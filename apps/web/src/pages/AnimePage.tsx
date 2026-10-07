import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Star, AlertCircle, Layers, Search, RefreshCw } from 'lucide-react';
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

export const AnimePage: React.FC = () => {
  const [animeList, setAnimeList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
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
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'top_rated') return (a.rating || 0) >= 8.0;
    if (selectedFilter === 'recent') return (a.year || 0) >= 2023;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/25 text-secondary text-xs font-mono tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seasonal Japanese Animation • Multi-Server HD Mirrors</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Anime Universe
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Stream popular Japanese animation, seasonal broadcasts, and classic series with multi-server playback mirrors and full episode guides.
          </p>
        </div>

        {/* Search Bar & Filter Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anime title..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-surface-container-low border border-border-subtle rounded-xl text-xs text-on-surface focus:outline-none focus:border-secondary transition-colors"
            />
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Anime' },
              { id: 'recent', label: 'Recent (2023+)' },
              { id: 'top_rated', label: 'Top Rated (8.0+)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedFilter === f.id
                    ? 'bg-secondary text-on-secondary border-secondary font-semibold shadow-glow-secondary'
                    : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-secondary/40 hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => fetchAnime(searchQuery)}
              title="Refresh catalog"
              className="p-2 rounded-xl bg-surface-container-low border border-border-subtle text-on-surface-variant hover:text-on-surface hover:border-secondary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-secondary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Anime Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
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
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-tertiary/30 text-[10px] font-mono text-tertiary font-bold">
                  ANIME
                </div>

                {/* Rating Badge */}
                {item.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{Number(item.rating).toFixed(1)}</span>
                  </div>
                )}

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-surface-dim/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[11px] font-mono text-secondary font-medium tracking-wide">
                    EXPLORE EPISODES
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-secondary transition-colors">
                    {item.title}
                  </h3>
                  {item.original_title && (
                    <p className="text-[10px] font-mono text-on-surface-variant truncate">
                      {item.original_title}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant mt-0.5">
                    {item.year && <span>{item.year}</span>}
                    <span>•</span>
                    <span className="text-secondary font-medium">Episodes Available</span>
                  </div>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-secondary text-on-surface-variant group-hover:text-on-secondary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-secondary">
                  <Layers className="w-3 h-3" />
                  <span>View Seasons</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Season and Episode Modal */}
      {selectedAnime && (
        <SeriesDetailModal
          series={selectedAnime}
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
