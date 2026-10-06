import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from src.models import (
    Media,
    MediaType,
    Movie,
    User,
    Watchlist,
    Favorite,
    Collection,
    CollectionItem,
)


@pytest.mark.anyio
async def test_add_to_watchlist_and_favorite(session):
    user = User(
        email="curator@example.com",
        username="curator",
        hashed_password="hash",
    )
    media = Media(title="The Matrix", type=MediaType.MOVIE)
    movie = Movie(media=media, resolution="4K")
    session.add_all([user, media, movie])
    await session.commit()

    watchlist_entry = Watchlist(user_id=user.id, media_id=media.id)
    favorite_entry = Favorite(user_id=user.id, media_id=media.id)
    session.add_all([watchlist_entry, favorite_entry])
    await session.commit()

    # Query watchlist with media
    stmt = (
        select(Watchlist)
        .where(Watchlist.user_id == user.id)
        .options(selectinload(Watchlist.media))
    )
    res = await session.execute(stmt)
    entry = res.scalar_one()

    assert entry.media.title == "The Matrix"
    assert entry.created_at is not None

    # Query favorites
    stmt_fav = select(Favorite).where(Favorite.user_id == user.id)
    res_fav = await session.execute(stmt_fav)
    fav = res_fav.scalar_one()
    assert fav.media_id == media.id


@pytest.mark.anyio
async def test_watchlist_unique_constraint(session):
    user = User(
        email="dup_user@example.com",
        username="dup_user",
        hashed_password="hash",
    )
    media = Media(title="Inception", type=MediaType.MOVIE)
    session.add_all([user, media])
    await session.commit()

    w1 = Watchlist(user_id=user.id, media_id=media.id)
    w2 = Watchlist(user_id=user.id, media_id=media.id)
    session.add(w1)
    await session.commit()

    session.add(w2)
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()


@pytest.mark.anyio
async def test_create_custom_collection_with_ordered_items(session):
    user = User(
        email="scifi_fan@example.com",
        username="scifi_fan",
        hashed_password="hash",
    )
    media1 = Media(title="Blade Runner 2049", type=MediaType.MOVIE)
    media2 = Media(title="Arrival", type=MediaType.MOVIE)
    session.add_all([user, media1, media2])
    await session.commit()

    collection = Collection(
        user_id=user.id,
        name="Peak Modern Sci-Fi",
        description="Best sci-fi movies of the decade",
        is_public=True,
    )
    item1 = CollectionItem(collection=collection, media_id=media1.id, order=1)
    item2 = CollectionItem(collection=collection, media_id=media2.id, order=2)
    session.add_all([collection, item1, item2])
    await session.commit()

    # Query collection with ordered items and media
    stmt = (
        select(Collection)
        .where(Collection.id == collection.id)
        .options(selectinload(Collection.items).selectinload(CollectionItem.media))
    )
    res = await session.execute(stmt)
    col = res.scalar_one()

    assert col.name == "Peak Modern Sci-Fi"
    assert len(col.items) == 2
    assert col.items[0].order == 1
    assert col.items[0].media.title == "Blade Runner 2049"
    assert col.items[1].order == 2
    assert col.items[1].media.title == "Arrival"


@pytest.mark.anyio
async def test_cascade_delete_collection_cleans_items(session):
    user = User(
        email="col_user@example.com",
        username="col_user",
        hashed_password="hash",
    )
    media = Media(title="Standalone Movie", type=MediaType.MOVIE)
    session.add_all([user, media])
    await session.commit()

    collection = Collection(user_id=user.id, name="To Delete")
    item = CollectionItem(collection=collection, media_id=media.id, order=1)
    session.add_all([collection, item])
    await session.commit()

    collection_id = collection.id
    item_id = item.id
    media_id = media.id

    # Delete collection
    stmt = select(Collection).where(Collection.id == collection_id).options(selectinload(Collection.items))
    res = await session.execute(stmt)
    loaded_col = res.scalar_one()

    await session.delete(loaded_col)
    await session.commit()

    # Verify item was deleted, but underlying media remains intact
    assert await session.get(CollectionItem, item_id) is None
    assert await session.get(Media, media_id) is not None
