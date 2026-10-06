import pytest
from datetime import date
import uuid
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from src.db.session import async_session_factory
from src.models import (
    Media,
    MediaType,
    Movie,
    Series,
    Season,
    Episode,
    Book,
)


@pytest.mark.anyio
async def test_create_and_query_movie():
    async with async_session_factory() as session:
        movie_media = Media(
            title="Inception",
            original_title="Inception",
            type=MediaType.MOVIE,
            description="A thief who steals corporate secrets through dream-sharing technology.",
            release_date=date(2010, 7, 16),
            genres=["Action", "Sci-Fi", "Adventure"],
            rating=8.8,
            duration=148,
            metadata_payload={"tmdb_id": 27205, "imdb_id": "tt1375666"},
        )
        movie_detail = Movie(
            media=movie_media,
            video_codec="H.265",
            resolution="4K",
        )
        session.add_all([movie_media, movie_detail])
        await session.commit()

        # Query back
        stmt = (
            select(Media)
            .where(Media.id == movie_media.id)
            .options(selectinload(Media.movie))
        )
        result = await session.execute(stmt)
        queried = result.scalar_one()

        assert queried.title == "Inception"
        assert queried.type == MediaType.MOVIE
        assert queried.genres == ["Action", "Sci-Fi", "Adventure"]
        assert queried.movie is not None
        assert queried.movie.resolution == "4K"
        assert queried.created_at is not None


@pytest.mark.anyio
async def test_series_season_episode_hierarchy():
    async with async_session_factory() as session:
        series_media = Media(
            title="Breaking Bad",
            type=MediaType.SERIES,
            description="A high school chemistry teacher turned methamphetamine producer.",
            genres=["Crime", "Drama", "Thriller"],
            metadata_payload={"tmdb_id": 1396},
        )
        series_detail = Series(
            media=series_media,
            total_seasons=1,
            status="Ended",
        )
        season_1 = Season(
            series=series_detail,
            season_number=1,
            title="Season 1",
            description="The first season of Breaking Bad",
        )
        ep_1 = Episode(
            season=season_1,
            episode_number=1,
            title="Pilot",
            duration=58,
        )
        ep_2 = Episode(
            season=season_1,
            episode_number=2,
            title="Cat's in the Bag...",
            duration=48,
        )

        session.add_all([series_media, series_detail, season_1, ep_1, ep_2])
        await session.commit()

        # Query full hierarchy
        stmt = (
            select(Series)
            .where(Series.id == series_media.id)
            .options(
                selectinload(Series.seasons).selectinload(Season.episodes),
                selectinload(Series.media),
            )
        )
        result = await session.execute(stmt)
        series = result.scalar_one()

        assert series.media.title == "Breaking Bad"
        assert len(series.seasons) == 1
        assert series.seasons[0].season_number == 1
        assert len(series.seasons[0].episodes) == 2
        assert series.seasons[0].episodes[0].title == "Pilot"
        assert series.seasons[0].episodes[1].title == "Cat's in the Bag..."


@pytest.mark.anyio
async def test_create_and_query_book():
    async with async_session_factory() as session:
        book_media = Media(
            title="Dune",
            type=MediaType.BOOK,
            description="Set on the desert planet Arrakis.",
            genres=["Sci-Fi", "Classic"],
            metadata_payload={"openlibrary_id": "OL893415M"},
        )
        book_detail = Book(
            media=book_media,
            author="Frank Herbert",
            format="epub",
            page_count=688,
            reading_sources=[{"type": "local", "path": "books/dune.epub"}],
        )
        session.add_all([book_media, book_detail])
        await session.commit()

        stmt = (
            select(Book)
            .where(Book.id == book_media.id)
            .options(selectinload(Book.media))
        )
        result = await session.execute(stmt)
        book = result.scalar_one()

        assert book.author == "Frank Herbert"
        assert book.format == "epub"
        assert book.media.title == "Dune"
        assert len(book.reading_sources) == 1


@pytest.mark.anyio
async def test_cascade_delete_media():
    async with async_session_factory() as session:
        media = Media(
            title="Temporary Movie",
            type=MediaType.MOVIE,
            genres=["Action"],
        )
        movie = Movie(media=media, resolution="1080p")
        session.add_all([media, movie])
        await session.commit()

        media_id = media.id

        # Delete media
        await session.delete(media)
        await session.commit()

        # Verify movie is also deleted
        check_movie = await session.get(Movie, media_id)
        assert check_movie is None
