import React, { useState, useEffect } from 'react';
import { Tv, Play, Star, AlertCircle, Layers } from 'lucide-react';
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

export const SeriesPage: React.FC = () => {
  const [seriesList, setSeriesList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<MediaDetails | null>(null);
  const [activePlayback, setActivePlayback] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
    currentSeason: number;
    currentEpisode: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true);
      try {
        const results = await searchMedia('', 'series');
        setSeriesList(results || []);
      } catch (err) {
        console.warn('Failed to fetch series catalog:', err);
        setSeriesList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const handleOpenSeries = async (item: MediaItem) => {
    setError(null);
    try {
      const details = await fetchMediaDetails(item.provider_media_id, 'series');
      setSelectedSeries(details);
    } catch (err: any) {
      console.error('Failed to load series details:', err);
      setError(
        err?.message || `Unable to load season details for "${item.title}". Please try again.`
      );
    }
  };

  const handlePlayEpisode = async (seasonNumber: number, episodeNumber: number, epTitle: string) => {
    if (!selectedSeries) return;
    setError(null);
    try {
      const playback = await resolvePlayback(
        selectedSeries.provider_media_id,
        'series',
        seasonNumber,
        episodeNumber
      );
      setActivePlayback({
        data: playback,
        title: selectedSeries.title,
        episodeTitle: `S${seasonNumber}:E${episodeNumber} - ${epTitle}`,
        currentSeason: seasonNumber,
        currentEpisode: episodeNumber,
      });
    } catch (err: any) {
      console.error('Failed to resolve episode stream:', err);
      setError(
        err?.message || `Unable to resolve stream for Season ${seasonNumber}, Episode ${episodeNumber}.`
      );
    }
  };

  const handleNextEpisode = () => {
    if (!activePlayback || !selectedSeries) return;
    const nextEpNum = activePlayback.currentEpisode + 1;
    handlePlayEpisode(activePlayback.currentSeason, nextEpNum, `Episode ${nextEpNum}`);
  };

  const filteredSeries = seriesList.filter(s => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'top_rated') return (s.rating || 0) >= 8.0;
    if (selectedFilter === 'recent') return (s.year || 0) >= 2024;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono tracking-wider uppercase">
            <Tv className="w-3.5 h-3.5" />
            <span>Episodic Architecture • Multi-Season Pipeline</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Television Series
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Browse television catalogs with intelligent episode progression, season selection, and source resolution.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Series' },
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

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Series Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : filteredSeries.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low/40 rounded-3xl border border-border-subtle p-8">
          <Tv className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
          <p className="text-base font-semibold text-on-surface">No series found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Check your TMDB configuration in settings or explore other categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredSeries.map(item => (
            <div
              key={item.provider_media_id}
              onClick={() => handleOpenSeries(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenSeries(item);
                }
              }}
              className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-primary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-surface-container-lowest">
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container p-4 text-center">
                    <Tv className="w-8 h-8 text-on-surface-variant/40 mb-2" />
                    <span className="text-[11px] text-on-surface-variant font-medium line-clamp-2">
                      {item.title}
                    </span>
                  </div>
                )}

                {/* Rating Badge */}
                {item.rating ? (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                ) : null}

                {/* Seasons Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-primary/30 text-[10px] font-mono font-bold text-primary flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5" />
                  <span>SERIES</span>
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-surface-dim/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[11px] font-mono text-primary font-medium tracking-wide">
                    EXPLORE SEASONS
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant mt-0.5">
                    {item.year && <span>{item.year}</span>}
                    <span>•</span>
                    <span className="text-tertiary">Multi-Episode</span>
                  </div>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-primary text-on-surface-variant group-hover:text-on-primary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-primary">
                  <Layers className="w-3 h-3" />
                  <span>View Seasons</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Season and Episode Navigation Modal */}
      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
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
