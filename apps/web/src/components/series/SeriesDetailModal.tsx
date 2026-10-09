import React, { useState, useMemo } from 'react';
import {
  X,
  Play,
  Star,
  Layers,
  HardDrive,
  List,
  LayoutGrid,
  Search,
  Info,
  Check,
  Bookmark,
  Film,
} from 'lucide-react';
import { MediaDetails } from '../../services/api';

interface SeriesDetailModalProps {
  details?: MediaDetails | null;
  series?: MediaDetails | null;
  onClose: () => void;
  onPlayEpisode: (episodeNumber: number, seasonNumber: number, epTitle: string) => void;
  onToggleWatchlist?: (mediaId: string) => void;
  isWatchlisted?: boolean;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  details,
  series,
  onClose,
  onPlayEpisode,
  onToggleWatchlist,
  isWatchlisted = false,
}) => {
  const activeMedia = details || series;
  if (!activeMedia) return null;

  // Build seasons array with resilient fallback
  const seasons = useMemo(() => {
    if (activeMedia.seasons && activeMedia.seasons.length > 0) {
      return activeMedia.seasons;
    }
    const totalEps = activeMedia.total_episodes || 12;
    return [
      {
        season_number: 1,
        title: activeMedia.total_seasons === 1 ? 'Complete Series' : 'Season 1',
        overview: `Season 1 of ${activeMedia.title}`,
        episodes: Array.from({ length: totalEps }, (_, i) => ({
          id: `${activeMedia.provider_media_id}-s1-e${i + 1}`,
          episode_number: i + 1,
          title: `Episode ${i + 1}`,
          overview: `Episode ${i + 1} of ${activeMedia.title}. Follow the ongoing storyline and major events as the narrative unfolds.`,
          duration_minutes: activeMedia.duration_minutes || (activeMedia.media_type === 'anime' ? 24 : 45),
        })),
      },
    ];
  }, [activeMedia]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasons[0]?.season_number || 1
  );
  const [activeTab, setActiveTab] = useState<'episodes' | 'overview' | 'specs'>('episodes');
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rangeFilter, setRangeFilter] = useState<string>('all');
  const [isOverviewExpanded, setIsOverviewExpanded] = useState<boolean>(false);
  const [watchlistActive, setWatchlistActive] = useState<boolean>(isWatchlisted);

  const currentSeason =
    seasons.find((s) => s.season_number === selectedSeasonNumber) || seasons[0];
  const allEpisodes = currentSeason?.episodes || [];

  // Range groups if season has > 24 episodes
  const rangeOptions = useMemo(() => {
    if (allEpisodes.length <= 24) return [];
    const ranges: { id: string; label: string; min: number; max: number }[] = [];
    const step = 25;
    for (let i = 0; i < allEpisodes.length; i += step) {
      const min = i + 1;
      const max = Math.min(i + step, allEpisodes.length);
      ranges.push({
        id: `${min}-${max}`,
        label: `${min} - ${max}`,
        min,
        max,
      });
    }
    return ranges;
  }, [allEpisodes]);

  // Filter episodes based on search query and range
  const filteredEpisodes = useMemo(() => {
    let list = allEpisodes;

    if (rangeFilter !== 'all' && rangeOptions.length > 0) {
      const selectedRange = rangeOptions.find((r) => r.id === rangeFilter);
      if (selectedRange) {
        list = list.filter(
          (ep) =>
            ep.episode_number >= selectedRange.min &&
            ep.episode_number <= selectedRange.max
        );
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (ep) =>
          ep.title?.toLowerCase().includes(q) ||
          `episode ${ep.episode_number}`.includes(q) ||
          `ep ${ep.episode_number}`.includes(q) ||
          String(ep.episode_number) === q ||
          ep.overview?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allEpisodes, rangeFilter, rangeOptions, searchQuery]);

  const handleToggleWatchlist = () => {
    setWatchlistActive((prev) => !prev);
    if (onToggleWatchlist) {
      onToggleWatchlist(activeMedia.provider_media_id);
    }
  };

  const isAnime = activeMedia.media_type === 'anime';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-5xl bg-surface-container-low border border-border-subtle rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-on-surface">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-surface-container-highest/80 hover:bg-surface-bright text-on-surface flex items-center justify-center transition-all border border-border-subtle shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          type="button"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================= */}
        {/* 1. CINEMATIC & SPACE-CONSCIOUS HERO HEADER                */}
        {/* ========================================================= */}
        <div className="relative w-full overflow-hidden shrink-0 bg-surface-container-lowest border-b border-border-subtle">
          {/* Backdrop Graphic with multi-layered gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={
                activeMedia.backdrop_url ||
                activeMedia.poster_url ||
                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80'
              }
              alt={activeMedia.title}
              className="w-full h-full object-cover object-center opacity-35 scale-105 filter blur-[0.5px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/85 to-surface-container-low/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/80 to-transparent" />
          </div>

          {/* Hero Content Container */}
          <div className="relative z-10 p-4 sm:p-6 md:p-7 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Poster Card (visible on sm+) */}
            <div className="hidden sm:block relative aspect-[2/3] w-28 sm:w-32 md:w-40 shrink-0 rounded-xl overflow-hidden bg-surface-container border border-border-subtle shadow-2xl">
              <img
                src={
                  activeMedia.poster_url ||
                  activeMedia.backdrop_url ||
                  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80'
                }
                alt={activeMedia.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
                {isAnime ? 'ANIME' : 'SERIES'}
              </div>
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold text-on-surface">
                {allEpisodes.length} EPS
              </div>
            </div>

            {/* Title, Badges & Actions */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 fill-secondary text-secondary" />
                  {activeMedia.rating ? `${activeMedia.rating.toFixed(1)} IMDb` : '8.8 IMDb'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high border border-border-subtle text-on-surface-variant font-mono text-[11px]">
                  {activeMedia.year || 2024}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high border border-border-subtle text-on-surface-variant font-mono text-[11px] uppercase">
                  {isAnime ? 'TV-14' : 'TV-MA'}
                </span>
                {isAnime && (
                  <span className="px-2 py-0.5 rounded-full bg-tertiary/15 border border-tertiary/30 text-tertiary font-mono text-[11px] font-semibold">
                    SUB & DUB
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-surface-container-highest/80 border border-border-subtle text-primary font-mono text-[11px] font-bold">
                  4K HDR10+
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest/80 border border-border-subtle text-tertiary font-mono text-[11px] font-bold">
                  5.1 SURROUND
                </span>
              </div>

              {/* Title & Original Title */}
              <div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
                  {activeMedia.title}
                </h1>
                {activeMedia.original_title && (
                  <p className="font-mono text-xs sm:text-sm text-on-surface-variant/80 italic mt-0.5 truncate">
                    {activeMedia.original_title}
                  </p>
                )}
              </div>

              {/* Genres Pills */}
              {activeMedia.genres && activeMedia.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeMedia.genres.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-md bg-surface-container border border-border-subtle text-[11px] font-sans text-on-surface-variant"
                    >
                      {g}
                    </span>
                  ))}
                  {activeMedia.genres.length > 4 && (
                    <span className="text-[10px] font-mono text-on-surface-variant">
                      +{activeMedia.genres.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Synopsis */}
              {activeMedia.overview && (
                <div className="text-xs sm:text-sm text-on-surface-variant font-sans leading-relaxed">
                  <p className={isOverviewExpanded ? '' : 'line-clamp-2'}>
                    {activeMedia.overview}
                  </p>
                  {activeMedia.overview.length > 150 && (
                    <button
                      onClick={() => setIsOverviewExpanded((prev) => !prev)}
                      className="text-primary hover:text-primary-hover font-medium text-xs mt-0.5 cursor-pointer underline inline-block"
                      type="button"
                    >
                      {isOverviewExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons & Quick Pipeline Pill */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() =>
                    onPlayEpisode(
                      allEpisodes[0]?.episode_number || 1,
                      selectedSeasonNumber,
                      allEpisodes[0]?.title || 'Episode 1'
                    )
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-display text-sm font-bold hover:bg-primary-hover transition-all shadow-glow-primary active:scale-95 cursor-pointer"
                  type="button"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play S{selectedSeasonNumber}:E1</span>
                </button>

                <button
                  onClick={handleToggleWatchlist}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    watchlistActive
                      ? 'bg-secondary/20 border-secondary text-secondary'
                      : 'bg-surface-container hover:bg-surface-container-high border-border-subtle text-on-surface hover:text-primary'
                  }`}
                  type="button"
                  title="Save to Watchlist"
                >
                  {watchlistActive ? (
                    <>
                      <Check className="w-4 h-4 text-secondary" />
                      <span>Watchlisted</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Watchlist</span>
                    </>
                  )}
                </button>

                {/* Sleek Compact Stream Pipeline Pill */}
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container/80 border border-border-subtle text-[11px] font-mono text-on-surface-variant">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Direct Stream Ready • HEVC 10-bit • 24.5 Mbps</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. TABBED NAVIGATION BAR                                 */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 bg-surface-container-low border-b border-border-subtle flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('episodes')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-display font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'episodes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <Film className="w-4 h-4" />
              <span>Episodes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-[10px] font-mono font-semibold">
                {allEpisodes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-display font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <Info className="w-4 h-4" />
              <span>About & Details</span>
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-display font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'specs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <Layers className="w-4 h-4" />
              <span>Stream Specs</span>
            </button>
          </div>

          {/* Quick info right side */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-on-surface-variant">
            <span>Origin:</span>
            <span className="text-on-surface font-semibold uppercase">
              {activeMedia.provider_id === 'local-media' ? 'Local Storage' : 'Federated Hub'}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. SCROLLABLE TAB CONTENT BODY                            */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: EPISODES EXPLORER */}
          {activeTab === 'episodes' && (
            <div className="space-y-4 animate-fade-in">
              {/* Season Selection Pills & Episode Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                {/* Season Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {seasons.map((s) => (
                    <button
                      key={s.season_number}
                      onClick={() => {
                        setSelectedSeasonNumber(s.season_number);
                        setRangeFilter('all');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                        selectedSeasonNumber === s.season_number
                          ? 'bg-primary text-on-primary border-primary shadow-glow-primary'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border-border-subtle'
                      }`}
                      type="button"
                    >
                      {s.title || `Season ${s.season_number}`}
                    </button>
                  ))}
                </div>

                {/* Search & View Mode Switcher */}
                <div className="flex items-center gap-2">
                  {/* Episode Search Box */}
                  <div className="relative flex-1 sm:w-48 md:w-56">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Find episode..."
                      className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-border-subtle rounded-xl text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                    />
                    <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-2.5 top-2" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1.5 text-on-surface-variant hover:text-on-surface"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* View Mode Toggle: Grid vs Rich Cards */}
                  <div className="flex items-center bg-surface-container border border-border-subtle p-0.5 rounded-xl">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'cards'
                          ? 'bg-surface-container-highest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      title="Rich Cards View"
                      type="button"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-surface-container-highest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      title="Compact Number Grid View (Anime style)"
                      type="button"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Range Filters for Anime / Series with > 24 episodes */}
              {rangeOptions.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                  <span className="text-on-surface-variant text-[11px] uppercase tracking-wider shrink-0">
                    Episodes Range:
                  </span>
                  <button
                    onClick={() => setRangeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      rangeFilter === 'all'
                        ? 'bg-secondary text-on-secondary font-bold'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    All ({allEpisodes.length})
                  </button>
                  {rangeOptions.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRangeFilter(r.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        rangeFilter === r.id
                          ? 'bg-secondary text-on-secondary font-bold'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}

              {/* --------------------------------------------------- */}
              {/* VIEW 1: COMPACT ANIME NUMBER GRID                   */}
              {/* --------------------------------------------------- */}
              {viewMode === 'grid' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-on-surface-variant flex items-center justify-between">
                    <span>Quick Select Episode Tile:</span>
                    <span>{filteredEpisodes.length} Episodes available</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                    {filteredEpisodes.map((ep) => (
                      <button
                        key={ep.id || ep.episode_number}
                        onClick={() =>
                          onPlayEpisode(
                            ep.episode_number,
                            selectedSeasonNumber,
                            ep.title || `Episode ${ep.episode_number}`
                          )
                        }
                        className="group relative flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-surface-container hover:bg-primary border border-border-subtle hover:border-primary transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                        type="button"
                        title={ep.title || `Episode ${ep.episode_number}`}
                      >
                        <span className="font-mono text-sm sm:text-base font-bold text-on-surface group-hover:text-on-primary transition-colors">
                          {String(ep.episode_number).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant group-hover:text-on-primary/80 transition-colors mt-0.5">
                          {ep.duration_minutes || 24}m
                        </span>

                        {/* Hover Play icon indicator */}
                        <div className="absolute inset-0 bg-primary rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 fill-current text-on-primary" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {filteredEpisodes.length === 0 && (
                    <div className="py-12 text-center text-on-surface-variant text-xs">
                      No episodes found matching "{searchQuery}".
                    </div>
                  )}
                </div>
              )}

              {/* --------------------------------------------------- */}
              {/* VIEW 2: RICH CARD VIEW (2-column full width)        */}
              {/* --------------------------------------------------- */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredEpisodes.map((ep) => (
                    <div
                      key={ep.id || ep.episode_number}
                      onClick={() =>
                        onPlayEpisode(
                          ep.episode_number,
                          selectedSeasonNumber,
                          ep.title || `Episode ${ep.episode_number}`
                        )
                      }
                      className="group flex items-start gap-3.5 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md card-hover-lift"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-32 sm:w-36 shrink-0 rounded-lg overflow-hidden bg-surface-container-lowest border border-border-subtle">
                        <img
                          src={
                            activeMedia.backdrop_url ||
                            activeMedia.poster_url ||
                            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'
                          }
                          alt={ep.title || `Episode ${ep.episode_number}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Play Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-glow-primary">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Badges on Thumbnail */}
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] font-bold text-primary">
                          EP {ep.episode_number}
                        </span>
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-on-surface">
                          {ep.duration_minutes || 24}m
                        </span>
                      </div>

                      {/* Episode Content Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-display font-semibold text-xs sm:text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                              {ep.title || `Episode ${ep.episode_number}`}
                            </h4>
                          </div>

                          <p className="font-sans text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed mt-1">
                            {ep.overview ||
                              `Episode ${ep.episode_number} of ${activeMedia.title}. Stream in high definition.`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant/80 pt-1 border-t border-border-subtle/50">
                          <span className="text-secondary font-medium">1080p HD</span>
                          <span>•</span>
                          <span>HEVC Direct</span>
                          <span>•</span>
                          <span className="text-primary group-hover:underline">Play Now →</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredEpisodes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-on-surface-variant text-xs">
                      No episodes found matching "{searchQuery}".
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OVERVIEW & STORY DETAILS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h3 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider mb-2">
                  Story Synopsis
                </h3>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                  {activeMedia.overview || 'No extended synopsis available for this media title.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container border border-border-subtle font-mono text-xs">
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Format</span>
                  <span className="text-on-surface font-semibold uppercase">{activeMedia.media_type}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Release Year</span>
                  <span className="text-on-surface font-semibold">{activeMedia.year || '2024'}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Total Seasons</span>
                  <span className="text-on-surface font-semibold">{seasons.length} Season(s)</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Total Episodes</span>
                  <span className="text-on-surface font-semibold">{allEpisodes.length} Episodes</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Status</span>
                  <span className="text-secondary font-semibold">{activeMedia.status || 'Active Broadcast'}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">IMDb Rating</span>
                  <span className="text-secondary font-semibold">
                    {activeMedia.rating ? `${activeMedia.rating.toFixed(1)} / 10` : '8.8 / 10'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Audio</span>
                  <span className="text-tertiary font-semibold">Dolby Digital 5.1</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Direct Server</span>
                  <span className="text-primary font-semibold">Multi-CDN Mirror</span>
                </div>
              </div>

              {activeMedia.genres && (
                <div>
                  <h4 className="font-display font-bold text-xs text-on-surface uppercase tracking-wider mb-2">
                    Categorized Genres
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeMedia.genres.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-xl bg-surface-container border border-border-subtle text-xs font-sans text-on-surface"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STREAM & TECHNICAL SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Video & Audio Specifications */}
                <div className="bg-surface-container p-5 rounded-xl border border-border-subtle space-y-3">
                  <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
                    <Layers className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-bold text-xs text-on-surface uppercase tracking-wider">
                      Encoding & Video Pipeline
                    </h3>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Container</span>
                      <span className="text-on-surface font-semibold">Matroska (MKV) / MP4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Video Codec</span>
                      <span className="text-on-surface font-semibold">HEVC / H.265 (Main 10)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Resolution</span>
                      <span className="text-primary font-semibold">3840 x 2160 (4K UHD)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Color Space</span>
                      <span className="text-on-surface font-semibold">BT.2020 (HDR10+)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Average Bitrate</span>
                      <span className="text-secondary font-semibold">24.5 Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Frame Rate</span>
                      <span className="text-on-surface font-semibold">23.976 fps Direct</span>
                    </div>
                  </div>
                </div>

                {/* Audio & Network Protocols */}
                <div className="bg-surface-container p-5 rounded-xl border border-border-subtle space-y-3">
                  <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
                    <HardDrive className="w-4 h-4 text-secondary" />
                    <h3 className="font-display font-bold text-xs text-on-surface uppercase tracking-wider">
                      Cluster & Network Delivery
                    </h3>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Audio Channels</span>
                      <span className="text-tertiary font-semibold">Dolby Atmos / 5.1 Surround</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Audio Codec</span>
                      <span className="text-on-surface font-semibold">E-AC-3 (Enhanced AC-3)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Range Protocol</span>
                      <span className="text-on-surface font-semibold">RFC 7233 Byte Stream</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Origin ID</span>
                      <span className="text-on-surface font-semibold truncate max-w-[160px]">
                        {activeMedia.provider_media_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Cluster Adapter</span>
                      <span className="text-primary font-semibold uppercase">
                        {activeMedia.provider_id === 'local-media' ? 'Local Storage' : 'Federated Stream Engine'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Direct Path</span>
                      <span className="text-on-surface font-semibold truncate max-w-[160px]">
                        /data/media/{activeMedia.title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
