import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  Headphones,
  RefreshCw,
  Search,
  Activity,
} from 'lucide-react';
import { searchMedia, resolvePlayback, MediaItem } from '../services/api';
import { useAudio } from '../context/AudioContext';

export const MusicPage: React.FC = () => {
  const [stations, setStations] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();

  const fetchStations = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchMedia(query, 'audio');
      setStations(results || []);
    } catch (err: any) {
      console.error('Failed to load music stations:', err);
      setError(err?.message || 'Unable to connect to audio channels.');
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStations(searchQuery);
  };

  const handlePlayStation = async (station: MediaItem) => {
    if (currentTrack?.id === station.provider_media_id) {
      togglePlay();
      return;
    }

    setResolvingId(station.provider_media_id);
    try {
      const playback = await resolvePlayback(station.provider_media_id, 'audio');
      const primary = playback.primary_source || playback.sources[0];
      if (primary) {
        playTrack({
          id: station.provider_media_id,
          title: station.title,
          artist: station.original_title || 'Live Stream',
          poster_url: station.poster_url,
          stream_url: primary.url,
          bitrate: primary.quality || '128 kbps',
        });
      }
    } catch (err) {
      console.warn('Failed to resolve stream:', err);
      // Fallback stream resolution
      playTrack({
        id: station.provider_media_id,
        title: station.title,
        artist: station.original_title || 'Live Stream',
        poster_url: station.poster_url,
        stream_url: 'https://ice2.somafm.com/chill-128-mp3',
        bitrate: '128 kbps',
      });
    } finally {
      setResolvingId(null);
    }
  };

  const filteredStations = stations.filter((st) => {
    if (selectedCategory === 'all') return true;
    const text = (st.title + ' ' + (st.overview || '')).toLowerCase();
    if (selectedCategory === 'lofi') return text.includes('lo-fi') || text.includes('chill');
    if (selectedCategory === 'synth') return text.includes('synth') || text.includes('cyber') || text.includes('vapor');
    if (selectedCategory === 'ambient') return text.includes('ambient') || text.includes('space') || text.includes('drone');
    if (selectedCategory === 'world') return text.includes('goa') || text.includes('lounge') || text.includes('agent');
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/25 text-secondary text-xs font-mono tracking-wider uppercase">
            <Radio className="w-3.5 h-3.5" />
            <span>DaoStream High-Bitrate Continuous Audio & Music Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Audio & Music Stations
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Stream continuous Lo-Fi chillhop, synthwave, deep ambient space drones, and cinematic soundscapes. Audio persists in the background while you read web novels or explore media.
          </p>
        </div>

        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station or genre..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-surface-container-low border border-border-subtle rounded-xl text-xs text-on-surface focus:outline-none focus:border-secondary transition-colors"
            />
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Channels' },
              { id: 'lofi', label: 'Lo-Fi Chill' },
              { id: 'synth', label: 'Synthwave & Cyber' },
              { id: 'ambient', label: 'Ambient & Space' },
              { id: 'world', label: 'World & Lounge' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-secondary text-on-secondary border-secondary font-semibold shadow-glow-secondary'
                    : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-secondary/40 hover:text-on-surface'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <button
              onClick={() => fetchStations(searchQuery)}
              title="Refresh channels"
              className="p-2 rounded-xl bg-surface-container-low border border-border-subtle text-on-surface-variant hover:text-on-surface hover:border-secondary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-secondary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-72 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Headphones className="w-12 h-12 text-secondary/40 animate-pulse" />
          <h3 className="text-base font-semibold text-on-surface">No audio stations found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Try resetting your search query or exploring different genre tags.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStations.map((station) => {
            const isCurrent = currentTrack?.id === station.provider_media_id;
            const isCurrentlyPlaying = isCurrent && isPlaying;
            const isResolving = resolvingId === station.provider_media_id;

            return (
              <div
                key={station.provider_media_id}
                className={`group relative rounded-2xl overflow-hidden bg-surface-container-low border transition-all duration-300 card-hover-lift flex flex-col shadow-lg ${
                  isCurrent
                    ? 'border-secondary shadow-glow-secondary bg-surface-container-high'
                    : 'border-border-subtle hover:border-secondary/50'
                }`}
              >
                {/* Station Artwork Header */}
                <div className="aspect-[16/10] relative overflow-hidden bg-surface-container-lowest">
                  <img
                    src={
                      station.poster_url ||
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'
                    }
                    alt={station.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-black/40" />

                  {/* Live Status Badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[10px] font-mono text-secondary font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span>BROADCAST LIVE</span>
                  </div>

                  {/* Bitrate Badge */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-border-subtle text-[10px] font-mono text-on-surface-variant font-medium">
                    128K MP3
                  </div>

                  {/* Floating Action / Play Button */}
                  <button
                    onClick={() => handlePlayStation(station)}
                    disabled={isResolving}
                    className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                    aria-label={isCurrentlyPlaying ? 'Pause Station' : 'Play Station'}
                  >
                    {isResolving ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : isCurrentlyPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Station Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-display font-semibold text-on-surface truncate group-hover:text-secondary transition-colors">
                      {station.title}
                    </h3>
                    {station.original_title && (
                      <p className="text-xs font-mono text-secondary mt-0.5 truncate">
                        {station.original_title}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
                      {station.overview}
                    </p>
                  </div>

                  {/* Play Action Footer */}
                  <button
                    onClick={() => handlePlayStation(station)}
                    disabled={isResolving}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all border ${
                      isCurrentlyPlaying
                        ? 'bg-secondary text-on-secondary border-secondary font-semibold shadow-glow-secondary'
                        : 'bg-surface-container-high text-on-surface hover:bg-secondary hover:text-on-secondary border-border-subtle hover:border-secondary'
                    }`}
                  >
                    {isCurrentlyPlaying ? (
                      <>
                        <Volume2 className="w-4 h-4 animate-pulse" />
                        <span>Now Playing in Background</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Listen Station</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
