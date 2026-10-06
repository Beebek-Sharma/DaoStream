from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from src.providers.registry import provider_registry
from src.providers.schemas import ProviderInfo
from src.providers.capabilities import ProviderHealthStatus
from src.api.deps import get_current_user, get_current_admin_user
from src.models.user import User

router = APIRouter()


class ProviderConfigUpdate(BaseModel):
    config: Dict[str, Any]


class ProviderToggleRequest(BaseModel):
    enabled: bool


@router.get("", response_model=List[ProviderInfo])
async def list_providers(
    enabled_only: bool = False,
    current_user: User = Depends(get_current_user),
) -> List[ProviderInfo]:
    """List all registered providers and their current status."""
    return provider_registry.list_all(enabled_only=enabled_only)


@router.get("/health", response_model=Dict[str, ProviderHealthStatus])
async def check_all_providers_health(
    current_user: User = Depends(get_current_user),
) -> Dict[str, ProviderHealthStatus]:
    """Check health across all registered providers."""
    return await provider_registry.check_all_health()


@router.get("/{provider_id}", response_model=ProviderInfo)
async def get_provider_details(
    provider_id: str,
    current_user: User = Depends(get_current_user),
) -> ProviderInfo:
    """Get metadata for a specific provider."""
    provider = provider_registry.get(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )
    info = provider.info.model_copy()
    info.is_enabled = provider.is_enabled()
    return info


@router.get("/{provider_id}/health", response_model=Dict[str, Any])
async def check_provider_health(
    provider_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Check health of a specific provider."""
    provider = provider_registry.get(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )
    health = await provider.check_health()
    return {"provider_id": provider_id, "status": health}


@router.post("/{provider_id}/toggle", response_model=Dict[str, Any])
async def toggle_provider(
    provider_id: str,
    payload: ProviderToggleRequest,
    admin_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """Enable or disable a provider (admin only)."""
    provider = provider_registry.get(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )
    if payload.enabled:
        provider.enable()
    else:
        provider.disable()
    return {
        "provider_id": provider_id,
        "is_enabled": provider.is_enabled(),
    }


@router.post("/{provider_id}/configure", response_model=Dict[str, Any])
async def configure_provider(
    provider_id: str,
    payload: ProviderConfigUpdate,
    admin_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """Update settings or credentials for a provider (admin only)."""
    provider = provider_registry.get(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )
    provider.update_config(payload.config)
    return {
        "provider_id": provider_id,
        "message": "Configuration updated successfully",
    }
