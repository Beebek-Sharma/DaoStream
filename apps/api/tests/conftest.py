import pytest
import asyncio
from pathlib import Path
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event

from src.main import app
from src.db.base import Base
import src.models  # Ensure all models are registered on Base.metadata

TEST_DB_PATH = Path("./data/test_media_hub.db")

test_engine = create_async_engine(
    f"sqlite+aiosqlite:///{TEST_DB_PATH.as_posix()}",
    echo=False,
    connect_args={"check_same_thread": False},
)


@event.listens_for(test_engine.sync_engine, "connect")
def set_test_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


test_session_factory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create schema in isolated test database and clean up file on completion."""
    TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    async def _create():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def _drop():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await test_engine.dispose()
        if TEST_DB_PATH.exists():
            try:
                TEST_DB_PATH.unlink()
            except Exception:
                pass

    asyncio.run(_create())
    yield
    asyncio.run(_drop())


@pytest.fixture
async def session() -> AsyncSession:
    """Yields an isolated async session for database testing."""
    async with test_session_factory() as s:
        yield s


@pytest.fixture
def anyio_backend():
    return "asyncio"
