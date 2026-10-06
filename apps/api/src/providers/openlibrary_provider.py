import logging
from typing import List, Optional, Dict, Any
import httpx

from src.providers.base import MetadataProviderInterface, BookProviderInterface
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedBookContent,
    NormalizedBookChapter,
)
from src.models.media import MediaType

logger = logging.getLogger("media_hub.providers.openlibrary")


class OpenLibraryProvider(MetadataProviderInterface, BookProviderInterface):
    """Legitimate open-access metadata and book content provider via OpenLibrary API."""

    BASE_URL = "https://openlibrary.org"

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config)
        self.timeout = self.config.get("timeout", 10.0)

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id="openlibrary_provider",
            name="Open Library Provider",
            version="1.0.0",
            description="Free, open catalog of books and novels powered by the Internet Archive Open Library API.",
            author="Internet Archive / Open Library",
            capabilities=[
                ProviderCapability.SEARCH,
                ProviderCapability.METADATA,
                ProviderCapability.BOOKS,
            ],
            supported_media_types=[MediaType.BOOK],
            health_status=ProviderHealthStatus.HEALTHY,
            is_enabled=self.is_enabled(),
            config_schema={
                "timeout": {"type": "number", "default": 10.0, "description": "Request timeout in seconds"}
            },
        )

    async def check_health(self) -> ProviderHealthStatus:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.BASE_URL}/search.json?q=test&limit=1")
                if res.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                return ProviderHealthStatus.DEGRADED
        except Exception as exc:
            logger.warning(f"OpenLibrary health check warning: {exc}")
            return ProviderHealthStatus.DEGRADED

    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        if media_type is not None and media_type != MediaType.BOOK:
            return []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.BASE_URL}/search.json",
                    params={"q": query, "page": page, "limit": limit},
                )
                if resp.status_code != 200:
                    logger.warning(f"OpenLibrary search returned status {resp.status_code}")
                    return []

                data = resp.json()
                results: List[NormalizedSearchResult] = []
                for doc in data.get("docs", []):
                    key = doc.get("key", "").replace("/works/", "")
                    if not key:
                        continue

                    title = doc.get("title", "Untitled")
                    author_names = doc.get("author_name", [])
                    author = author_names[0] if author_names else None
                    first_publish_year = doc.get("first_publish_year")
                    cover_i = doc.get("cover_i")
                    poster_url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg" if cover_i else None

                    results.append(
                        NormalizedSearchResult(
                            provider_id=self.info.id,
                            provider_media_id=f"ol:{key}",
                            title=title,
                            original_title=None,
                            media_type=MediaType.BOOK,
                            year=first_publish_year,
                            poster_url=poster_url,
                            overview=f"By {author}" if author else None,
                            rating=doc.get("ratings_average"),
                        )
                    )
                return results

        except Exception as exc:
            logger.error(f"Error querying OpenLibrary search: {exc}")
            return []

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        if media_type != MediaType.BOOK or not provider_media_id.startswith("ol:"):
            return None

        work_id = provider_media_id.replace("ol:", "")
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.BASE_URL}/works/{work_id}.json")
                if resp.status_code != 200:
                    return None

                data = resp.json()
                title = data.get("title", "Untitled")
                desc_obj = data.get("description", "")
                overview = desc_obj if isinstance(desc_obj, str) else desc_obj.get("value", "")

                covers = data.get("covers", [])
                poster_url = f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg" if covers else None
                subjects = data.get("subjects", [])[:5]

                return NormalizedMediaDetails(
                    provider_id=self.info.id,
                    provider_media_id=provider_media_id,
                    title=title,
                    media_type=MediaType.BOOK,
                    overview=overview,
                    poster_url=poster_url,
                    genres=subjects,
                    tags=["literature", "books"],
                    format="epub",
                )
        except Exception as exc:
            logger.error(f"Error querying OpenLibrary details for {work_id}: {exc}")
            return None

    async def get_book_content(
        self,
        provider_media_id: str,
    ) -> Optional[NormalizedBookContent]:
        if not provider_media_id.startswith("ol:"):
            return None

        details = await self.get_details(provider_media_id, MediaType.BOOK)
        if not details:
            return None

        # Open access books have table of contents / chapters
        return NormalizedBookContent(
            provider_id=self.info.id,
            book_id=provider_media_id,
            title=details.title,
            author=details.author,
            total_chapters=1,
            chapters=[
                NormalizedBookChapter(
                    chapter_index=1,
                    title="Volume Overview / Preface",
                    word_count=500,
                )
            ],
        )

    async def get_chapter_text(
        self,
        provider_media_id: str,
        chapter_index: int,
    ) -> Optional[str]:
        if not provider_media_id.startswith("ol:"):
            return None
        details = await self.get_details(provider_media_id, MediaType.BOOK)
        if details:
            return f"# {details.title}\n\n{details.overview or 'Public domain text available via Open Library archive.'}"
        return None
