import pytest
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserRole
from src.core.security import get_password_hash, create_access_token


@pytest.fixture
async def auth_token(session: AsyncSession) -> str:
    user = User(
        email="settings_admin@example.com",
        username="settings_admin",
        hashed_password=get_password_hash("password123"),
        role=UserRole.ADMIN,
        is_active=True,
        preferences={
            "preferred_quality": "1080p",
            "auto_play_next": True,
            "reader_theme": "obsidian",
        },
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return create_access_token(user.id)


@pytest.mark.anyio
async def test_user_preferences_flow(client: TestClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Get preferences
    res = client.get("/api/v1/settings/preferences", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["preferred_quality"] == "1080p"
    assert data["reader_theme"] == "obsidian"

    # 2. Update preferences
    update_payload = {
        "preferred_quality": "4k",
        "auto_play_next": False,
        "default_subtitle_language": "fr",
        "reader_theme": "sepia",
        "reader_font_size": 22,
        "reader_font_family": "serif",
    }
    put_res = client.put("/api/v1/settings/preferences", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_data = put_res.json()
    assert updated_data["preferred_quality"] == "4k"
    assert updated_data["reader_theme"] == "sepia"
    assert updated_data["reader_font_size"] == 22

    # 3. Verify persistence
    verify_res = client.get("/api/v1/settings/preferences", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["preferred_quality"] == "4k"


def test_system_diagnostics(client: TestClient):
    res = client.get("/api/v1/settings/diagnostics")
    assert res.status_code == 200
    data = res.json()
    assert "app_name" in data
    assert "version" in data
    assert "python_version" in data
    assert "storage" in data
    assert "media" in data["storage"]
    assert "media_counts" in data
    assert "providers" in data
    assert len(data["providers"]) > 0


def test_provider_connection_test(client: TestClient):
    # Test valid provider
    res = client.post("/api/v1/settings/providers/mock_media_provider/test")
    assert res.status_code == 200
    data = res.json()
    assert data["provider_id"] == "mock_media_provider"
    assert data["is_healthy"] is True

    # Test unknown provider
    res_unknown = client.post("/api/v1/settings/providers/unknown_provider_xyz/test")
    assert res_unknown.status_code == 404
