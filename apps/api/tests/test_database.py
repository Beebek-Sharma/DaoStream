import pytest
from sqlalchemy import text, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from src.db.base import Base, TimestampMixin
from src.db.session import engine, async_session_factory


class SampleModel(Base, TimestampMixin):
    __tablename__ = "test_samples"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)


@pytest.mark.anyio
async def test_database_engine_connection():
    """Verify that the async engine connects and executes basic SQL queries."""
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        assert result.scalar() == 1


@pytest.mark.anyio
async def test_session_lifecycle_and_mixins():
    """Verify creating tables, inserting entities with TimestampMixin, and querying."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        item = SampleModel(name="test_item")
        session.add(item)
        await session.commit()
        await session.refresh(item)

        assert item.id is not None
        assert item.name == "test_item"
        assert item.created_at is not None
        assert item.updated_at is not None

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
