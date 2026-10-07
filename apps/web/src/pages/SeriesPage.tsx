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

const SERIES_FIXTURES: MediaItem[] = [
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-s-1',
    title: 'Chronicles of Aetheria',
    media_type: 'series',
    year: 2023,
    overview: 'Ancient elemental dynasties clash across floating archipelagoes as natural resonance crystals deplete.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80',
    rating: 9.2,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-s-2',
    title: 'Aegis Protocol: Sublevel 4',
    media_type: 'series',
    year: 2024,
    overview: 'In a sealed deep-ocean containment trench, an AI safety team investigates synthetic neural drift.',
    poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80',
    rating: 8.9,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-s-3',
    title: 'The Starlight Archive',
    media_type: 'series',
    year: 2023,
    overview: 'Historians decipher stellar telemetry recorded by ancestral dynasties across galactic civilizations.',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80',
    rating: 9.0,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-s-4',
    title: 'Neon Outpost: Neo-Tokyo',
    media_type: 'series',
    year: 2024,
    overview: 'A street detective and a rogue cybernetic surgeon navigate black-market neural enhancements.',
    poster_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
    rating: 8.7,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-s-5',
    title: 'Quantum Drift',
    media_type: 'series',
    year: 2022,
    overview: 'A research crew on an orbital collider experience parallel timeline overlapping after an experiment goes critical.',
    poster_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    rating: 8.6,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-s-6',
    title: 'The Silo Paradox',
    media_type: 'series',
    year: 2024,
    overview: 'Thousands live in a giant subterranean bunker with strict regulations, unaware of what caused the planetary quarantine.',
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    rating: 9.3,
  },
];

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
      try {
        const results = await searchMedia('', 'series');
        if (results && results.length > 0) {
          const combined = [...results];
          for (const item of SERIES_FIXTURES) {
            if (!combined.some(c => c.provider_media_id === item.provider_media_id)) {
              combined.push(item);
            }
          }
          setSeriesList(combined);
        } else {
          setSeriesList(SERIES_FIXTURES);
        }
      } catch (err) {
        console.warn('Fallback series list:', err);
        setSeriesList(SERIES_FIXTURES);
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
    } catch (err) {
      console.warn('Fallback details for series:', err);
      setSelectedSeries({
        provider_id: item.provider_id,
        provider_media_id: item.provider_media_id,
        title: item.title,
        media_type: 'series',
        genres: ['Sci-Fi', 'Mystery', 'Drama'],
        tags: ['orbital', 'neural-net', 'direct-play'],
        overview: item.overview,
        poster_url: item.poster_url,
        backdrop_url: item.backdrop_url,
        rating: item.rating,
        total_seasons: 2,
        seasons: [
          {
            season_number: 1,
            title: 'Season 1: The Activation',
            episodes: [
              {
                id: `${item.provider_media_id}-s1-e1`,
                episode_number: 1,
                title: 'Skyward Awakening',
                overview: 'An outcast crystal technician uncovers an ancient subterranean resonance vault.',
                duration_minutes: 54,
              },
              {
                id: `${item.provider_media_id}-s1-e2`,
                episode_number: 2,
                title: 'Resonance Drift',
                overview: 'The orbital guard tracks the harmonic frequency to the outer atmospheric ring.',
                duration_minutes: 49,
              },
              {
                id: `${item.provider_media_id}-s1-e3`,
                episode_number: 3,
                title: 'The Obsidian Vector',
                overview: 'Encoded signals from deep orbit reveal a coordinate matrix spanning three planetary systems.',
                duration_minutes: 58,
              },
            ],
          },
          {
            season_number: 2,
            title: 'Season 2: Convergence',
            episodes: [
              {
                id: `${item.provider_media_id}-s2-e1`,
                episode_number: 1,
                title: 'Event Threshold',
                overview: 'The secondary core initiates emergency containment as the resonance array reaches peak power.',
                duration_minutes: 56,
              },
            ],
          },
        ],
      });
    }
  };

  const handlePlayEpisode = async (seasonNumber: number, episodeNumber: number, epTitle: string) => {
    if (!selectedSeries) return;
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
    } catch (err) {
      console.warn('Fallback demo playback for episode:', err);
      setActivePlayback({
        data: {
          media_id: selectedSeries.provider_media_id,
          media_type: 'series',
          season_number: seasonNumber,
          episode_number: episodeNumber,
          primary_source: {
            id: `${selectedSeries.provider_media_id}-e${episodeNumber}-1080p`,
            title: `Episode ${episodeNumber} Master (1080p Direct)`,
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [
            {
              id: `${selectedSeries.provider_media_id}-e${episodeNumber}-1080p`,
              title: `Episode ${episodeNumber} Master (1080p Direct)`,
              quality: '1080p',
              format: 'mp4',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
              is_direct: true,
              subtitles: [],
            },
          ],
          available_qualities: ['1080p'],
          subtitles: [],
          expires_in_seconds: 7200,
        },
        title: selectedSeries.title,
        episodeTitle: `S${seasonNumber}:E${episodeNumber} - ${epTitle}`,
        currentSeason: seasonNumber,
        currentEpisode: episodeNumber,
      });
    }
  };

  const handleNextEpisode = () => {
    if (!activePlayback || !selectedSeries) return;
    const nextEpNum = activePlayback.currentEpisode + 1;
    handlePlayEpisode(activePlayback.currentSeason, nextEpNum, `Episode ${nextEpNum}`);
  };

  const filteredSeries = seriesList.filter(s => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'top_rated') return (s.rating || 0) >= 9.0;
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
            Browse multi-season television catalogs with intelligent episode progression, season selection, and source resolution inspectors.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Series' },
            { id: 'top_rated', label: 'Top Rated (9.0+)' },
            { id: 'recent', label: 'New Seasons (2024)' },
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
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Series Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredSeries.map(item => (
            <div
              key={item.provider_media_id}
              onClick={() => handleOpenSeries(item)}
              className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-primary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-surface-container-lowest">
                <img
                  src={item.poster_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Rating Badge */}
                {item.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{item.rating}</span>
                  </div>
                )}

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

