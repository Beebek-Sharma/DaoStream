import time
from typing import Any, Dict, Optional, Tuple


class TTLCache:
    """Lightweight in-memory TTL cache with thread-safe expiration support."""

    def __init__(self, default_ttl_seconds: int = 300) -> None:
        self.default_ttl = default_ttl_seconds
        self._store: Dict[str, Tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        value, expiry = self._store[key]
        if time.time() > expiry:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expiry = time.time() + ttl
        self._store[key] = (value, expiry)

    def delete(self, key: str) -> bool:
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear(self) -> None:
        self._store.clear()

    def cleanup_expired(self) -> int:
        now = time.time()
        expired_keys = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired_keys:
            del self._store[k]
        return len(expired_keys)

    def size(self) -> int:
        return len(self._store)

    def __len__(self) -> int:
        return len(self._store)


# Global metadata cache instance (default TTL: 10 minutes)
metadata_cache = TTLCache(default_ttl_seconds=600)
