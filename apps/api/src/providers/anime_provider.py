import logging
import re
from typing import List, Optional, Dict, Any
import httpx

from src.core.config import settings
from src.providers.base import MetadataProviderInterface, StreamingProviderInterface
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedSeason,
    NormalizedEpisode,
    NormalizedPlaybackSource,
)
from src.models.media import MediaType

logger = logging.getLogger("media_hub.providers.anime")

ANILIST_API_URL = "https://graphql.anilist.co"
JIKAN_API_URL = "https://api.jikan.moe/v4"


def clean_html(text: Optional[str]) -> Optional[str]:
    """Strip HTML markup from API descriptions."""
    if not text:
        return None
    clean = re.sub(r"<[^>]+>", "", text)
    return clean.replace("&quot;", '"').replace("&amp;", "&").replace("&#039;", "'").strip()


class AniListAnimeProvider(MetadataProviderInterface, StreamingProviderInterface):
    """Open-access Anime Provider using AniList GraphQL, Jikan fallback, and Consumet HLS streaming."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config)
        self.consumet_url = (
            self.config.get("consumet_url")
            or getattr(settings, "CONSUMET_API_URL", "http://localhost:3000")
        )
        self.timeout = self.config.get("timeout", 8.0)

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id="anilist_anime_provider",
            name="AniList & Jikan Anime Hub",
            version="1.0.0",
            description="Open-access Japanese animation catalog via AniList GraphQL and Jikan (no API key required) with Consumet HLS video streaming.",
            author="DaoStream Core",
            capabilities=[
                ProviderCapability.SEARCH,
                ProviderCapability.METADATA,
                ProviderCapability.ANIME,
                ProviderCapability.EPISODES,
                ProviderCapability.STREAMING,
            ],
            supported_media_types=[MediaType.ANIME],
            health_status=ProviderHealthStatus.HEALTHY,
            is_enabled=self.is_enabled(),
            config_schema={
                "consumet_url": {
                    "type": "string",
                    "default": "http://localhost:3000",
                    "description": "Optional self-hosted Consumet API URL for direct .m3u8 stream scraping",
                }
            },
        )

    async def check_health(self) -> ProviderHealthStatus:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                query = "{ Page(page: 1, perPage: 1) { media(type: ANIME) { id } } }"
                resp = await client.post(ANILIST_API_URL, json={"query": query})
                if resp.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                return ProviderHealthStatus.DEGRADED
        except Exception as exc:
            logger.warning(f"AniList health check warning: {exc}")
            return ProviderHealthStatus.DEGRADED

    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        if media_type is not None and media_type != MediaType.ANIME:
            return []

        # 1. Try AniList GraphQL first
        results = await self._search_anilist(query, page, limit)
        if results:
            return results

        # 2. Resilient fallback to Jikan API v4
        return await self._search_jikan(query, page, limit)

    async def _search_anilist(self, query: str, page: int, limit: int) -> List[NormalizedSearchResult]:
        is_empty_query = not query or not query.strip()
        if is_empty_query:
            gql_query = """
            query ($page: Int, $perPage: Int) {
              Page(page: $page, perPage: $perPage) {
                media(type: ANIME, sort: POPULARITY_DESC) {
                  id
                  idMal
                  title { english romaji native }
                  meanScore
                  episodes
                  coverImage { extraLarge large }
                  bannerImage
                  description(asHtml: false)
                  genres
                  seasonYear
                }
              }
            }
            """
            variables = {"page": page, "perPage": min(limit, 30)}
        else:
            gql_query = """
            query ($search: String, $page: Int, $perPage: Int) {
              Page(page: $page, perPage: $perPage) {
                media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
                  id
                  idMal
                  title { english romaji native }
                  meanScore
                  episodes
                  coverImage { extraLarge large }
                  bannerImage
                  description(asHtml: false)
                  genres
                  seasonYear
                }
              }
            }
            """
            variables = {"search": query.strip(), "page": page, "perPage": min(limit, 30)}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(ANILIST_API_URL, json={"query": gql_query, "variables": variables})
                if resp.status_code != 200:
                    logger.warning(f"AniList returned status {resp.status_code}")
                    return []

                data = resp.json().get("data", {}).get("Page", {}).get("media", [])
                out: List[NormalizedSearchResult] = []
                for m in data:
                    t_eng = m.get("title", {}).get("english")
                    t_rom = m.get("title", {}).get("romaji")
                    t_nat = m.get("title", {}).get("native")
                    title = t_eng or t_rom or "Anime"
                    orig_title = t_nat or (t_rom if t_eng else None)

                    cover_img = m.get("coverImage", {})
                    poster = cover_img.get("extraLarge") or cover_img.get("large")
                    backdrop = m.get("bannerImage")
                    rating = round(m["meanScore"] / 10.0, 1) if m.get("meanScore") else None

                    out.append(
                        NormalizedSearchResult(
                            provider_id=self.info.id,
                            provider_media_id=f"al:{m['id']}",
                            title=title,
                            original_title=orig_title,
                            media_type=MediaType.ANIME,
                            year=m.get("seasonYear"),
                            poster_url=poster,
                            backdrop_url=backdrop,
                            overview=clean_html(m.get("description")),
                            rating=rating,
                        )
                    )
                return out[:limit]

        except Exception as exc:
            logger.warning(f"AniList search error: {exc}")
            return []

    async def _search_jikan(self, query: str, page: int, limit: int) -> List[NormalizedSearchResult]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                if not query or not query.strip():
                    endpoint = f"{JIKAN_API_URL}/top/anime?page={page}&limit={min(limit, 25)}"
                else:
                    endpoint = f"{JIKAN_API_URL}/anime?q={query.strip()}&page={page}&limit={min(limit, 25)}&sfw=true"

                resp = await client.get(endpoint)
                if resp.status_code != 200:
                    return []

                items = resp.json().get("data", [])
                out: List[NormalizedSearchResult] = []
                for a in items:
                    images = a.get("images", {}).get("jpg", {})
                    poster = images.get("large_image_url") or images.get("image_url")
                    out.append(
                        NormalizedSearchResult(
                            provider_id=self.info.id,
                            provider_media_id=f"jikan:{a['mal_id']}",
                            title=a.get("title_english") or a.get("title", "Anime"),
                            original_title=a.get("title_japanese"),
                            media_type=MediaType.ANIME,
                            year=a.get("year"),
                            poster_url=poster,
                            backdrop_url=poster,
                            overview=a.get("synopsis"),
                            rating=a.get("score"),
                        )
                    )
                return out[:limit]
        except Exception as exc:
            logger.warning(f"Jikan fallback search error: {exc}")
            return []

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        if media_type != MediaType.ANIME:
            return None

        if provider_media_id.startswith("al:"):
            anilist_id = int(provider_media_id.replace("al:", ""))
            return await self._get_details_anilist(anilist_id, provider_media_id)
        elif provider_media_id.startswith("jikan:"):
            mal_id = int(provider_media_id.replace("jikan:", ""))
            return await self._get_details_jikan(mal_id, provider_media_id)

        return None

    async def _get_details_anilist(self, anilist_id: int, provider_media_id: str) -> Optional[NormalizedMediaDetails]:
        gql_query = """
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            idMal
            title { english romaji native }
            meanScore
            episodes
            duration
            coverImage { extraLarge large }
            bannerImage
            description(asHtml: false)
            genres
            tags { name }
            seasonYear
            status
            studios(isMain: true) { nodes { name } }
            trailer { id site }
          }
        }
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(ANILIST_API_URL, json={"query": gql_query, "variables": {"id": anilist_id}})
                if resp.status_code != 200:
                    return None

                m = resp.json().get("data", {}).get("Media")
                if not m:
                    return None

                t_eng = m.get("title", {}).get("english")
                t_rom = m.get("title", {}).get("romaji")
                t_nat = m.get("title", {}).get("native")
                title = t_eng or t_rom or "Anime"
                orig_title = t_nat or (t_rom if t_eng else None)

                cover_img = m.get("coverImage", {})
                poster = cover_img.get("extraLarge") or cover_img.get("large")
                backdrop = m.get("bannerImage")
                rating = round(m["meanScore"] / 10.0, 1) if m.get("meanScore") else None
                genres = m.get("genres", [])
                tags = [t["name"] for t in m.get("tags", [])][:6]

                total_eps = m.get("episodes") or 12
                # Generate episodes array
                episodes_dto = [
                    NormalizedEpisode(
                        id=f"al:{anilist_id}:s1:e{idx}",
                        episode_number=idx,
                        title=f"Episode {idx}",
                        overview=f"Episode {idx} of {title}.",
                        duration_minutes=m.get("duration") or 24,
                    )
                    for idx in range(1, total_eps + 1)
                ]

                seasons = [
                    NormalizedSeason(
                        season_number=1,
                        title="Season 1",
                        overview=f"Season 1 of {title}",
                        poster_url=poster,
                        episodes=episodes_dto,
                    )
                ]

                return NormalizedMediaDetails(
                    provider_id=self.info.id,
                    provider_media_id=provider_media_id,
                    title=title,
                    original_title=orig_title,
                    media_type=MediaType.ANIME,
                    year=m.get("seasonYear"),
                    overview=clean_html(m.get("description")),
                    poster_url=poster,
                    backdrop_url=backdrop,
                    genres=genres,
                    tags=tags,
                    rating=rating,
                    status=m.get("status"),
                    duration_minutes=m.get("duration"),
                    total_seasons=1,
                    total_episodes=total_eps,
                    seasons=seasons,
                )

        except Exception as exc:
            logger.error(f"AniList details error for {anilist_id}: {exc}")
            return None

    async def _get_details_jikan(self, mal_id: int, provider_media_id: str) -> Optional[NormalizedMediaDetails]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{JIKAN_API_URL}/anime/{mal_id}/full")
                if resp.status_code != 200:
                    return None

                a = resp.json().get("data", {})
                images = a.get("images", {}).get("jpg", {})
                poster = images.get("large_image_url") or images.get("image_url")
                genres = [g["name"] for g in a.get("genres", [])]
                total_eps = a.get("episodes") or 12
                title = a.get("title_english") or a.get("title", "Anime")

                episodes_dto = [
                    NormalizedEpisode(
                        id=f"jikan:{mal_id}:s1:e{idx}",
                        episode_number=idx,
                        title=f"Episode {idx}",
                        overview=f"Episode {idx} of {title}.",
                        duration_minutes=24,
                    )
                    for idx in range(1, total_eps + 1)
                ]

                seasons = [
                    NormalizedSeason(
                        season_number=1,
                        title="Season 1",
                        overview=f"Season 1 of {title}",
                        poster_url=poster,
                        episodes=episodes_dto,
                    )
                ]

                return NormalizedMediaDetails(
                    provider_id=self.info.id,
                    provider_media_id=provider_media_id,
                    title=title,
                    original_title=a.get("title_japanese"),
                    media_type=MediaType.ANIME,
                    year=a.get("year"),
                    overview=a.get("synopsis"),
                    poster_url=poster,
                    backdrop_url=poster,
                    genres=genres,
                    rating=a.get("score"),
                    status=a.get("status"),
                    duration_minutes=24,
                    total_seasons=1,
                    total_episodes=total_eps,
                    seasons=seasons,
                )
        except Exception as exc:
            logger.error(f"Jikan details error for {mal_id}: {exc}")
            return None

    async def get_playback_sources(
        self,
        provider_media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> List[NormalizedPlaybackSource]:
        s_num = season_number or 1
        e_num = episode_number or 1
        sources: List[NormalizedPlaybackSource] = []

        # 1. Self-hosted Consumet HLS Stream Probe (if Consumet instance is accessible)
        # Consumet endpoints: /anime/gogoanime/watch/... or /anime/zoro/watch/...
        if self.consumet_url:
            consumet_source = await self._resolve_consumet_hls(provider_media_id, e_num)
            if consumet_source:
                sources.append(consumet_source)

        # 2. Multi-Server Cloud Streaming Mirrors (like 69anime.cc)
        # Extract numeric id or slug
        clean_id = provider_media_id.split(":")[-1]

        sources.append(
            NormalizedPlaybackSource(
                id=f"anime-{clean_id}-vidsrc-s{s_num}e{e_num}",
                title=f"69Anime / VidSrc Cloud - Episode {e_num} (Server 1)",
                quality="1080p",
                format="embed",
                url=f"https://vidsrc.to/embed/tv/{clean_id}/{s_num}/{e_num}",
                is_direct=False,
                subtitles=[],
            )
        )
        sources.append(
            NormalizedPlaybackSource(
                id=f"anime-{clean_id}-vidsrc-pro-s{s_num}e{e_num}",
                title=f"DaoStream Anime Pro - Episode {e_num} (Server 2)",
                quality="1080p",
                format="embed",
                url=f"https://vidsrc.xyz/embed/tv/{clean_id}/{s_num}/{e_num}",
                is_direct=False,
                subtitles=[],
            )
        )
        sources.append(
            NormalizedPlaybackSource(
                id=f"anime-{clean_id}-autoembed-s{s_num}e{e_num}",
                title=f"AutoEmbed Fast - Episode {e_num} (Server 3)",
                quality="1080p",
                format="embed",
                url=f"https://autoembed.co/tv/tmdb/{clean_id}-{s_num}-{e_num}",
                is_direct=False,
                subtitles=[],
            )
        )
        sources.append(
            NormalizedPlaybackSource(
                id=f"anime-{clean_id}-2embed-s{s_num}e{e_num}",
                title=f"2Embed Stream - Episode {e_num} (Server 4)",
                quality="1080p",
                format="embed",
                url=f"https://www.2embed.cc/embedtv/{clean_id}&s={s_num}&e={e_num}",
                is_direct=False,
                subtitles=[],
            )
        )

        return sources

    async def _resolve_consumet_hls(
        self,
        provider_media_id: str,
        episode_number: int,
    ) -> Optional[NormalizedPlaybackSource]:
        """Attempt to query private/self-hosted Consumet API for direct .m3u8 HLS streams."""
        try:
            # First, fetch title details for searching in Consumet
            details = await self.get_details(provider_media_id, MediaType.ANIME)
            if not details:
                return None

            anime_title = details.title
            async with httpx.AsyncClient(timeout=3.5) as client:
                # Search Consumet Gogoanime or Zoro provider
                search_res = await client.get(
                    f"{self.consumet_url.rstrip('/')}/anime/gogoanime/{anime_title}"
                )
                if search_res.status_code != 200:
                    return None

                results = search_res.json().get("results", [])
                if not results:
                    return None

                first_match = results[0]
                anime_slug = first_match.get("id")

                # Get episode stream
                watch_res = await client.get(
                    f"{self.consumet_url.rstrip('/')}/anime/gogoanime/watch/{anime_slug}-episode-{episode_number}"
                )
                if watch_res.status_code != 200:
                    return None

                watch_data = watch_res.json()
                sources = watch_data.get("sources", [])
                if not sources:
                    return None

                # Find highest quality m3u8 or default
                best = next((s for s in sources if s.get("quality") in ["1080p", "default"]), sources[0])
                m3u8_url = best.get("url")
                if not m3u8_url:
                    return None

                headers = watch_data.get("headers", {})

                return NormalizedPlaybackSource(
                    id=f"consumet-hls-e{episode_number}",
                    title=f"Consumet HLS Direct (.m3u8) - Ep {episode_number} (Custom Player)",
                    quality="1080p",
                    format="m3u8",
                    url=m3u8_url,
                    headers=headers,
                    is_direct=True,
                    subtitles=[],
                )
        except Exception:
            # Consumet is optional / self-hosted; silently fall through to cloud mirrors
            return None
