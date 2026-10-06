import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.models import User, UserRole


@pytest.mark.anyio
async def test_create_and_query_user(session):
    user = User(
        email="viewer@example.com",
        username="cinemafan",
        hashed_password="secure_argon2_hash_placeholder",
        role=UserRole.USER,
        preferences={"theme": "dark", "preferred_quality": "1080p"},
    )
    session.add(user)
    await session.commit()

    stmt = select(User).where(User.email == "viewer@example.com")
    result = await session.execute(stmt)
    queried = result.scalar_one()

    assert queried.id is not None
    assert queried.username == "cinemafan"
    assert queried.role == UserRole.USER
    assert queried.is_active is True
    assert queried.is_superuser is False
    assert queried.preferences["preferred_quality"] == "1080p"
    assert queried.created_at is not None


@pytest.mark.anyio
async def test_user_unique_email_constraint(session):
    user1 = User(
        email="duplicate@example.com",
        username="user_one",
        hashed_password="hash1",
    )
    user2 = User(
        email="duplicate@example.com",
        username="user_two",
        hashed_password="hash2",
    )
    session.add(user1)
    await session.commit()

    session.add(user2)
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()


@pytest.mark.anyio
async def test_user_unique_username_constraint(session):
    user1 = User(
        email="one@example.com",
        username="samename",
        hashed_password="hash1",
    )
    user2 = User(
        email="two@example.com",
        username="samename",
        hashed_password="hash2",
    )
    session.add(user1)
    await session.commit()

    session.add(user2)
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()


@pytest.mark.anyio
async def test_admin_user_flags(session):
    admin = User(
        email="admin@example.com",
        username="sysadmin",
        hashed_password="admin_hash",
        role=UserRole.ADMIN,
        is_superuser=True,
    )
    session.add(admin)
    await session.commit()

    assert admin.role == UserRole.ADMIN
    assert admin.is_superuser is True
