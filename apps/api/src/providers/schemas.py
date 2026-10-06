from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from src.models.media import MediaType
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus


class NormalizedSubtitle(BaseModel):
    id: str
    language: str
    label: str
    url: str
    format: str = "vtt"  # vtt, srt, ass


class NormalizedPlaybackSource(BaseModel):
    id: str
    title: str
    quality: str = "1080p"  # 4k, 1080p, 720p, 480p, auto
    format: str = "hls"  # hls, dash, mp4, webm
    url: str
    headers: Optional[Dict[str, str]] = None
    subtitles: List[NormalizedSubtitle] = Field(default_factory=list)
    is_direct: bool = True


class NormalizedEpisode(BaseModel):
    id: str
    episode_number: int
    title: Optional[str] = None
    overview: Optional[str] = None
    air_date: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_minutes: Optional[int] = None


class NormalizedSeason(BaseModel):
    season_number: int
    title: Optional[str] = None
    overview: Optional[str] = None
    poster_url: Optional[str] = None
    episodes: List[NormalizedEpisode] = Field(default_factory=list)


class NormalizedSearchResult(BaseModel):
    provider_id: str
    provider_media_id: str
    title: str
    original_title: Optional[str] = None
    media_type: MediaType
    year: Optional[int] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    overview: Optional[str] = None
    rating: Optional[float] = None


class NormalizedMediaDetails(BaseModel):
    provider_id: str
    provider_media_id: str
    title: str
    original_title: Optional[str] = None
    media_type: MediaType
    year: Optional[int] = None
    overview: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    rating: Optional[float] = None
    release_date: Optional[str] = None
    status: Optional[str] = None
    # Movie specific
    duration_minutes: Optional[int] = None
    # Series specific
    total_seasons: Optional[int] = None
    total_episodes: Optional[int] = None
    seasons: List[NormalizedSeason] = Field(default_factory=list)
    # Book specific
    author: Optional[str] = None
    page_count: Optional[int] = None
    isbn: Optional[str] = None
    format: Optional[str] = None


class NormalizedBookChapter(BaseModel):
    chapter_index: int
    title: str
    content_url: Optional[str] = None
    word_count: Optional[int] = None


class NormalizedBookContent(BaseModel):
    provider_id: str
    book_id: str
    title: str
    author: Optional[str] = None
    total_chapters: int
    chapters: List[NormalizedBookChapter] = Field(default_factory=list)


class ProviderInfo(BaseModel):
    id: str
    name: str
    version: str
    description: str
    author: str = "Media Hub Team"
    capabilities: List[ProviderCapability]
    supported_media_types: List[MediaType]
    health_status: ProviderHealthStatus = ProviderHealthStatus.HEALTHY
    is_enabled: bool = True
    config_schema: Optional[Dict[str, Any]] = None
