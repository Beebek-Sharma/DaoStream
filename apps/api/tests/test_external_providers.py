import pytest
from unittest.mock import AsyncMock, patch
import httpx

from src.models.media import MediaType
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.openlibrary_provider import OpenLibraryProvider
from src.providers.tmdb_provider import TMDBProvider


@pytest.mark.anyio
async def test_openlibrary_provider_capabilities_and_parsing():
    provider = OpenLibraryProvider()
    assert provider.info.id == "openlibrary_provider"
    assert ProviderCapability.BOOKS in provider.info.capabilities
    assert MediaType.BOOK in provider.info.supported_media_types

    # Mock OpenLibrary search HTTP response
    mock_search_data = {
        "docs": [
            {
                "key": "/works/OL45804W",
                "title": "Dune",
                "author_name": ["Frank Herbert"],
                "first_publish_year": 1965,
                "cover_i": 912345,
                "ratings_average": 4.6,
            }
        ]
    }
    dummy_req = httpx.Request("GET", "https://openlibrary.org/search.json")
    mock_resp = httpx.Response(200, json=mock_search_data, request=dummy_req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        results = await provider.search("Dune", media_type=MediaType.BOOK)
        assert len(results) == 1
        assert results[0].title == "Dune"
        assert results[0].provider_media_id == "ol:OL45804W"
        assert results[0].year == 1965
        assert "912345" in results[0].poster_url


@pytest.mark.anyio
async def test_openlibrary_provider_details_and_content():
    provider = OpenLibraryProvider()
    mock_work_data = {
        "title": "Dune",
        "description": "Epic science fiction saga on Arrakis.",
        "covers": [912345],
        "subjects": ["Science Fiction", "Space Opera"],
    }
    dummy_req = httpx.Request("GET", "https://openlibrary.org/works/OL45804W.json")
    mock_resp = httpx.Response(200, json=mock_work_data, request=dummy_req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        details = await provider.get_details("ol:OL45804W", MediaType.BOOK)
        assert details is not None
        assert details.title == "Dune"
        assert "Arrakis" in details.overview

        content = await provider.get_book_content("ol:OL45804W")
        assert content is not None
        assert content.total_chapters == 1


@pytest.mark.anyio
async def test_openlibrary_provider_resilience_on_http_error():
    provider = OpenLibraryProvider()
    dummy_req = httpx.Request("GET", "https://openlibrary.org")
    mock_resp = httpx.Response(500, request=dummy_req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        # Should return empty list cleanly without crashing
        results = await provider.search("Error Test")
        assert results == []

        # Should return None cleanly on details 500
        details = await provider.get_details("ol:OL9999W", MediaType.BOOK)
        assert details is None


@pytest.mark.anyio
async def test_tmdb_provider_unconfigured_behavior():
    # TMDB without API key should be UNCONFIGURED and return empty search
    provider = TMDBProvider(config={})
    assert provider.info.health_status == ProviderHealthStatus.UNCONFIGURED
    health = await provider.check_health()
    assert health == ProviderHealthStatus.UNCONFIGURED

    results = await provider.search("Inception")
    assert results == []


@pytest.mark.anyio
async def test_tmdb_provider_configured_search_and_details():
    provider = TMDBProvider(config={"api_key": "test_fake_tmdb_key_123"})
    assert provider.info.health_status == ProviderHealthStatus.HEALTHY

    mock_search_data = {
        "results": [
            {
                "id": 27205,
                "title": "Inception",
                "original_title": "Inception",
                "media_type": "movie",
                "release_date": "2010-07-16",
                "poster_path": "/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
                "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                "overview": "Cobb steals information from subconscious targets.",
                "vote_average": 8.4,
            }
        ]
    }
    dummy_req = httpx.Request("GET", "https://api.themoviedb.org/3/search/movie")
    mock_resp = httpx.Response(200, json=mock_search_data, request=dummy_req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        results = await provider.search("Inception", media_type=MediaType.MOVIE)
        assert len(results) == 1
        assert results[0].title == "Inception"
        assert results[0].provider_media_id == "tmdb:movie:27205"
        assert results[0].year == 2010
        assert "image.tmdb.org" in results[0].poster_url
