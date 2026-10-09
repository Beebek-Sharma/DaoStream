import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Star,
  AlertCircle,
  Layers,
  Search,
  RefreshCw,
  Tv,
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

const ANIME_GENRES = [
  'All',
  'Action',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Supernatural',
  'Comedy',
  'Adventure',
];

export const AnimePage: React.FC = () => {
  const [animeList, setAnimeList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedAnime, setSelectedAnime] = useState<MediaDetails | null>(null);
  const [activePlayback, setActivePlayback] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
    currentSeason: number;
    currentEpisode: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnime = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchMedia(query, 'anime');
      setAnimeList(results || []);
    } catch (err: any) {
      console.error('Failed to load anime catalog:', err);
      setError(err?.message || 'Unable to connect to Anime service. Please try again.');
      setAnimeList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnime();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnime(searchQuery);
  };

  const handleOpenAnime = async (item: MediaItem) => {
    setError(null);
    try {
      const details = await fetchMediaDetails(item.provider_media_id, 'anime');
      setSelectedAnime(details);
    } catch (err: any) {
      console.error('Error fetching anime details:', err);
      setError('Could not load episode guide for this anime.');
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
        episodeTitle: epTitle || `Episode ${episodeNumber}`,
        currentSeason: seasonNumber,
        currentEpisode: episodeNumber,
      });
    } catch (err: any) {
      console.error('Playback resolution failed:', err);
      setError('Stream servers currently unavailable for this episode.');
    }
  };

  const handleNextEpisode = () => {
    if (!activePlayback || !selectedAnime) return;
    const nextEpNum = activePlayback.currentEpisode + 1;
    handlePlayEpisode(activePlayback.currentSeason, nextEpNum, `Episode ${nextEpNum}`);
  };

  const filteredAnime = animeList.filter((a) => {
    if (selectedFilter === 'top_rated' && (a.rating || 0) < 8.0) return false;
    if (selectedFilter === 'recent' && (a.year || 0) < 2023) return false;
    if (selectedGenre !== 'All') {
      const hasGenre =
        (a as any).genres?.some((g: string) =>
          g.toLowerCase().includes(selectedGenre.toLowerCase())
        ) || a.overview?.toLowerCase().includes(selectedGenre.toLowerCase());
      if (!hasGenre) return false;
    }
    return true;
  });

  const spotlightAnime = animeList.length > 0 ? animeList[0] : null;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. SPOTLIGHT ANIME HERO BANNER (Featured Top Anime) */}
      {spotlightAnime && !loading && (
        <div className="relative w-full rounded-3xl overflow-hidden bg-surface-container-low border border-border-subtle shadow-2xl">
          <div className="relative min-h-[300px] sm:min-h-[360px] md:min-h-[400px] flex items-end p-6 sm:p-8 md:p-10">
            {/* Background Backdrop Image */}
            <img
              src={
                spotlightAnime.backdrop_url ||
                spotlightAnime.poster_url ||
                'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&q=80'
              }
              alt={spotlightAnime.title}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-45 scale-105"
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/80 to-transparent w-full lg:w-2/3" />

            {/* Spotlight Content Details */}
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-xs font-mono tracking-wider uppercase font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Anime Spotlight • Season Broadcast</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight leading-tight">
                {spotlightAnime.title}
              </h1>

              {spotlightAnime.original_title && (
                <p className="text-xs sm:text-sm font-mono text-on-surface-variant/80 italic">
                  {spotlightAnime.original_title}
                </p>
              )}

              <p className="text-xs sm:text-sm text-on-surface-variant line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {spotlightAnime.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleOpenAnime(spotlightAnime)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary font-display text-sm font-bold hover:bg-secondary-hover transition-all shadow-glow-secondary active:scale-95 cursor-pointer"
                  type="button"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Explore Episodes</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-border-subtle flex items-center gap-1 text-secondary font-bold">
                    <Star className="w-3.5 h-3.5 fill-secondary" />
                    {spotlightAnime.rating ? `${spotlightAnime.rating.toFixed(1)} IMDb` : '9.0'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-border-subtle">
                    {spotlightAnime.year || 2024}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-border-subtle text-tertiary font-bold">
                    SUB & DUB
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
          <div className="flex items-center gap-2 text-secondary text-xs font-mono uppercase tracking-wider font-semibold">
            <Tv className="w-3.5 h-3.5" />
            <span>AniList & Jikan Anime Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-on-surface tracking-tight">
            Anime Universe
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            Stream popular Japanese animation, seasonal broadcasts, and classic series with multi-server playback mirrors and full episode guides.
          </p>
        </div>

        {/* Search Bar & Quick Refresh */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anime title..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-border-subtle rounded-xl text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-secondary transition-colors"
            />
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
          </form>

          <button
            onClick={() => fetchAnime(searchQuery)}
            title="Refresh catalog"
            className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle text-on-surface-variant hover:text-on-surface hover:border-secondary transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-secondary' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC GENRE & STATUS FILTER CHIPS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {ANIME_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedGenre === g
                  ? 'bg-secondary text-on-secondary border-secondary font-bold shadow-glow-secondary'
                  : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-secondary/40 hover:text-on-surface'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'top_rated', label: 'Top Rated (8.0+)' },
            { id: 'recent', label: 'New Releases' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedFilter === f.id
                  ? 'bg-primary text-on-primary border-primary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:text-on-surface'
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

      {/* 4. ANIME CATALOG GRID */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : filteredAnime.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Sparkles className="w-12 h-12 text-secondary/40 animate-pulse" />
          <h3 className="text-base font-semibold text-on-surface">No anime found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Try searching for another anime title like "Solo Leveling", "Demon Slayer", or "Frieren".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {filteredAnime.map((item) => (
            <div
              key={item.provider_media_id}
              onClick={() => handleOpenAnime(item)}
              className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-secondary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-surface-container-lowest">
                <img
                  src={
                    item.poster_url ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80'
                  }
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Sub / Dub Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-surface-container-highest/90 backdrop-blur-md border border-tertiary/30 text-[10px] font-mono text-tertiary font-bold">
                  SUB & DUB
                </div>

                {/* Rating Badge */}
                {item.rating && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-surface-container-highest/90 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{Number(item.rating).toFixed(1)}</span>
                  </div>
                )}

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-surface-dim/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2.5 p-4">
                  <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[11px] font-mono text-secondary font-bold tracking-wider uppercase">
                    EPISODE GUIDE
                  </span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-secondary transition-colors">
                    {item.title}
                  </h3>
                  {item.original_title && (
                    <p className="text-[10px] font-mono text-on-surface-variant truncate">
                      {item.original_title}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant mt-1">
                    {item.year && <span>{item.year}</span>}
                    <span>•</span>
                    <span className="text-secondary font-medium">TV Series</span>
                  </div>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-secondary text-on-surface-variant group-hover:text-on-secondary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-secondary">
                  <Layers className="w-3 h-3" />
                  <span>Episodes Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Season and Episode Modal */}
      {selectedAnime && (
        <SeriesDetailModal
          details={selectedAnime}
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
