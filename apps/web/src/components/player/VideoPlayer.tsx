import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  SkipForward,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { ResolvedPlayback, updateWatchProgress } from '../../services/api';

interface VideoPlayerProps {
  playbackData?: ResolvedPlayback;
  playback?: ResolvedPlayback;
  title: string;
  episodeTitle?: string;
  mediaId?: string;
  onClose: () => void;
  onNextEpisode?: () => void;
  initialTime?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playbackData,
  playback,
  title,
  episodeTitle,
  mediaId,
  onClose,
  onNextEpisode,
  initialTime = 0,
}) => {
  const activePlaybackData = playbackData || playback;
  if (!activePlaybackData) return null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => {
    return activePlaybackData.primary_source?.id || activePlaybackData.sources[0]?.id || '';
  });
  const [selectedQuality, setSelectedQuality] = useState<string>(
    activePlaybackData.primary_source?.quality || '1080p'
  );
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active video source
  const activeSource =
    activePlaybackData.sources.find(s => s.id === selectedSourceId) ||
    activePlaybackData.sources.find(s => s.quality === selectedQuality) ||
    activePlaybackData.primary_source ||
    activePlaybackData.sources[0];

  const isEmbed = Boolean(
    activeSource &&
    (activeSource.format === 'embed' ||
      activeSource.url.includes('embed') ||
      activeSource.url.includes('youtube.com') ||
      activeSource.url.includes('vidsrc') ||
      activeSource.url.includes('autoembed'))
  );

  // Auto-hide controls timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
        setShowSubtitlesMenu(false);
      }
    }, 3500);
  }, [isPlaying]);

  // Initial seek & setup
  useEffect(() => {
    if (isEmbed) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setIsLoading(false);
      return;
    }

    if (initialTime > 0) {
      video.currentTime = initialTime;
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      // Auto fallback to another available source if any
      const nextSource = activePlaybackData.sources.find(s => s.id !== activeSource?.id);
      if (nextSource) {
        console.warn(`Source ${activeSource?.id} failed, falling back to ${nextSource.id}`);
        setSelectedSourceId(nextSource.id);
        setError(null);
      } else {
        setError('Media stream could not be loaded or source is unavailable.');
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [initialTime, activeSource, isEmbed]);

  const targetMediaId = mediaId || activePlaybackData.media_id;

  // Periodic watch progress sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        const completed = currentTime / duration > 0.92;
        updateWatchProgress(
          targetMediaId,
          currentTime,
          duration,
          completed,
          activePlaybackData.episode_number?.toString()
        ).catch(() => {});
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentTime, duration, targetMediaId, activePlaybackData]);


  // Play / Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case 'escape':
          if (!isFullscreen) {
            onClose();
          }
          break;
      }
      resetControlsTimeout();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isFullscreen, onClose, resetControlsTimeout]);

  const seekDelta = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
  };

  const changeVolume = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettingsMenu(false);
  };

  const handleQualityChange = (q: string) => {
    const video = videoRef.current;
    const prevTime = video ? video.currentTime : currentTime;
    const wasPlaying = isPlaying;

    setSelectedQuality(q);
    setShowSettingsMenu(false);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = prevTime;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    }, 100);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element or Embed Stream */}
      {activeSource ? (
        isEmbed ? (
          <iframe
            key={activeSource.url}
            src={activeSource.url}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={activeSource.url}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            playsInline
          />
        )
      ) : (
        <div className="flex flex-col items-center text-gray-400 gap-2">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p>No playable source available</p>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Error Overlay with Multi-Source Recovery */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white gap-4 p-6 text-center z-40 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-display">Stream Notice</h3>
            <p className="text-xs text-gray-300 max-w-md">
              {error}
            </p>
          </div>

          {/* Alternative Source Switcher */}
          {activePlaybackData.sources.length > 1 && (
            <div className="flex flex-col items-center gap-2 mt-2 w-full max-w-md">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                Select an alternative stream to continue:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {activePlaybackData.sources.map(src => (
                  <button
                    key={src.id}
                    onClick={() => {
                      setSelectedSourceId(src.id);
                      setError(null);
                      setIsLoading(true);
                    }}
                    className={`py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border ${
                      src.id === activeSource?.id
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-white/5 border-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    <span className="truncate mr-2">{src.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 flex-shrink-0">
                      {src.format === 'embed' ? 'Cloud' : src.quality}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
              }}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-xs font-bold transition-all shadow-glow-primary"
            >
              Retry Current Stream
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-all"
            >
              Close Player
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header Bar */}
        <div className="p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex flex-wrap items-center justify-between gap-4 pointer-events-auto z-20">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-primary text-[10px] font-mono uppercase tracking-wider font-bold">
                {isEmbed ? 'Cloud Stream' : 'Direct Play'}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md md:max-w-xl">
                {title}
              </h1>
            </div>
            {episodeTitle && <p className="text-xs text-indigo-300 font-medium">{episodeTitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {/* Stream Server Switcher Pills */}
            {activePlaybackData.sources.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
                {activePlaybackData.sources.map((src, idx) => (
                  <button
                    key={src.id}
                    onClick={() => {
                      setSelectedSourceId(src.id);
                      setError(null);
                      setIsLoading(true);
                    }}
                    title={src.title}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      src.id === activeSource?.id
                        ? 'bg-primary text-white font-bold shadow-glow-primary'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {src.title.includes('Trailer') ? '🎬 Trailer' : `Server ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Open in New Window if embed */}
            {isEmbed && activeSource && (
              <a
                href={activeSource.url}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Open stream in dedicated tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Close player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Click Indicator / Play Button */}
        <div className="flex-1 flex items-center justify-center">
          {!isPlaying && !isLoading && !error && !isEmbed && (
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-primary/90 hover:bg-primary text-white flex items-center justify-center pointer-events-auto shadow-2xl shadow-primary/50 transform hover:scale-105 transition-all"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          )}
        </div>

        {/* Bottom Control Bar */}
        {!isEmbed && (
          <div className="p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-3 pointer-events-auto">
          {/* Progress Seek Bar */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-gray-300">{formatTime(currentTime)}</span>
            <div className="relative flex-1 group flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-2 transition-all"
              />
            </div>
            <span className="text-[11px] font-mono text-gray-400">{formatTime(duration)}</span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-indigo-400 p-1.5 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={() => seekDelta(-10)}
                className="text-gray-300 hover:text-white p-1.5 transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekDelta(10)}
                className="text-gray-300 hover:text-white p-1.5 transition-colors"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="text-gray-300 hover:text-white p-1.5 transition-colors flex items-center gap-1 text-xs"
                  title="Next Episode"
                >
                  <SkipForward className="w-4 h-4" />
                  <span className="hidden sm:inline">Next</span>
                </button>
              )}

              {/* Volume Slider */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="text-gray-300 hover:text-white p-1.5 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={e => changeVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 relative">
              {/* Subtitles Button */}
              {activePlaybackData.subtitles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSubtitlesMenu(!showSubtitlesMenu);
                      setShowSettingsMenu(false);
                    }}
                    className={`p-1.5 transition-colors ${
                      selectedSubtitle !== 'off' ? 'text-primary' : 'text-gray-300 hover:text-white'
                    }`}
                    title="Subtitles"
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>

                  {showSubtitlesMenu && (
                    <div className="absolute right-0 bottom-10 bg-surface/95 border border-white/10 rounded-xl p-2 min-w-32 shadow-2xl backdrop-blur-md space-y-1 text-xs">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Subtitles
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSubtitle('off');
                          setShowSubtitlesMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg ${
                          selectedSubtitle === 'off' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        Off
                      </button>
                      {activePlaybackData.subtitles.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubtitle(sub.id);
                            setShowSubtitlesMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg ${
                            selectedSubtitle === sub.id ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings (Speed & Quality) Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettingsMenu(!showSettingsMenu);
                    setShowSubtitlesMenu(false);
                  }}
                  className="text-gray-300 hover:text-white p-1.5 transition-colors"
                  title="Playback Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 bottom-10 bg-surface/95 border border-white/10 rounded-xl p-3 min-w-44 shadow-2xl backdrop-blur-md space-y-3 text-xs">
                    {/* Quality */}
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Quality
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activePlaybackData.available_qualities.map(q => (
                          <button
                            key={q}
                            onClick={() => handleQualityChange(q)}
                            className={`px-2 py-1 rounded-md text-[11px] ${
                              selectedQuality === q
                                ? 'bg-primary text-white font-medium'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>


                    {/* Speed */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Speed
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`px-2 py-1 rounded-md text-[11px] ${
                              playbackSpeed === speed
                                ? 'bg-primary text-white font-medium'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="text-gray-300 hover:text-white p-1.5 transition-colors"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
