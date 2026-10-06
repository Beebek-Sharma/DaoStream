import ipaddress
import socket
from urllib.parse import urlparse
from pathlib import Path
from typing import List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforce strict modern security headers across all HTTP responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response
