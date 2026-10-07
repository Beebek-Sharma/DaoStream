import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Film,
  Tv,
  BookOpen,
  Layers,
  Star,
  Play,
  HardDrive,
  Loader2,
  X,
  LayoutGrid,
  List as ListIcon,
  Zap,
  AlertCircle,
} from 'lucide-react';
import {
  searchMedia,
  fetchMediaDetails,
  fetchBookContent,
  resolvePlayback,
  MediaItem,
  MediaDetails,
  BookContent,
  ResolvedPlayback,
} from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { SeriesDetailModal } from '../components/series/SeriesDetailModal';
import { BookReader } from '../components/reader/BookReader';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || 'Cyberpunk';

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [latencyMs, setLatencyMs] = useState<number>(48);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modals / Players state
  const [activeVideo, setActiveVideo] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
  } | null>(null);
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<MediaDetails | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const filters = [
    { id: 'all', label: 'All Media', icon: Layers, mediaType: undefined },
    { id: 'movies', label: 'Movies', icon: Film, mediaType: 'movie' },
    { id: 'series', label: 'Series & Anime', icon: Tv, mediaType: 'series' },
    { id: 'books', label: 'Books & Novels', icon: BookOpen, mediaType: 'book' },
    { id: 'local', label: 'Local Vault Only', icon: HardDrive, mediaType: undefined },
  ];

  const suggestionTags = [
    'Cyberpunk',
    'Hard Sci-Fi',
    'Space Opera',
    '4K UHD',
    'Dolby Atmos',
    'Completed Series',
  ];

  // Global Ctrl+K / Cmd+K focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced federated search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setSearchParams({ q: trimmed }, { replace: true });
    setLoading(true);

    const startTime = performance.now();
    const currentFilterDef = filters.find((f) => f.id === activeFilter);
    const selectedType = currentFilterDef?.mediaType;

    const timeout = setTimeout(async () => {
      try {
        const items = await searchMedia(trimmed, selectedType);
        let filtered = items || [];
        if (activeFilter === 'local') {
          filtered = filtered.filter((i) => i.provider_id === 'local-media');
        }
        setResults(filtered);
        setLatencyMs(Math.max(24, Math.round(performance.now() - startTime)));
      } catch (err) {
        console.warn('Search query fallback:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, activeFilter]);

  const handleActionClick = async (item: MediaItem) => {
    setPlaybackError(null);
    if (item.media_type === 'movie') {
      try {
        const resolved = await resolvePlayback(item.provider_media_id, 'movie');
        setActiveVideo({ data: resolved, title: item.title });
      } catch (err: any) {
        console.error('Failed to resolve movie:', err);
        setPlaybackError(
          err?.message || `Unable to start streaming "${item.title}". Please try again.`
        );
      }
    } else if (item.media_type === 'series' || item.media_type === 'anime') {
      try {
        const details = await fetchMediaDetails(item.provider_media_id, item.media_type);
        setSelectedSeries(details);
      } catch (err: any) {
        console.error('Failed to load series details:', err);
        setPlaybackError(
          err?.message || `Unable to load season details for "${item.title}".`
        );
      }
    } else if (item.media_type === 'book') {
      try {
        const bookData = await fetchBookContent(item.provider_media_id);
        setActiveBook(bookData);
      } catch (err: any) {
        console.error('Failed to load book:', err);
        setPlaybackError(err?.message || `Unable to load book "${item.title}".`);
      }
    }
  };

  return (
    <div className="relative flex flex-col gap-8 w-full -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
      {/* Subtle Ambient Glow Canvas Decorators */}
      <div
        className="pointer-events-none absolute -top-40 right-1/4 w-[520px] h-[520px] rounded-full blur-[140px] opacity-60"
        style={{ backgroundColor: 'rgba(13, 161, 186, 0.12)' }}
      />
      <div
        className="pointer-events-none absolute top-48 left-12 w-[380px] h-[380px] rounded-full blur-[100px] opacity-50"
        style={{ backgroundColor: 'rgba(97, 214, 240, 0.08)' }}
      />

      {/* 1. SEARCH CONTROL BAR & FEDERATED METRICS TOPLINE */}
      <section className="relative z-10 flex flex-col gap-4">
        {/* Topline & Engine Telemetry */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-mono text-[11px] font-bold uppercase text-secondary tracking-wider">
                Federated Engine v3.4
              </span>
              <span className="font-mono text-[11px] text-outline">/</span>
              <span className="font-mono text-[11px] uppercase text-on-surface-variant font-medium">
                Cluster Synchronized
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-on-surface font-extrabold tracking-tight">
              Universal Catalog Exploration
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-1.5 rounded-full border border-border-subtle shadow-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-on-surface">
              Query resolved in <span className="text-secondary font-bold">{latencyMs}ms</span> across 3 adapters
            </span>
            <span className="font-mono text-[10px] uppercase font-bold bg-surface-container-high px-2 py-0.5 rounded text-outline ml-1">
              NAS • TMDB • OL
            </span>
          </div>
        </div>

        {/* Master Search Input Bar */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-primary group-focus-within:text-secondary transition-colors" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across universal catalog: movies, anime, series, books, authors..."
            className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-display text-base sm:text-lg pl-14 pr-36 py-4 rounded-xl border border-border-subtle focus:outline-none focus:border-primary/50 focus:bg-surface-container transition-all shadow-md"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                type="button"
                title="Clear Query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="h-5 w-px bg-border-subtle mx-1" />
            <span className="font-mono text-xs font-bold bg-surface-container-high px-2 py-1 rounded text-primary border border-border-subtle">
              ESC to exit
            </span>
          </div>
        </div>
      </section>

      {/* 2. MULTI-FILTER SCOPE PILLS & LIVE INDEX STATS */}
      <section className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            {filters.map((f) => {
              const Icon = f.icon;
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-display text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-glow-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-border-subtle'
                  }`}
                  type="button"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                  {isActive && results.length > 0 && (
                    <span className="font-mono text-[10px] bg-on-primary/20 px-1.5 py-0.5 rounded-full ml-0.5">
                      {results.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Density / View Mode Toggles */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-surface-container text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Grid View"
              type="button"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-surface-container text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="List View"
              type="button"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suggestion Tag Cloud */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-mono text-[11px] font-bold text-outline uppercase shrink-0">
            Refine:
          </span>
          {suggestionTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors border border-border-subtle font-mono text-[11px] shrink-0 cursor-pointer"
              type="button"
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {playbackError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{playbackError}</span>
          </div>
          <button
            onClick={() => setPlaybackError(null)}
            className="text-rose-400 hover:text-rose-200 underline text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. FEDERATED SEARCH RESULTS MATRIX */}
      <section className="relative z-10 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[35vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="font-mono text-xs text-on-surface-variant">
              Querying federated providers in parallel...
            </span>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-container/60 border border-border-subtle flex flex-col items-center gap-3">
            <Search className="w-10 h-10 text-outline" />
            <h3 className="font-display font-bold text-lg text-on-surface">
              No matching catalog items found
            </h3>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-md">
              Try searching for alternative keywords like "Cyberpunk", "Dune", "Celestial", or clear category filters.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {results.map((item) => (
              <div
                key={`${item.provider_id}-${item.provider_media_id}`}
                onClick={() => handleActionClick(item)}
                className="group flex flex-col bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-primary/40 transition-all duration-200 cursor-pointer card-hover-lift shadow-md"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                  <img
                    src={
                      item.poster_url ||
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />

                  {/* Rating Badge */}
                  {item.rating && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono font-bold text-secondary">
                      <Star className="w-3 h-3 fill-secondary text-secondary" />
                      {item.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Category Chip */}
                  <div className="absolute top-2 right-2 bg-surface-container-highest/90 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-primary uppercase">
                    {item.media_type}
                  </div>

                  {/* Play/Inspect Action Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-glow-primary">
                      {item.media_type === 'book' ? (
                        <BookOpen className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-1">
                  <h3 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                    <span>{item.year || '2024'}</span>
                    <span className="text-[10px] uppercase font-bold text-tertiary">
                      {item.provider_id === 'local-media' ? 'Local' : item.provider_id.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-3">
            {results.map((item) => (
              <div
                key={`${item.provider_id}-${item.provider_media_id}`}
                onClick={() => handleActionClick(item)}
                className="group flex items-center gap-4 p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/40 transition-all cursor-pointer card-hover-lift shadow-sm"
              >
                <div className="w-16 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-surface-container-lowest">
                  <img
                    src={
                      item.poster_url ||
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high font-mono text-[10px] font-bold text-primary uppercase">
                      {item.media_type}
                    </span>
                    <h3 className="font-display font-bold text-sm sm:text-base text-on-surface truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  {item.overview && (
                    <p className="font-sans text-xs text-on-surface-variant line-clamp-2 max-w-3xl leading-relaxed">
                      {item.overview}
                    </p>
                  )}
                  <div className="flex items-center gap-3 font-mono text-xs text-on-surface-variant pt-1">
                    <span>{item.year || 2024}</span>
                    {item.rating && (
                      <span className="flex items-center gap-1 text-secondary font-bold">
                        <Star className="w-3 h-3 fill-secondary" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="text-[10px] text-tertiary uppercase font-bold">
                      {item.provider_id}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pr-2">
                  <button
                    className="p-2.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface transition-colors"
                    type="button"
                  >
                    {item.media_type === 'book' ? <BookOpen className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Players & Modals */}
      {activeVideo && (
        <VideoPlayer
          playback={activeVideo.data}
          title={activeVideo.title}
          episodeTitle={activeVideo.episodeTitle}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {selectedSeries && (
        <SeriesDetailModal
          details={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlayEpisode={async (epNumber, seasonNum, epTitle) => {
            try {
              const playback = await resolvePlayback(
                selectedSeries.provider_media_id,
                'series',
                seasonNum,
                epNumber
              );
              setActiveVideo({
                data: playback,
                title: selectedSeries.title,
                episodeTitle: `S${seasonNum}:E${epNumber}${epTitle ? ` - ${epTitle}` : ''}`,
              });
            } catch (err: any) {
              console.error('Failed to resolve episode stream:', err);
              setPlaybackError(
                err?.message || `Unable to start playback for Season ${seasonNum}, Episode ${epNumber}.`
              );
            }
          }}

        />
      )}

      {activeBook && (
        <BookReader content={activeBook} onClose={() => setActiveBook(null)} />
      )}
    </div>
  );
};
