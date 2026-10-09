import React, { useState, useEffect } from 'react';
import {
  Tv,
  Play,
  Star,
  AlertCircle,
  Layers,
  Search,
  RefreshCw,
} from 'lucide-react';
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

const SERIES_GENRES = [
  'All',
  'Drama',
  'Sci-Fi & Fantasy',
  'Crime & Mystery',
  'Comedy',
  'Action',
  'Thriller',
];

export const SeriesPage: React.FC = () => {
  const [seriesList, setSeriesList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedSeries, setSelectedSeries] = useState<MediaDetails | null>(null);
  const [activePlayback, setActivePlayback] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
    currentSeason: number;
    currentEpisode: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchMedia(query, 'series');
      setSeriesList(results || []);
    } catch (err: any) {
      console.warn('Failed to fetch series catalog:', err);
      setError(err?.message || 'Unable to connect to TV series service. Please try again.');
      setSeriesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSeries(searchQuery);
  };

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

  const filteredSeries = seriesList.filter((s) => {
    if (selectedFilter === 'top_rated' && (s.rating || 0) < 8.0) return false;
    if (selectedFilter === 'recent' && (s.year || 0) < 2023) return false;
    if (selectedGenre !== 'All') {
      const hasGenre =
        (s as any).genres?.some((g: string) =>
          g.toLowerCase().includes(selectedGenre.toLowerCase())
        ) || s.overview?.toLowerCase().includes(selectedGenre.toLowerCase());
      if (!hasGenre) return false;
    }
    return true;
  });

  const spotlightSeries = seriesList.length > 0 ? seriesList[0] : null;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. SPOTLIGHT TELEVISION HERO BANNER */}
      {spotlightSeries && !loading && (
        <div className="relative w-full rounded-3xl overflow-hidden bg-surface-container-low border border-border-subtle shadow-2xl">
          <div className="relative min-h-[300px] sm:min-h-[360px] md:min-h-[400px] flex items-end p-6 sm:p-8 md:p-10">
            {/* Background Backdrop */}
            <img
              src={
                spotlightSeries.backdrop_url ||
                spotlightSeries.poster_url ||
                'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1280&q=80'
              }
              alt={spotlightSeries.title}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-45 scale-105"
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/80 to-transparent w-full lg:w-2/3" />

            {/* Spotlight Content */}
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-mono tracking-wider uppercase font-bold">
                <Tv className="w-3.5 h-3.5" />
                <span>Featured TV Spotlight • Multi-Season Pipeline</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight leading-tight">
                {spotlightSeries.title}
              </h1>

              <p className="text-xs sm:text-sm text-on-surface-variant line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {spotlightSeries.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleOpenSeries(spotlightSeries)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-display text-sm font-bold hover:bg-primary-hover transition-all shadow-glow-primary active:scale-95 cursor-pointer"
                  type="button"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Explore Seasons & Episodes</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-border-subtle flex items-center gap-1 text-secondary font-bold">
                    <Star className="w-3.5 h-3.5 fill-secondary" />
                    {spotlightSeries.rating ? `${spotlightSeries.rating.toFixed(1)} IMDb` : '9.0'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-border-subtle">
                    {spotlightSeries.year || 2024}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-border-subtle text-tertiary font-bold">
                    4K HDR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CATALOG HEADER WITH SEARCH & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-wider font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Episodic Architecture • Multi-Season Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-on-surface tracking-tight">
            Television Series
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            Browse television catalogs with intelligent episode progression, season selection, and direct playback.
          </p>
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search series title..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-border-subtle rounded-xl text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
            />
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
          </form>

          <button
            onClick={() => fetchSeries(searchQuery)}
            title="Refresh series catalog"
            className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC GENRE & STATUS FILTER CHIPS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {SERIES_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedGenre === g
                  ? 'bg-primary text-on-primary border-primary font-bold shadow-glow-primary'
                  : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-primary/40 hover:text-on-surface'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: 'all', label: 'All Series' },
            { id: 'top_rated', label: 'Top Rated (8.0+)' },
            { id: 'recent', label: 'Recent Releases' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedFilter === f.id
                  ? 'bg-secondary text-on-secondary border-secondary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:text-on-surface'
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
            className="text-rose-400 hover:text-rose-200 underline text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. SERIES CATALOG GRID */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : filteredSeries.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low/40 rounded-3xl border border-border-subtle p-8">
          <Tv className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
          <p className="text-base font-semibold text-on-surface">No series found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Check your search query or select another filter category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {filteredSeries.map((item) => (
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
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/90 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                ) : null}

                {/* Series Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/90 backdrop-blur-md border border-primary/30 text-[10px] font-mono font-bold text-primary flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5" />
                  <span>SERIES</span>
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-surface-dim/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2.5 p-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[11px] font-mono text-primary font-bold tracking-wider uppercase">
                    SEASONS & EPISODES
                  </span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant mt-1">
                    {item.year && <span>{item.year}</span>}
                    <span>•</span>
                    <span className="text-tertiary">Multi-Episode</span>
                  </div>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-primary text-on-surface-variant group-hover:text-on-primary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-primary">
                  <Layers className="w-3 h-3" />
                  <span>Episodes Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Season and Episode Navigation Modal */}
      {selectedSeries && (
        <SeriesDetailModal
          details={selectedSeries}
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
