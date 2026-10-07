import shutil
import sys
import platform
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.core.config import settings
from src.core.cache import metadata_cache
from src.db.session import get_db
from src.models.user import User
from src.models.media import Media, MediaType
from src.models.progress import WatchProgress, ReadingProgress
from src.api.deps import get_current_user, get_current_admin_user
from src.core.sanitizer import sanitize_text
from src.providers.registry import provider_registry
from src.providers.capabilities import ProviderHealthStatus

router = APIRouter()


class UserPreferencesDTO(BaseModel):
    preferred_quality: str = "1080p"
    auto_play_next: bool = True
    default_subtitle_language: str = "en"
    reader_theme: str = "obsidian"
    reader_font_size: int = 18
    reader_font_family: str = "sans"
    media_storage_path: Optional[str] = None
    books_storage_path: Optional[str] = None


class ProviderHealthDetail(BaseModel):
    id: str
    name: str
    is_enabled: bool
    health_status: str
    capabilities: list[str]


class StorageDiagnostic(BaseModel):
    path: str
    exists: bool
    total_gb: Optional[float] = None
    used_gb: Optional[float] = None
    free_gb: Optional[float] = None


class SystemDiagnosticsResponse(BaseModel):
    app_name: str
    version: str
    environment: str
    python_version: str
    os_system: str
    cache_entries: int
    media_counts: Dict[str, int]
    total_users: int
    watch_sessions_count: int
    reading_sessions_count: int
    providers: list[ProviderHealthDetail]
    storage: Dict[str, StorageDiagnostic]


@router.get("/preferences", response_model=UserPreferencesDTO)
async def get_user_preferences(
    current_user: User = Depends(get_current_user),
):
    """Retrieve logged in user preferences merged with sensible defaults."""
    prefs = current_user.preferences or {}
    return UserPreferencesDTO(
        preferred_quality=prefs.get("preferred_quality", "1080p"),
        auto_play_next=prefs.get("auto_play_next", True),
        default_subtitle_language=prefs.get("default_subtitle_language", "en"),
        reader_theme=prefs.get("reader_theme", "obsidian"),
        reader_font_size=prefs.get("reader_font_size", 18),
        reader_font_family=prefs.get("reader_font_family", "sans"),
        media_storage_path=prefs.get("media_storage_path", settings.MEDIA_STORAGE_PATH),
        books_storage_path=prefs.get("books_storage_path", settings.BOOKS_STORAGE_PATH),
    )


@router.put("/preferences", response_model=UserPreferencesDTO)
async def update_user_preferences(
    payload: UserPreferencesDTO,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update and persist user preferences with sanitized values."""
    data = payload.model_dump()
    data["preferred_quality"] = sanitize_text(data.get("preferred_quality", "1080p"), 20)
    data["default_subtitle_language"] = sanitize_text(data.get("default_subtitle_language", "en"), 10)
    data["reader_theme"] = sanitize_text(data.get("reader_theme", "obsidian"), 30)
    data["reader_font_family"] = sanitize_text(data.get("reader_font_family", "sans"), 30)
    if data.get("media_storage_path"):
        data["media_storage_path"] = sanitize_text(data["media_storage_path"], 500)
    if data.get("books_storage_path"):
        data["books_storage_path"] = sanitize_text(data["books_storage_path"], 500)

    current_user.preferences = data
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return payload


@router.get("/diagnostics", response_model=SystemDiagnosticsResponse)
async def get_system_diagnostics(
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Compile exhaustive system diagnostics, provider health checks, and database metrics (admin only)."""
    # 1. Check provider health
    health_map = await provider_registry.check_all_health()
    providers_detail: list[ProviderHealthDetail] = []
    for p_info in provider_registry.list_all():
        providers_detail.append(
            ProviderHealthDetail(
                id=p_info.id,
                name=p_info.name,
                is_enabled=p_info.is_enabled,
                health_status=health_map.get(p_info.id, ProviderHealthStatus.HEALTHY).value,
                capabilities=[c.value for c in p_info.capabilities],
            )
        )

    # 2. Storage diagnostics
    storage_diags: Dict[str, StorageDiagnostic] = {}
    for name, p_str in [
        ("media", settings.MEDIA_STORAGE_PATH),
        ("books", settings.BOOKS_STORAGE_PATH),
    ]:
        p = Path(p_str).resolve()
        exists = p.exists()
        tot, used, free = None, None, None
        if exists:
            try:
                usage = shutil.disk_usage(p)
                tot = round(usage.total / (1024**3), 2)
                used = round(usage.used / (1024**3), 2)
                free = round(usage.free / (1024**3), 2)
            except Exception:
                pass
        storage_diags[name] = StorageDiagnostic(
            path=str(p),
            exists=exists,
            total_gb=tot,
            used_gb=used,
            free_gb=free,
        )

    # 3. Media metrics
    media_counts: Dict[str, int] = {}
    for mt in MediaType:
        stmt = select(func.count(Media.id)).where(Media.type == mt)
        res = await db.execute(stmt)
        media_counts[mt.value] = res.scalar_one() or 0

    # 4. Total users
    res_users = await db.execute(select(func.count(User.id)))
    total_users = res_users.scalar_one() or 0

    # 5. Watch & Reading sessions
    res_watch = await db.execute(select(func.count(WatchProgress.id)))
    watch_sessions_count = res_watch.scalar_one() or 0

    res_reading = await db.execute(select(func.count(ReadingProgress.id)))
    reading_sessions_count = res_reading.scalar_one() or 0

    return SystemDiagnosticsResponse(
        app_name=settings.APP_NAME,
        version=settings.VERSION,
        environment=settings.APP_ENV,
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        os_system=f"{platform.system()} {platform.release()}",
        cache_entries=metadata_cache.size(),
        media_counts=media_counts,
        total_users=total_users,
        watch_sessions_count=watch_sessions_count,
        reading_sessions_count=reading_sessions_count,
        providers=providers_detail,
        storage=storage_diags,
    )


@router.post("/providers/{provider_id}/test")
async def test_provider_connection(
    provider_id: str,
    admin_user: User = Depends(get_current_admin_user),
):
    """Execute live health test and connectivity check against specific provider (admin only)."""
    provider = provider_registry.get(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )

    health_status = await provider.check_health()
    return {
        "provider_id": provider_id,
        "name": provider.info.name,
        "status": health_status.value,
        "is_healthy": health_status in [ProviderHealthStatus.HEALTHY, ProviderHealthStatus.DEGRADED],
    }
