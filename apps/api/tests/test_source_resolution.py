import pytest
from httpx import AsyncClient, ASGITransport

from src.main import app
from src.models.media import MediaType
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.base import StreamingProviderInterface
from src.providers.schemas import ProviderInfo, NormalizedPlaybackSource
from src.providers.mock_provider import MockMediaHubProvider
from src.providers.registry import provider_registry
from src.services.resolver_service import source_resolver_service


@pytest.fixture(autouse=True)
def reset_resolver_cache():
    source_resolver_service._cache.clear()
    yield
    source_resolver_service._cache.clear()
    provider_registry.unregister("mock_media_provider")
    provider_registry.unregister("failing_streaming_provider")


class FailingStreamingProvider(StreamingProviderInterface):
    """Provider specifically designed to simulate provider timeouts / failures."""

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id="failing_streaming_provider",
            name="Faulty Streaming Provider",
            version="1.0.0",
            description="Simulates downstream provider outages.",
            capabilities=[ProviderCapability.STREAMING],
            supported_media_types=[MediaType.MOVIE],
            health_status=ProviderHealthStatus.UNHEALTHY,
        )

    async def check_health(self) -> ProviderHealthStatus:
        return ProviderHealthStatus.UNHEALTHY

    async def get_playback_sources(self, *args, **kwargs):
        raise ConnectionResetError("Remote media server unavailable")


@pytest.mark.anyio
async def test_resolver_ranks_and_delivers_sources():
    provider_registry.register(MockMediaHubProvider())

    # 1. Default resolution (1080p is preferred by default over 720p)
    res = await source_resolver_service.resolve_playback_sources(
        media_id="mock-m-1",
        media_type=MediaType.MOVIE,
    )
    assert res.media_id == "mock-m-1"
    assert len(res.sources) >= 2
    assert res.primary_source is not None
    assert res.primary_source.quality == "1080p"
    assert "1080p" in res.available_qualities
    assert "720p" in res.available_qualities
    assert len(res.subtitles) >= 1

    # 2. Preferred quality override (ask specifically for 720p)
    res_720 = await source_resolver_service.resolve_playback_sources(
        media_id="mock-m-1",
        media_type=MediaType.MOVIE,
        preferred_quality="720p",
    )
    assert res_720.primary_source is not None
    assert res_720.primary_source.quality == "720p"


@pytest.mark.anyio
async def test_resolver_graceful_fallback_on_provider_failure():
    # Register both the failing provider and the working mock provider
    provider_registry.register(FailingStreamingProvider())
    provider_registry.register(MockMediaHubProvider())

    # Resolver should catch the exception from FailingStreamingProvider and fallback to Mock
    res = await source_resolver_service.resolve_playback_sources(
        media_id="mock-m-1",
        media_type=MediaType.MOVIE,
    )
    assert len(res.sources) >= 1
    assert res.primary_source is not None
    assert res.primary_source.url.endswith(".mp4")

    # Clean up registry
    provider_registry.unregister("failing_streaming_provider")


@pytest.mark.anyio
async def test_playback_api_endpoint():
    provider_registry.register(MockMediaHubProvider())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Register and login user
        reg_payload = {
            "email": "playback_user@example.com",
            "username": "playbackuser",
            "password": "SecurePassword123!",
        }
        await ac.post("/api/v1/auth/register", json=reg_payload)
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"email_or_username": "playbackuser", "password": "SecurePassword123!"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Successful resolution
        res = await ac.get(
            "/api/v1/playback/resolve/mock-m-1?media_type=movie",
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["media_id"] == "mock-m-1"
        assert data["primary_source"]["quality"] == "1080p"
        assert len(data["sources"]) >= 2
        assert data["expires_in_seconds"] == 7200

        # 2. 404 on unresolvable media
        res_404 = await ac.get(
            "/api/v1/playback/resolve/unknown-item-999?media_type=movie",
            headers=headers,
        )
        assert res_404.status_code == 404
