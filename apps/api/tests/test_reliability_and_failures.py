import pytest
import asyncio
from typing import List, Optional
from httpx import AsyncClient, ConnectTimeout, ReadTimeout

from src.models.media import MediaType
from src.providers.base import (
    BaseProvider,
    MetadataProviderInterface,
    StreamingProviderInterface,
)
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedPlaybackSource,
)
from src.providers.registry import provider_registry
from src.services.metadata_service import MetadataService
from src.services.resolver_service import SourceResolverService


class FailingProvider(MetadataProviderInterface, StreamingProviderInterface):
    """Simulated provider that fails with timeouts, errors, and malformed data."""

    def __init__(self, failure_mode: str = "timeout") -> None:
        super().__init__()
        self.failure_mode = failure_mode

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id=f"failing_{self.failure_mode}",
            name="Failing Test Provider",
            version="1.0.0",
            description="Simulates provider network failures and malformed payloads.",
            capabilities=[ProviderCapability.METADATA, ProviderCapability.STREAMING],
            supported_media_types=[MediaType.MOVIE],
            health_status=ProviderHealthStatus.UNHEALTHY,
            is_enabled=True,
        )

    async def check_health(self) -> ProviderHealthStatus:
        return ProviderHealthStatus.UNHEALTHY

    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        if self.failure_mode == "timeout":
            raise ReadTimeout("Simulated provider read timeout")
        elif self.failure_mode == "network_error":
            raise ConnectTimeout("Simulated upstream network down")
        raise RuntimeError("Unexpected provider server exception")

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        raise RuntimeError("Simulated crash on details")

    async def get_playback_sources(
        self,
        provider_media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> List[NormalizedPlaybackSource]:
        if self.failure_mode == "timeout":
            raise ConnectTimeout("Simulated streaming provider unreachable")
        raise RuntimeError("Streaming provider fatal error")


from starlette.testclient import TestClient


@pytest.mark.anyio
async def test_search_gracefully_survives_provider_outage(client: TestClient):
    # Register failing provider
    failing = FailingProvider(failure_mode="timeout")
    provider_registry.register(failing)

    try:
        service = MetadataService()
        # Search should not throw an unhandled exception despite the failing provider
        results = await service.search_media(query="Cosmic", media_type=MediaType.MOVIE)
        assert isinstance(results, list)
        # Healthy providers should still contribute results
        assert any(r.title == "Cosmic Drift" for r in results)
    finally:
        provider_registry.unregister(failing.info.id)


@pytest.mark.anyio
async def test_source_resolution_fallback_on_provider_crash(client: TestClient):
    # Register failing streaming provider
    failing_streamer = FailingProvider(failure_mode="network_error")
    provider_registry.register(failing_streamer)

    try:
        resolver = SourceResolverService()
        # Should resolve primary stream using healthy mock provider without failing
        res = await resolver.resolve_playback_sources(
            media_id="mock-m-1",
            media_type=MediaType.MOVIE,
        )
        assert res.primary_source is not None
        assert res.primary_source.quality == "1080p"
        assert len(res.sources) > 0
    finally:
        provider_registry.unregister(failing_streamer.info.id)


@pytest.mark.anyio
async def test_health_check_handles_unhealthy_provider_cleanly(client: TestClient):
    failing = FailingProvider(failure_mode="network_error")
    provider_registry.register(failing)

    try:
        health_map = await provider_registry.check_all_health()
        assert health_map.get(failing.info.id) == ProviderHealthStatus.UNHEALTHY
    finally:
        provider_registry.unregister(failing.info.id)
