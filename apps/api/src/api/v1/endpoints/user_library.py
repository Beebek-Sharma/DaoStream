from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from src.db.session import get_db
from src.api.deps import get_current_active_user
from src.models.user import User
from src.models.media import Media, Book, MediaType, Episode
from src.models.library import Watchlist, Favorite
from src.models.progress import WatchProgress, ReadingProgress
from src.core.sanitizer import sanitize_text

router = APIRouter()


class WatchProgressPayload(BaseModel):
    media_id: str
    episode_id: Optional[str] = None
    position: Optional[float] = None
    current_time: Optional[float] = None
    duration: float
    percentage: Optional[float] = None
    completed: Optional[bool] = None


class ReadingProgressPayload(BaseModel):
    book_id: Optional[str] = None
    media_id: Optional[str] = None
    location: Optional[str] = None
    last_location: Optional[str] = None
    percentage: Optional[float] = None
    progress_percentage: Optional[float] = None
    current_page: Optional[int] = None
    total_pages: Optional[int] = None
    completed: Optional[bool] = None
    bookmarks: Optional[List[Dict[str, Any]]] = None


# --- Watchlist Endpoints ---

@router.get("/watchlist")
async def get_watchlist(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Watchlist)
        .where(Watchlist.user_id == current_user.id)
        .options(selectinload(Watchlist.media))
        .order_by(Watchlist.created_at.desc())
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()
    return [
        {
            "id": entry.id,
            "media_id": entry.media_id,
            "title": entry.media.title,
            "type": entry.media.type,
            "poster": entry.media.poster,
            "rating": entry.media.rating,
            "added_at": entry.created_at,
        }
        for entry in entries
    ]


@router.post("/watchlist/{media_id}", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    media_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    media = await db.get(Media, media_id)
    if not media:
        from src.services.metadata_service import metadata_service
        details = await metadata_service.get_media_details(media_id)
        if details:
            media = await metadata_service.sync_media_to_db(details, db)

    if not media:
        raise HTTPException(status_code=404, detail="Media item not found")

    stmt = select(Watchlist).where(
        Watchlist.user_id == current_user.id, Watchlist.media_id == media_id
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        return {"status": "already_in_watchlist", "id": existing.id}

    entry = Watchlist(user_id=current_user.id, media_id=media_id)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {"status": "added", "id": entry.id}


@router.delete("/watchlist/{media_id}")
async def remove_from_watchlist(
    media_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = delete(Watchlist).where(
        Watchlist.user_id == current_user.id, Watchlist.media_id == media_id
    )
    res = await db.execute(stmt)
    await db.commit()
    return {"status": "removed", "rows_affected": res.rowcount}


# --- Favorites Endpoints ---

@router.get("/favorites")
async def get_favorites(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Favorite)
        .where(Favorite.user_id == current_user.id)
        .options(selectinload(Favorite.media))
        .order_by(Favorite.created_at.desc())
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()
    return [
        {
            "id": entry.id,
            "media_id": entry.media_id,
            "title": entry.media.title,
            "type": entry.media.type,
            "poster": entry.media.poster,
            "rating": entry.media.rating,
            "added_at": entry.created_at,
        }
        for entry in entries
    ]


@router.post("/favorites/{media_id}", status_code=status.HTTP_201_CREATED)
async def add_to_favorites(
    media_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    media = await db.get(Media, media_id)
    if not media:
        from src.services.metadata_service import metadata_service
        details = await metadata_service.get_media_details(media_id)
        if details:
            media = await metadata_service.sync_media_to_db(details, db)

    if not media:
        raise HTTPException(status_code=404, detail="Media item not found")

    stmt = select(Favorite).where(
        Favorite.user_id == current_user.id, Favorite.media_id == media_id
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        return {"status": "already_favorite", "id": existing.id}

    entry = Favorite(user_id=current_user.id, media_id=media_id)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {"status": "added", "id": entry.id}


@router.delete("/favorites/{media_id}")
async def remove_from_favorites(
    media_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = delete(Favorite).where(
        Favorite.user_id == current_user.id, Favorite.media_id == media_id
    )
    res = await db.execute(stmt)
    await db.commit()
    return {"status": "removed", "rows_affected": res.rowcount}


# --- Progress Endpoints ---

@router.post("/progress/watch")
async def save_watch_progress(
    payload: WatchProgressPayload,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    effective_position = payload.position if payload.position is not None else (payload.current_time or 0.0)
    pct = payload.percentage
    if pct is None and payload.duration > 0:
        pct = (effective_position / payload.duration) * 100
    pct = round(pct or 0.0, 2)

    is_completed = payload.completed if payload.completed is not None else (pct >= 90.0)

    stmt = select(WatchProgress).where(
        WatchProgress.user_id == current_user.id,
        WatchProgress.media_id == payload.media_id,
        WatchProgress.episode_id == payload.episode_id,
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.position = effective_position
        existing.duration = payload.duration
        existing.percentage = pct
        existing.completed = is_completed
        await db.commit()
        return {"status": "updated", "id": existing.id, "percentage": pct, "completed": is_completed}
    else:
        # Ensure media item exists in db
        media = await db.get(Media, payload.media_id)
        if not media:
            from src.services.metadata_service import metadata_service
            details = await metadata_service.get_media_details(payload.media_id)
            if details:
                await metadata_service.sync_media_to_db(details, db)

        # Validate episode_id if specified to prevent foreign key constraint violations
        valid_episode_id = payload.episode_id
        if valid_episode_id:
            ep = await db.get(Episode, valid_episode_id)
            if not ep:
                valid_episode_id = None

        new_prog = WatchProgress(
            user_id=current_user.id,
            media_id=payload.media_id,
            episode_id=valid_episode_id,
            position=effective_position,
            duration=payload.duration,
            percentage=pct,
            completed=is_completed,
        )
        db.add(new_prog)
        await db.commit()
        await db.refresh(new_prog)
        return {"status": "created", "id": new_prog.id, "percentage": pct, "completed": is_completed}


@router.get("/progress/watch")
@router.get("/continue-watching")
async def get_watch_progress_list(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(WatchProgress)
        .where(WatchProgress.user_id == current_user.id)
        .options(selectinload(WatchProgress.media))
        .order_by(WatchProgress.updated_at.desc())
    )
    res = await db.execute(stmt)
    entries = res.scalars().all()
    return [
        {
            "id": e.id,
            "media_id": e.media_id,
            "episode_id": e.episode_id,
            "title": e.media.title if e.media else "Unknown",
            "position": e.position,
            "duration": e.duration,
            "percentage": e.percentage,
            "completed": e.completed,
            "updated_at": e.updated_at,
        }
        for e in entries
    ]


@router.post("/progress/reading")
async def save_reading_progress(
    payload: ReadingProgressPayload,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    target_book_id = payload.book_id or payload.media_id
    if not target_book_id:
        raise HTTPException(status_code=400, detail="Missing book_id or media_id")

    effective_location = payload.location or payload.last_location or (f"page-{payload.current_page}" if payload.current_page else "0")
    effective_percentage = payload.percentage if payload.percentage is not None else (payload.progress_percentage or 0.0)
    is_completed = payload.completed if payload.completed is not None else (effective_percentage >= 95.0)

    # Ensure book exists in DB before linking progress
    book = await db.get(Book, target_book_id)
    if not book:
        from src.services.metadata_service import metadata_service
        details = await metadata_service.get_media_details(target_book_id, media_type=MediaType.BOOK)
        if details:
            await metadata_service.sync_media_to_db(details, db)
        book = await db.get(Book, target_book_id)
        if not book:
            media = await db.get(Media, target_book_id)
            if not media:
                media = Media(
                    id=target_book_id,
                    title=f"Book {target_book_id}",
                    type=MediaType.BOOK,
                    genres=[],
                    metadata_payload={},
                )
                db.add(media)
                await db.flush()
            book = Book(
                id=target_book_id,
                author="Unknown Author",
                format="epub",
                reading_sources=[],
            )
            db.add(book)
            await db.commit()

    stmt = select(ReadingProgress).where(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.book_id == target_book_id,
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.location = sanitize_text(effective_location, 255) or ""
        existing.percentage = effective_percentage
        existing.completed = is_completed
        if payload.bookmarks is not None:
            existing.bookmarks = payload.bookmarks
        await db.commit()
        return {"status": "updated", "id": existing.id, "percentage": effective_percentage}
    else:
        new_prog = ReadingProgress(
            user_id=current_user.id,
            book_id=target_book_id,
            location=sanitize_text(effective_location, 255) or "",
            percentage=effective_percentage,
            completed=is_completed,
            bookmarks=payload.bookmarks or [],
        )
        db.add(new_prog)
        await db.commit()
        await db.refresh(new_prog)
        return {"status": "created", "id": new_prog.id, "percentage": effective_percentage}


@router.get("/progress/reading")
async def get_reading_progress_list(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ReadingProgress)
        .where(ReadingProgress.user_id == current_user.id)
        .options(selectinload(ReadingProgress.book))
        .order_by(ReadingProgress.updated_at.desc())
    )
    res = await db.execute(stmt)
    entries = res.scalars().all()
    return [
        {
            "id": e.id,
            "book_id": e.book_id,
            "location": e.location,
            "percentage": e.percentage,
            "completed": e.completed,
            "bookmarks": e.bookmarks,
            "updated_at": e.updated_at,
        }
        for e in entries
    ]


# --- Collections Endpoints ---

class CreateCollectionPayload(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False


class AddCollectionItemPayload(BaseModel):
    media_id: str
    order: Optional[int] = 0


@router.post("/collections", status_code=status.HTTP_201_CREATED)
async def create_collection(
    payload: CreateCollectionPayload,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from src.models.library import Collection
    clean_name = sanitize_text(payload.name, 100) or "Untitled Collection"
    clean_desc = sanitize_text(payload.description, 500) if payload.description else None
    collection = Collection(
        user_id=current_user.id,
        name=clean_name,
        description=clean_desc,
        is_public=payload.is_public,
    )
    db.add(collection)
    await db.commit()
    await db.refresh(collection)
    return {
        "id": collection.id,
        "name": collection.name,
        "description": collection.description,
        "is_public": collection.is_public,
        "created_at": collection.created_at,
    }


@router.get("/collections")
async def list_collections(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from src.models.library import Collection
    stmt = (
        select(Collection)
        .where(Collection.user_id == current_user.id)
        .options(selectinload(Collection.items))
        .order_by(Collection.created_at.desc())
    )
    res = await db.execute(stmt)
    collections = res.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "is_public": c.is_public,
            "item_count": len(c.items),
            "created_at": c.created_at,
        }
        for c in collections
    ]


@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from src.models.library import Collection
    stmt = delete(Collection).where(
        Collection.id == collection_id,
        Collection.user_id == current_user.id,
    )
    res = await db.execute(stmt)
    await db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"status": "deleted", "collection_id": collection_id}


@router.post("/collections/{collection_id}/items", status_code=status.HTTP_201_CREATED)
async def add_item_to_collection(
    collection_id: str,
    payload: AddCollectionItemPayload,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from src.models.library import Collection, CollectionItem
    col = await db.get(Collection, collection_id)
    if not col or col.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Ensure media exists before adding to collection items
    media = await db.get(Media, payload.media_id)
    if not media:
        from src.services.metadata_service import metadata_service
        details = await metadata_service.get_media_details(payload.media_id)
        if details:
            await metadata_service.sync_media_to_db(details, db)

    item = CollectionItem(
        collection_id=collection_id,
        media_id=payload.media_id,
        order=payload.order or 0,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"status": "added", "item_id": item.id}

