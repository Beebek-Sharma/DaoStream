import os
import re
from pathlib import Path
from typing import Optional, Dict, Any, Generator
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.core.config import settings
from src.db.session import get_db
from src.models.media import Media, MediaType, Book
from src.services.local_scanner import (
    local_scanner_service,
    ScanResultSummary,
)

router = APIRouter()

MIME_TYPES = {
    ".mp4": "video/mp4",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".epub": "application/epub+zip",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".cbz": "application/vnd.comicbook+zip",
}


class ScanRequest(BaseModel):
    media_path: Optional[str] = None
    books_path: Optional[str] = None


class LocalStatusResponse(BaseModel):
    media_storage_path: str
    media_storage_exists: bool
    books_storage_path: str
    books_storage_exists: bool
    indexed_local_media_count: int


def is_safe_path(target_path: Path, allowed_roots: list[Path]) -> bool:
    """Security check against directory traversal attacks."""
    try:
        resolved_target = target_path.resolve()
        for root in allowed_roots:
            resolved_root = root.resolve()
            if resolved_target == resolved_root or resolved_root in resolved_target.parents:
                return True
        return False
    except Exception:
        return False


def ranged_file_generator(file_path: Path, start: int, end: int, chunk_size: int = 1024 * 1024) -> Generator[bytes, None, None]:
    """Yield file chunks for HTTP partial content range responses."""
    with open(file_path, "rb") as f:
        f.seek(start)
        bytes_left = end - start + 1
        while bytes_left > 0:
            read_size = min(chunk_size, bytes_left)
            data = f.read(read_size)
            if not data:
                break
            bytes_left -= len(data)
            yield data


@router.get("/status", response_model=LocalStatusResponse)
async def get_local_storage_status(db: AsyncSession = Depends(get_db)):
    """Retrieve status of configured local media and books storage paths."""
    m_dir = Path(settings.MEDIA_STORAGE_PATH)
    b_dir = Path(settings.BOOKS_STORAGE_PATH)

    # Count items flagged as local
    stmt = select(func.count(Media.id)).where(
        Media.metadata_payload.contains({"is_local": True})
    )
    res = await db.execute(stmt)
    count = res.scalar_one() or 0

    return LocalStatusResponse(
        media_storage_path=str(m_dir.resolve()),
        media_storage_exists=m_dir.exists(),
        books_storage_path=str(b_dir.resolve()),
        books_storage_exists=b_dir.exists(),
        indexed_local_media_count=count,
    )


@router.post("/scan", response_model=ScanResultSummary)
async def scan_local_media_storage(
    payload: ScanRequest = ScanRequest(),
    db: AsyncSession = Depends(get_db),
):
    """Trigger recursive filesystem scan of media and books directories."""
    summary = await local_scanner_service.scan_directories(
        db=db,
        media_path=payload.media_path,
        books_path=payload.books_path,
    )
    return summary


@router.get("/stream/{media_id}")
async def stream_local_media(
    media_id: str,
    request: Request,
    season: Optional[int] = None,
    episode: Optional[int] = None,
    range: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Stream authorized local video media with RFC 7233 HTTP Byte Range seeking."""
    stmt = select(Media).where(Media.id == media_id)
    res = await db.execute(stmt)
    media = res.scalar_one_or_none()

    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    file_path_str: Optional[str] = None

    if media.type in [MediaType.SERIES, MediaType.ANIME, MediaType.DRAMA] and season is not None and episode is not None:
        local_episodes = media.metadata_payload.get("local_episodes", {})
        key = f"S{season:02d}E{episode:02d}"
        if key in local_episodes:
            file_path_str = local_episodes[key].get("local_path")

    if not file_path_str:
        file_path_str = media.metadata_payload.get("local_path")

    if not file_path_str:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No local file path associated with this media item",
        )

    file_path = Path(file_path_str)

    # Enforce path traversal security
    allowed_roots = [
        Path(settings.MEDIA_STORAGE_PATH).resolve(),
        Path(settings.BOOKS_STORAGE_PATH).resolve(),
        Path(".").resolve(),
    ]
    if not is_safe_path(file_path, allowed_roots):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to specified file path is unauthorized",
        )

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File does not exist on disk")

    file_size = file_path.stat().st_size
    content_type = MIME_TYPES.get(file_path.suffix.lower(), "video/mp4")

    # Handle HTTP Range requests for video seeking
    if range:
        match = re.match(r"bytes=(\d+)-(\d*)", range)
        if match:
            start_str, end_str = match.groups()
            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1

            if start >= file_size or end >= file_size or start > end:
                raise HTTPException(
                    status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
                    headers={"Content-Range": f"bytes */{file_size}"},
                    detail="Requested Range Not Satisfiable",
                )

            chunk_len = end - start + 1
            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_len),
                "Content-Type": content_type,
            }
            return StreamingResponse(
                ranged_file_generator(file_path, start, end),
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                headers=headers,
            )

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": content_type,
    }
    return FileResponse(file_path, headers=headers, media_type=content_type)


@router.get("/book/{media_id}")
async def get_local_book(
    media_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve digital book file from local storage."""
    stmt = select(Media).where(Media.id == media_id, Media.type == MediaType.BOOK)
    res = await db.execute(stmt)
    media = res.scalar_one_or_none()

    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    file_path_str = media.metadata_payload.get("local_path")
    if not file_path_str:
        # Check Book model reading sources
        stmt_book = select(Book).where(Book.id == media_id)
        book_res = await db.execute(stmt_book)
        book = book_res.scalar_one_or_none()
        if book and book.reading_sources:
            for src in book.reading_sources:
                if src.get("type") == "local" and src.get("path"):
                    file_path_str = src.get("path")
                    break

    if not file_path_str:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Local book file not configured")

    file_path = Path(file_path_str)
    allowed_roots = [
        Path(settings.MEDIA_STORAGE_PATH).resolve(),
        Path(settings.BOOKS_STORAGE_PATH).resolve(),
        Path(".").resolve(),
    ]
    if not is_safe_path(file_path, allowed_roots):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book file missing on disk")

    content_type = MIME_TYPES.get(file_path.suffix.lower(), "application/octet-stream")
    return FileResponse(file_path, media_type=content_type, filename=file_path.name)
