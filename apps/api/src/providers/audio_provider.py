import logging
from typing import List, Optional, Dict, Any

from src.providers.base import MetadataProviderInterface, StreamingProviderInterface
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedPlaybackSource,
)
from src.models.media import MediaType

logger = logging.getLogger("media_hub.providers.audio")

# Curated catalog of high-bitrate continuous streaming stations & music channels
AUDIO_STATION_CATALOG = [
    {
        "id": "audio:lofi-sanctuary",
        "title": "DaoStream Lo-Fi Sanctuary",
        "artist": "DaoStream Sound Collective",
        "genre": "Lo-Fi / Chillhop",
        "year": 2024,
        "rating": 9.9,
        "genres": ["Lo-Fi", "Chillhop", "Study", "Relaxation"],
        "tags": ["lo-fi", "beats", "cultivation", "study", "continuous-stream"],
        "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80",
        "overview": "Immersive mellow hip-hop, relaxing piano chords, and soothing vinyl crackle designed for deep focus, reading novels, and meditation.",
        "stream_url": "https://ice2.somafm.com/chill-128-mp3",
        "bitrate": "128 kbps MP3",
    },
    {
        "id": "audio:groove-salad",
        "title": "Groove Salad: Ambient Downtempo",
        "artist": "SomaFM Audio Engineers",
        "genre": "Ambient Downtempo",
        "year": 2024,
        "rating": 9.8,
        "genres": ["Ambient", "Downtempo", "Electronic", "Chillout"],
        "tags": ["downtempo", "atmospheric", "ambient", "groove"],
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80",
        "overview": "A pristine plate of ambient and downtempo grooves, atmospheric beats, and deep electronic textures.",
        "stream_url": "https://ice2.somafm.com/groovesalad-128-mp3",
        "bitrate": "128 kbps MP3",
    },
    {
        "id": "audio:def-con-cyber",
        "title": "DEF CON Radio: Cyber Matrix",
        "artist": "DEF CON Media Collective",
        "genre": "Cyberpunk / Industrial Synth",
        "year": 2024,
        "rating": 9.7,
        "genres": ["Cyberpunk", "Dark Synth", "Industrial", "Hacker Beats"],
        "tags": ["cyberpunk", "hacker", "synthwave", "defcon", "coding-flow"],
        "poster_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&q=80",
        "overview": "Music for hacking the planet. Dark synthesized basslines, industrial rhythms, and relentless electronic drive for intense focus.",
        "stream_url": "https://ice4.somafm.com/defcon-128-mp3",
        "bitrate": "128 kbps MP3",
    },
    {
        "id": "audio:vaporwaves",
        "title": "Vaporwaves & Neon Dreams",
        "artist": "RetroWave Synthesizers",
        "genre": "Synthwave / Vaporwave",
        "year": 2024,
        "rating": 9.6,
        "genres": ["Synthwave", "Vaporwave", "Retro 80s", "Chillwave"],
        "tags": ["vaporwave", "neon", "80s-aesthetic", "nostalgia", "synth"],
        "poster_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80",
        "overview": "Nostalgic 1980s synthesized landscapes, cassette-deck tape warble, and neon-drenched retro-futuristic journeys.",
        "stream_url": "https://ice4.somafm.com/vaporwaves-128-mp3",
        "bitrate": "128 kbps MP3",
    },
    {
        "id": "audio:drone-zone",
        "title": "Drone Zone: Celestial Atmospheric",
        "artist": "Atmospheric Space Ensemble",
        "genre": "Ambient Space / Drone",
        "year": 2024,
        "rating": 9.7,
        "genres": ["Space Ambient", "Drone", "Deep Sleep", "Meditation"],
        "tags": ["celestial", "space", "meditation", "sleep", "minimalist"],
        "poster_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80",
        "overview": "Deep ethereal ambient space soundscapes and continuous harmonic drones for transcendental relaxation and reading.",
        "stream_url": "https://ice6.somafm.com/dronezone-128-mp3",
        "bitrate": "128 kbps MP3",
    },
    {
        "id": "audio:secret-agent",
        "title": "Secret Agent: Spy-Fi & Cinematic Lounge",
        "artist": "The Syndicate Lounge",
        "genre": "Cinematic Lounge / Spy-Fi",
        "year": 2023,
        "rating": 9.5,
        "genres": ["Cinematic", "Spy Lounge", "Vintage Surf", "Jazz"],
        "tags": ["james-bond", "vintage", "detective", "lounge", "brass"],
        "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80",
        "overview": "The stylish soundtrack for your mysterious nocturnal life. Classic 1960s espionage lounge, brass flourishes, and spy surf guitars.",
        "stream_url": "https://ice2.somafm.com/secretagent-128-mp3",
        "bitrate": "128 kbps MP3",
    },
    {
        "id": "audio:suburbs-of-goa",
        "title": "Suburbs of Goa: Mystical Eastern Fusion",
        "artist": "Silk Road Transmissions",
        "genre": "Asian Underground / Desi Chill",
        "year": 2024,
        "rating": 9.6,
        "genres": ["World Fusion", "Sitar Lounge", "Asian Chill", "Electronic"],
        "tags": ["sitar", "eastern", "dao-cultivation", "mystic", "chillout"],
        "poster_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80",
        "overview": "Desi chill, traditional sitar harmonics, and mystical Asian electronic beats perfectly synchronized with cultivation lore.",
        "stream_url": "https://ice2.somafm.com/suburbsofgoa-128-mp3",
        "bitrate": "128 kbps MP3",
    },
    {
        "id": "audio:mission-control",
        "title": "Mission Control: NASA Space Communications",
        "artist": "Apollo & Shuttle Archives",
        "genre": "Space Ambient / Telemetry",
        "year": 2024,
        "rating": 9.8,
        "genres": ["Space Ambient", "Historic Audio", "Documentary", "Focus"],
        "tags": ["nasa", "spaceflight", "astronaut", "apollo", "ambient"],
        "poster_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&q=80",
        "overview": "Atmospheric ambient electronic soundscapes seamlessly intermixed with live historical NASA space exploration telemetry and astronaut communications.",
        "stream_url": "https://ice2.somafm.com/missioncontrol-128-mp3",
        "bitrate": "128 kbps MP3",
    },
]


class AudioProvider(MetadataProviderInterface, StreamingProviderInterface):
    """High-fidelity continuous streaming audio, radio stations, and curated music provider."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config)

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id="audio_provider",
            name="DaoStream Audio & Music Vault",
            version="1.0.0",
            description="Continuous high-bitrate streaming audio channels, Lo-Fi beats, Synthwave, and Ambient stations.",
            author="DaoStream Core",
            capabilities=[
                ProviderCapability.SEARCH,
                ProviderCapability.METADATA,
                ProviderCapability.STREAMING,
                ProviderCapability.AUDIO,
            ],
            supported_media_types=[MediaType.AUDIO],
            health_status=ProviderHealthStatus.HEALTHY,
            is_enabled=self.is_enabled(),
            config_schema={},
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
        if media_type is not None and media_type != MediaType.AUDIO:
            return []

        q_lower = query.lower().strip()
        matched = []

        for st in AUDIO_STATION_CATALOG:
            if not q_lower:
                matched.append(st)
            else:
                title_match = q_lower in st["title"].lower()
                artist_match = q_lower in st["artist"].lower()
                genre_match = any(q_lower in g.lower() for g in st["genres"])
                tag_match = any(q_lower in t.lower() for t in st["tags"])
                desc_match = q_lower in st["overview"].lower()

                if title_match or artist_match or genre_match or tag_match or desc_match:
                    matched.append(st)

        results: List[NormalizedSearchResult] = []
        for s in matched[:limit]:
            results.append(
                NormalizedSearchResult(
                    provider_id=self.info.id,
                    provider_media_id=s["id"],
                    title=s["title"],
                    original_title=s["artist"],
                    media_type=MediaType.AUDIO,
                    year=s["year"],
                    poster_url=s["poster_url"],
                    backdrop_url=s.get("backdrop_url"),
                    overview=s["overview"],
                    rating=s["rating"],
                )
            )
        return results

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        if media_type != MediaType.AUDIO and not provider_media_id.startswith("audio:"):
            return None

        station = next((s for s in AUDIO_STATION_CATALOG if s["id"] == provider_media_id), None)
        if not station:
            return None

        return NormalizedMediaDetails(
            provider_id=self.info.id,
            provider_media_id=station["id"],
            title=station["title"],
            original_title=station["artist"],
            media_type=MediaType.AUDIO,
            year=station["year"],
            overview=station["overview"],
            poster_url=station["poster_url"],
            backdrop_url=station.get("backdrop_url"),
            genres=station["genres"],
            tags=station["tags"],
            rating=station["rating"],
            author=station["artist"],
            status="Live Broadcast",
        )

    async def get_playback_sources(
        self,
        provider_media_id: str,
        media_type: MediaType,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> List[NormalizedPlaybackSource]:
        station = next((s for s in AUDIO_STATION_CATALOG if s["id"] == provider_media_id), None)
        if not station:
            return []

        return [
            NormalizedPlaybackSource(
                id=f"{station['id']}-live",
                title=f"{station['title']} (Direct Live Stream)",
                quality="High Bitrate",
                format="mp3",
                url=station["stream_url"],
                is_direct=True,
                subtitles=[],
            )
        ]
