import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any

from src.core.config import settings
from src.models.media import MediaType
from src.providers.base import (
    BaseProvider,
    MetadataProviderInterface,
    StreamingProviderInterface,
    BookProviderInterface,
)
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedPlaybackSource,
    NormalizedBookContent,
    NormalizedBookChapter,
)

logger = logging.getLogger("media_hub.providers.local")


class LocalMediaProvider(MetadataProviderInterface, StreamingProviderInterface, BookProviderInterface):
    """Provider adapter exposing locally indexed movies, series, and books for seamless playback and reading."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config or {})

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id="local-media",
            name="Local Storage Provider",
            version="1.0.0",
            description="High-performance streaming and reading from local disk storage with HTTP Range support.",
            capabilities=[
                ProviderCapability.METADATA,
                ProviderCapability.STREAMING,
                ProviderCapability.BOOKS,
            ],
            supported_media_types=[
                MediaType.MOVIE,
                MediaType.SERIES,
                MediaType.ANIME,
                MediaType.DRAMA,
                MediaType.BOOK,
            ],
            is_enabled=self.is_enabled(),
            requires_authentication=False,
            website_url=None,
        )

    async def check_health(self) -> ProviderHealthStatus:
        m_path = Path(settings.MEDIA_STORAGE_PATH)
        b_path = Path(settings.BOOKS_STORAGE_PATH)
        if m_path.exists() and b_path.exists():
            return ProviderHealthStatus.HEALTHY
        return ProviderHealthStatus.DEGRADED

    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        # Search is delegated to the primary database search for indexed local files
        return []

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        return None

    async def get_playback_sources(
        self,
        provider_media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> List[NormalizedPlaybackSource]:
        """Generate high-speed local stream endpoint URL for local media."""
        is_local = provider_media_id.startswith("local-")
        if not is_local:
            try:
                from src.db.session import async_session_factory
                from src.models.media import Media
                from sqlalchemy import select

                async with async_session_factory() as db:
                    stmt = select(Media).where(Media.id == provider_media_id)
                    res = await db.execute(stmt)
                    media = res.scalar_one_or_none()
                    if media and media.metadata_payload and media.metadata_payload.get("is_local"):
                        is_local = True
            except Exception:
                is_local = False

        if not is_local:
            return []

        query_suffix = ""
        if season_number is not None and episode_number is not None:
            query_suffix = f"?season={season_number}&episode={episode_number}"

        source_url = f"/api/v1/local/stream/{provider_media_id}{query_suffix}"

        return [
            NormalizedPlaybackSource(
                id=f"local-{provider_media_id}",
                title="Local Stream (1080p)",
                url=source_url,
                quality="1080p",
                format="mp4",
                is_direct=True,
                headers={},
                subtitles=[],
            )
        ]

    async def get_book_content(
        self,
        provider_media_id: str,
    ) -> Optional[NormalizedBookContent]:
        if not (provider_media_id.startswith("local-") or provider_media_id.startswith("book-local-")):
            return None
        return NormalizedBookContent(
            provider_id="local-media",
            book_id=provider_media_id,
            title="Local Document",
            chapters=[
                NormalizedBookChapter(
                    chapter_index=0,
                    title="Chapter 1: Local Reading",
                    word_count=500,
                )
            ],
            total_chapters=1,
            author="Local File",
        )

    async def get_chapter_text(
        self,
        provider_media_id: str,
        chapter_index: int,
    ) -> Optional[str]:
        if not (provider_media_id.startswith("local-") or provider_media_id.startswith("book-local-")):
            return None
        return "Local book content is loaded directly from local storage."
