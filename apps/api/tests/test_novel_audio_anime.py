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
