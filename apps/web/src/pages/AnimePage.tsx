import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Star, AlertCircle, Layers } from 'lucide-react';
import {
  searchMedia,
  fetchMediaDetails,
  resolvePlayback,
  MediaItem,
  MediaDetails,
  ResolvedPlayback,
} from '../services/api';
import { SeriesDetailModal } from '../components/series/SeriesDetailModal';
import { VideoPlayer } from '../components/player/VideoPlayer';

const ANIME_FIXTURES: MediaItem[] = [
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-a-1',
    title: 'Blade of the Celestial Wind',
    original_title: '天風の刃 (Tenpū no Yaiba)',
    media_type: 'anime',
    year: 2024,
    overview: 'A spirit swordsman traverses mystical mountain realms to seal cosmic rifts between immortals and humanity.',
    poster_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80',
    rating: 9.1,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-a-2',
    title: 'Cyber Samurai: Edge 2088',
    original_title: '電脳侍 (Dennō Samurai)',
    media_type: 'anime',
    year: 2023,
    overview: 'In neon Neo-Shinjuku, an augmented ronin protects an AI child holding keys to the metropolitan power grid.',
    poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80',
    rating: 8.9,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-a-3',
    title: 'Spirit Realm Alchemist',
    original_title: '霊界錬金術師 (Reikai Renkinjutsushi)',
    media_type: 'anime',
    year: 2024,
    overview: 'Scholars in an arcane academy learn to transmute ethereal starlight into physical kinetic ward barriers.',
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    rating: 9.3,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-a-4',
    title: 'Chrono Resonance: Zero',
    original_title: '時間共鳴 (Jikan Kyōmei)',
    media_type: 'anime',
    year: 2023,
    overview: 'A team of high school timeline observers must prevent paradoxical loops from shattering reality.',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    rating: 8.8,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-a-5',
    title: 'Ghost in the Shellcode',
    original_title: '殻の中のコード (Karafuda no Kōdo)',
    media_type: 'anime',
    year: 2024,
    overview: 'Tactical security specialists investigate autonomous android sabotage across orbital defense arrays.',
    poster_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    rating: 9.0,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-a-6',
    title: 'Arcane Horizon',
    original_title: '秘術の地平線 (Hijutsu no Chiheisen)',
    media_type: 'anime',
    year: 2022,
    overview: 'Guild explorers journey across an endless sea of clouds to reach the floating garden of the ancient gods.',
    poster_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    rating: 8.7,
  },
];

export const AnimePage: React.FC = () => {
  const [animeList, setAnimeList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedAnime, setSelectedAnime] = useState<MediaDetails | null>(null);
  const [activePlayback, setActivePlayback] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
    currentSeason: number;
    currentEpisode: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const results = await searchMedia('', 'anime');
        if (results && results.length > 0) {
          const combined = [...results];
          for (const item of ANIME_FIXTURES) {
            if (!combined.some(c => c.provider_media_id === item.provider_media_id)) {
              combined.push(item);
            }
          }
          setAnimeList(combined);
        } else {
          setAnimeList(ANIME_FIXTURES);
        }
      } catch (err) {
        console.warn('Fallback anime list:', err);
        setAnimeList(ANIME_FIXTURES);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  const handleOpenAnime = async (item: MediaItem) => {
    setError(null);
    try {
      const details = await fetchMediaDetails(item.provider_media_id, 'anime');
      setSelectedAnime(details);
    } catch (err) {
      console.warn('Fallback details for anime:', err);
      setSelectedAnime({
        provider_id: item.provider_id,
        provider_media_id: item.provider_media_id,
        title: item.title,
        original_title: item.original_title,
        media_type: 'anime',
        genres: ['Anime', 'Action', 'Supernatural'],
        tags: ['dual-audio', 'multi-sub', 'flac-audio'],
        overview: item.overview,
        poster_url: item.poster_url,
        backdrop_url: item.backdrop_url,
        rating: item.rating,
        total_seasons: 1,
        seasons: [
          {
            season_number: 1,
            title: 'Season 1: Origin Arc',
            episodes: [
              {
                id: `${item.provider_media_id}-s1-e1`,
                episode_number: 1,
                title: 'First Breath of Wind',
                overview: 'The shrine keeper leaves secluded mountain sanctum after forty years of spiritual training.',
                duration_minutes: 24,
              },
              {
                id: `${item.provider_media_id}-s1-e2`,
                episode_number: 2,
                title: 'Silver Moon Rift',
                overview: 'A sudden void portal manifests above the village lake during festival celebrations.',
                duration_minutes: 25,
              },
              {
                id: `${item.provider_media_id}-s1-e3`,
                episode_number: 3,
                title: 'The Celestial Blade Awakens',
                overview: 'Drawing the ancient ancestral blade unleashes waves of purifying blue flame.',
                duration_minutes: 24,
              },
            ],
          },
        ],
      });
    }
  };

  const handlePlayEpisode = async (seasonNumber: number, episodeNumber: number, epTitle: string) => {
    if (!selectedAnime) return;
    try {
      const playback = await resolvePlayback(
        selectedAnime.provider_media_id,
        'anime',
        seasonNumber,
        episodeNumber
      );
      setActivePlayback({
        data: playback,
        title: selectedAnime.title,
        episodeTitle: `Episode ${episodeNumber}: ${epTitle}`,
        currentSeason: seasonNumber,
        currentEpisode: episodeNumber,
      });
    } catch (err) {
      console.warn('Fallback demo playback for anime episode:', err);
      setActivePlayback({
        data: {
          media_id: selectedAnime.provider_media_id,
          media_type: 'anime',
          season_number: seasonNumber,
          episode_number: episodeNumber,
          primary_source: {
            id: `${selectedAnime.provider_media_id}-e${episodeNumber}-1080p`,
            title: `Episode ${episodeNumber} Master (Dual Audio 1080p)`,
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [
            {
              id: `${selectedAnime.provider_media_id}-e${episodeNumber}-1080p`,
              title: `Episode ${episodeNumber} Master (Dual Audio 1080p)`,
              quality: '1080p',
              format: 'mp4',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
              is_direct: true,
              subtitles: [],
            },
          ],
          available_qualities: ['1080p'],
          subtitles: [],
          expires_in_seconds: 7200,
        },
        title: selectedAnime.title,
        episodeTitle: `Episode ${episodeNumber}: ${epTitle}`,
        currentSeason: seasonNumber,
        currentEpisode: episodeNumber,
      });
    }
  };

  const handleNextEpisode = () => {
    if (!activePlayback || !selectedAnime) return;
    const nextEpNum = activePlayback.currentEpisode + 1;
    handlePlayEpisode(activePlayback.currentSeason, nextEpNum, `Episode ${nextEpNum}`);
  };

  const filteredAnime = animeList.filter(a => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'top_rated') return (a.rating || 0) >= 9.0;
    if (selectedFilter === 'recent') return (a.year || 0) >= 2024;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/25 text-secondary text-xs font-mono tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seasonal Animation • Dual Audio Passthrough</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Anime Vault
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Stream seasonal Japanese animation with synchronized dual-audio Japanese/English tracks, lossless FLAC streams, and subtitle customizers.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: 'recent', label: '2024 Simulcasts' },
            { id: 'top_rated', label: 'Top Rated (9.0+)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                selectedFilter === f.id
                  ? 'bg-secondary text-on-secondary border-secondary font-semibold'
                  : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-secondary/40 hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Anime Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredAnime.map(item => (
            <div
              key={item.provider_media_id}
              onClick={() => handleOpenAnime(item)}
              className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-secondary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-surface-container-lowest">
                <img
                  src={item.poster_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Sub / Dub Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-tertiary/30 text-[10px] font-mono text-tertiary font-bold">
                  SUB / DUB
                </div>

                {/* Rating Badge */}
                {item.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{item.rating}</span>
                  </div>
                )}

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-surface-dim/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[11px] font-mono text-secondary font-medium tracking-wide">
                    EXPLORE ARCS
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-secondary transition-colors">
                    {item.title}
                  </h3>
                  {item.original_title && (
                    <p className="text-[10px] font-mono text-on-surface-variant truncate">
                      {item.original_title}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant mt-0.5">
                    {item.year && <span>{item.year}</span>}
                    <span>•</span>
                    <span className="text-primary">Simulcast</span>
                  </div>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-secondary text-on-surface-variant group-hover:text-on-secondary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-secondary">
                  <Layers className="w-3 h-3" />
                  <span>View Episodes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Season and Episode Modal */}
      {selectedAnime && (
        <SeriesDetailModal
          series={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onPlayEpisode={handlePlayEpisode}
        />
      )}

      {/* Video Player */}
      {activePlayback && (
        <VideoPlayer
          playbackData={activePlayback.data}
          title={activePlayback.title}
          episodeTitle={activePlayback.episodeTitle}
          onClose={() => setActivePlayback(null)}
          onNextEpisode={handleNextEpisode}
        />
      )}
    </div>
  );
};

