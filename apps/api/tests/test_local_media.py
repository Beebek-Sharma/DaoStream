import pytest
from pathlib import Path
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.services.local_scanner import local_scanner_service
from src.models.media import Media, MediaType


def test_filename_parsers():
    # Test movie parser
    movie_info = local_scanner_service.parse_video_filename("Interstellar.2014.1080p.mp4")
    assert movie_info.is_series is False
    assert movie_info.title == "Interstellar"
    assert movie_info.year == 2014
    assert movie_info.quality == "1080p"

    # Test series episode parser
    series_info = local_scanner_service.parse_video_filename("Stranger Things - S02E03 - The Pollywog.mkv")
    assert series_info.is_series is True
    assert series_info.series_title == "Stranger Things"
    assert series_info.season_number == 2
    assert series_info.episode_number == 3

    # Test book parser
    book_info = local_scanner_service.parse_book_filename("Dune - Frank Herbert.epub")
    assert book_info.title == "Dune"
    assert book_info.author == "Frank Herbert"
    assert book_info.extension == ".epub"


@pytest.mark.anyio
async def test_local_storage_scan_and_status(client: TestClient, session: AsyncSession, tmp_path: Path):
    # Setup dummy media and books directory structure
    media_dir = tmp_path / "media"
    books_dir = tmp_path / "books"
    media_dir.mkdir()
    books_dir.mkdir()

    # Create dummy files
    dummy_video = media_dir / "Gladiator.2000.1080p.mp4"
    dummy_video.write_bytes(b"VIDEO_DATA_FOR_STREAMING_TEST_1234567890")

    dummy_book = books_dir / "Neuromancer - William Gibson.txt"
    dummy_book.write_text("The sky above the port was the color of television, tuned to a dead channel.")

    # Execute scanner
    summary = await local_scanner_service.scan_directories(
        db=session,
        media_path=str(media_dir),
        books_path=str(books_dir),
    )

    assert summary.scanned_files == 2
    assert summary.movies_added == 1
    assert summary.books_added == 1

    # Test local status endpoint
    response = client.get("/api/v1/local/status")
    assert response.status_code == 200
    data = response.json()
    assert "media_storage_path" in data
    assert "indexed_local_media_count" in data


@pytest.mark.anyio
async def test_local_video_range_streaming(client: TestClient, session: AsyncSession):
    storage_dir = Path(settings.MEDIA_STORAGE_PATH).resolve()
    storage_dir.mkdir(parents=True, exist_ok=True)
    media_file = storage_dir / "sample_stream_test.mp4"
    sample_content = b"0123456789ABCDEFGHIJ"
    media_file.write_bytes(sample_content)

    try:
        # Insert Media record with metadata pointing to file
        test_media = Media(
            title="Sample Video Stream",
            type=MediaType.MOVIE,
            genres=["Action"],
            metadata_payload={
                "is_local": True,
                "local_path": str(media_file.resolve()),
            },
        )
        session.add(test_media)
        await session.commit()
        await session.refresh(test_media)

        # 1. Full stream request (no range)
        res_full = client.get(f"/api/v1/local/stream/{test_media.id}")
        assert res_full.status_code == 200
        assert res_full.content == sample_content

        # 2. HTTP Byte Range request (partial content)
        headers = {"Range": "bytes=0-9"}
        res_range = client.get(f"/api/v1/local/stream/{test_media.id}", headers=headers)
        assert res_range.status_code == 206
        assert res_range.content == b"0123456789"
        assert res_range.headers.get("content-range") == f"bytes 0-9/{len(sample_content)}"
        assert res_range.headers.get("accept-ranges") == "bytes"
    finally:
        if media_file.exists():
            media_file.unlink()


@pytest.mark.anyio
async def test_local_streaming_path_traversal_forbidden(client: TestClient, session: AsyncSession, tmp_path: Path):
    # File created in system temp folder outside project media paths
    unauthorized_file = tmp_path / "secret.txt"
    unauthorized_file.write_text("sensitive")

    media = Media(
        title="Unauthorized Media",
        type=MediaType.MOVIE,
        genres=["Drama"],
        metadata_payload={
            "is_local": True,
            "local_path": str(unauthorized_file.resolve()),
        },
    )
    session.add(media)
    await session.commit()
    await session.refresh(media)

    res = client.get(f"/api/v1/local/stream/{media.id}")
    assert res.status_code == 403


def test_local_streaming_not_found(client: TestClient):
    response = client.get("/api/v1/local/stream/non-existent-id")
    assert response.status_code == 404
