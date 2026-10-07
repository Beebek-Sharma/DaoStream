import pytest
from src.models.media import MediaType
from src.providers.webnovel_provider import WebNovelProvider
from src.providers.audio_provider import AudioProvider
from src.services.metadata_service import metadata_service
from src.services.resolver_service import source_resolver_service
from src.providers.registry import provider_registry


@pytest.fixture(autouse=True)
def ensure_providers_registered():
    if not provider_registry.get("webnovel_provider"):
        provider_registry.register(WebNovelProvider())
    if not provider_registry.get("audio_provider"):
        provider_registry.register(AudioProvider())


@pytest.mark.anyio
async def test_webnovel_provider_search():
    provider = WebNovelProvider()
    results = await provider.search(query="", media_type=MediaType.BOOK)
    assert len(results) > 0
    titles = [r.title for r in results]
    assert "Shadow Slave" in titles
    assert "Lord of the Mysteries" in titles


@pytest.mark.anyio
async def test_webnovel_provider_reading_content():
    provider = WebNovelProvider()
    content = await provider.get_book_content("wn:shadow-slave")
    assert content is not None
    assert content.title == "Shadow Slave"
    assert len(content.chapters) >= 3

    # Test chapter text
    ch1_text = await provider.get_chapter_text("wn:shadow-slave", 0)
    assert ch1_text is not None
    assert "Nightmare Spell" in ch1_text
    assert "Sunny" in ch1_text


@pytest.mark.anyio
async def test_audio_provider_search_and_playback():
    provider = AudioProvider()
    results = await provider.search(query="", media_type=MediaType.AUDIO)
    assert len(results) >= 5
    station_ids = [r.provider_media_id for r in results]
    assert "audio:lofi-sanctuary" in station_ids

    # Test playback source
    sources = await provider.get_playback_sources("audio:lofi-sanctuary", MediaType.AUDIO)
    assert len(sources) > 0
    primary = sources[0]
    assert primary.is_direct is True
    assert primary.format == "mp3"
    assert "somafm.com" in primary.url


@pytest.mark.anyio
async def test_resolver_service_resolves_audio():
    res = await source_resolver_service.resolve_playback_sources(
        media_id="audio:lofi-sanctuary",
        media_type=MediaType.AUDIO,
    )
    assert res.primary_source is not None
    assert res.primary_source.is_direct is True


@pytest.mark.anyio
async def test_metadata_service_novel_chapter_text():
    text = await metadata_service.get_chapter_text("wn:lord-of-the-mysteries", 1)
    assert text is not None
    assert ("Crimson" in text or "Zhou Mingrui" in text or "Klein" in text)


@pytest.mark.anyio
async def test_anilist_anime_provider():
    from src.providers.anime_provider import AniListAnimeProvider

    from src.providers.capabilities import ProviderHealthStatus

    provider = AniListAnimeProvider()
    health = await provider.check_health()
    assert health == ProviderHealthStatus.HEALTHY
    assert provider.info.id == "anilist_anime_provider"
    assert "AniList" in provider.info.name

    # Search for popular/trending anime
    results = await provider.search(query="", media_type=MediaType.ANIME)
    assert len(results) > 0
    # Search should return valid media items
    first = results[0]
    assert first.media_type == MediaType.ANIME
    assert first.title is not None
    assert first.provider_media_id.startswith("al:") or first.provider_media_id.startswith("jikan:")

    # Search with query
    query_results = await provider.search(query="Solo Leveling", media_type=MediaType.ANIME)
    assert len(query_results) > 0
    assert any("Solo" in r.title or "Leveling" in r.title for r in query_results)

    # Details resolution
    details = await provider.get_details(first.provider_media_id, MediaType.ANIME)
    assert details is not None
    assert len(details.seasons) > 0
    assert len(details.seasons[0].episodes) > 0

    # Playback sources resolution
    sources = await provider.get_playback_sources(
        provider_media_id=first.provider_media_id,
        media_type=MediaType.ANIME,
        season_number=1,
        episode_number=1
    )
    assert len(sources) > 0
    # Must include mirrors or HLS
    titles = [s.title for s in sources]
    assert any("69Anime" in t or "DaoStream" in t or "Consumet" in t or "AutoEmbed" in t for t in titles)

