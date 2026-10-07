import asyncio
import logging
from typing import List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.media import Media, MediaType, Movie, Series, Season, Episode, Book
from src.providers.base import MetadataProviderInterface, BookProviderInterface
from src.providers.capabilities import ProviderCapability
from src.providers.registry import provider_registry
from src.providers.schemas import (
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedBookContent,
)
from src.core.cache import metadata_cache

logger = logging.getLogger("media_hub.services.metadata")


class MetadataService:
    """Service for querying, aggregating, normalizing, and syncing media metadata."""

    def __init__(self) -> None:
        pass

    async def search_media(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        """Federated search across all active metadata providers with caching."""
        cache_key = f"search:{query.lower().strip()}:{media_type.value if media_type else 'all'}:{limit}"
        cached = metadata_cache.get(cache_key)
        if cached is not None:
            return cached

        providers = provider_registry.get_metadata_providers(media_type=media_type)
        if not providers:
            return []

        tasks = [
            p.search(query=query, media_type=media_type, limit=limit)
            for p in providers
        ]
        provider_results = await asyncio.gather(*tasks, return_exceptions=True)

        combined: List[NormalizedSearchResult] = []
        seen_keys = set()

        for res in provider_results:
            if isinstance(res, Exception):
                logger.error(f"Search provider failed with error: {res}")
                continue
            for item in res:
                unique_key = (item.title.lower(), item.year, item.media_type)
                if unique_key not in seen_keys:
                    seen_keys.add(unique_key)
                    combined.append(item)

        results = combined[:limit]
        metadata_cache.set(cache_key, results, ttl_seconds=180)
        return results

    async def get_media_details(
        self,
        media_id_or_provider_id: str,
        media_type: Optional[MediaType] = None,
        db: Optional[AsyncSession] = None,
    ) -> Optional[NormalizedMediaDetails]:
        """Fetch media details either from database or provider adapter with caching."""
        cache_key = f"details:{media_id_or_provider_id}"
        cached = metadata_cache.get(cache_key)
        if cached is not None:
            return cached

        # Check DB first if session provided
        if db:
            stmt = select(Media).where(Media.id == media_id_or_provider_id)
            result = await db.execute(stmt)
            db_media = result.scalar_one_or_none()
            if db_media:
                details = NormalizedMediaDetails(
                    provider_id="local_db",
                    provider_media_id=db_media.id,
                    title=db_media.title,
                    original_title=db_media.original_title,
                    media_type=db_media.type,
                    year=db_media.release_date.year if db_media.release_date else db_media.metadata_payload.get("year"),
                    overview=db_media.description,
                    poster_url=db_media.poster,
                    backdrop_url=db_media.backdrop,
                    genres=db_media.genres or [],
                    tags=db_media.metadata_payload.get("tags", []),
                    rating=db_media.rating,
                    release_date=db_media.release_date.isoformat() if db_media.release_date else None,
                    status=db_media.metadata_payload.get("status"),
                )
                metadata_cache.set(cache_key, details, ttl_seconds=600)
                return details

        # Otherwise query providers
        providers = provider_registry.get_metadata_providers(media_type=media_type)
        for provider in providers:
            try:
                # If media_type not given, try all supported types
                types_to_try = [media_type] if media_type else provider.info.supported_media_types
                for m_type in types_to_try:
                    res = await provider.get_details(media_id_or_provider_id, m_type)
                    if res:
                        metadata_cache.set(cache_key, res, ttl_seconds=600)
                        return res
            except Exception as exc:
                logger.warning(f"Provider {provider.info.id} failed fetching details: {exc}")

        return None

    async def get_book_content(
        self,
        provider_media_id: str,
    ) -> Optional[NormalizedBookContent]:
        """Fetch book contents from registered book providers."""
        cache_key = f"book:{provider_media_id}"
        cached = metadata_cache.get(cache_key)
        if cached is not None:
            return cached

        providers = provider_registry.get_book_providers()
        for p in providers:
            try:
                content = await p.get_book_content(provider_media_id)
                if content:
                    metadata_cache.set(cache_key, content, ttl_seconds=600)
                    return content
            except Exception as exc:
                logger.warning(f"Provider {p.info.id} failed fetching book content: {exc}")

        return None

    async def get_chapter_text(
        self,
        provider_media_id: str,
        chapter_index: int,
    ) -> Optional[str]:
        """Fetch raw chapter text content from registered book providers."""
        cache_key = f"chapter:{provider_media_id}:{chapter_index}"
        cached = metadata_cache.get(cache_key)
        if cached is not None:
            return cached

        providers = provider_registry.get_book_providers()
        for p in providers:
            try:
                text = await p.get_chapter_text(provider_media_id, chapter_index)
                if text is not None:
                    metadata_cache.set(cache_key, text, ttl_seconds=1200)
                    return text
            except Exception as exc:
                logger.warning(f"Provider {p.info.id} failed fetching chapter text: {exc}")

        return None

    async def sync_media_to_db(
        self,
        details: NormalizedMediaDetails,
        db: AsyncSession,
    ) -> Media:
        """Ensure media is stored in canonical database for bookmarking/history relationships."""
        # Check if already exists by id
        stmt = select(Media).where(Media.id == details.provider_media_id)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            return existing

        try:
            # Create base Media entry
            media = Media(
                id=details.provider_media_id,
                title=details.title,
                original_title=details.original_title,
                type=details.media_type,
                description=details.overview,
                poster=details.poster_url,
                backdrop=details.backdrop_url,
                rating=details.rating,
                genres=details.genres,
                duration=details.duration_minutes,
                metadata_payload={
                    "year": details.year,
                    "status": details.status,
                    "tags": details.tags,
                },
            )
            db.add(media)
            await db.flush()

            # Add child subtype record
            if details.media_type == MediaType.MOVIE:
                movie = Movie(
                    id=media.id,
                )
                db.add(movie)
            elif details.media_type in [MediaType.SERIES, MediaType.ANIME]:
                series = Series(
                    id=media.id,
                    total_seasons=details.total_seasons or 0,
                    status=details.status,
                )
                db.add(series)
                await db.flush()

                # Add seasons and episodes if provided
                for s_dto in details.seasons:
                    season = Season(
                        series_id=series.id,
                        season_number=s_dto.season_number,
                        title=s_dto.title,
                        description=s_dto.overview,
                        poster=s_dto.poster_url,
                    )
                    db.add(season)
                    await db.flush()

                    for ep_dto in s_dto.episodes:
                        episode = Episode(
                            id=ep_dto.id,
                            season_id=season.id,
                            episode_number=ep_dto.episode_number,
                            title=ep_dto.title or f"Episode {ep_dto.episode_number}",
                            description=ep_dto.overview,
                            duration=ep_dto.duration_minutes,
                        )
                        db.add(episode)

            elif details.media_type == MediaType.BOOK:
                book = Book(
                    id=media.id,
                    author=details.author,
                    page_count=details.page_count,
                    isbn=details.isbn,
                    format=details.format or "epub",
                )
                db.add(book)

            await db.commit()
            await db.refresh(media)
            return media
        except Exception as exc:
            logger.warning(f"Media sync duplicate or race condition caught for {details.provider_media_id}: {exc}")
            await db.rollback()
            stmt = select(Media).where(Media.id == details.provider_media_id)
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if existing:
                return existing
            raise



metadata_service = MetadataService()
