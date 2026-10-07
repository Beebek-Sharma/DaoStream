import time
import ipaddress
import socket
from urllib.parse import urlparse
from pathlib import Path
from typing import List, Dict, Tuple
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback
    ipaddress.ip_network("10.0.0.0/8"),       # Private class A
    ipaddress.ip_network("172.16.0.0/12"),    # Private class B
    ipaddress.ip_network("192.168.0.0/16"),   # Private class C
    ipaddress.ip_network("169.254.0.0/16"),   # Link-local / Cloud metadata (AWS/GCP/Azure)
    ipaddress.ip_network("0.0.0.0/8"),        # Current network
    ipaddress.ip_network("::1/128"),          # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),        # IPv6 link-local
]


def is_safe_external_url(url: str, allow_private_for_dev: bool = False) -> bool:
    """Validate external URLs to prevent SSRF against internal infrastructure, localhost, or cloud metadata services."""
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # If allow_private_for_dev is enabled, allow local requests
        if allow_private_for_dev:
            return True

        # Check for numeric IP addresses directly
        try:
            ip = ipaddress.ip_address(hostname)
            for net in BLOCKED_IP_NETWORKS:
                if ip in net:
                    return False
        except ValueError:
            # Hostname is a domain name, resolve DNS to verify target IP
            try:
                addr_info = socket.getaddrinfo(hostname, None)
                for item in addr_info:
                    resolved_ip_str = item[4][0]
                    resolved_ip = ipaddress.ip_address(resolved_ip_str)
                    for net in BLOCKED_IP_NETWORKS:
                        if resolved_ip in net:
                            return False
            except Exception:
                # If DNS resolution fails, reject to be safe
                return False

        return True
    except Exception:
        return False


def is_safe_filesystem_path(target_path: Path, allowed_root_directories: List[Path]) -> bool:
    """Canonical path traversal defense ensuring paths strictly reside within authorized boundaries."""
    try:
        resolved_target = target_path.resolve()
        for root in allowed_root_directories:
            resolved_root = root.resolve()
            if resolved_target == resolved_root or resolved_root in resolved_target.parents:
                return True
        return False
    except Exception:
        return False


def mask_secret(value: str) -> str:
    """Masks a sensitive API key or secret string, revealing only the last 4 characters."""
    if not value or len(value) <= 6:
        return "******"
    return f"{'*' * (len(value) - 4)}{value[-4:]}"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforce strict modern security headers across all HTTP responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https: blob:; "
            "media-src 'self' blob: https: http:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:* http://192.168.*:* http://10.*:* http://172.*:* https:; "
            "frame-ancestors 'none';"
        )
        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding-window IP rate limiter defending authentication and heavy playback endpoints."""

    # Path prefix -> (max_requests, window_seconds)
    RATE_LIMITS: Dict[str, Tuple[int, int]] = {
        "/api/v1/auth/login": (10, 60),      # Max 10 login attempts per min per IP
        "/api/v1/auth/register": (5, 60),    # Max 5 registrations per min per IP
        "/api/v1/playback/resolve": (60, 60),# Max 60 stream resolutions per min per IP
    }

    def __init__(self, app):
        super().__init__(app)
        # Store: (client_ip, path) -> list of timestamps
        self.history: Dict[Tuple[str, str], List[float]] = defaultdict(list)
        self.last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        matched_rule = None

        for rule_path, limit_config in self.RATE_LIMITS.items():
            if path.startswith(rule_path):
                matched_rule = limit_config
                matched_prefix = rule_path
                break

        if matched_rule:
            # Bypass for automated test client
            if (
                request.headers.get("x-bypass-ratelimit") == "test"
                or (request.client and request.client.host == "testclient")
            ):
                return await call_next(request)

            max_requests, window_seconds = matched_rule
            client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            if not client_ip and request.client:
                client_ip = request.client.host
            if not client_ip:
                client_ip = "127.0.0.1"

            now = time.time()
            key = (client_ip, matched_prefix)
            cutoff = now - window_seconds

            # Filter old timestamps
            self.history[key] = [t for t in self.history[key] if t > cutoff]

            if len(self.history[key]) >= max_requests:
                retry_after = int(window_seconds - (now - self.history[key][0])) + 1
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Too many requests to {matched_prefix}. Please wait {retry_after} seconds.",
                            "details": {"retry_after_seconds": retry_after},
                        }
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            self.history[key].append(now)

            # Periodic cleanup every 5 minutes
            if now - self.last_cleanup > 300:
                self._cleanup(now)
                self.last_cleanup = now

        return await call_next(request)

    def _cleanup(self, now: float) -> None:
        keys_to_remove = []
        for key, timestamps in self.history.items():
            valid = [t for t in timestamps if t > now - 120]
            if not valid:
                keys_to_remove.append(key)
            else:
                self.history[key] = valid
        for k in keys_to_remove:
            del self.history[k]
