import pytest
from datetime import date
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
    UserRole,
    WatchProgress,
    ReadingProgress,
    Watchlist,
    Favorite,
    Collection,
    CollectionItem,
)


@pytest.mark.anyio
async def test_complete_domain_integration(session):
    """End-to-end domain model test simulating an active user consuming diverse media."""
    # 1. Create User
    user = User(
        email="alex@mediahub.local",
        username="alex",
        hashed_password="secure_password_hash",
        role=UserRole.USER,
        preferences={"player": {"auto_play_next": True, "quality": "1080p"}},
    )
    session.add(user)
    await session.commit()

    # 2. Add Movie
    movie_media = Media(
        title="Spirited Away",
        type=MediaType.ANIME,
        description="A young girl wanders into a world ruled by gods and witches.",
        release_date=date(2001, 7, 20),
        genres=["Animation", "Family", "Fantasy"],
        rating=8.6,
        duration=125,
    )
    movie = Movie(media=movie_media, resolution="1080p")

    # 3. Add Series with Season and Episode
    series_media = Media(
        title="Severance",
        type=MediaType.SERIES,
        description="Mark leads a team of office workers whose memories have been surgically divided.",
        genres=["Drama", "Sci-Fi", "Thriller"],
        rating=8.7,
    )
    series = Series(media=series_media, total_seasons=1, status="Returning")
    season = Season(series=series, season_number=1, title="Season 1")
    ep1 = Episode(season=season, episode_number=1, title="Good News About Hell", duration=57)
    ep2 = Episode(season=season, episode_number=2, title="Half Loop", duration=53)

    # 4. Add Book
    book_media = Media(
        title="Hyperion",
        type=MediaType.BOOK,
        description="Seven pilgrims journey to the Time Tombs of Hyperion.",
        genres=["Sci-Fi", "Space Opera"],
    )
    book = Book(media=book_media, author="Dan Simmons", format="epub", page_count=500)

    session.add_all([movie_media, movie, series_media, series, season, ep1, ep2, book_media, book])
    await session.commit()

    # 5. User adds Movie to Watchlist, Series to Favorites
    watchlist_entry = Watchlist(user_id=user.id, media_id=movie_media.id)
    favorite_entry = Favorite(user_id=user.id, media_id=series_media.id)

    # 6. User creates Collection "Mind Benders"
    collection = Collection(user_id=user.id, name="Mind Benders", is_public=True)
    item1 = CollectionItem(collection=collection, media_id=series_media.id, order=1)
    item2 = CollectionItem(collection=collection, media_id=book_media.id, order=2)

    # 7. User tracks progress
    watch_prog = WatchProgress(
        user_id=user.id,
        media_id=series_media.id,
        episode_id=ep1.id,
        position=3100.0,
        duration=3420.0,
        percentage=90.6,
        completed=True,
    )
    read_prog = ReadingProgress(
        user_id=user.id,
        book_id=book.id,
        location="epubcfi(/6/6[chapter-3]!/4/10)",
        percentage=45.0,
        completed=False,
    )

    session.add_all([watchlist_entry, favorite_entry, collection, item1, item2, watch_prog, read_prog])
    await session.commit()

    # 8. Query and verify all user relationships and state
    stmt_user = (
        select(User)
        .where(User.id == user.id)
        .options(
            selectinload(User.watch_progress).selectinload(WatchProgress.media),
            selectinload(User.reading_progress).selectinload(ReadingProgress.book),
        )
    )
    res_user = await session.execute(stmt_user)
    loaded_user = res_user.scalar_one()

    assert loaded_user.username == "alex"
    assert len(loaded_user.watch_progress) == 1
    assert loaded_user.watch_progress[0].media.title == "Severance"
    assert loaded_user.watch_progress[0].completed is True

    assert len(loaded_user.reading_progress) == 1
    assert loaded_user.reading_progress[0].percentage == 45.0

    # Query Watchlist & Favorites
    stmt_wl = select(Watchlist).where(Watchlist.user_id == user.id).options(selectinload(Watchlist.media))
    res_wl = await session.execute(stmt_wl)
    wl_items = res_wl.scalars().all()
    assert len(wl_items) == 1
    assert wl_items[0].media.title == "Spirited Away"

    stmt_fav = select(Favorite).where(Favorite.user_id == user.id).options(selectinload(Favorite.media))
    res_fav = await session.execute(stmt_fav)
    fav_items = res_fav.scalars().all()
    assert len(fav_items) == 1
    assert fav_items[0].media.title == "Severance"

    # Query Collection
    stmt_col = select(Collection).where(Collection.user_id == user.id).options(selectinload(Collection.items))
    res_col = await session.execute(stmt_col)
    col_loaded = res_col.scalar_one()
    assert len(col_loaded.items) == 2
