import logging
from typing import List, Optional, Dict, Any
import httpx

from src.providers.base import MetadataProviderInterface
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedSeason,
    NormalizedEpisode,
)
from src.models.media import MediaType

logger = logging.getLogger("media_hub.providers.tmdb")


class TMDBProvider(MetadataProviderInterface):
    """The Movie Database (TMDB) provider for Movies, TV Shows, Anime, and Dramas."""

    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
    BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original"

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config)

    @property
    def api_key(self) -> Optional[str]:
        return self.config.get("api_key")

    @property
    def info(self) -> ProviderInfo:
        is_configured = bool(self.api_key)
        return ProviderInfo(
            id="tmdb_provider",
            name="The Movie Database (TMDB)",
            version="1.0.0",
            description="Leading community-built database for movies, television series, anime, and Asian dramas.",
            author="TMDB Community",
            capabilities=[
                ProviderCapability.SEARCH,
                ProviderCapability.METADATA,
                ProviderCapability.MOVIE,
                ProviderCapability.SERIES,
                ProviderCapability.ANIME,
                ProviderCapability.EPISODES,
                ProviderCapability.RECOMMENDATIONS,
            ],
            supported_media_types=[
                MediaType.MOVIE,
                MediaType.SERIES,
                MediaType.ANIME,
                MediaType.DRAMA,
            ],
            health_status=ProviderHealthStatus.HEALTHY if is_configured else ProviderHealthStatus.UNCONFIGURED,
            is_enabled=self.is_enabled(),
            config_schema={
                "api_key": {
                    "type": "string",
                    "description": "TMDB v3 API Key (get free at themoviedb.org/settings/api)",
                    "required": True,
                    "secret": True,
                },
                "language": {
                    "type": "string",
                    "default": "en-US",
                    "description": "ISO 639-1 language code",
                },
            },
        )

    async def check_health(self) -> ProviderHealthStatus:
        if not self.api_key:
            return ProviderHealthStatus.UNCONFIGURED

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.BASE_URL}/configuration",
                    params={"api_key": self.api_key},
                )
                if resp.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                elif resp.status_code in [401, 403]:
                    return ProviderHealthStatus.UNHEALTHY
                return ProviderHealthStatus.DEGRADED
        except Exception as exc:
            logger.warning(f"TMDB health check failed: {exc}")
            return ProviderHealthStatus.DEGRADED

    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        if not self.api_key:
            return []

        endpoint = "/search/multi"
        if media_type == MediaType.MOVIE:
            endpoint = "/search/movie"
        elif media_type in [MediaType.SERIES, MediaType.ANIME, MediaType.DRAMA]:
            endpoint = "/search/tv"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"{self.BASE_URL}{endpoint}",
                    params={
                        "api_key": self.api_key,
                        "query": query,
                        "page": page,
                        "language": self.config.get("language", "en-US"),
                    },
                )
                if resp.status_code != 200:
                    return []

                data = resp.json()
                results: List[NormalizedSearchResult] = []
                for item in data.get("results", []):
                    item_type = item.get("media_type")
                    if endpoint == "/search/movie" or item_type == "movie":
                        m_type = MediaType.MOVIE
                        title = item.get("title", "")
                        orig_title = item.get("original_title")
                        year = int(item.get("release_date")[:4]) if item.get("release_date") else None
                    else:
                        m_type = MediaType.SERIES
                        title = item.get("name", "")
                        orig_title = item.get("original_name")
                        year = int(item.get("first_air_date")[:4]) if item.get("first_air_date") else None

                    poster_path = item.get("poster_path")
                    backdrop_path = item.get("backdrop_path")

                    results.append(
                        NormalizedSearchResult(
                            provider_id=self.info.id,
                            provider_media_id=f"tmdb:{m_type.value}:{item['id']}",
                            title=title,
                            original_title=orig_title,
                            media_type=m_type,
                            year=year,
                            poster_url=f"{self.IMAGE_BASE_URL}{poster_path}" if poster_path else None,
                            backdrop_url=f"{self.BACKDROP_BASE_URL}{backdrop_path}" if backdrop_path else None,
                            overview=item.get("overview"),
                            rating=item.get("vote_average"),
                        )
                    )
                return results[:limit]

        except Exception as exc:
            logger.error(f"Error querying TMDB search: {exc}")
            return []

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        if not self.api_key or not provider_media_id.startswith("tmdb:"):
            return None

        parts = provider_media_id.split(":")
        if len(parts) < 3:
            return None
        tmdb_type, tmdb_id = parts[1], parts[2]
        endpoint = "/movie" if tmdb_type == "movie" else "/tv"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"{self.BASE_URL}{endpoint}/{tmdb_id}",
                    params={
                        "api_key": self.api_key,
                        "language": self.config.get("language", "en-US"),
                        "append_to_response": "credits,videos",
                    },
                )
                if resp.status_code != 200:
                    return None

                data = resp.json()
                is_movie = tmdb_type == "movie"
                title = data.get("title" if is_movie else "name", "")
                genres = [g["name"] for g in data.get("genres", [])]
                poster_path = data.get("poster_path")
                backdrop_path = data.get("backdrop_path")

                seasons_dto: List[NormalizedSeason] = []
                if not is_movie:
                    for s in data.get("seasons", []):
                        seasons_dto.append(
                            NormalizedSeason(
                                season_number=s.get("season_number", 1),
                                title=s.get("name"),
                                overview=s.get("overview"),
                                poster_url=f"{self.IMAGE_BASE_URL}{s['poster_path']}" if s.get("poster_path") else None,
                            )
                        )

                return NormalizedMediaDetails(
                    provider_id=self.info.id,
                    provider_media_id=provider_media_id,
                    title=title,
                    original_title=data.get("original_title" if is_movie else "original_name"),
                    media_type=MediaType.MOVIE if is_movie else MediaType.SERIES,
                    overview=data.get("overview"),
                    poster_url=f"{self.IMAGE_BASE_URL}{poster_path}" if poster_path else None,
                    backdrop_url=f"{self.BACKDROP_BASE_URL}{backdrop_path}" if backdrop_path else None,
                    genres=genres,
                    rating=data.get("vote_average"),
                    release_date=data.get("release_date" if is_movie else "first_air_date"),
                    status=data.get("status"),
                    duration_minutes=data.get("runtime") if is_movie else None,
                    total_seasons=data.get("number_of_seasons") if not is_movie else None,
                    total_episodes=data.get("number_of_episodes") if not is_movie else None,
                    seasons=seasons_dto,
                )
        except Exception as exc:
            logger.error(f"Error querying TMDB details for {provider_media_id}: {exc}")
            return None
