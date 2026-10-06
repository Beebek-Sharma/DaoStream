import React, { useState } from 'react';
import { X, Play, Star } from 'lucide-react';
import { MediaDetails } from '../../services/api';

interface SeriesDetailModalProps {
  series: MediaDetails;
  onClose: () => void;
  onPlayEpisode: (seasonNumber: number, episodeNumber: number, epTitle: string) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  series,
  onClose,
  onPlayEpisode,
}) => {
  const seasons = series.seasons || [];
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasons.length > 0 ? seasons[0].season_number : 1
  );

  const currentSeason = seasons.find(s => s.season_number === selectedSeasonNumber) || seasons[0];
  const episodes = currentSeason?.episodes || [];

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-background-elevated border border-white/10 rounded-3xl overflow-hidden shadow-cinematic my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop & Header Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-background">
          <img
            src={series.backdrop_url || series.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80'}
            alt={series.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-elevated via-background-elevated/60 to-transparent" />

          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
            <div className="w-20 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 hidden sm:block">
              <img
                src={series.poster_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80'}
                alt={series.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/20 text-indigo-300 text-[10px] font-mono uppercase font-semibold border border-primary/30">
                  {series.media_type}
                </span>
                {series.rating && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{series.rating}</span>
                  </span>
                )}
                {series.status && (
                  <span className="text-[11px] text-gray-400">• {series.status}</span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{series.title}</h2>
              {series.overview && (
                <p className="text-xs text-gray-300 line-clamp-2 max-w-2xl leading-relaxed">
                  {series.overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body: Season Tabs & Episodes List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Season Selector Tabs */}
          {seasons.length > 0 && (
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 overflow-x-auto">
              {seasons.map(s => (
                <button
                  key={s.season_number}
                  onClick={() => setSelectedSeasonNumber(s.season_number)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSeasonNumber === s.season_number
                      ? 'bg-primary text-white shadow-glow-primary'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {s.title || `Season ${s.season_number}`}
                </button>
              ))}
            </div>
          )}

          {/* Episodes List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Episodes ({episodes.length})
            </h3>

            {episodes.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 border border-white/5 rounded-2xl bg-white/5">
                No episodes cataloged for this season yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {episodes.map(ep => (
                  <div
                    key={ep.id}
                    onClick={() =>
                      onPlayEpisode(
                        selectedSeasonNumber,
                        ep.episode_number,
                        ep.title || `Episode ${ep.episode_number}`
                      )
                    }
                    className="group rounded-2xl glass-card p-3.5 border border-white/5 hover:border-primary/40 cursor-pointer transition-all hover:bg-white/[0.07] flex items-center gap-3.5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-md">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-indigo-400 font-medium">
                          EP {ep.episode_number}
                        </span>
                        {ep.duration_minutes && (
                          <span className="text-[10px] text-gray-500">
                            • {ep.duration_minutes}m
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {ep.title || `Episode ${ep.episode_number}`}
                      </h4>
                      {ep.overview && (
                        <p className="text-[11px] text-gray-400 line-clamp-1">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
