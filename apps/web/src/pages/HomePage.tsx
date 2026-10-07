import React, { useState, useEffect } from 'react';
import {
  Play,
  Star,
  Info,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Radio,
  Volume2,
} from 'lucide-react';
import {
  searchMedia,
  fetchMediaDetails,
  fetchBookContent,
  resolvePlayback,
  fetchWatchProgress,
  fetchReadingProgress,
  addToWatchlist,
  removeFromWatchlist,
  fetchWatchlist,
  MediaItem,
  MediaDetails,
  BookContent,
  ResolvedPlayback,
} from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { SeriesDetailModal } from '../components/series/SeriesDetailModal';
import { BookReader } from '../components/reader/BookReader';
import { useAudio } from '../context/AudioContext';

export const HomePage: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [featuredItem, setFeaturedItem] = useState<MediaItem | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [popularSeries, setPopularSeries] = useState<MediaItem[]>([]);
  const [popularAnime, setPopularAnime] = useState<MediaItem[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<MediaItem[]>([]);
  const [audioStations, setAudioStations] = useState<MediaItem[]>([]);
  const [continueWatchingList, setContinueWatchingList] = useState<any[]>([]);
  const [continueReadingList, setContinueReadingList] = useState<any[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  // Active Modals & Players
  const [activeVideo, setActiveVideo] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
    mediaId?: string;
  } | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<MediaDetails | null>(null);
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      try {
        const [moviesRes, seriesRes, animeRes, booksRes, audioRes, watchProgRes, readProgRes, watchListRes] =
          await Promise.allSettled([
            searchMedia('', 'movie'),
            searchMedia('', 'series'),
            searchMedia('', 'anime'),
            searchMedia('', 'book'),
            searchMedia('', 'audio'),
            fetchWatchProgress(),
            fetchReadingProgress(),
            fetchWatchlist(),
          ]);

        if (!mounted) return;

        const movies: MediaItem[] =
          moviesRes.status === 'fulfilled' && moviesRes.value ? moviesRes.value : [];
        const series: MediaItem[] =
          seriesRes.status === 'fulfilled' && seriesRes.value ? seriesRes.value : [];
        const anime: MediaItem[] =
          animeRes.status === 'fulfilled' && animeRes.value ? animeRes.value : [];
        const books: MediaItem[] =
          booksRes.status === 'fulfilled' && booksRes.value ? booksRes.value : [];
        const audio: MediaItem[] =
          audioRes.status === 'fulfilled' && audioRes.value ? audioRes.value : [];

        setTrendingMovies(movies);
        setPopularSeries(series);
        setPopularAnime(anime);
        setFeaturedBooks(books);
        setAudioStations(audio);
        setFeaturedItem(movies[0] || series[0] || anime[0] || null);

        // Continue watching items from database
        if (watchProgRes.status === 'fulfilled' && watchProgRes.value && watchProgRes.value.length > 0) {
          setContinueWatchingList(watchProgRes.value);
        } else {
          setContinueWatchingList([]);
        }

        // Continue reading items from database
        if (readProgRes.status === 'fulfilled' && readProgRes.value && readProgRes.value.length > 0) {
          setContinueReadingList(readProgRes.value);
        } else {
          setContinueReadingList([]);
        }


        if (watchListRes.status === 'fulfilled') {
          const ids = new Set<string>(watchListRes.value.map((item: any) => item.media_id));
          setWatchlistIds(ids);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      }
    };


    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePlayMedia = async (mediaId: string, mediaType: string, title: string) => {
    try {
      const resolved = await resolvePlayback(mediaId, mediaType);
      setActiveVideo({
        data: resolved,
        title,
        mediaId,
      });
    } catch (err) {
      console.error('Failed to resolve stream:', err);
    }
  };

  const handleOpenDetails = async (mediaId: string, mediaType: string) => {
    try {
      const details = await fetchMediaDetails(mediaId, mediaType);
      setSelectedSeries(details);
    } catch (err) {
      console.error('Failed to fetch details:', err);
    }
  };

  const handleOpenBook = async (bookId: string) => {
    try {
      const content = await fetchBookContent(bookId);
      setActiveBook(content);
    } catch (err) {
      console.error('Failed to load book:', err);
    }
  };

  const toggleWatchlist = async (mediaId: string) => {
    try {
      if (watchlistIds.has(mediaId)) {
        await removeFromWatchlist(mediaId);
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(mediaId);
          return next;
        });
      } else {
        await addToWatchlist(mediaId);
        setWatchlistIds((prev) => new Set(prev).add(mediaId));
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
    }
  };

  return (
    <div className="relative flex flex-col w-full -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Dynamic Atmospheric Ambient Glow Orbs */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 w-[700px] h-[450px] rounded-full blur-[140px] mix-blend-screen opacity-70"
        style={{ backgroundColor: 'rgba(13, 161, 186, 0.12)' }}
      />
      <div
        className="pointer-events-none absolute top-48 right-12 w-[500px] h-[350px] rounded-full blur-[120px] mix-blend-screen opacity-60"
        style={{ backgroundColor: 'rgba(97, 214, 240, 0.08)' }}
      />

      {/* 1. TOP HERO SHOWCASE: Bleeds gracefully with ambient scrims */}
      {featuredItem && (
        <section className="relative w-full -mt-6 sm:-mt-8 pt-8 sm:pt-12 pb-10 sm:pb-14 px-6 sm:px-10 lg:px-12 flex flex-col justify-end min-h-[580px] lg:min-h-[640px] overflow-hidden shadow-2xl border-b border-border-subtle">
          {/* Backdrop Photography */}
          <div
            className="absolute inset-0 bg-cover bg-center -z-10 scale-105 transform hover:scale-100 transition-transform duration-1000 ease-out"
            style={{
              backgroundImage: `url(${
                featuredItem.backdrop_url ||
                'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80'
              })`,
            }}
          />

          {/* Scrim Overlays for High-Contrast Architectural Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20 -z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent -z-10 w-full lg:w-4/5" />

          {/* Hero Content Hierarchy */}
          <div className="max-w-4xl flex flex-col gap-4 z-10 pt-16">
            {/* Metadata Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-surface-container-high px-3 py-0.5 rounded-full font-mono text-xs text-secondary font-bold uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                {featuredItem.rating ? `${featuredItem.rating.toFixed(1)} IMDb` : '9.1 IMDb'}
              </span>
              <span className="inline-flex items-center bg-surface-container-high/90 px-3 py-0.5 rounded-full font-mono text-xs text-tertiary font-medium">
                4K UHD • HDR10+
              </span>
              <span className="inline-flex items-center bg-surface-container-high/90 px-3 py-0.5 rounded-full font-mono text-xs text-on-surface-variant font-medium">
                Dolby Atmos 7.1.4
              </span>
              <span className="inline-flex items-center bg-surface-container-high/90 px-3 py-0.5 rounded-full font-sans text-xs text-on-surface uppercase font-semibold">
                Sci-Fi / Drama
              </span>
              <span className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 px-3 py-0.5 rounded-full font-mono text-xs text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Local NAS (Direct Play 4K)
              </span>
            </div>

            {/* Title & Logline */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-secondary font-bold">
                <span>Vault Premier Exclusive</span>
                <span className="text-outline-variant">•</span>
                <span className="text-on-surface-variant">{featuredItem.year || 2024}</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-on-surface tracking-tight font-extrabold leading-tight">
                {featuredItem.title}
              </h1>
              <p className="font-sans text-base sm:text-lg text-on-surface-variant max-w-2xl line-clamp-2 leading-relaxed">
                {featuredItem.overview}
              </p>
            </div>

            {/* Playback Actions Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() =>
                  handlePlayMedia(
                    featuredItem.provider_media_id,
                    featuredItem.media_type,
                    featuredItem.title
                  )
                }
                className="group flex items-center gap-3 bg-primary hover:bg-primary-hover text-on-primary px-6 py-2.5 rounded-lg transition-all shadow-glow-primary active:scale-95 font-bold cursor-pointer"
                type="button"
              >
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="font-display text-sm leading-none font-bold">
                    Resume S1:E3
                  </span>
                  <span className="font-mono text-[10px] opacity-80 mt-0.5 font-medium">
                    42m remaining of 1h 08m
                  </span>
                </div>
              </button>

              <button
                onClick={() => toggleWatchlist(featuredItem.provider_media_id)}
                className="flex items-center gap-2 bg-surface-container-high/80 hover:bg-surface-bright backdrop-blur-md px-4 py-2.5 rounded-lg text-on-surface transition-colors shadow-sm cursor-pointer"
                type="button"
              >
                {watchlistIds.has(featuredItem.provider_media_id) ? (
                  <>
                    <Check className="w-4 h-4 text-tertiary" />
                    <span className="font-sans text-sm font-medium">In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span className="font-sans text-sm font-medium">Watchlist</span>
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  handleOpenDetails(featuredItem.provider_media_id, featuredItem.media_type)
                }
                className="flex items-center gap-2 bg-surface-container-high/80 hover:bg-surface-bright backdrop-blur-md px-4 py-2.5 rounded-lg text-on-surface transition-colors shadow-sm cursor-pointer"
                type="button"
              >
                <Info className="w-4 h-4" />
                <span className="font-sans text-sm font-medium">Details & Seasons</span>
              </button>

              {/* Quick Keyboard Shortcut Hint */}
              <div className="hidden lg:flex items-center gap-2 pl-4 text-on-surface-variant font-mono text-xs">
                <kbd className="px-2 py-0.5 bg-surface-container rounded text-primary border border-border-subtle">
                  Space
                </kbd>
                <span>Quick Resume</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Section Container */}
      <div className="flex flex-col gap-10 sm:gap-12 px-6 sm:px-10 lg:px-12 py-10">
        {/* 2. CONTINUE WATCHING RAIL (16:9 Aspect Video Cards) */}
        {continueWatchingList.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-secondary tracking-wider font-bold">
                  Active Playback Stream
                </span>
                <h2 className="font-display text-2xl text-on-surface font-bold tracking-tight">
                  Continue Watching
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                  type="button"
                  aria-label="Previous watching items"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                  type="button"
                  aria-label="Next watching items"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {continueWatchingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    handlePlayMedia(
                      item.provider_media_id || 'mock-m-1',
                      item.media_type || 'series',
                      item.title
                    )
                  }
                  className="group flex flex-col bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-primary/40 transition-all duration-200 cursor-pointer card-hover-lift shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-container-lowest">
                    <img
                      src={
                        item.thumbnail_url ||
                        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-black/20" />

                    {/* Season / Episode Chip */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-surface-container-high/90 backdrop-blur-md text-[11px] font-mono font-bold text-on-surface">
                      {item.episode_code || 'S01:E01'}
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-glow-primary">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Active Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container-high">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${item.progress_pct || 50}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col gap-1">
                    <span className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant flex items-center justify-between">
                      <span>{item.time_remaining || '35m remaining'}</span>
                      <span className="text-tertiary font-medium">
                        {item.progress_pct || 50}%
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. CONTINUE READING / LITERATURE VAULT RAIL (1:1.5 Aspect Book Covers) */}
        {continueReadingList.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-tertiary tracking-wider font-bold">
                  Interactive Literature Vault
                </span>
                <h2 className="font-display text-2xl text-on-surface font-bold tracking-tight">
                  Continue Reading
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {continueReadingList.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleOpenBook(book.provider_media_id || 'mock-b-1')}
                  className="group flex bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-tertiary/40 transition-all duration-200 cursor-pointer card-hover-lift p-3 gap-3.5 items-center shadow-md"
                >
                  <div className="relative w-20 aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest">
                    <img
                      src={
                        book.cover_url ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
                      }
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                    <div className="flex flex-col gap-1">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-tertiary/15 text-tertiary w-fit">
                        {book.progress_pct || 50}% READ
                      </span>
                      <h4 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-tertiary transition-colors">
                        {book.title}
                      </h4>
                      <p className="font-sans text-xs text-on-surface-variant truncate">
                        {book.author}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle mt-2">
                      <span className="font-mono text-[11px] text-secondary truncate">
                        {book.chapter_label || 'Chapter 18'}
                      </span>
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {book.page_info || 'Page 248 of 496'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. THEMATIC DISCOVERY RAILS: MOVIES */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase text-primary tracking-wider font-bold">
                Theatrical & Local Library
              </span>
              <h2 className="font-display text-2xl text-on-surface font-bold tracking-tight">
                Featured Movies
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {trendingMovies.map((movie) => (
              <div
                key={movie.provider_media_id}
                onClick={() =>
                  handlePlayMedia(movie.provider_media_id, movie.media_type, movie.title)
                }
                className="group flex flex-col bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-primary/40 transition-all duration-200 cursor-pointer card-hover-lift shadow-md"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                  <img
                    src={
                      movie.poster_url ||
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />

                  {/* Rating Badge */}
                  {movie.rating && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono font-bold text-secondary">
                      <Star className="w-3 h-3 fill-secondary text-secondary" />
                      {movie.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Quality Pill */}
                  <div className="absolute top-2 right-2 bg-surface-container-highest/90 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-primary">
                    4K
                  </div>

                  {/* Hover Quick Action */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-glow-primary">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-1">
                  <h3 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                    <span>{movie.year || '2024'}</span>
                    <span className="text-[10px] uppercase font-bold text-tertiary">
                      {movie.provider_id === 'local-media' ? 'Local' : 'TMDB'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. THEMATIC DISCOVERY RAILS: TV SERIES */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase text-secondary tracking-wider font-bold">
                Multi-Season Sagas
              </span>
              <h2 className="font-display text-2xl text-on-surface font-bold tracking-tight">
                Featured TV Series
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {popularSeries.slice(0, 6).map((show) => (
              <div
                key={show.provider_media_id}
                onClick={() => handleOpenDetails(show.provider_media_id, show.media_type)}
                className="group flex flex-col bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-secondary/40 transition-all duration-200 cursor-pointer card-hover-lift shadow-md"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                  <img
                    src={
                      show.poster_url ||
                      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80'
                    }
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />

                  {/* Rating Badge */}
                  {show.rating && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono font-bold text-secondary">
                      <Star className="w-3 h-3 fill-secondary text-secondary" />
                      {show.rating.toFixed(1)}
                    </div>
                  )}

                  <div className="absolute top-2 right-2 bg-surface-container-highest/90 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-secondary">
                    SERIES
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-11 h-11 rounded-full bg-secondary text-on-primary flex items-center justify-center shadow-glow-amber">
                      <Info className="w-5 h-5 text-surface-container-lowest" />
                    </div>
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-1">
                  <h3 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-secondary transition-colors">
                    {show.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                    <span>{show.year || '2023'}</span>
                    <span className="text-[10px] uppercase font-bold text-secondary">
                      Seasons
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. SEASONAL JAPANESE ANIME */}
        {popularAnime.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-secondary tracking-wider font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  Seasonal Japanese Animation
                </span>
                <h2 className="font-display text-2xl text-on-surface font-bold tracking-tight">
                  Anime Universe
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {popularAnime.slice(0, 6).map((anime) => (
                <div
                  key={anime.provider_media_id}
                  onClick={() => handleOpenDetails(anime.provider_media_id, 'anime')}
                  className="group flex flex-col bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-secondary/50 transition-all duration-200 cursor-pointer card-hover-lift shadow-md"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                    <img
                      src={
                        anime.poster_url ||
                        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80'
                      }
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />

                    {anime.rating && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono font-bold text-secondary">
                        <Star className="w-3 h-3 fill-secondary text-secondary" />
                        {anime.rating.toFixed(1)}
                      </div>
                    )}

                    <div className="absolute top-2 right-2 bg-secondary/90 text-on-secondary px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                      ANIME
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-11 h-11 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-glow-secondary">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col gap-1">
                    <h3 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-secondary transition-colors">
                      {anime.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                      <span>{anime.year || '2024'}</span>
                      <span className="text-[10px] uppercase font-bold text-secondary">
                        Simulcast
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. WEB NOVELS & LITERATURE */}
        {featuredBooks.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-tertiary tracking-wider font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-tertiary" />
                  Cultivation, Xianxia & Epic Fiction
                </span>
                <h2 className="font-display text-2xl text-on-surface font-bold tracking-tight">
                  Web Novels & Literature
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {featuredBooks.slice(0, 6).map((book) => (
                <div
                  key={book.provider_media_id}
                  onClick={() => handleOpenBook(book.provider_media_id)}
                  className="group flex flex-col bg-surface-container rounded-xl overflow-hidden border border-border-subtle hover:border-tertiary/50 transition-all duration-200 cursor-pointer card-hover-lift shadow-md"
                >
                  <div className="relative aspect-[1/1.5] w-full overflow-hidden bg-surface-container-lowest">
                    <img
                      src={
                        book.poster_url ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
                      }
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

                    {book.rating && (
                      <div className="absolute top-2 left-3 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono font-bold text-secondary">
                        <Star className="w-3 h-3 fill-secondary text-secondary" />
                        {book.rating.toFixed(1)}
                      </div>
                    )}

                    <div className="absolute top-2 right-2 bg-tertiary/90 text-surface px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                      {book.provider_id === 'webnovel_provider' ? 'WEB NOVEL' : 'BOOK'}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-11 h-11 rounded-full bg-tertiary text-surface flex items-center justify-center shadow-glow-tertiary">
                        <BookOpen className="w-5 h-5 fill-surface ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col gap-1">
                    <h3 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-tertiary transition-colors">
                      {book.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                      <span>{book.year || 'Ongoing'}</span>
                      <span className="text-[10px] uppercase font-bold text-tertiary">
                        Read
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. CONTINUOUS AUDIO & LO-FI STATIONS */}
        {audioStations.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-secondary tracking-wider font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-secondary" />
                  Background Music & Focus Beats
                </span>
                <h2 className="font-display text-2xl text-on-surface font-bold tracking-tight">
                  Audio & Music Stations
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {audioStations.slice(0, 4).map((station) => {
                const isCurrent = currentTrack?.id === station.provider_media_id;
                const isCurrentlyPlaying = isCurrent && isPlaying;
                return (
                  <div
                    key={station.provider_media_id}
                    onClick={() => {
                      playTrack({
                        id: station.provider_media_id,
                        title: station.title,
                        artist: station.original_title || 'Live Stream',
                        poster_url: station.poster_url,
                        stream_url: 'https://ice2.somafm.com/chill-128-mp3',
                        bitrate: '128 kbps',
                      });
                    }}
                    className={`group flex items-center gap-3.5 bg-surface-container rounded-xl overflow-hidden border p-3.5 transition-all duration-200 cursor-pointer card-hover-lift shadow-md ${
                      isCurrent
                        ? 'border-secondary bg-surface-container-high shadow-glow-secondary'
                        : 'border-border-subtle hover:border-secondary/40'
                    }`}
                  >
                    <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-surface-container-lowest">
                      <img
                        src={station.poster_url}
                        alt={station.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        {isCurrentlyPlaying ? (
                          <Volume2 className="w-6 h-6 text-secondary animate-pulse" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] font-mono text-secondary uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                        LIVE 128K
                      </span>
                      <h4 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-secondary transition-colors">
                        {station.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant truncate">
                        {station.original_title || 'Lo-Fi Chill'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* MODAL 1: Interactive Custom Video Player */}
      {activeVideo && (
        <VideoPlayer
          playback={activeVideo.data}
          title={activeVideo.title}
          episodeTitle={activeVideo.episodeTitle}
          mediaId={activeVideo.mediaId}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* MODAL 2: Series & Anime Detail Modal with Season/Episode Browser */}
      {selectedSeries && (
        <SeriesDetailModal
          details={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlayEpisode={(epNumber, seasonNum, epTitle) => {
            handlePlayMedia(
              selectedSeries.provider_media_id,
              selectedSeries.media_type,
              `${selectedSeries.title} - S${seasonNum}E${epNumber}${epTitle ? `: ${epTitle}` : ''}`
            );
          }}

        />
      )}

      {/* MODAL 3: Interactive Book & Novel Reader */}
      {activeBook && (
        <BookReader
          content={activeBook}
          onClose={() => setActiveBook(null)}
        />
      )}
    </div>
  );
};
