import React, { useState } from 'react';
import {
  X,
  Play,
  Star,
  Layers,
  HardDrive,
} from 'lucide-react';
import { MediaDetails } from '../../services/api';

interface SeriesDetailModalProps {
  details?: MediaDetails;
  series?: MediaDetails;
  onClose: () => void;
  onPlayEpisode: (episodeNumber: number, seasonNumber: number, epTitle: string) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  details,
  series,
  onClose,
  onPlayEpisode,
}) => {
  const activeMedia = details || series;
  if (!activeMedia) return null;

  const seasons = activeMedia.seasons && activeMedia.seasons.length > 0
    ? activeMedia.seasons
    : [
        {
          season_number: 1,
          title: 'Season 1',
          episodes: Array.from({ length: 8 }, (_, i) => ({
            id: `${activeMedia.provider_media_id}-s1-e${i + 1}`,
            episode_number: i + 1,
            title: `Episode ${i + 1}`,
            overview: `Episode ${i + 1} of ${activeMedia.title}`,
            duration_minutes: 45,
          })),
        },
      ];

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasons[0].season_number
  );

  const currentSeason =
    seasons.find((s) => s.season_number === selectedSeasonNumber) || seasons[0];
  const episodes = currentSeason.episodes || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-5xl bg-surface-container-low border border-border-subtle rounded-2xl overflow-hidden shadow-cinematic my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors border border-border-subtle shadow-md"
          type="button"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Atmospheric Backdrop Hero Header */}
        <div className="relative w-full min-h-[340px] sm:min-h-[400px] overflow-hidden bg-surface-container-lowest shrink-0">
          <img
            src={
              activeMedia.backdrop_url ||
              activeMedia.poster_url ||
              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80'
            }
            alt={activeMedia.title}
            className="w-full h-full object-cover opacity-50 scale-105"
          />

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/85 to-transparent w-full lg:w-3/4" />

          {/* Content Details */}
          <div className="absolute bottom-6 left-6 right-6 sm:left-8 sm:right-8 flex flex-col gap-3">
            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                {activeMedia.rating ? `${activeMedia.rating.toFixed(1)} IMDb` : '9.0 IMDb'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-xs">
                {activeMedia.year || 2024}–Present
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-xs uppercase">
                TV-MA
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-sans text-xs">
                {activeMedia.genres && activeMedia.genres.length > 0
                  ? activeMedia.genres.join(' / ')
                  : 'Drama / Sci-Fi / Mystery'}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-primary font-mono text-xs font-bold tracking-wide">
                4K HDR10+
              </span>
              <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-tertiary font-mono text-xs font-bold tracking-wide">
                5.1 Surround
              </span>
            </div>

            {/* Title & Logline */}
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">
                {activeMedia.title}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-3xl line-clamp-3 leading-relaxed">
                {activeMedia.overview}
              </p>
            </div>

            {/* 2. Source Resolution Inspector Panel */}
            <div className="p-3.5 rounded-xl bg-surface-container/90 backdrop-blur-md border border-border-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-1 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant">
                      Primary Pipeline
                    </span>
                    <span className="font-mono text-xs text-on-surface font-semibold">
                      Local NAS Direct Stream • 24.5 Mbps • HEVC 10-bit
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-6 bg-border-subtle" />

                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant">
                      Fallback Adaptor
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">
                      Authorized Multi-Quality Stream (1080p Auto)
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions inside inspector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() =>
                    onPlayEpisode(
                      episodes[0]?.episode_number || 1,
                      selectedSeasonNumber,
                      episodes[0]?.title || `Episode 1`
                    )
                  }
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-display text-sm font-bold hover:bg-primary-hover transition-all shadow-glow-primary active:scale-95 cursor-pointer"
                  type="button"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play S{selectedSeasonNumber}:E1</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Interactive Content Split Layout: Season Explorer & Technical Specs */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col lg:flex-row gap-8">
          {/* Left Column: Season Explorer & Episodes Rail (2/3 width) */}
          <div className="w-full lg:w-8/12 flex flex-col gap-5">
            {/* Season Tabs Navigation */}
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2 overflow-x-auto">
                {seasons.map((s) => (
                  <button
                    key={s.season_number}
                    onClick={() => setSelectedSeasonNumber(s.season_number)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedSeasonNumber === s.season_number
                        ? 'bg-primary text-on-primary shadow-glow-primary'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-border-subtle'
                    }`}
                    type="button"
                  >
                    {s.title || `Season ${s.season_number}`}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs text-on-surface-variant hidden sm:inline">
                {episodes.length} Episodes Available
              </span>
            </div>

            {/* Episodes List */}
            <div className="flex flex-col gap-3">
              {episodes.map((ep) => (
                <div
                  key={ep.id || ep.episode_number}
                  onClick={() =>
                    onPlayEpisode(
                      ep.episode_number,
                      selectedSeasonNumber,
                      ep.title || `Episode ${ep.episode_number}`
                    )
                  }
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/40 transition-all cursor-pointer card-hover-lift"
                >
                  {/* Thumbnail with overlay */}
                  <div className="relative aspect-video w-full sm:w-36 shrink-0 rounded-lg overflow-hidden bg-surface-container-lowest">
                    <img
                      src={
                        activeMedia.backdrop_url ||
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'
                      }
                      alt={ep.title || `Episode ${ep.episode_number}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-glow-primary">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-on-surface">
                      {ep.duration_minutes || 48}m
                    </span>
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] font-mono font-bold text-primary">
                        S{selectedSeasonNumber}:E{ep.episode_number}
                      </span>
                      <h4 className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {ep.title || `Episode ${ep.episode_number}`}
                      </h4>
                    </div>
                    {ep.overview && (
                      <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {ep.overview}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant/70 pt-1">
                      <span>HEVC 10-bit</span>
                      <span>•</span>
                      <span>5.1 Surround</span>
                      <span>•</span>
                      <span className="text-tertiary">Direct Play Ready</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Technical Specifications & Provider Inspector (1/3 width) */}
          <div className="w-full lg:w-4/12 flex flex-col gap-5">
            {/* Technical Specifications Card */}
            <div className="bg-surface-container p-5 rounded-xl border border-border-subtle flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider">
                  Technical Specs
                </h3>
              </div>

              <div className="flex flex-col gap-2.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Container</span>
                  <span className="text-on-surface font-semibold">MKV (Matroska)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Video Codec</span>
                  <span className="text-on-surface font-semibold">HEVC / H.265 (Main 10)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Resolution</span>
                  <span className="text-primary font-semibold">3840 x 2160 (4K UHD)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Audio Channels</span>
                  <span className="text-on-surface font-semibold">Dolby Atmos (7.1.4)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Bitrate</span>
                  <span className="text-secondary font-semibold">24.5 Mbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Range Protocol</span>
                  <span className="text-tertiary font-semibold">RFC 7233 Byte Stream</span>
                </div>
              </div>
            </div>

            {/* Provider Adapter Metadata Card */}
            <div className="bg-surface-container p-5 rounded-xl border border-border-subtle flex flex-col gap-3 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <HardDrive className="w-4 h-4 text-secondary" />
                <h3 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider">
                  Cluster Origin
                </h3>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Provider Source</span>
                  <span className="text-on-surface font-semibold uppercase">
                    {activeMedia.provider_id === 'local-media' ? 'Local Storage' : 'TMDB Adapter'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Origin ID</span>
                  <span className="text-on-surface font-semibold truncate max-w-[150px]">
                    {activeMedia.provider_media_id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Direct Path</span>
                  <span className="text-on-surface font-semibold truncate max-w-[150px]">
                    /data/media/{activeMedia.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
