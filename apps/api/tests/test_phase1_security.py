import pytest
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path

from src.models.user import User, UserRole
from src.core.security import get_password_hash, create_access_token
from src.core.security_hardening import is_safe_external_url, is_safe_filesystem_path
from src.api.v1.endpoints.local_media import get_allowed_storage_roots, is_safe_path


@pytest.fixture
async def regular_token(session: AsyncSession) -> str:
    stmt = select(User).where(User.username == "sec_regular_user")
    res = await session.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email="sec_regular@example.com",
            username="sec_regular_user",
            hashed_password=get_password_hash("RegularPass123!"),
            role=UserRole.USER,
            is_superuser=False,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return create_access_token(user.id)


@pytest.fixture
async def admin_token(session: AsyncSession) -> str:
    stmt = select(User).where(User.username == "sec_admin_user")
    res = await session.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email="sec_admin@example.com",
            username="sec_admin_user",
            hashed_password=get_password_hash("AdminPass123!"),
            role=UserRole.ADMIN,
            is_superuser=True,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return create_access_token(user.id)


def test_public_browsing_without_authentication(client: TestClient):
    """DaoStream public media discovery and playback endpoints must NOT require login."""
    # 1. Search media without auth token
    res = client.get("/api/v1/media/search?query=lofi&limit=5")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 2. Providers listing without auth token
    res = client.get("/api/v1/providers")
    assert res.status_code == 200
    providers = res.json()
    assert isinstance(providers, list)
    assert any(p["id"] == "audio_provider" for p in providers)

    # 3. Playback resolution without auth token
    res = client.get("/api/v1/playback/resolve/audio:lofi-sanctuary?media_type=audio")
    assert res.status_code == 200
    data = res.json()
    assert len(data.get("sources", [])) > 0


@pytest.mark.anyio
async def test_restricted_endpoints_require_authentication(
    client: TestClient, regular_token: str
):
    """Sensitive endpoints must reject unauthenticated users with 401."""
    # 1. User library requires authentication
    res = client.get("/api/v1/library/watchlist")
    assert res.status_code == 401

    # 2. Filesystem scanning requires admin authentication
    res = client.post("/api/v1/local/scan", json={})
    assert res.status_code == 401

    # Non-admin user gets 403 Forbidden
    res_regular = client.post(
        "/api/v1/local/scan",
        json={},
        headers={"Authorization": f"Bearer {regular_token}"},
    )
    assert res_regular.status_code == 403

    # 3. Provider toggle requires admin
    res = client.post("/api/v1/providers/audio_provider/toggle", json={"enabled": True})
    assert res.status_code == 401

    res_reg = client.post(
        "/api/v1/providers/audio_provider/toggle",
        json={"enabled": True},
        headers={"Authorization": f"Bearer {regular_token}"},
    )
    assert res_reg.status_code == 403


@pytest.mark.anyio
async def test_path_traversal_guards(client: TestClient, admin_token: str):
    """File storage checks must block directory traversal and sensitive workspace files."""
    allowed = get_allowed_storage_roots()

    # Verify project root itself is not in allowed roots
    cwd = Path(".").resolve()
    assert cwd not in allowed

    # Attempting to access sensitive project files must be rejected by is_safe_path
    env_file = cwd / ".env"
    assert is_safe_path(env_file, allowed) is False

    main_py = cwd / "apps" / "api" / "src" / "main.py"
    assert is_safe_path(main_py, allowed) is False

    # Arbitrary system root attempt
    sys_file = Path("C:/Windows/win.ini")
    assert is_safe_path(sys_file, allowed) is False

    # Scan with path outside allowed storage roots must return 400 Bad Request
    res = client.post(
        "/api/v1/local/scan",
        json={"media_path": "C:/Windows", "books_path": None},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400


def test_comprehensive_ssrf_blocking():
    """All private IPs, loopback, cloud metadata, and link-local ranges must be blocked."""
    # Cloud metadata (AWS / GCP / Azure)
    assert is_safe_external_url("http://169.254.169.254/latest/meta-data/") is False
    assert is_safe_external_url("http://metadata.google.internal/computeMetadata/v1/") is False
    assert is_safe_external_url("http://instance-data/") is False

    # Loopback
    assert is_safe_external_url("http://127.0.0.1:8000/internal") is False
    assert is_safe_external_url("http://localhost:3000/") is False
    assert is_safe_external_url("http://[::1]/secret") is False

    # RFC 1918 Private Ranges
    assert is_safe_external_url("http://10.0.0.10/admin") is False
    assert is_safe_external_url("http://172.16.1.1/") is False
    assert is_safe_external_url("http://192.168.1.100:8080") is False

    # CGNAT
    assert is_safe_external_url("http://100.64.1.1/") is False

    # Dangerous Schemes
    assert is_safe_external_url("file:///etc/passwd") is False
    assert is_safe_external_url("gopher://127.0.0.1:6379") is False
    assert is_safe_external_url("dict://127.0.0.1:11211") is False

    # Authorized Public APIs must be permitted
    assert is_safe_external_url("https://api.themoviedb.org/3/movie/popular") is True
    assert is_safe_external_url("https://openlibrary.org/search.json") is True
    assert is_safe_external_url("https://graphql.anilist.co") is True
    assert is_safe_external_url("https://api.jikan.moe/v4/anime") is True


def test_error_response_sanitization(client: TestClient):
    """Error responses must provide clean JSON without internal stack traces or path disclosures."""
    # Malformed JSON payload to trigger validation error
    res = client.post(
        "/api/v1/auth/login",
        json={"invalid_field": 123},
    )
    assert res.status_code == 422
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    # Ensure no internal server stack trace
    assert "Traceback" not in res.text
