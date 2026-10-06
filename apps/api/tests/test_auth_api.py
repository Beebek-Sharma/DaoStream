import pytest
from src.models.media import Media, MediaType


def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "sarah@example.com",
            "username": "sarah",
            "password": "supersecretpassword123",
            "preferences": {"theme": "cinematic_dark"}
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "sarah@example.com"
    assert data["user"]["username"] == "sarah"
    assert data["user"]["preferences"]["theme"] == "cinematic_dark"


def test_register_duplicate_email_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "username": "first_user",
            "password": "password123",
        }
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "username": "second_user",
            "password": "password123",
        }
    )
    assert response.status_code == 400
    assert "Email is already registered" in response.json()["error"]["message"]


def test_login_user_success_and_failure(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login_test@example.com",
            "username": "logintest",
            "password": "correct_password_456",
        }
    )

    # Success with email
    res_success = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "login_test@example.com", "password": "correct_password_456"}
    )
    assert res_success.status_code == 200
    assert "access_token" in res_success.json()

    # Success with username
    res_user = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "logintest", "password": "correct_password_456"}
    )
    assert res_user.status_code == 200

    # Failure with incorrect password
    res_bad = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "logintest", "password": "wrong_password"}
    )
    assert res_bad.status_code == 401


def test_get_and_update_current_user_profile(client):
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "profile@example.com",
            "username": "profileuser",
            "password": "password123",
        }
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Unauthenticated request fails
    assert client.get("/api/v1/auth/me").status_code == 401

    # Authenticated get
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "profileuser"

    # Patch profile preferences
    patch_res = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"preferences": {"autoplay": True}}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["preferences"]["autoplay"] is True


@pytest.mark.anyio
async def test_user_watchlist_endpoints(client, session):
    # Setup media item
    media = Media(title="Cyberpunk: Edgerunners", type=MediaType.ANIME)
    session.add(media)
    await session.commit()
    media_id = media.id

    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "wl_test@example.com",
            "username": "wluser",
            "password": "password123",
        }
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add to watchlist
    add_res = client.post(f"/api/v1/library/watchlist/{media_id}", headers=headers)
    assert add_res.status_code == 201

    # Get watchlist
    get_res = client.get("/api/v1/library/watchlist", headers=headers)
    assert get_res.status_code == 200
    items = get_res.json()
    assert len(items) == 1
    assert items[0]["title"] == "Cyberpunk: Edgerunners"

    # Delete from watchlist
    del_res = client.delete(f"/api/v1/library/watchlist/{media_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify empty
    get_res2 = client.get("/api/v1/library/watchlist", headers=headers)
    assert len(get_res2.json()) == 0
