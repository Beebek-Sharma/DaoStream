import pytest
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.main import app
from src.models.user import User, UserRole
from src.core.security import get_password_hash, create_access_token
from src.core.security_hardening import mask_secret


@pytest.fixture
async def standard_user_token(session: AsyncSession) -> str:
    stmt = select(User).where(User.email == "standard_audit_user@example.com")
    res = await session.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email="standard_audit_user@example.com",
            username="standard_audit_user",
            hashed_password=get_password_hash("StandardUserPass123!"),
            role=UserRole.USER,
            is_superuser=False,
            is_active=True,
            preferences={},
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return create_access_token(user.id)


@pytest.fixture
async def admin_user_token(session: AsyncSession) -> str:
    stmt = select(User).where(User.email == "admin_audit_user@example.com")
    res = await session.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email="admin_audit_user@example.com",
            username="admin_audit_user",
            hashed_password=get_password_hash("AdminUserPass123!"),
            role=UserRole.ADMIN,
            is_superuser=True,
            is_active=True,
            preferences={},
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return create_access_token(user.id)


def test_security_headers_present(client: TestClient):
    """Verify modern security headers are appended to all responses."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    headers = res.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "SAMEORIGIN"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-origin-when-cross-origin" in headers.get("referrer-policy", "")
    assert "default-src 'self'" in headers.get("content-security-policy", "")
    assert headers.get("cross-origin-opener-policy") == "same-origin"


def test_secret_masking_utility():
    """Verify sensitive API keys are never exposed in plaintext."""
    val = "sk_live_123456789abcdef"
    masked = mask_secret(val)
    assert masked == ("*" * (len(val) - 4)) + "cdef"
    assert mask_secret("short") == "******"
    assert mask_secret("") == "******"


@pytest.mark.anyio
async def test_admin_route_protection_against_normal_user(
    client: TestClient, standard_user_token: str, admin_user_token: str
):
    """Non-admin users must be rejected with 403 Forbidden on privileged endpoints."""
    user_headers = {"Authorization": f"Bearer {standard_user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_user_token}"}

    # 1. Provider toggle
    res_user = client.post(
        "/api/v1/providers/local-media/toggle",
        json={"enabled": True},
        headers=user_headers,
    )
    assert res_user.status_code == 403

    res_admin = client.post(
        "/api/v1/providers/local-media/toggle",
        json={"enabled": True},
        headers=admin_headers,
    )
    assert res_admin.status_code == 200

    # 2. Diagnostics
    res_diag_user = client.get("/api/v1/settings/diagnostics", headers=user_headers)
    assert res_diag_user.status_code == 403

    res_diag_admin = client.get("/api/v1/settings/diagnostics", headers=admin_headers)
    assert res_diag_admin.status_code == 200


@pytest.mark.anyio
async def test_password_length_enforcement(client: TestClient):
    """Ensure weak passwords under 8 characters are rejected."""
    short_pw_payload = {
        "email": "short_pw_user@example.com",
        "username": "shortpwuser",
        "password": "123",  # Less than 8 chars
    }
    res = client.post("/api/v1/auth/register", json=short_pw_payload)
    assert res.status_code == 422


@pytest.mark.anyio
async def test_registration_privilege_escalation_prevention(client: TestClient, session: AsyncSession):
    """Public registrations must not be allowed to self-grant ADMIN privileges."""
    reg_payload = {
        "email": "priv_user@example.com",
        "username": "privuser",
        "password": "ValidPassword123!",
        "role": "admin",  # Attempt privilege escalation
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["role"] == "user"  # Forced to USER
    assert data["user"]["is_superuser"] is False
