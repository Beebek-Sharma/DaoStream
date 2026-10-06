import React, { useState, useEffect } from 'react';
import { Tv, Play, Star, AlertCircle } from 'lucide-react';
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

export const SeriesPage: React.FC = () => {
  const [seriesList, setSeriesList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
          setSeriesList(results);
        } else {
          setSeriesList([
            {
              provider_id: 'mock_media_provider',
              provider_media_id: 'mock-s-1',
              title: 'Chronicles of Aetheria',
              media_type: 'series',
              year: 2022,
              overview: 'Ancient elemental dynasties clash across floating islands as energy crystals deplete.',
              poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
              backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80',
              rating: 9.1,
            },
          ]);
        }
      } catch (err) {
        console.warn('Fallback series list:', err);
        setSeriesList([
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-s-1',
            title: 'Chronicles of Aetheria',
            media_type: 'series',
            year: 2022,
            overview: 'Ancient elemental dynasties clash across floating islands as energy crystals deplete.',
            poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
            backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80',
            rating: 9.1,
          },
        ]);
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
      // Fallback sample series structure
      setSelectedSeries({
        provider_id: item.provider_id,
        provider_media_id: item.provider_media_id,
        title: item.title,
        media_type: 'series',
        genres: ['Fantasy', 'Mystery', 'Drama'],
        tags: ['magic', 'empires'],
        overview: item.overview,
        poster_url: item.poster_url,
        backdrop_url: item.backdrop_url,
        rating: item.rating,
        total_seasons: 1,
        seasons: [
          {
            season_number: 1,
            title: 'Season 1: The Gathering',
            episodes: [
              {
                id: 'mock-s-1-s1-e1',
                episode_number: 1,
                title: 'Skyward Awakening',
                overview: 'An outcast crystal miner uncovers an ancient resonance vault.',
                duration_minutes: 52,
              },
              {
                id: 'mock-s-1-s1-e2',
                episode_number: 2,
                title: 'Whispers of the Deep',
                overview: 'The Imperial Guard tracks the resonance anomaly to the outer ring.',
                duration_minutes: 48,
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
            title: `Episode ${episodeNumber} Source (1080p)`,
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [
            {
              id: `${selectedSeries.provider_media_id}-e${episodeNumber}-1080p`,
              title: `Episode ${episodeNumber} Source (1080p)`,
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TV Series</h1>
            <p className="text-xs text-gray-400">Episodic television and season catalogs</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Series Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {seriesList.map(item => (
            <div
              key={item.provider_media_id}
              onClick={() => handleOpenSeries(item)}
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

                {item.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                    {item.year && <span>{item.year}</span>}
                    <span>•</span>
                    <span>Series</span>
                  </div>
                </div>

                <div className="mt-2 text-center py-1.5 px-2 rounded-lg bg-white/5 group-hover:bg-primary text-[11px] font-medium text-gray-300 group-hover:text-white transition-colors">
                  View Episodes
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
