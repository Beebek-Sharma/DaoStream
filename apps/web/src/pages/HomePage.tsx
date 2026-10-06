import React, { useState, useEffect } from 'react';
import {
  Play,
  Star,
  Info,
  Clock,
  BookOpen,
  Film,
  Tv,
  Bookmark,
} from 'lucide-react';
import {
  searchMedia,
  fetchMediaDetails,
  fetchBookContent,
  resolvePlayback,
  fetchWatchProgress,
  fetchReadingProgress,
  MediaItem,
  MediaDetails,
  BookContent,
  ResolvedPlayback,
} from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { SeriesDetailModal } from '../components/series/SeriesDetailModal';
import { BookReader } from '../components/reader/BookReader';

export const HomePage: React.FC = () => {
  const [featuredItem, setFeaturedItem] = useState<MediaItem | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [popularSeries, setPopularSeries] = useState<MediaItem[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<MediaItem[]>([]);
  const [continueWatchingList, setContinueWatchingList] = useState<any[]>([]);
  const [continueReadingList, setContinueReadingList] = useState<any[]>([]);


  // Active Modals & Players
  const [activeVideo, setActiveVideo] = useState<{
    data: ResolvedPlayback;
    title: string;
    episodeTitle?: string;
  } | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<MediaDetails | null>(null);
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [movies, series, anime, books, watchProg, readProg] = await Promise.allSettled([
          searchMedia('', 'movie'),
          searchMedia('', 'series'),
          searchMedia('', 'anime'),
          searchMedia('', 'book'),
          fetchWatchProgress(),
          fetchReadingProgress(),
        ]);

        const mList = movies.status === 'fulfilled' && movies.value.length > 0 ? movies.value : [
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-m-1',
            title: 'Cosmic Drift',
            media_type: 'movie' as const,
            year: 2024,
            overview: 'A lone interstellar navigator finds themselves lost in an uncharted gravitational fold.',
            poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
            backdrop_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80',
            rating: 8.7,
          },
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-m-2',
            title: 'Neon Symphony',
            media_type: 'movie' as const,
            year: 2023,
            overview: 'In a rain-drenched cyberpunk metropolis, a renegade acoustic hacker uncovers a corporate conspiracy.',
            poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
            backdrop_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80',
            rating: 8.4,
          },
        ];

        const sList = series.status === 'fulfilled' && series.value.length > 0 ? series.value : [
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-s-1',
            title: 'Chronicles of Aetheria',
            media_type: 'series' as const,
            year: 2022,
            overview: 'Ancient elemental dynasties clash across floating islands as energy crystals deplete.',
            poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
            backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80',
            rating: 9.1,
          },
        ];

        const aList = anime.status === 'fulfilled' && anime.value.length > 0 ? anime.value : [
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-a-1',
            title: 'Blade of the Celestial Wind',
            media_type: 'anime' as const,
            year: 2023,
            overview: 'A spirit swordsman traverses mystical realms to seal rifts between realms of gods and men.',
            poster_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
            backdrop_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80',
            rating: 8.9,
          },
        ];

        const bList = books.status === 'fulfilled' && books.value.length > 0 ? books.value : [
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-b-1',
            title: 'The Quantum Cartographer',
            media_type: 'book' as const,
            year: 2021,
            overview: 'A profound journey through multidimensional topologies and forgotten algorithms.',
            poster_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
            rating: 9.3,
          },
        ];

        setTrendingMovies(mList);
        setPopularSeries([...sList, ...aList]);
        setFeaturedBooks(bList);
        setFeaturedItem(mList[0] || sList[0]);

        // Continue watching/reading lists
        if (watchProg.status === 'fulfilled' && watchProg.value.length > 0) {
          setContinueWatchingList(watchProg.value);
        } else {
          // Sample continue watching entry
          setContinueWatchingList([
            {
              media_id: 'mock-m-1',
              title: 'Cosmic Drift',
              current_time: 2840,
              duration: 8520,
              progress_percent: 33,
              poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
            },
          ]);
        }

        if (readProg.status === 'fulfilled' && readProg.value.length > 0) {
          setContinueReadingList(readProg.value);
        } else {
          // Sample continue reading entry
          setContinueReadingList([
            {
              media_id: 'mock-b-1',
              title: 'The Quantum Cartographer',
              current_page: 1,
              total_pages: 2,
              progress_percentage: 50,
              last_location: 'Chapter 1: The Threshold of Coordinates',
            },
          ]);
        }
      } catch (err) {
        console.warn('Error loading home data:', err);
      }
    };

    loadHomeData();
  }, []);

  const handlePlayHero = async (item: MediaItem) => {
    try {
      const playback = await resolvePlayback(item.provider_media_id, item.media_type);
      setActiveVideo({ data: playback, title: item.title });
    } catch (err) {
      console.warn('Hero fallback playback:', err);
      setActiveVideo({
        data: {
          media_id: item.provider_media_id,
          media_type: item.media_type,
          primary_source: {
            id: `${item.provider_media_id}-source-1080p`,
            title: 'Authorized Demo Source (1080p)',
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [
            {
              id: `${item.provider_media_id}-source-1080p`,
              title: 'Authorized Demo Source (1080p)',
              quality: '1080p',
              format: 'mp4',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              is_direct: true,
              subtitles: [],
            },
          ],
          available_qualities: ['1080p'],
          subtitles: [],
          expires_in_seconds: 7200,
        },
        title: item.title,
      });
    }
  };

  const handleMediaCardClick = async (item: MediaItem) => {
    if (item.media_type === 'movie') {
      await handlePlayHero(item);
    } else if (item.media_type === 'series' || item.media_type === 'anime') {
      try {
        const details = await fetchMediaDetails(item.provider_media_id, item.media_type);
        setSelectedSeries(details);
      } catch (err) {
        console.warn('Series fallback details:', err);
      }
    } else if (item.media_type === 'book') {
      try {
        const content = await fetchBookContent(item.provider_media_id);
        setActiveBook(content);
      } catch (err) {
        console.warn('Book fallback content:', err);
      }
    }
  };

  const handleResumeWatching = async (entry: any) => {
    try {
      const playback = await resolvePlayback(entry.media_id, 'movie');
      setActiveVideo({ data: playback, title: entry.title });
    } catch (err) {
      console.warn('Fallback resume:', err);
      setActiveVideo({
        data: {
          media_id: entry.media_id,
          media_type: 'movie',
          primary_source: {
            id: `${entry.media_id}-source-1080p`,
            title: 'Authorized Demo Source (1080p)',
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [],
          available_qualities: ['1080p'],
          subtitles: [],
          expires_in_seconds: 7200,
        },
        title: entry.title,
      });
    }
  };

  const handleResumeReading = async (entry: any) => {
    try {
      const content = await fetchBookContent(entry.media_id);
      setActiveBook(content);
    } catch (err) {
      console.warn('Fallback resume reading:', err);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Featured Cinematic Hero Banner */}
      {featuredItem && (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-cinematic bg-background-elevated min-h-[380px] sm:min-h-[440px] flex items-end p-6 sm:p-12">
          {/* Backdrop Image */}
          <div className="absolute inset-0">
            <img
              src={
                featuredItem.backdrop_url ||
                featuredItem.poster_url ||
                'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80'
              }
              alt={featuredItem.title}
              className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 transition-transform duration-1000"
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background-card via-background-card/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background-card via-background-card/40 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/30 border border-primary/50 text-[11px] font-mono uppercase text-indigo-300 font-semibold backdrop-blur-md">
                Featured {featuredItem.media_type}
              </span>
              {featuredItem.rating && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[11px] font-semibold text-amber-400 backdrop-blur-md">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{featuredItem.rating}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {featuredItem.title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-200 line-clamp-3 leading-relaxed max-w-xl">
              {featuredItem.overview}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handlePlayHero(featuredItem)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-glow-primary hover:translate-y-[-1px]"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => handleMediaCardClick(featuredItem)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium backdrop-blur-md transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching Row */}
      {continueWatchingList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Continue Watching</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {continueWatchingList.map((entry, idx) => (
              <div
                key={idx}
                onClick={() => handleResumeWatching(entry)}
                className="group relative rounded-2xl glass-card border border-white/5 hover:border-primary/40 overflow-hidden cursor-pointer transition-all hover:translate-y-[-2px] p-3 flex items-center gap-3.5"
              >
                <div className="w-16 aspect-[2/3] rounded-xl overflow-hidden bg-background-elevated relative flex-shrink-0">
                  <img
                    src={entry.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                    alt={entry.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 fill-white text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{entry.progress_percent || 33}% watched</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${entry.progress_percent || 33}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Reading Row */}
      {continueReadingList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Continue Reading</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {continueReadingList.map((entry, idx) => (
              <div
                key={idx}
                onClick={() => handleResumeReading(entry)}
                className="group relative rounded-2xl glass-card border border-white/5 hover:border-emerald-500/40 p-4 cursor-pointer transition-all hover:translate-y-[-2px] flex items-center justify-between"
              >
                <div className="space-y-1 min-w-0 flex-1 pr-3">
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">
                    Current Book
                  </span>
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {entry.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 truncate">
                    {entry.last_location || 'Chapter 1'}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-md">
                  <Bookmark className="w-4 h-4 fill-current" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Movies Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Trending Feature Films</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {trendingMovies.map(movie => (
            <div
              key={movie.provider_media_id}
              onClick={() => handleMediaCardClick(movie)}
              className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-cinematic hover:translate-y-[-2px] flex flex-col cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-background-elevated">
                <img
                  src={movie.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {movie.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{movie.rating}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                    {movie.year && <span>{movie.year}</span>}
                    <span>•</span>
                    <span>Movie</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Series & Anime Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-purple-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Popular Series & Anime</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {popularSeries.map(item => (
            <div
              key={item.provider_media_id}
              onClick={() => handleMediaCardClick(item)}
              className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-purple-500/40 transition-all duration-300 hover:shadow-cinematic hover:translate-y-[-2px] flex flex-col cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-background-elevated">
                <img
                  src={item.poster_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-glow-primary transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase text-indigo-300 font-semibold">
                  {item.media_type}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                    {item.year && <span>{item.year}</span>}
                    <span>•</span>
                    <span>{item.media_type === 'anime' ? 'Anime' : 'Series'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acclaimed Books & Novels Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Acclaimed Literature</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {featuredBooks.map(book => (
            <div
              key={book.provider_media_id}
              onClick={() => handleMediaCardClick(book)}
              className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-cinematic hover:translate-y-[-2px] flex flex-col cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-background-elevated">
                <img
                  src={book.poster_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>

                {book.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{book.rating}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 truncate">
                    {book.overview?.replace('By ', '') || 'Author'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayer
          playbackData={activeVideo.data}
          title={activeVideo.title}
          episodeTitle={activeVideo.episodeTitle}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Series Detail Modal */}
      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlayEpisode={async (sNum, epNum, epTitle) => {
            try {
              const playback = await resolvePlayback(
                selectedSeries.provider_media_id,
                selectedSeries.media_type,
                sNum,
                epNum
              );
              setActiveVideo({
                data: playback,
                title: selectedSeries.title,
                episodeTitle: `S${sNum}:E${epNum} - ${epTitle}`,
              });
            } catch (err) {
              console.warn(err);
            }
          }}
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
