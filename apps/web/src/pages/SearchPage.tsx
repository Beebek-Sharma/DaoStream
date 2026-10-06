import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Film,
  Tv,
  BookOpen,
  Layers,
  Star,
  Play,
  BookMarked,
  Loader2,
  X,
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
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modals / Players state
  const [activeVideo, setActiveVideo] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
  } | null>(null);
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<MediaDetails | null>(null);

  const filters = [
    { id: 'all', label: 'All Media', icon: Layers, mediaType: undefined },
    { id: 'movies', label: 'Movies', icon: Film, mediaType: 'movie' },
    { id: 'series', label: 'TV Series', icon: Tv, mediaType: 'series' },
    { id: 'anime', label: 'Anime', icon: Sparkles, mediaType: 'anime' },
    { id: 'books', label: 'Books', icon: BookOpen, mediaType: 'book' },
  ];

  // Global Ctrl+K / Cmd+K focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
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
    const selectedType = filters.find(f => f.id === activeFilter)?.mediaType;

    const timeout = setTimeout(async () => {
      try {
        const items = await searchMedia(trimmed, selectedType);
        setResults(items || []);
      } catch (err) {
        console.warn('Search query fallback:', err);
        // Fallback filter over mock data
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [query, activeFilter]);

  const handleActionClick = async (item: MediaItem) => {
    if (item.media_type === 'movie') {
      try {
        const playback = await resolvePlayback(item.provider_media_id, 'movie');
        setActiveVideo({ data: playback, title: item.title });
      } catch (err) {
        console.warn('Fallback movie playback:', err);
      }
    } else if (item.media_type === 'series' || item.media_type === 'anime') {
      try {
        const details = await fetchMediaDetails(item.provider_media_id, item.media_type);
        setSelectedSeries(details);
      } catch (err) {
        console.warn('Fallback series details:', err);
      }
    } else if (item.media_type === 'book') {
      try {
        const content = await fetchBookContent(item.provider_media_id);
        setActiveBook(content);
      } catch (err) {
        console.warn('Fallback book content:', err);
      }
    }
  };

  const handlePlayEpisodeFromModal = async (
    seasonNumber: number,
    episodeNumber: number,
    epTitle: string
  ) => {
    if (!selectedSeries) return;
    try {
      const playback = await resolvePlayback(
        selectedSeries.provider_media_id,
        selectedSeries.media_type,
        seasonNumber,
        episodeNumber
      );
      setActiveVideo({
        data: playback,
        title: selectedSeries.title,
        episodeTitle: `S${seasonNumber}:E${episodeNumber} - ${epTitle}`,
      });
    } catch (err) {
      console.warn('Fallback episode playback:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Federated Search</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Search movies, shows, anime, and books across all active providers in real time.
        </p>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a title, actor, author, or keyword (Ctrl+K)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-background-elevated border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm md:text-base transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filters.map(filter => {
            const Icon = filter.icon;
            const isSelected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'bg-background-card border border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs">Querying connected providers...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Results ({results.length})</span>
            <span className="font-mono">Federated Response</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {results.map(item => (
              <div
                key={`${item.provider_id}-${item.provider_media_id}`}
                onClick={() => handleActionClick(item)}
                className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-primary/40 transition-all duration-300 hover:shadow-cinematic hover:translate-y-[-2px] flex flex-col cursor-pointer"
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-background-elevated">
                  <img
                    src={
                      item.poster_url ||
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Play / Read Icon Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform">
                      {item.media_type === 'book' ? (
                        <BookMarked className="w-5 h-5 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase text-indigo-300 font-semibold">
                    {item.media_type}
                  </div>

                  {/* Rating */}
                  {item.rating && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{item.rating}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      {item.year && <span>{item.year}</span>}
                    </div>
                  </div>

                  <div className="mt-2 text-center py-1.5 px-2 rounded-lg bg-white/5 group-hover:bg-primary text-[11px] font-medium text-gray-300 group-hover:text-white transition-colors">
                    {item.media_type === 'book' ? 'Read' : item.media_type === 'movie' ? 'Watch' : 'Episodes'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : query ? (
        <div className="rounded-2xl glass-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">No matches found for "{query}"</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Try checking spelling or adjusting the media category filter.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl glass-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Universal Search Ready</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mt-1">
              Start typing above to search titles, genres, actors, and novels across all connected providers.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-gray-500">Popular queries:</span>
            {['Cosmic Drift', 'Chronicles of Aetheria', 'Blade of the Celestial Wind', 'Dune'].map(tag => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 text-[11px] transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayer
          playbackData={activeVideo.data}
          title={activeVideo.title}
          episodeTitle={activeVideo.episodeTitle}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Series Episodes Modal */}
      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlayEpisode={handlePlayEpisodeFromModal}
        />
      )}

      {/* Book Reader Modal */}
      {activeBook && (
        <BookReader
          book={activeBook}
          onClose={() => setActiveBook(null)}
        />
      )}
    </div>
  );
};
