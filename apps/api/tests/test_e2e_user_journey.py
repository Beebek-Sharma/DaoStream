import pytest
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserRole
from src.core.security import get_password_hash, create_access_token


@pytest.fixture
async def e2e_user(session: AsyncSession) -> tuple[str, str]:
    user = User(
        email="journey_user@example.com",
        username="journey_user",
        hashed_password=get_password_hash("password123"),
        role=UserRole.USER,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    token = create_access_token(user.id)
    return user.id, token


@pytest.mark.anyio
async def test_full_media_lifecycle_journey(client: TestClient, e2e_user: tuple[str, str]):
    _, token = e2e_user
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Federated Search
    search_res = client.get("/api/v1/media/search?query=Cosmic", headers=headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data) > 0
    target_media = search_data[0]
    media_id = target_media["provider_media_id"]

    # Step 2: Add to Watchlist
    watch_add = client.post(f"/api/v1/library/watchlist/{media_id}", headers=headers)
    assert watch_add.status_code in [200, 201]

    # Step 3: Verify in Watchlist
    watchlist_get = client.get("/api/v1/library/watchlist", headers=headers)
    assert watchlist_get.status_code == 200
    watchlist_ids = [item.get("media_id", item.get("id")) for item in watchlist_get.json()]
    assert media_id in watchlist_ids

    # Step 4: Resolve Playback Stream
    resolve_res = client.get(f"/api/v1/playback/resolve/{media_id}?media_type=movie", headers=headers)
    assert resolve_res.status_code == 200
    playback_data = resolve_res.json()
    assert playback_data["primary_source"] is not None
    assert "url" in playback_data["primary_source"]

    # Step 5: Update Watch Progress (Watched 1200 seconds of 7200)
    progress_payload = {
        "media_id": media_id,
        "position": 1200.0,
        "duration": 7200.0,
        "completed": False,
    }
    progress_res = client.post("/api/v1/library/progress/watch", json=progress_payload, headers=headers)
    assert progress_res.status_code == 200

    # Step 6: Verify in Continue Watching
    continue_res = client.get("/api/v1/library/continue-watching", headers=headers)
    assert continue_res.status_code == 200
    continue_items = continue_res.json()
    assert len(continue_items) > 0
    assert any(c["media_id"] == media_id for c in continue_items)

    # Step 7: Create Custom Collection and Add Item
    col_payload = {"name": "Interstellar Gems", "description": "My curated space titles", "is_public": False}
    create_col = client.post("/api/v1/library/collections", json=col_payload, headers=headers)
    assert create_col.status_code in [200, 201]
    col_id = create_col.json()["id"]

    add_item = client.post(f"/api/v1/library/collections/{col_id}/items", json={"media_id": media_id}, headers=headers)
    assert add_item.status_code in [200, 201]

    # Step 8: Remove from Watchlist
    remove_watch = client.delete(f"/api/v1/library/watchlist/{media_id}", headers=headers)
    assert remove_watch.status_code == 200

    # Step 9: Delete Collection
    delete_col = client.delete(f"/api/v1/library/collections/{col_id}", headers=headers)
    assert delete_col.status_code == 200
