import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.models import (
    Media,
    MediaType,
    Movie,
    Series,
    Season,
    Episode,
    Book,
    User,
    WatchProgress,
    ReadingProgress,
)


@pytest.mark.anyio
async def test_watch_progress_movie(session):
    user = User(
        email="viewer1@example.com",
        username="viewer1",
        hashed_password="hash",
    )
    media = Media(
        title="Interstellar",
        type=MediaType.MOVIE,
        duration=169,
    )
    movie = Movie(media=media, resolution="4K")
    session.add_all([user, media, movie])
    await session.commit()

    progress = WatchProgress(
        user_id=user.id,
        media_id=media.id,
        position=3600.0,
        duration=10140.0,
        percentage=(3600.0 / 10140.0) * 100,
        completed=False,
    )
    session.add(progress)
    await session.commit()

    # Query back
    stmt = (
        select(WatchProgress)
        .where(WatchProgress.user_id == user.id, WatchProgress.media_id == media.id)
    )
    result = await session.execute(stmt)
    saved = result.scalar_one()

    assert saved.position == 3600.0
    assert round(saved.percentage, 1) == 35.5
    assert saved.completed is False
    assert saved.created_at is not None


@pytest.mark.anyio
async def test_watch_progress_series_episode(session):
    user = User(
        email="viewer2@example.com",
        username="viewer2",
        hashed_password="hash",
    )
    series_media = Media(title="Dark", type=MediaType.SERIES)
    series = Series(media=series_media, total_seasons=1)
    season = Season(series=series, season_number=1, title="Season 1")
    episode = Episode(season=season, episode_number=1, title="Secrets", duration=51)

    session.add_all([user, series_media, series, season, episode])
    await session.commit()

    ep_progress = WatchProgress(
        user_id=user.id,
        media_id=series_media.id,
        episode_id=episode.id,
        position=3000.0,
        duration=3060.0,
        percentage=98.0,
        completed=True,
    )
    session.add(ep_progress)
    await session.commit()

    stmt = select(WatchProgress).where(
        WatchProgress.user_id == user.id,
        WatchProgress.episode_id == episode.id
    )
    result = await session.execute(stmt)
    saved = result.scalar_one()

    assert saved.completed is True
    assert saved.percentage == 98.0


@pytest.mark.anyio
async def test_reading_progress_book(session):
    user = User(
        email="reader1@example.com",
        username="reader1",
        hashed_password="hash",
    )
    book_media = Media(title="Neuromancer", type=MediaType.BOOK)
    book = Book(media=book_media, author="William Gibson", format="epub")
    session.add_all([user, book_media, book])
    await session.commit()

    progress = ReadingProgress(
        user_id=user.id,
        book_id=book.id,
        location="epubcfi(/6/12[chapter-2]!/4/2/4)",
        percentage=22.5,
        completed=False,
        bookmarks=[{"title": "The Matrix Quote", "cfi": "epubcfi(/6/12!/4/2/1)"}],
    )
    session.add(progress)
    await session.commit()

    stmt = select(ReadingProgress).where(ReadingProgress.user_id == user.id)
    result = await session.execute(stmt)
    saved = result.scalar_one()

    assert saved.location == "epubcfi(/6/12[chapter-2]!/4/2/4)"
    assert saved.percentage == 22.5
    assert len(saved.bookmarks) == 1


@pytest.mark.anyio
async def test_cascade_delete_user_cleans_progress(session):
    user = User(
        email="temporary@example.com",
        username="tempuser",
        hashed_password="hash",
    )
    media = Media(title="Test Media", type=MediaType.MOVIE)
    movie = Movie(media=media)
    progress = WatchProgress(
        media=media,
        position=100.0,
        duration=1000.0,
        percentage=10.0,
    )
    user.watch_progress.append(progress)
    session.add_all([user, media, movie])
    await session.commit()

    progress_id = progress.id
    user_id = user.id

    # Load user with watch_progress and delete
    stmt = select(User).where(User.id == user_id).options(selectinload(User.watch_progress))
    res = await session.execute(stmt)
    loaded_user = res.scalar_one()

    await session.delete(loaded_user)
    await session.commit()

    # Verify progress was cascaded
    check_prog = await session.get(WatchProgress, progress_id)
    assert check_prog is None
