from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.models.media import MediaType
from src.models.user import User
from src.api.deps import get_current_user
from src.services.resolver_service import (
    source_resolver_service,
    ResolvedPlaybackResponse,
)

router = APIRouter()


@router.get("/resolve/{media_id}", response_model=ResolvedPlaybackResponse)
async def resolve_media_playback(
    media_id: str,
    media_type: MediaType = Query(MediaType.MOVIE, description="Type of media (movie, series, anime)"),
    season_number: Optional[int] = Query(None, description="Season number if series"),
    episode_number: Optional[int] = Query(None, description="Episode number if series"),
    preferred_quality: Optional[str] = Query(None, description="Preferred quality e.g. 1080p, 720p"),
    current_user: User = Depends(get_current_user),
) -> ResolvedPlaybackResponse:
    """Resolve and rank playable streams across active providers with automatic fallback."""
    response = await source_resolver_service.resolve_playback_sources(
        media_id=media_id,
        media_type=media_type,
        season_number=season_number,
        episode_number=episode_number,
        preferred_quality=preferred_quality,
    )

    if not response.sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No playable streams could be resolved for media '{media_id}'",
        )

    return response
