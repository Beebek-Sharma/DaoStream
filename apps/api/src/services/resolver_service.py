import asyncio
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from src.core.cache import TTLCache
from src.models.media import MediaType
from src.providers.capabilities import ProviderCapability
from src.providers.registry import provider_registry
from src.providers.schemas import NormalizedPlaybackSource, NormalizedSubtitle

logger = logging.getLogger("media_hub.services.resolver")

QUALITY_SCORES: Dict[str, int] = {
    "4k": 40,
    "1080p": 30,
    "720p": 20,
    "480p": 10,
    "auto": 15,
}


class ResolvedPlaybackResponse(BaseModel):
    media_id: str
    media_type: MediaType
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    primary_source: Optional[NormalizedPlaybackSource] = None
    sources: List[NormalizedPlaybackSource] = Field(default_factory=list)
    available_qualities: List[str] = Field(default_factory=list)
    subtitles: List[NormalizedSubtitle] = Field(default_factory=list)
    expires_in_seconds: int = 7200  # 2 hours validity recommendation


class SourceResolverService:
    """Central engine for discovering, ranking, and delivering authorized media playback streams."""

    def __init__(self) -> None:
        self._cache = TTLCache(default_ttl_seconds=300)

    def _rank_source(self, source: NormalizedPlaybackSource, preferred_quality: Optional[str] = None) -> int:
        score = QUALITY_SCORES.get(source.quality.lower(), 5)
        # Prioritize matching user's preferred quality
        if preferred_quality and source.quality.lower() == preferred_quality.lower():
            score += 50
        # Subtitles availability bonus
        if source.subtitles:
            score += len(source.subtitles)
        return score

    async def resolve_playback_sources(
        self,
        media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
        preferred_quality: Optional[str] = None,
    ) -> ResolvedPlaybackResponse:
        """Resolve and rank playable streams across active streaming providers with automatic fallback."""
        cache_key = f"{media_id}:{media_type.value}:{season_number}:{episode_number}:{preferred_quality}"
        cached = self._cache.get(cache_key)
        if cached:
            return cached

        providers = provider_registry.get_streaming_providers(media_type=media_type)
        if not providers:
            logger.warning(f"No active streaming providers found for type {media_type}")
            return ResolvedPlaybackResponse(
                media_id=media_id,
                media_type=media_type,
                season_number=season_number,
                episode_number=episode_number,
            )

        tasks = [
            p.get_playback_sources(
                provider_media_id=media_id,
                media_type=media_type,
                season_number=season_number,
                episode_number=episode_number,
            )
            for p in providers
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_sources: List[NormalizedPlaybackSource] = []
        for res in results:
            if isinstance(res, Exception):
                logger.error(f"Streaming provider resolution error: {res}")
                continue
            all_sources.extend(res)

        if not all_sources:
            return ResolvedPlaybackResponse(
                media_id=media_id,
                media_type=media_type,
                season_number=season_number,
                episode_number=episode_number,
            )

        # Sort sources by calculated ranking score descending
        ranked_sources = sorted(
            all_sources,
            key=lambda s: self._rank_source(s, preferred_quality=preferred_quality),
            reverse=True,
        )

        # Aggregate unique qualities and subtitle tracks
        seen_qualities = set()
        qualities: List[str] = []
        seen_sub_urls = set()
        aggregated_subs: List[NormalizedSubtitle] = []

        for src in ranked_sources:
            if src.quality not in seen_qualities:
                seen_qualities.add(src.quality)
                qualities.append(src.quality)
            for sub in src.subtitles:
                if sub.url not in seen_sub_urls:
                    seen_sub_urls.add(sub.url)
                    aggregated_subs.append(sub)

        response = ResolvedPlaybackResponse(
            media_id=media_id,
            media_type=media_type,
            season_number=season_number,
            episode_number=episode_number,
            primary_source=ranked_sources[0] if ranked_sources else None,
            sources=ranked_sources,
            available_qualities=qualities,
            subtitles=aggregated_subs,
            expires_in_seconds=7200,
        )
        self._cache.set(cache_key, response)
        return response


source_resolver_service = SourceResolverService()
