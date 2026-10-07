import os
import logging
from typing import List, Optional, Dict, Any
import httpx

from src.providers.base import MetadataProviderInterface, StreamingProviderInterface
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedSeason,
    NormalizedEpisode,
    NormalizedPlaybackSource,
    NormalizedSubtitle,
)
from src.models.media import MediaType

logger = logging.getLogger("media_hub.providers.tmdb")


class TMDBProvider(MetadataProviderInterface, StreamingProviderInterface):
    """The Movie Database (TMDB) provider for Movies, TV Shows, Anime, and Asian Dramas."""

    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
    BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original"

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config)
        if not self.config.get("api_key"):
            env_key = os.environ.get("TMDB_API_KEY") or os.environ.get("TMDB_ACCESS_TOKEN")
            if env_key:
                self.config["api_key"] = env_key.strip()

    @property
    def api_key(self) -> Optional[str]:
        return (
            self.config.get("api_key")
            or os.environ.get("TMDB_API_KEY")
            or os.environ.get("TMDB_ACCESS_TOKEN")
        )

    def _get_auth(self, extra_params: Optional[Dict[str, Any]] = None) -> tuple[Dict[str, Any], Dict[str, str]]:
        params = dict(extra_params) if extra_params else {}
        headers = {"accept": "application/json"}
        key = self.api_key
        if not key:
            return params, headers
        if key.startswith("eyJ"):
            headers["Authorization"] = f"Bearer {key}"
        else:
            params["api_key"] = key
        return params, headers

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
                ProviderCapability.STREAMING,
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
            params, headers = self._get_auth()
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.BASE_URL}/configuration",
                    params=params,
                    headers=headers,
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

        is_empty_query = not query or not query.strip()
        if is_empty_query:
            if media_type == MediaType.MOVIE:
                endpoint = "/trending/movie/week"
            elif media_type in [MediaType.SERIES, MediaType.ANIME, MediaType.DRAMA]:
                endpoint = "/trending/tv/week"
            else:
                endpoint = "/trending/all/week"
            auth_params = {
                "page": page,
                "language": self.config.get("language", "en-US"),
            }
        else:
            endpoint = "/search/multi"
            if media_type == MediaType.MOVIE:
                endpoint = "/search/movie"
            elif media_type in [MediaType.SERIES, MediaType.ANIME, MediaType.DRAMA]:
                endpoint = "/search/tv"
            auth_params = {
                "query": query.strip(),
                "page": page,
                "language": self.config.get("language", "en-US"),
            }

        try:
            params, headers = self._get_auth(auth_params)
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"{self.BASE_URL}{endpoint}",
                    params=params,
                    headers=headers,
                )
                if resp.status_code != 200:
                    return []

                data = resp.json()
                results: List[NormalizedSearchResult] = []
                for item in data.get("results", []):
                    item_type = item.get("media_type")
                    if endpoint in ["/search/movie", "/trending/movie/week"] or item_type == "movie":
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
            params, headers = self._get_auth({
                "language": self.config.get("language", "en-US"),
                "append_to_response": "credits,videos",
            })
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"{self.BASE_URL}{endpoint}/{tmdb_id}",
                    params=params,
                    headers=headers,
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
                        s_num = s.get("season_number", 1)
                        ep_count = s.get("episode_count", 0)
                        eps = [
                            NormalizedEpisode(
                                id=f"tmdb:tv:{tmdb_id}:s{s_num}:e{e_idx}",
                                episode_number=e_idx,
                                title=f"Episode {e_idx}",
                                overview=f"Episode {e_idx} of {title} (Season {s_num}).",
                            )
                            for e_idx in range(1, ep_count + 1)
                        ] if ep_count > 0 else []

                        seasons_dto.append(
                            NormalizedSeason(
                                season_number=s_num,
                                title=s.get("name"),
                                overview=s.get("overview"),
                                poster_url=f"{self.IMAGE_BASE_URL}{s['poster_path']}" if s.get("poster_path") else None,
                                episodes=eps,
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

    async def get_playback_sources(
        self,
        provider_media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> List[NormalizedPlaybackSource]:
        """Resolve playable streams and trailers for TMDB movies and series."""
        if not provider_media_id.startswith("tmdb:"):
            return []

        parts = provider_media_id.split(":")
        if len(parts) < 3:
            return []
        tmdb_type, tmdb_id = parts[1], parts[2]
        is_movie = tmdb_type == "movie"

        sources: List[NormalizedPlaybackSource] = []

        # 1. Fetch official HD trailer from TMDB
        try:
            endpoint = f"/movie/{tmdb_id}/videos" if is_movie else f"/tv/{tmdb_id}/videos"
            params, headers = self._get_auth()
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.BASE_URL}{endpoint}", params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    videos = data.get("results", [])
                    yt_trailer = next(
                        (v for v in videos if v.get("site") == "YouTube" and v.get("type") == "Trailer"),
                        None
                    ) or next(
                        (v for v in videos if v.get("site") == "YouTube"),
                        None
                    )
                    if yt_trailer:
                        key = yt_trailer.get("key")
                        sources.append(
                            NormalizedPlaybackSource(
                                id=f"tmdb-{tmdb_id}-trailer",
                                title=f"Official HD Trailer ({yt_trailer.get('name', 'Preview')})",
                                quality="1080p",
                                format="embed",
                                url=f"https://www.youtube.com/embed/{key}?autoplay=1",
                                is_direct=False,
                                subtitles=[],
                            )
                        )
        except Exception as exc:
            logger.warning(f"Failed to fetch TMDB trailer for {provider_media_id}: {exc}")

        # 2. Universal Multi-Server Streaming Embeds
        if is_movie:
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-vidsrc-to",
                    title="VidSrc Cloud (Server 1)",
                    quality="1080p",
                    format="embed",
                    url=f"https://vidsrc.to/embed/movie/{tmdb_id}",
                    is_direct=False,
                    subtitles=[],
                )
            )
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-vidsrc-xyz",
                    title="VidSrc Pro (Server 2)",
                    quality="1080p",
                    format="embed",
                    url=f"https://vidsrc.xyz/embed/movie/{tmdb_id}",
                    is_direct=False,
                    subtitles=[],
                )
            )
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-vidsrc-cc",
                    title="VidSrc Fast (Server 3)",
                    quality="1080p",
                    format="embed",
                    url=f"https://vidsrc.cc/v2/embed/movie/{tmdb_id}",
                    is_direct=False,
                    subtitles=[],
                )
            )
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-autoembed",
                    title="AutoEmbed Cloud (Server 4)",
                    quality="1080p",
                    format="embed",
                    url=f"https://autoembed.co/movie/tmdb/{tmdb_id}",
                    is_direct=False,
                    subtitles=[],
                )
            )
        else:
            s_num = season_number or 1
            e_num = episode_number or 1
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-vidsrc-to-s{s_num}e{e_num}",
                    title=f"VidSrc Cloud - S{s_num} E{e_num} (Server 1)",
                    quality="1080p",
                    format="embed",
                    url=f"https://vidsrc.to/embed/tv/{tmdb_id}/{s_num}/{e_num}",
                    is_direct=False,
                    subtitles=[],
                )
            )
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-vidsrc-xyz-s{s_num}e{e_num}",
                    title=f"VidSrc Pro - S{s_num} E{e_num} (Server 2)",
                    quality="1080p",
                    format="embed",
                    url=f"https://vidsrc.xyz/embed/tv/{tmdb_id}/{s_num}/{e_num}",
                    is_direct=False,
                    subtitles=[],
                )
            )
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-vidsrc-cc-s{s_num}e{e_num}",
                    title=f"VidSrc Fast - S{s_num} E{e_num} (Server 3)",
                    quality="1080p",
                    format="embed",
                    url=f"https://vidsrc.cc/v2/embed/tv/{tmdb_id}/{s_num}/{e_num}",
                    is_direct=False,
                    subtitles=[],
                )
            )
            sources.append(
                NormalizedPlaybackSource(
                    id=f"tmdb-{tmdb_id}-autoembed-s{s_num}e{e_num}",
                    title=f"AutoEmbed Cloud - S{s_num} E{e_num} (Server 4)",
                    quality="1080p",
                    format="embed",
                    url=f"https://autoembed.co/tv/tmdb/{tmdb_id}-{s_num}-{e_num}",
                    is_direct=False,
                    subtitles=[],
                )
            )

        return sources
