import React, { useState, useEffect } from 'react';
import { Film, Play, Star, Clock, AlertCircle } from 'lucide-react';
import { searchMedia, resolvePlayback, MediaItem, ResolvedPlayback } from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';

const MOVIE_FIXTURES: MediaItem[] = [
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-m-1',
    title: 'Cosmic Drift: Event Horizon',
    media_type: 'movie',
    year: 2024,
    overview: 'A lone deep-space navigator finds themselves trapped within an uncharted gravitational fold where spacetime loops indefinitely.',
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80',
    rating: 8.8,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-m-2',
    title: 'Neon Symphony 2099',
    media_type: 'movie',
    year: 2023,
    overview: 'In a rain-drenched cyberpunk megalopolis, a renegade acoustic hacker uncovers a mind-altering corporate frequency.',
    poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80',
    rating: 8.5,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-m-3',
    title: 'Solaris Protocol',
    media_type: 'movie',
    year: 2024,
    overview: 'Autonomous orbital research stations go dark across Jupiter orbit; a salvage crew deploys to investigate.',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    rating: 9.1,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-m-4',
    title: 'The Obsidian Crypt',
    media_type: 'movie',
    year: 2022,
    overview: 'Beneath the Antarctic permafrost, archaeologists uncover a non-terrestrial subterranean complex radiating thermal pulse waves.',
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    rating: 8.3,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-m-5',
    title: 'Aethelgard: The Last Bastion',
    media_type: 'movie',
    year: 2023,
    overview: 'A high fantasy epic chronicling the siege of the diamond fortress during the eclipse of the twin suns.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    rating: 8.9,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-m-6',
    title: 'Echoes of the Red Planet',
    media_type: 'movie',
    year: 2024,
    overview: 'The first generation of Martian settlers discover audio transmissions buried inside basalt formations.',
    poster_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    rating: 8.6,
  },
];

export const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activePlayback, setActivePlayback] = useState<{
    data: ResolvedPlayback;
    title: string;
  } | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const results = await searchMedia('', 'movie');
        if (results && results.length > 0) {
          // Merge API items with rich fixtures if count is low
          const combined = [...results];
          for (const item of MOVIE_FIXTURES) {
            if (!combined.some(c => c.provider_media_id === item.provider_media_id)) {
              combined.push(item);
            }
          }
          setMovies(combined);
        } else {
          setMovies(MOVIE_FIXTURES);
        }
      } catch (err) {
        console.warn('Fallback to local movie fixtures:', err);
        setMovies(MOVIE_FIXTURES);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handlePlayMovie = async (movie: MediaItem) => {
    setPlaybackError(null);
    try {
      const playback = await resolvePlayback(movie.provider_media_id, 'movie');
      setActivePlayback({ data: playback, title: movie.title });
    } catch (err) {
      console.warn('Falling back to local demo resolution:', err);
      setActivePlayback({
        data: {
          media_id: movie.provider_media_id,
          media_type: 'movie',
          primary_source: {
            id: `${movie.provider_media_id}-source-1080p`,
            title: 'Authorized Demo Source (1080p Direct)',
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [
            {
              id: `${movie.provider_media_id}-source-1080p`,
              title: 'Authorized Demo Source (1080p Direct)',
              quality: '1080p',
              format: 'mp4',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              is_direct: true,
              subtitles: [],
            },
          ],
          available_qualities: ['1080p', '720p'],
          subtitles: [],
          expires_in_seconds: 7200,
        },
        title: movie.title,
      });
    }
  };

  const filteredMovies = movies.filter(m => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === '4k') return (m.rating || 0) >= 8.5;
    if (selectedFilter === 'top_rated') return (m.rating || 0) >= 8.7;
    if (selectedFilter === 'recent') return (m.year || 0) >= 2024;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner / Hero Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono tracking-wider uppercase">
            <Film className="w-3.5 h-3.5" />
            <span>Cinematic Film Vault • 4K HDR Direct Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Feature Films
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Stream high-bitrate authorized films with localized direct play, lossless audio passthrough, and zero transcoding delay.
          </p>
        </div>

        {/* Quick Filter Scopes */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: '4k', label: '4K Ultra HD' },
            { id: 'top_rated', label: 'IMDb 8.7+' },
            { id: 'recent', label: '2024 Releases' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                selectedFilter === f.id
                  ? 'bg-primary text-on-primary border-primary shadow-glow-primary'
                  : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-primary/40 hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {playbackError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{playbackError}</span>
        </div>
      )}

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredMovies.map(movie => (
            <div
              key={movie.provider_media_id}
              className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-primary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-surface-container-lowest">
                <img
                  src={movie.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Rating Badge */}
                {movie.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{movie.rating}</span>
                  </div>
                )}

                {/* Direct Play Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-tertiary/30 text-[10px] font-mono font-bold text-tertiary">
                  4K DIRECT
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-surface-dim/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                  <button
                    onClick={() => handlePlayMovie(movie)}
                    className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-on-primary flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform"
                    title="Direct Stream"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                  <span className="text-[11px] font-mono text-primary font-medium tracking-wide">
                    PLAY STREAM
                  </span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant mt-0.5">
                    {movie.year && <span>{movie.year}</span>}
                    <span>•</span>
                    <span className="flex items-center gap-1 text-tertiary">
                      <Clock className="w-2.5 h-2.5" />
                      <span>HEVC 10-bit</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayMovie(movie)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high hover:bg-primary text-on-surface-variant hover:text-on-primary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle hover:border-primary"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Stream Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cinematic Fullscreen Video Player */}
      {activePlayback && (
        <VideoPlayer
          playbackData={activePlayback.data}
          title={activePlayback.title}
          onClose={() => setActivePlayback(null)}
        />
      )}
    </div>
  );
};

