import pytest
from httpx import AsyncClient, ASGITransport

from src.main import app
from src.models.media import MediaType
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.mock_provider import MockMediaHubProvider
from src.providers.registry import ProviderRegistry, provider_registry


@pytest.mark.anyio
async def test_mock_provider_capabilities():
    provider = MockMediaHubProvider()
    info = provider.info
    assert info.id == "mock_media_provider"
    assert ProviderCapability.SEARCH in info.capabilities
    assert ProviderCapability.STREAMING in info.capabilities
    assert ProviderCapability.BOOKS in info.capabilities
    assert MediaType.MOVIE in info.supported_media_types
    assert MediaType.BOOK in info.supported_media_types

    health = await provider.check_health()
    assert health == ProviderHealthStatus.HEALTHY


@pytest.mark.anyio
async def test_mock_provider_search_and_details():
    provider = MockMediaHubProvider()

    # Search for movie
    results = await provider.search("Cosmic", media_type=MediaType.MOVIE)
    assert len(results) >= 1
    assert results[0].title == "Cosmic Drift"
    assert results[0].media_type == MediaType.MOVIE

    # Get details
    details = await provider.get_details("mock-m-1", MediaType.MOVIE)
    assert details is not None
    assert details.title == "Cosmic Drift"
    assert details.duration_minutes == 142
    assert "Sci-Fi" in details.genres


@pytest.mark.anyio
async def test_mock_provider_streaming_sources():
    provider = MockMediaHubProvider()
    sources = await provider.get_playback_sources("mock-m-1", MediaType.MOVIE)
    assert len(sources) >= 1
    assert sources[0].quality in ["1080p", "720p"]
    assert sources[0].url.endswith(".mp4")


@pytest.mark.anyio
async def test_mock_provider_book_content():
    provider = MockMediaHubProvider()
    book = await provider.get_book_content("mock-b-1")
    assert book is not None
    assert book.title == "The Quantum Cartographer"
    assert book.total_chapters == 2
    assert len(book.chapters) == 2

    chapter_1 = await provider.get_chapter_text("mock-b-1", chapter_index=1)
    assert chapter_1 is not None
    assert "quantum mapping" in chapter_1.lower()


@pytest.mark.anyio
async def test_provider_registry_management():
    registry = ProviderRegistry()
    mock_p = MockMediaHubProvider()
    registry.register(mock_p)

    assert registry.get("mock_media_provider") == mock_p
    meta_providers = registry.get_metadata_providers(MediaType.MOVIE)
    assert len(meta_providers) == 1

    book_providers = registry.get_book_providers()
    assert len(book_providers) == 1

    health_map = await registry.check_all_health()
    assert health_map["mock_media_provider"] == ProviderHealthStatus.HEALTHY

    assert registry.unregister("mock_media_provider") is True
    assert registry.get("mock_media_provider") is None


@pytest.mark.anyio
async def test_provider_api_endpoints():
    # Ensure provider is registered in the global registry
    provider_registry.register(MockMediaHubProvider())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Register user and login
        reg_payload = {
            "email": "provider_tester@example.com",
            "username": "providertester",
            "password": "SecurePassword123!",
        }
        await ac.post("/api/v1/auth/register", json=reg_payload)
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"email_or_username": "providertester", "password": "SecurePassword123!"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. List providers
        res = await ac.get("/api/v1/providers", headers=headers)
        assert res.status_code == 200
        providers = res.json()
        assert any(p["id"] == "mock_media_provider" for p in providers)

        # 2. Get provider details
        res_det = await ac.get("/api/v1/providers/mock_media_provider", headers=headers)
        assert res_det.status_code == 200
        assert res_det.json()["name"] == "Sample Media Hub Provider"

        # 3. Check health endpoint
        res_health = await ac.get("/api/v1/providers/mock_media_provider/health", headers=headers)
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # 4. Check all health
        res_all_health = await ac.get("/api/v1/providers/health", headers=headers)
        assert res_all_health.status_code == 200
        assert "mock_media_provider" in res_all_health.json()
