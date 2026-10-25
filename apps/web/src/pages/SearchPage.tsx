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
  AlertCircle,
  Sparkles,
  Radio,
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
import { useAudio } from '../context/AudioContext';

/**
 * Robust poster image component that provides a clean, elegant
 * placeholder card if artwork is unavailable or fails to load.
 */
const MediaArtwork: React.FC<{
  src?: string | null;
  alt: string;
  mediaType: string;
}> = ({ src, alt, mediaType }) => {
  const [hasError, setHasError] = useState(false);

  const renderIcon = () => {
    switch (mediaType) {
      case 'movie':
        return <Film className="w-8 h-8 text-primary/70" />;
      case 'series':
        return <Tv className="w-8 h-8 text-primary/70" />;
      case 'anime':
        return <Sparkles className="w-8 h-8 text-secondary/70" />;
      case 'book':
        return <BookOpen className="w-8 h-8 text-tertiary/70" />;
      case 'audio':
        return <Radio className="w-8 h-8 text-secondary/70" />;
      default:
        return <Film className="w-8 h-8 text-primary/70" />;
    }
  };

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-surface-container-high border border-border-subtle/40 select-none">
        <div className="mb-2 p-2.5 rounded-full bg-surface-container-highest border border-border-subtle/60 shadow-sm">
          {renderIcon()}
        </div>
        <span className="text-xs text-on-surface-variant font-medium line-clamp-3 leading-snug px-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  );
};

export const SearchPage: React.FC = () => {
  const { playTrack } = useAudio();
  const [searchParams, setSearchParams] = useSearchParams();

  // The search field must start completely empty unless explicitly passed via ?q= URL param
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    { id: 'series', label: 'Series', icon: Tv, mediaType: 'series' },
    { id: 'anime', label: 'Anime', icon: Sparkles, mediaType: 'anime' },
    { id: 'books', label: 'Books & Novels', icon: BookOpen, mediaType: 'book' },
    { id: 'audio', label: 'Music & Audio', icon: Radio, mediaType: 'audio' },
    { id: 'local', label: 'Local Library', icon: HardDrive, mediaType: undefined },
  ];

  // Global Ctrl+K / Cmd+K focus shortcut and ESC to blur/clear
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

  // Debounced search with race-condition / stale-response prevention
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setSearchParams({}, { replace: true });
      return;
    }

    setSearchParams({ q: trimmed }, { replace: true });
    setLoading(true);

    let isCurrent = true;
    const currentFilterDef = filters.find((f) => f.id === activeFilter);
    const selectedType = currentFilterDef?.mediaType;

    const timeout = setTimeout(async () => {
      try {
        const items = await searchMedia(trimmed, selectedType);
        if (!isCurrent) return;

        let filtered = items || [];
        if (activeFilter === 'local') {
          filtered = filtered.filter((i) => i.provider_id === 'local-media');
        }
        setResults(filtered);
      } catch (err) {
        if (!isCurrent) return;
        console.warn('Search query error:', err);
        setResults([]);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
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
    } else if (item.media_type === 'audio') {
      try {
        const playback = await resolvePlayback(item.provider_media_id, 'audio');
        const primary = playback.primary_source || playback.sources[0];
        if (primary) {
          playTrack({
            id: item.provider_media_id,
            title: item.title,
            artist: item.original_title || 'Audio Stream',
            poster_url: item.poster_url,
            stream_url: primary.url,
            bitrate: primary.quality || '128 kbps',
          });
        }
      } catch (err: any) {
        console.error('Failed to resolve audio:', err);
        setPlaybackError(err?.message || `Unable to start audio stream "${item.title}".`);
      }
    }
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className="relative flex flex-col gap-8 w-full -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
      {/* 1. CLEAN SEARCH HEADER & SEARCH INPUT BAR */}
      <section className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl sm:text-4xl text-on-surface font-bold tracking-tight">
            Explore & Search
          </h1>
          <p className="text-sm text-on-surface-variant font-sans">
            Search across movies, series, anime, books, and music
          </p>
        </div>

        {/* Master Search Input Bar */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-primary group-focus-within:text-primary transition-colors" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, series, anime, books, and more..."
            className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-base sm:text-lg pl-12 sm:pl-14 pr-28 sm:pr-32 py-3.5 sm:py-4 rounded-xl border border-border-subtle focus:outline-none focus:border-primary/50 focus:bg-surface-container transition-all shadow-sm"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center gap-2">
            {hasQuery && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                type="button"
                aria-label="Clear Search Query"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-surface-container-high text-primary border border-border-subtle">
              Ctrl K
            </kbd>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTER NAVIGATION & VIEW MODE TOGGLE */}
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
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-glow-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-border-subtle'
                  }`}
                  type="button"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                  {isActive && results.length > 0 && (
                    <span className="text-[11px] bg-on-primary/20 px-1.5 py-0.2 rounded-full ml-0.5">
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
                viewMode === 'grid'
                  ? 'bg-surface-container text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Grid View"
              type="button"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-surface-container text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="List View"
              type="button"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. PLAYBACK / ACTION ERROR BANNER */}
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

      {/* 4. RESULTS DISPLAY OR DISCOVERY EMPTY STATES */}
      <section className="relative z-10 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[35vh] gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <span className="text-sm text-on-surface-variant font-sans">
              Searching catalog...
            </span>
          </div>
        ) : !hasQuery ? (
          /* Normal Discovery State (when query is empty) */
          <div className="p-12 sm:p-16 text-center rounded-2xl bg-surface-container/30 border border-border-subtle flex flex-col items-center gap-4 my-2">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-primary shadow-sm">
              <Search className="w-7 h-7" />
            </div>
            <div className="max-w-md flex flex-col gap-1.5">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-on-surface">
                Discover Media
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant font-sans leading-relaxed">
                Enter a title, director, author, or keyword above to explore movies, series, anime, books, and music.
              </p>
            </div>
          </div>
        ) : results.length === 0 ? (
          /* Query Has No Results */
          <div className="p-12 text-center rounded-2xl bg-surface-container/30 border border-border-subtle flex flex-col items-center gap-3 my-2">
            <Search className="w-10 h-10 text-outline" />
            <h2 className="font-display font-bold text-lg text-on-surface">
              No matching items found for "{query}"
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant font-sans max-w-md">
              Please check your spelling, try different keywords, or switch the category filter.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {results.map((item) => (
              <div
                key={`${item.provider_id}-${item.provider_media_id}`}
                onClick={() => handleActionClick(item)}
                className="group flex flex-col bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-primary/40 transition-all duration-200 cursor-pointer card-hover-lift shadow-sm"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                  <MediaArtwork
                    src={item.poster_url}
                    alt={item.title}
                    mediaType={item.media_type}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />

                  {/* Rating Badge (only if available) */}
                  {item.rating && item.rating > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-secondary">
                      <Star className="w-3 h-3 fill-secondary text-secondary" />
                      {item.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Category Chip */}
                  <div className="absolute top-2 right-2 bg-surface-container-highest/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-primary uppercase">
                    {item.media_type}
                  </div>

                  {/* Action Overlay */}
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
                  <h3 className="font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-sans">
                    <span>{item.year || ''}</span>
                    <span className="text-[11px] uppercase text-on-surface-variant/70">
                      {item.media_type}
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
                  <MediaArtwork
                    src={item.poster_url}
                    alt={item.title}
                    mediaType={item.media_type}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] font-bold text-primary uppercase">
                      {item.media_type}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-on-surface truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  {item.overview && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 max-w-3xl leading-relaxed">
                      {item.overview}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1 font-sans">
                    {item.year && <span>{item.year}</span>}
                    {item.rating && item.rating > 0 && (
                      <span className="flex items-center gap-1 text-secondary font-bold">
                        <Star className="w-3 h-3 fill-secondary" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pr-2">
                  <button
                    className="p-2.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface transition-colors"
                    type="button"
                    aria-label={`Play or read ${item.title}`}
                  >
                    {item.media_type === 'book' ? (
                      <BookOpen className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. PLAYERS & MODALS */}
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
                selectedSeries.media_type || 'series',
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
