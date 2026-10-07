import React, { useState, useEffect } from 'react';
import { Film, Play, Star, Clock, AlertCircle } from 'lucide-react';
import { searchMedia, resolvePlayback, MediaItem, ResolvedPlayback } from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';

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
      setLoading(true);
      try {
        const results = await searchMedia('', 'movie');
        setMovies(results || []);
      } catch (err) {
        console.warn('Failed to load movies from API:', err);
        setMovies([]);
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
    } catch (err: any) {
      console.error('Failed to resolve movie stream:', err);
      setPlaybackError(
        err?.message || `Unable to resolve stream for "${movie.title}". Please try again.`
      );
    }
  };

  const filteredMovies = movies.filter(m => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === '4k') return (m.rating || 0) >= 7.5;
    if (selectedFilter === 'top_rated') return (m.rating || 0) >= 8.0;
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
            <span>Cinematic Film Vault • Real TMDB Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Feature Films
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Stream high-bitrate films with localized direct play, lossless audio passthrough, and zero transcoding delay.
          </p>
        </div>

        {/* Quick Filter Scopes */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: '4k', label: 'Popular High-Def' },
            { id: 'top_rated', label: 'Top Rated (8.0+)' },
            { id: 'recent', label: 'Recent Releases' },
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
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{playbackError}</span>
          </div>
          <button
            onClick={() => setPlaybackError(null)}
            className="text-rose-400 hover:text-rose-200 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low/40 rounded-3xl border border-border-subtle p-8">
          <Film className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
          <p className="text-base font-semibold text-on-surface">No movies found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Check your TMDB API configuration in settings or try clearing filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredMovies.map(movie => (
            <div
              key={movie.provider_media_id}
              onClick={() => handlePlayMovie(movie)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePlayMovie(movie);
                }
              }}
              className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-primary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-surface-container-lowest">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container p-4 text-center">
                    <Film className="w-8 h-8 text-on-surface-variant/40 mb-2" />
                    <span className="text-[11px] text-on-surface-variant font-medium line-clamp-2">
                      {movie.title}
                    </span>
                  </div>
                )}

                {/* Rating Badge */}
                {movie.rating ? (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                ) : null}

                {/* Direct Play Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-tertiary/30 text-[10px] font-mono font-bold text-tertiary">
                  HD STREAM
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-surface-dim/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-on-primary flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
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
                      <span>HEVC Stream</span>
                    </span>
                  </div>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-primary text-on-surface-variant group-hover:text-on-primary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-primary">
                  <Play className="w-3 h-3 fill-current" />
                  <span>Stream Now</span>
                </div>
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
