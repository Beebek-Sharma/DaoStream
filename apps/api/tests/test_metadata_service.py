import pytest
from httpx import AsyncClient, ASGITransport

from src.main import app
from src.models.media import MediaType
from src.core.cache import TTLCache, metadata_cache
from src.providers.mock_provider import MockMediaHubProvider
from src.providers.registry import provider_registry
from src.services.metadata_service import metadata_service


import uuid

@pytest.fixture(autouse=True)
def clean_metadata_test_env():
    metadata_cache.clear()
    yield
    metadata_cache.clear()
    provider_registry.unregister("mock_media_provider")


@pytest.mark.anyio
async def test_cache_ttl_and_eviction():
    cache = TTLCache(default_ttl_seconds=1)
    cache.set("key1", "val1")
    assert cache.get("key1") == "val1"

    # Fast delete
    assert cache.delete("key1") is True
    assert cache.get("key1") is None


@pytest.mark.anyio
async def test_metadata_service_search_and_deduplication():
    # Ensure provider registered
    provider_registry.register(MockMediaHubProvider())
    metadata_cache.clear()

    try:
        # Search
        results = await metadata_service.search_media("Cosmic", media_type=MediaType.MOVIE)
        assert len(results) >= 1
        assert any("Cosmic" in r.title for r in results)

        # Test cache hit
        cached_results = await metadata_service.search_media("Cosmic", media_type=MediaType.MOVIE)
        assert len(cached_results) == len(results)
    finally:
        provider_registry.unregister("mock_media_provider")
        metadata_cache.clear()


@pytest.mark.anyio
async def test_metadata_service_details_and_db_sync(session):
    provider_registry.register(MockMediaHubProvider())

    # Fetch details from provider
    details = await metadata_service.get_media_details("mock-m-1", MediaType.MOVIE)
    assert details is not None
    assert details.title == "Cosmic Drift"

    # Sync to DB
    media = await metadata_service.sync_media_to_db(details, session)
    assert media.id == "mock-m-1"
    assert media.title == "Cosmic Drift"

    # Invalidate cache to test DB retrieval directly
    metadata_cache.delete("details:mock-m-1")

    # Fetch again, this time local_db can serve it
    db_details = await metadata_service.get_media_details("mock-m-1", db=session)
    assert db_details is not None
    assert db_details.title == "Cosmic Drift"


@pytest.mark.anyio
async def test_metadata_api_endpoints():
    provider_registry.register(MockMediaHubProvider())
    metadata_cache.clear()

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            uid = uuid.uuid4().hex[:6]
            # Register and login user
            reg_payload = {
                "email": f"media_tester_{uid}@example.com",
                "username": f"mediatester_{uid}",
                "password": "SecurePassword123!",
            }
            await ac.post("/api/v1/auth/register", json=reg_payload)
            login_res = await ac.post(
                "/api/v1/auth/login",
                json={"email_or_username": f"mediatester_{uid}", "password": "SecurePassword123!"},
            )
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 1. Search endpoint
            search_res = await ac.get("/api/v1/media/search?query=Blade", headers=headers)
            assert search_res.status_code == 200
            items = search_res.json()
            assert len(items) >= 1
            assert any("Blade" in item["title"] for item in items)

            # 2. Details endpoint
            detail_res = await ac.get("/api/v1/media/mock-a-1", headers=headers)
            assert detail_res.status_code == 200
            assert detail_res.json()["title"] == "Blade of the Celestial Wind"
            assert len(detail_res.json()["seasons"]) >= 1

            # 3. Sync to DB endpoint
            sync_res = await ac.post("/api/v1/media/mock-a-1/sync", headers=headers)
            assert sync_res.status_code == 200
            assert sync_res.json()["status"] == "synced"

            # 4. Book content endpoint
            book_res = await ac.get("/api/v1/media/mock-b-1/book", headers=headers)
            assert book_res.status_code == 200
            assert book_res.json()["title"] == "The Quantum Cartographer"
            assert len(book_res.json()["chapters"]) == 2

            # 5. Book chapter text endpoint
            chap_res = await ac.get("/api/v1/media/mock-b-1/book/chapter/1", headers=headers)
            assert chap_res.status_code == 200
            assert "quantum mapping" in chap_res.json()["content"].lower()

            # 6. 404 for unknown media
            unknown_res = await ac.get("/api/v1/media/non-existent-id-999", headers=headers)
            assert unknown_res.status_code == 404
    finally:
        provider_registry.unregister("mock_media_provider")
        metadata_cache.clear()

