from typing import List, Optional, Dict, Any
from src.providers.base import (
    MetadataProviderInterface,
    StreamingProviderInterface,
    BookProviderInterface,
)
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedSeason,
    NormalizedEpisode,
    NormalizedPlaybackSource,
    NormalizedSubtitle,
    NormalizedBookContent,
    NormalizedBookChapter,
)
from src.models.media import MediaType


SAMPLE_MEDIA_DATABASE = [
    {
        "id": "mock-m-1",
        "title": "Cosmic Drift",
        "original_title": "Cosmic Drift",
        "media_type": MediaType.MOVIE,
        "year": 2024,
        "overview": "A lone interstellar navigator finds themselves lost in an uncharted gravitational fold.",
        "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80",
        "genres": ["Sci-Fi", "Adventure", "Drama"],
        "tags": ["space", "exploration", "cinematic"],
        "rating": 8.7,
        "duration_minutes": 142,
        "release_date": "2024-03-15",
        "status": "Released",
        "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
        "id": "mock-m-2",
        "title": "Neon Symphony",
        "original_title": "Neon Symphony",
        "media_type": MediaType.MOVIE,
        "year": 2023,
        "overview": "In a rain-drenched cyberpunk metropolis, a renegade acoustic hacker uncovers a corporate conspiracy.",
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80",
        "genres": ["Cyberpunk", "Action", "Thriller"],
        "tags": ["cyberpunk", "hacker", "synthwave"],
        "rating": 8.4,
        "duration_minutes": 118,
        "release_date": "2023-11-20",
        "status": "Released",
        "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    },
    {
        "id": "mock-s-1",
        "title": "Chronicles of Aetheria",
        "original_title": "Chronicles of Aetheria",
        "media_type": MediaType.SERIES,
        "year": 2022,
        "overview": "Ancient elemental dynasties clash across floating islands as energy crystals begin to deplete.",
        "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80",
        "genres": ["Fantasy", "Mystery", "Drama"],
        "tags": ["magic", "empires", "intrigue"],
        "rating": 9.1,
        "total_seasons": 2,
        "total_episodes": 16,
        "release_date": "2022-09-01",
        "status": "Ongoing",
        "seasons": [
            {
                "season_number": 1,
                "title": "Season 1: The Gathering",
                "episodes": [
                    {
                        "id": "mock-s-1-s1-e1",
                        "episode_number": 1,
                        "title": "Skyward Awakening",
                        "overview": "An outcast crystal miner uncovers an ancient resonance vault.",
                        "duration_minutes": 52,
                    },
                    {
                        "id": "mock-s-1-s1-e2",
                        "episode_number": 2,
                        "title": "Whispers of the Deep",
                        "overview": "The Imperial Guard tracks the resonance anomaly to the outer ring.",
                        "duration_minutes": 48,
                    },
                ],
            }
        ],
    },
    {
        "id": "mock-a-1",
        "title": "Blade of the Celestial Wind",
        "original_title": "天風の刃",
        "media_type": MediaType.ANIME,
        "year": 2023,
        "overview": "A spirit swordsman traverses mystical realms to seal rifts between realms of gods and men.",
        "poster_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80",
        "genres": ["Anime", "Action", "Supernatural"],
        "tags": ["swordplay", "mythology", "celestial"],
        "rating": 8.9,
        "total_seasons": 1,
        "total_episodes": 12,
        "release_date": "2023-04-10",
        "status": "Completed",
        "seasons": [
            {
                "season_number": 1,
                "title": "Arc 1: The Mountain Gate",
                "episodes": [
                    {
                        "id": "mock-a-1-s1-e1",
                        "episode_number": 1,
                        "title": "First Breath of Wind",
                        "overview": "Master Ren leaves his secluded shrine after forty years.",
                        "duration_minutes": 24,
                    }
                ],
            }
        ],
    },
    {
        "id": "mock-b-1",
        "title": "The Quantum Cartographer",
        "original_title": "The Quantum Cartographer",
        "media_type": MediaType.BOOK,
        "year": 2021,
        "overview": "A profound journey through multidimensional topologies and forgotten algorithms.",
        "poster_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&q=80",
        "genres": ["Hard Sci-Fi", "Philosophy", "Speculative"],
        "tags": ["quantum", "cartography", "dimensions"],
        "rating": 9.3,
        "author": "Dr. Eleanor Vance",
        "page_count": 420,
        "isbn": "978-0-123456-78-9",
        "format": "EPUB/Markdown",
        "chapters": [
            {
                "chapter_index": 1,
                "title": "Chapter 1: The Threshold of Coordinates",
                "content": "In the beginning of quantum mapping, one does not measure distance in light-years, but in probability density tensors. The observatory perched atop Mount Erebus had stood silent for three decades before the first anomaly appeared.",
                "word_count": 35,
            },
            {
                "chapter_index": 2,
                "title": "Chapter 2: Eigenvalues of the Void",
                "content": "Signals began repeating with mathematical precision. Not primes, nor pi, but eigenvectors of higher dimensional manifolds. Dr. Vance noted the fluctuations with trembling hands.",
                "word_count": 28,
            },
        ],
    },
]


class MockMediaHubProvider(MetadataProviderInterface, StreamingProviderInterface, BookProviderInterface):
    """Reference built-in provider demonstrating metadata, streaming, and book content resolution."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config)

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id="mock_media_provider",
            name="Sample Media Hub Provider",
            version="1.0.0",
            description="Built-in reference provider supplying sample movies, series, anime, books, and authorized demo streams.",
            capabilities=[
                ProviderCapability.SEARCH,
                ProviderCapability.METADATA,
                ProviderCapability.MOVIE,
                ProviderCapability.SERIES,
                ProviderCapability.ANIME,
                ProviderCapability.EPISODES,
                ProviderCapability.STREAMING,
                ProviderCapability.SUBTITLES,
                ProviderCapability.BOOKS,
            ],
            supported_media_types=[
                MediaType.MOVIE,
                MediaType.SERIES,
                MediaType.ANIME,
                MediaType.BOOK,
            ],
            health_status=ProviderHealthStatus.HEALTHY,
            is_enabled=self.is_enabled(),
        )

    async def check_health(self) -> ProviderHealthStatus:
        return ProviderHealthStatus.HEALTHY

    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        q = query.lower()
        results: List[NormalizedSearchResult] = []
        for item in SAMPLE_MEDIA_DATABASE:
            if media_type and item["media_type"] != media_type:
                continue
            if q in item["title"].lower() or q in item.get("overview", "").lower():
                results.append(
                    NormalizedSearchResult(
                        provider_id=self.info.id,
                        provider_media_id=item["id"],
                        title=item["title"],
                        original_title=item.get("original_title"),
                        media_type=item["media_type"],
                        year=item.get("year"),
                        poster_url=item.get("poster_url"),
                        backdrop_url=item.get("backdrop_url"),
                        overview=item.get("overview"),
                        rating=item.get("rating"),
                    )
                )
        return results[:limit]

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        for item in SAMPLE_MEDIA_DATABASE:
            if item["id"] == provider_media_id:
                seasons_dto: List[NormalizedSeason] = []
                for s in item.get("seasons", []):
                    episodes_dto = [
                        NormalizedEpisode(
                            id=e["id"],
                            episode_number=e["episode_number"],
                            title=e.get("title"),
                            overview=e.get("overview"),
                            duration_minutes=e.get("duration_minutes"),
                        )
                        for e in s.get("episodes", [])
                    ]
                    seasons_dto.append(
                        NormalizedSeason(
                            season_number=s["season_number"],
                            title=s.get("title"),
                            episodes=episodes_dto,
                        )
                    )

                return NormalizedMediaDetails(
                    provider_id=self.info.id,
                    provider_media_id=item["id"],
                    title=item["title"],
                    original_title=item.get("original_title"),
                    media_type=item["media_type"],
                    year=item.get("year"),
                    overview=item.get("overview"),
                    poster_url=item.get("poster_url"),
                    backdrop_url=item.get("backdrop_url"),
                    genres=item.get("genres", []),
                    tags=item.get("tags", []),
                    rating=item.get("rating"),
                    release_date=item.get("release_date"),
                    status=item.get("status"),
                    duration_minutes=item.get("duration_minutes"),
                    total_seasons=item.get("total_seasons"),
                    total_episodes=item.get("total_episodes"),
                    seasons=seasons_dto,
                    author=item.get("author"),
                    page_count=item.get("page_count"),
                    isbn=item.get("isbn"),
                    format=item.get("format"),
                )
        return None

    async def get_playback_sources(
        self,
        provider_media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> List[NormalizedPlaybackSource]:
        for item in SAMPLE_MEDIA_DATABASE:
            if item["id"] == provider_media_id:
                url = item.get("stream_url", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")
                return [
                    NormalizedPlaybackSource(
                        id=f"{provider_media_id}-source-1080p",
                        title="Authorized Direct Source (1080p)",
                        quality="1080p",
                        format="mp4",
                        url=url,
                        subtitles=[
                            NormalizedSubtitle(
                                id="sub-en",
                                language="en",
                                label="English",
                                url="https://example.com/subtitles/en.vtt",
                                format="vtt",
                            )
                        ],
                        is_direct=True,
                    ),
                    NormalizedPlaybackSource(
                        id=f"{provider_media_id}-source-720p",
                        title="Authorized Direct Source (720p)",
                        quality="720p",
                        format="mp4",
                        url=url,
                        subtitles=[],
                        is_direct=True,
                    ),
                ]
        return []

    async def get_book_content(
        self,
        provider_media_id: str,
    ) -> Optional[NormalizedBookContent]:
        for item in SAMPLE_MEDIA_DATABASE:
            if item["id"] == provider_media_id and item["media_type"] == MediaType.BOOK:
                chapters_dto = [
                    NormalizedBookChapter(
                        chapter_index=c["chapter_index"],
                        title=c["title"],
                        word_count=c.get("word_count"),
                    )
                    for c in item.get("chapters", [])
                ]
                return NormalizedBookContent(
                    provider_id=self.info.id,
                    book_id=item["id"],
                    title=item["title"],
                    author=item.get("author"),
                    total_chapters=len(chapters_dto),
                    chapters=chapters_dto,
                )
        return None

    async def get_chapter_text(
        self,
        provider_media_id: str,
        chapter_index: int,
    ) -> Optional[str]:
        for item in SAMPLE_MEDIA_DATABASE:
            if item["id"] == provider_media_id and item["media_type"] == MediaType.BOOK:
                for c in item.get("chapters", []):
                    if c["chapter_index"] == chapter_index:
                        return c.get("content")
        return None
