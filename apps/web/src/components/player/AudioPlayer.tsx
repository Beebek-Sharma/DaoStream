import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Loader2,
  Music,
} from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

export const AudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    togglePlay,
    stop,
    setVolume,
    toggleMute,
  } = useAudio();

  if (!currentTrack) return null;

  return (
    <div
      className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-40 animate-slide-up"
      role="region"
      aria-label="Persistent Audio Player"
    >
      <div className="bg-surface-container-high/95 backdrop-blur-2xl border border-secondary/30 rounded-2xl shadow-2xl p-3.5 flex items-center justify-between gap-3 text-on-surface">
        {/* Artwork and Pulsing Graphic */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-container-lowest flex-shrink-0 border border-border-subtle shadow-md">
          {currentTrack.poster_url ? (
            <img
              src={currentTrack.poster_url}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-110' : 'scale-100'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-secondary">
              <Music className="w-5 h-5" />
            </div>
          )}

          {/* Equalizer Bars Overlay when playing */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-end justify-center gap-0.5 pb-1">
              <span className="w-1 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
              <span className="w-1 bg-secondary rounded-full animate-bounce [animation-delay:-0.1s] h-5" />
              <span className="w-1 bg-secondary rounded-full animate-bounce [animation-delay:-0.4s] h-2" />
              <span className="w-1 bg-secondary rounded-full animate-bounce [animation-delay:-0.2s] h-4" />
            </div>
          )}
        </div>

        {/* Track Title, Artist, and Live Pill */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary/15 text-secondary text-[9px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              LIVE
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant truncate">
              {currentTrack.bitrate || '128 kbps'}
            </span>
          </div>

          <h4 className="text-xs font-semibold text-on-surface truncate mt-0.5" title={currentTrack.title}>
            {currentTrack.title}
          </h4>
          <p className="text-[10px] text-on-surface-variant truncate">
            {currentTrack.artist || currentTrack.genre || 'DaoStream Audio'}
          </p>
        </div>

        {/* Controls: Play/Pause, Volume, Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-glow-secondary disabled:opacity-50"
            aria-label={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-on-secondary" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-secondary" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-secondary bg-surface-container rounded-lg cursor-pointer"
              aria-label="Volume Slider"
            />
          </div>

          {/* Dismiss Player */}
          <button
            onClick={stop}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-400 hover:bg-surface-container transition-colors"
            aria-label="Close Player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
