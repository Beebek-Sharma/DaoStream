import os
import re
import uuid
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.config import settings
from src.models.media import Media, MediaType, Movie, Series, Season, Episode, Book

logger = logging.getLogger("media_hub.services.local_scanner")

VIDEO_EXTENSIONS = {".mp4", ".mkv", ".webm", ".avi", ".mov"}
BOOK_EXTENSIONS = {".epub", ".pdf", ".txt", ".cbz"}


class ParsedVideoInfo(BaseModel):
    is_series: bool
    title: str
    series_title: Optional[str] = None
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    year: Optional[int] = None
    quality: Optional[str] = "1080p"
    extension: str


class ParsedBookInfo(BaseModel):
    title: str
    author: Optional[str] = "Unknown Author"
    extension: str


class ScanResultSummary(BaseModel):
    scanned_files: int = 0
    movies_added: int = 0
    episodes_added: int = 0
    books_added: int = 0
    errors: List[str] = Field(default_factory=list)


class LocalScannerService:
    """Service for recursively scanning storage directories, matching filenames to metadata, and indexing media."""

    def __init__(self) -> None:
        self.movie_regexes = [
            # Title (Year) [Quality].ext
            re.compile(r"^(?P<title>.+?)[\. _\-\(\[]+(?P<year>19\d{2}|20\d{2})[\]\)]?(?:[\. _\-]+(?P<quality>1080p|720p|4k|2160p|480p))?.*?\.(?P<ext>[a-zA-Z0-9]+)$", re.IGNORECASE),
            # Title.Year.Quality.ext
            re.compile(r"^(?P<title>.+?)\.(?P<year>19\d{2}|20\d{2})\.(?:(?P<quality>1080p|720p|4k|2160p|480p)\.)?.*?\.(?P<ext>[a-zA-Z0-9]+)$", re.IGNORECASE),
        ]
        self.series_regexes = [
            # Show - S01E01 - Title.ext
            re.compile(r"^(?P<series>.+?)[\. _\-]+[Ss](?P<season>\d{1,2})[Ee](?P<episode>\d{1,3})(?:[\. _\-]+(?P<title>.*?))?\.(?P<ext>[a-zA-Z0-9]+)$", re.IGNORECASE),
            # Show.1x01.Title.ext
            re.compile(r"^(?P<series>.+?)[\. _\-]+(?P<season>\d{1,2})x(?P<episode>\d{1,3})(?:[\. _\-]+(?P<title>.*?))?\.(?P<ext>[a-zA-Z0-9]+)$", re.IGNORECASE),
        ]
        self.book_regexes = [
            # Title - Author.ext
            re.compile(r"^(?P<title>.+?)[\. _\-]+(?:by[\. _\-]+)?(?P<author>[A-Z][a-zA-Z\s\.\-]+)\.(?P<ext>[a-zA-Z0-9]+)$", re.IGNORECASE),
            # Title (Author).ext
            re.compile(r"^(?P<title>.+?)\s*\((?P<author>[^)]+)\)\.(?P<ext>[a-zA-Z0-9]+)$", re.IGNORECASE),
        ]

    def clean_name(self, name: str) -> str:
        """Replace dots and underscores with spaces and strip clean."""
        cleaned = re.sub(r"[._]", " ", name)
        return re.sub(r"\s+", " ", cleaned).strip()

    def parse_video_filename(self, filename: str) -> ParsedVideoInfo:
        ext = os.path.splitext(filename)[1].lower()

        # Check for Series / Anime patterns first
        for reg in self.series_regexes:
            match = reg.match(filename)
            if match:
                groups = match.groupdict()
                series_name = self.clean_name(groups.get("series", ""))
                season_num = int(groups.get("season", 1))
                episode_num = int(groups.get("episode", 1))
                ep_title = self.clean_name(groups.get("title") or f"Episode {episode_num}")
                return ParsedVideoInfo(
                    is_series=True,
                    title=ep_title,
                    series_title=series_name,
                    season_number=season_num,
                    episode_number=episode_num,
                    extension=ext,
                )

        # Check for Movie patterns
        for reg in self.movie_regexes:
            match = reg.match(filename)
            if match:
                groups = match.groupdict()
                title = self.clean_name(groups.get("title", ""))
                year = int(groups.get("year")) if groups.get("year") else None
                quality = groups.get("quality") or "1080p"
                return ParsedVideoInfo(
                    is_series=False,
                    title=title,
                    year=year,
                    quality=quality.lower(),
                    extension=ext,
                )

        # Fallback to plain movie using stem
        stem = os.path.splitext(filename)[0]
        return ParsedVideoInfo(
            is_series=False,
            title=self.clean_name(stem),
            extension=ext,
        )

    def parse_book_filename(self, filename: str) -> ParsedBookInfo:
        ext = os.path.splitext(filename)[1].lower()
        for reg in self.book_regexes:
            match = reg.match(filename)
            if match:
                groups = match.groupdict()
                return ParsedBookInfo(
                    title=self.clean_name(groups.get("title", "")),
                    author=self.clean_name(groups.get("author", "Unknown Author")),
                    extension=ext,
                )

        stem = os.path.splitext(filename)[0]
        return ParsedBookInfo(
            title=self.clean_name(stem),
            author="Unknown Author",
            extension=ext,
        )

    async def scan_directories(
        self,
        db: AsyncSession,
        media_path: Optional[str] = None,
        books_path: Optional[str] = None,
    ) -> ScanResultSummary:
        """Scan media and books directories and index them into database."""
        m_path_str = media_path or settings.MEDIA_STORAGE_PATH
        b_path_str = books_path or settings.BOOKS_STORAGE_PATH

        m_dir = Path(m_path_str).resolve()
        b_dir = Path(b_path_str).resolve()

        summary = ScanResultSummary()

        # Ensure directories exist
        m_dir.mkdir(parents=True, exist_ok=True)
        b_dir.mkdir(parents=True, exist_ok=True)

        # Scan Video Files
        for root, _, files in os.walk(m_dir):
            for file in files:
                file_path = Path(root) / file
                ext = file_path.suffix.lower()
                if ext not in VIDEO_EXTENSIONS:
                    continue

                summary.scanned_files += 1
                try:
                    await self._index_video_file(db, file_path, summary)
                except Exception as exc:
                    logger.error(f"Error indexing video file {file_path}: {exc}")
                    summary.errors.append(f"{file}: {str(exc)}")

        # Scan Book Files
        for root, _, files in os.walk(b_dir):
            for file in files:
                file_path = Path(root) / file
                ext = file_path.suffix.lower()
                if ext not in BOOK_EXTENSIONS:
                    continue

                summary.scanned_files += 1
                try:
                    await self._index_book_file(db, file_path, summary)
                except Exception as exc:
                    logger.error(f"Error indexing book file {file_path}: {exc}")
                    summary.errors.append(f"{file}: {str(exc)}")

        await db.commit()
        return summary

    async def _index_video_file(
        self, db: AsyncSession, file_path: Path, summary: ScanResultSummary
    ) -> None:
        rel_str = str(file_path.resolve())
        parsed = self.parse_video_filename(file_path.name)

        if parsed.is_series:
            # Series episode indexing
            series_title = parsed.series_title or "Unknown Series"
            stmt = select(Media).where(
                Media.title.ilike(series_title),
                Media.type.in_([MediaType.SERIES, MediaType.ANIME, MediaType.DRAMA]),
            )
            res = await db.execute(stmt)
            media_series = res.scalar_one_or_none()

            if not media_series:
                media_series = Media(
                    id=str(uuid.uuid4()),
                    type=MediaType.SERIES,
                    title=series_title,
                    description=f"Local series: {series_title}",
                    genres=["Local"],
                    rating=8.0,
                    metadata_payload={"is_local": True, "source": "local-scanner"},
                )
                db.add(media_series)
                series_obj = Series(id=media_series.id, total_seasons=1, status="Local")
                db.add(series_obj)
                await db.flush()

            # Find or create Season
            s_num = parsed.season_number or 1
            season_stmt = select(Season).where(
                Season.series_id == media_series.id,
                Season.season_number == s_num,
            )
            season_res = await db.execute(season_stmt)
            season = season_res.scalar_one_or_none()

            if not season:
                season = Season(
                    id=str(uuid.uuid4()),
                    series_id=media_series.id,
                    season_number=s_num,
                    title=f"Season {s_num}",
                )
                db.add(season)
                await db.flush()

            # Find or create Episode
            ep_num = parsed.episode_number or 1
            ep_stmt = select(Episode).where(
                Episode.season_id == season.id,
                Episode.episode_number == ep_num,
            )
            ep_res = await db.execute(ep_stmt)
            episode = ep_res.scalar_one_or_none()

            file_stat = file_path.stat()
            if not episode:
                episode = Episode(
                    id=str(uuid.uuid4()),
                    season_id=season.id,
                    episode_number=ep_num,
                    title=parsed.title,
                    duration=None,
                )
                db.add(episode)
                # Store local path info on episode or linked media
                summary.episodes_added += 1

            # Update media metadata payload to reference local files mapping
            local_episodes = media_series.metadata_payload.get("local_episodes", {})
            local_episodes[f"S{s_num:02d}E{ep_num:02d}"] = {
                "episode_id": episode.id,
                "local_path": rel_str,
                "file_size": file_stat.st_size,
                "filename": file_path.name,
            }
            media_series.metadata_payload["local_episodes"] = local_episodes
            media_series.metadata_payload["is_local"] = True
            await db.flush()

        else:
            # Movie indexing
            # Check if movie with this local path already exists
            stmt = select(Media).where(
                Media.title.ilike(parsed.title),
                Media.type == MediaType.MOVIE,
            )
            res = await db.execute(stmt)
            media = res.scalar_one_or_none()

            file_stat = file_path.stat()
            if not media:
                media = Media(
                    id=str(uuid.uuid4()),
                    type=MediaType.MOVIE,
                    title=parsed.title,
                    description=f"Local video file: {file_path.name}",
                    genres=["Local"],
                    rating=7.5,
                    metadata_payload={
                        "is_local": True,
                        "local_path": rel_str,
                        "file_size": file_stat.st_size,
                        "quality": parsed.quality,
                        "filename": file_path.name,
                    },
                )
                db.add(media)
                movie_obj = Movie(
                    id=media.id,
                    resolution=parsed.quality or "1080p",
                    video_codec="H.264",
                )
                db.add(movie_obj)
                summary.movies_added += 1
            else:
                # Update local file path in metadata_payload
                media.metadata_payload["local_path"] = rel_str
                media.metadata_payload["is_local"] = True
                media.metadata_payload["file_size"] = file_stat.st_size
                media.metadata_payload["quality"] = parsed.quality
            await db.flush()

    async def _index_book_file(
        self, db: AsyncSession, file_path: Path, summary: ScanResultSummary
    ) -> None:
        rel_str = str(file_path.resolve())
        parsed = self.parse_book_filename(file_path.name)

        stmt = select(Media).where(
            Media.title.ilike(parsed.title),
            Media.type == MediaType.BOOK,
        )
        res = await db.execute(stmt)
        media = res.scalar_one_or_none()

        file_stat = file_path.stat()
        format_str = parsed.extension.replace(".", "")

        if not media:
            media = Media(
                id=str(uuid.uuid4()),
                type=MediaType.BOOK,
                title=parsed.title,
                description=f"Local digital publication by {parsed.author}",
                genres=["Local", "Literature"],
                rating=8.0,
                metadata_payload={
                    "is_local": True,
                    "local_path": rel_str,
                    "file_size": file_stat.st_size,
                    "filename": file_path.name,
                },
            )
            db.add(media)
            book_obj = Book(
                id=media.id,
                author=parsed.author,
                format=format_str,
                page_count=None,
                reading_sources=[
                    {
                        "type": "local",
                        "path": rel_str,
                        "format": format_str,
                    }
                ],
            )
            db.add(book_obj)
            summary.books_added += 1
        else:
            media.metadata_payload["local_path"] = rel_str
            media.metadata_payload["is_local"] = True
            media.metadata_payload["file_size"] = file_stat.st_size
        await db.flush()


local_scanner_service = LocalScannerService()
