import React, { useState, useEffect } from 'react';
import { Film, Play, Star, Clock, AlertCircle } from 'lucide-react';
import { searchMedia, resolvePlayback, MediaItem, ResolvedPlayback } from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';

export const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
          setMovies(results);
        } else {
          // Default sample titles from provider
          setMovies([
            {
              provider_id: 'mock_media_provider',
              provider_media_id: 'mock-m-1',
              title: 'Cosmic Drift',
              media_type: 'movie',
              year: 2024,
              overview: 'A lone interstellar navigator finds themselves lost in an uncharted gravitational fold.',
              poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
              rating: 8.7,
            },
            {
              provider_id: 'mock_media_provider',
              provider_media_id: 'mock-m-2',
              title: 'Neon Symphony',
              media_type: 'movie',
              year: 2023,
              overview: 'In a rain-drenched cyberpunk metropolis, a renegade acoustic hacker uncovers a corporate conspiracy.',
              poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
              rating: 8.4,
            },
          ]);
        }
      } catch (err) {
        console.warn('Fallback to local movie fixtures:', err);
        setMovies([
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-m-1',
            title: 'Cosmic Drift',
            media_type: 'movie',
            year: 2024,
            overview: 'A lone interstellar navigator finds themselves lost in an uncharted gravitational fold.',
            poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
            rating: 8.7,
          },
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-m-2',
            title: 'Neon Symphony',
            media_type: 'movie',
            year: 2023,
            overview: 'In a rain-drenched cyberpunk metropolis, a renegade acoustic hacker uncovers a corporate conspiracy.',
            poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
            rating: 8.4,
          },
        ]);
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
      // Fallback sample playback if API unreachable
      setActivePlayback({
        data: {
          media_id: movie.provider_media_id,
          media_type: 'movie',
          primary_source: {
            id: `${movie.provider_media_id}-source-1080p`,
            title: 'Authorized Demo Source (1080p)',
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [
            {
              id: `${movie.provider_media_id}-source-1080p`,
              title: 'Authorized Demo Source (1080p)',
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Movies</h1>
            <p className="text-xs text-gray-400">Authorized cinematic titles and feature films</p>
          </div>
        </div>
      </div>

      {playbackError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{playbackError}</span>
        </div>
      )}

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {movies.map(movie => (
            <div
              key={movie.provider_media_id}
              className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-cinematic hover:translate-y-[-2px] flex flex-col"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-background-elevated">
                <img
                  src={movie.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => handlePlayMovie(movie)}
                    className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform"
                  >
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </button>
                </div>

                {/* Rating Badge */}
                {movie.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{movie.rating}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1">
                <div>
                  <h3 className="text-xs font-semibold text-white truncate">{movie.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                    {movie.year && <span>{movie.year}</span>}
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>HD</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayMovie(movie)}
                  className="mt-2 w-full py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-primary text-gray-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Watch Now</span>
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
