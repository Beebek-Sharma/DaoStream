from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedPlaybackSource,
    NormalizedBookContent,
)
from src.models.media import MediaType


class BaseProvider(ABC):
    """Abstract base class for all Media Hub provider adapters."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        self.config: Dict[str, Any] = config or {}
        self._enabled: bool = True

    @property
    @abstractmethod
    def info(self) -> ProviderInfo:
        """Return provider metadata, supported media types, and capabilities."""
        pass

    def is_enabled(self) -> bool:
        return self._enabled

    def enable(self) -> None:
        self._enabled = True

    def disable(self) -> None:
        self._enabled = False

    def update_config(self, new_config: Dict[str, Any]) -> None:
        self.config.update(new_config)

    @abstractmethod
    async def check_health(self) -> ProviderHealthStatus:
        """Perform a quick connectivity or credential health check."""
        pass


class MetadataProviderInterface(BaseProvider):
    """Interface for providers that can search and fetch media metadata."""

    @abstractmethod
    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        """Search media by text query."""
        pass

    @abstractmethod
    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        """Fetch complete media details by provider media identifier."""
        pass


class StreamingProviderInterface(BaseProvider):
    """Interface for authorized providers that provide media playback sources."""

    @abstractmethod
    async def get_playback_sources(
        self,
        provider_media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> List[NormalizedPlaybackSource]:
        """Resolve authorized streaming playback sources (HLS/DASH/MP4)."""
        pass


class BookProviderInterface(BaseProvider):
    """Interface for providers supplying digital book or novel content."""

    @abstractmethod
    async def get_book_content(
        self,
        provider_media_id: str,
    ) -> Optional[NormalizedBookContent]:
        """Fetch chapters or reading metadata for a book."""
        pass

    @abstractmethod
    async def get_chapter_text(
        self,
        provider_media_id: str,
        chapter_index: int,
    ) -> Optional[str]:
        """Fetch chapter text content."""
        pass
