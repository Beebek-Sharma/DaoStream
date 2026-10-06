import pytest
import asyncio
from starlette.testclient import TestClient
from src.main import app
from src.db.base import Base
from src.db.session import engine, async_session_factory
import src.models  # Ensure all models are registered on Base.metadata


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session", autouse=True)
def setup_database_schema():
    """Ensure database schema is created via an isolated event loop before running test session."""
    async def _create():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def _drop():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    asyncio.run(_create())
    yield
    asyncio.run(_drop())


@pytest.fixture
def anyio_backend():
    return "asyncio"
