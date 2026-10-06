from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.models.media import MediaType
from src.models.user import User
from src.api.deps import get_current_user
from src.services.metadata_service import metadata_service
from src.providers.schemas import (
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedBookContent,
)

router = APIRouter()


@router.get("/search", response_model=List[NormalizedSearchResult])
async def search_media(
    query: str = Query(..., min_length=1, description="Search term"),
    media_type: Optional[MediaType] = Query(None, description="Filter by media type"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
) -> List[NormalizedSearchResult]:
    """Federated search across all active metadata providers."""
    return await metadata_service.search_media(
        query=query,
        media_type=media_type,
        limit=limit,
    )


@router.get("/{media_id}", response_model=NormalizedMediaDetails)
async def get_media_details(
    media_id: str,
    media_type: Optional[MediaType] = Query(None, description="Optional media type hint"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NormalizedMediaDetails:
    """Retrieve full media metadata, either from DB or enabled providers."""
    details = await metadata_service.get_media_details(
        media_id_or_provider_id=media_id,
        media_type=media_type,
        db=db,
    )
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media '{media_id}' not found across registered providers",
        )
    return details


@router.post("/{media_id}/sync")
async def sync_media_to_local_db(
    media_id: str,
    media_type: Optional[MediaType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sync external provider metadata into internal database for bookmarking/history."""
    details = await metadata_service.get_media_details(
        media_id_or_provider_id=media_id,
        media_type=media_type,
        db=db,
    )
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot sync: Media '{media_id}' not found",
        )
    media = await metadata_service.sync_media_to_db(details, db)
    return {
        "status": "synced",
        "media_id": media.id,
        "title": media.title,
        "type": media.type,
    }


@router.get("/{media_id}/book", response_model=NormalizedBookContent)
async def get_book_content(
    media_id: str,
    current_user: User = Depends(get_current_user),
) -> NormalizedBookContent:
    """Get book chapters and reading content from book providers."""
    content = await metadata_service.get_book_content(media_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book content for '{media_id}' not found",
        )
    return content
