import logging
from typing import Dict, List, Optional, Type
from src.providers.base import BaseProvider, MetadataProviderInterface, StreamingProviderInterface, BookProviderInterface
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import ProviderInfo
from src.models.media import MediaType

logger = logging.getLogger("media_hub.providers.registry")


class ProviderRegistry:
    """Central registry and manager for all provider adapters."""

    def __init__(self) -> None:
        self._providers: Dict[str, BaseProvider] = {}

    def register(self, provider: BaseProvider) -> None:
        """Register a provider instance."""
        provider_id = provider.info.id
        if provider_id in self._providers:
            logger.warning(f"Overwriting already registered provider: {provider_id}")
        self._providers[provider_id] = provider
        logger.info(f"Registered provider '{provider.info.name}' ({provider_id}) with capabilities: {provider.info.capabilities}")

    def unregister(self, provider_id: str) -> bool:
        """Unregister a provider by ID."""
        if provider_id in self._providers:
            del self._providers[provider_id]
            logger.info(f"Unregistered provider: {provider_id}")
            return True
        return False

    def get(self, provider_id: str) -> Optional[BaseProvider]:
        """Get provider by unique identifier."""
        return self._providers.get(provider_id)

    def list_all(self, enabled_only: bool = False) -> List[ProviderInfo]:
        """List provider info summaries."""
        results = []
        for p in self._providers.values():
            if enabled_only and not p.is_enabled():
                continue
            info = p.info.model_copy()
            info.is_enabled = p.is_enabled()
            results.append(info)
        return results

    def get_by_capability(self, capability: ProviderCapability, enabled_only: bool = True) -> List[BaseProvider]:
        """Return all providers offering a specific capability."""
        matched = []
        for p in self._providers.values():
            if enabled_only and not p.is_enabled():
                continue
            if capability in p.info.capabilities:
                matched.append(p)
        return matched

    def get_metadata_providers(self, media_type: Optional[MediaType] = None) -> List[MetadataProviderInterface]:
        """Get all enabled metadata providers, optionally filtered by media type."""
        providers = []
        for p in self.get_by_capability(ProviderCapability.METADATA, enabled_only=True):
            if isinstance(p, MetadataProviderInterface):
                if media_type is None or media_type in p.info.supported_media_types:
                    providers.append(p)
        return providers

    def get_streaming_providers(self, media_type: Optional[MediaType] = None) -> List[StreamingProviderInterface]:
        """Get all enabled streaming providers, optionally filtered by media type."""
        providers = []
        for p in self.get_by_capability(ProviderCapability.STREAMING, enabled_only=True):
            if isinstance(p, StreamingProviderInterface):
                if media_type is None or media_type in p.info.supported_media_types:
                    providers.append(p)
        return providers

    def get_book_providers(self) -> List[BookProviderInterface]:
        """Get all enabled book providers."""
        providers = []
        for p in self.get_by_capability(ProviderCapability.BOOKS, enabled_only=True):
            if isinstance(p, BookProviderInterface):
                providers.append(p)
        return providers

    async def check_all_health(self) -> Dict[str, ProviderHealthStatus]:
        """Check health status across all registered providers."""
        health_results: Dict[str, ProviderHealthStatus] = {}
        for p_id, p in self._providers.items():
            try:
                status = await p.check_health()
                health_results[p_id] = status
            except Exception as exc:
                logger.error(f"Health check failed for provider {p_id}: {exc}")
                health_results[p_id] = ProviderHealthStatus.UNHEALTHY
        return health_results


# Global singleton provider registry
provider_registry = ProviderRegistry()
