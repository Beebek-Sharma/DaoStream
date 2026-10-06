import enum
from typing import Set


class ProviderCapability(str, enum.Enum):
    """Enumeration of capabilities a media provider adapter can support."""
    SEARCH = "search"
    METADATA = "metadata"
    MOVIE = "movie"
    SERIES = "series"
    ANIME = "anime"
    EPISODES = "episodes"
    STREAMING = "streaming"
    SUBTITLES = "subtitles"
    BOOKS = "books"
    RECOMMENDATIONS = "recommendations"


class ProviderHealthStatus(str, enum.Enum):
    """Health check status of a provider."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNCONFIGURED = "unconfigured"
