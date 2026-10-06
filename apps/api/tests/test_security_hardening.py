import pytest
from pathlib import Path
from starlette.testclient import TestClient

from src.core.security_hardening import is_safe_external_url, is_safe_filesystem_path


def test_ssrf_protection_validator():
    # Private & loopback IPs should be blocked
    assert is_safe_external_url("http://127.0.0.1/admin") is False
    assert is_safe_external_url("http://127.0.0.1:8000") is False
    assert is_safe_external_url("http://10.0.0.1/internal") is False
    assert is_safe_external_url("http://172.16.0.5/api") is False
    assert is_safe_external_url("http://192.168.1.1/router") is False

    # Cloud metadata endpoints must be blocked
    assert is_safe_external_url("http://169.254.169.254/latest/meta-data/") is False

    # Disallowed URI schemes must be blocked
    assert is_safe_external_url("file:///etc/passwd") is False
    assert is_safe_external_url("ftp://example.com/file") is False
    assert is_safe_external_url("gopher://example.com") is False
    assert is_safe_external_url("javascript:alert(1)") is False

    # Legitimate external HTTPS endpoints must pass
    assert is_safe_external_url("https://api.themoviedb.org/3/movie/550") is True
    assert is_safe_external_url("https://openlibrary.org/search.json") is True


def test_path_traversal_validator(tmp_path: Path):
    root_storage = tmp_path / "media_storage"
    root_storage.mkdir()

    # Valid file inside storage root
    safe_file = root_storage / "sample.mp4"
    safe_file.write_text("safe")
    assert is_safe_filesystem_path(safe_file, [root_storage]) is True

    # Path traversal attack outside root
    escape_file = root_storage / ".." / "system.key"
    assert is_safe_filesystem_path(escape_file, [root_storage]) is False

    # Arbitrary system root path
    system_path = Path("C:/Windows/System32")
    assert is_safe_filesystem_path(system_path, [root_storage]) is False


def test_security_headers_middleware(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "SAMEORIGIN"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "permissions-policy" in headers
