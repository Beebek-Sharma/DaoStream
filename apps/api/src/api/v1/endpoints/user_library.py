from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from src.db.session import get_db
from src.api.deps import get_current_active_user
from src.models.user import User
from src.models.media import Media
from src.models.library import Watchlist, Favorite
from src.models.progress import WatchProgress, ReadingProgress

router = APIRouter()


class WatchProgressPayload(BaseModel):
    media_id: str
    episode_id: Optional[str] = None
    position: float
    duration: float
    percentage: Optional[float] = None
    completed: Optional[bool] = None


class ReadingProgressPayload(BaseModel):
    book_id: str
    location: str
    percentage: float
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
    pct = payload.percentage
    if pct is None and payload.duration > 0:
        pct = (payload.position / payload.duration) * 100
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
        existing.position = payload.position
        existing.duration = payload.duration
        existing.percentage = pct
        existing.completed = is_completed
        await db.commit()
        return {"status": "updated", "id": existing.id, "percentage": pct, "completed": is_completed}
    else:
        new_prog = WatchProgress(
            user_id=current_user.id,
            media_id=payload.media_id,
            episode_id=payload.episode_id,
            position=payload.position,
            duration=payload.duration,
            percentage=pct,
            completed=is_completed,
        )
        db.add(new_prog)
        await db.commit()
        await db.refresh(new_prog)
        return {"status": "created", "id": new_prog.id, "percentage": pct, "completed": is_completed}


@router.get("/progress/watch")
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
            "title": e.media.title,
            "position": e.position,
            "duration": e.duration,
            "percentage": e.percentage,
            "completed": e.completed,
            "updated_at": e.updated_at,
        }
        for e in entries
    ]
