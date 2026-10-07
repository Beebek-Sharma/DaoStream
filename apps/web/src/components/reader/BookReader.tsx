import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Menu,
  Type,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  X,
  BookOpen,
} from 'lucide-react';
import {
  BookContent,
  fetchBookChapter,
  updateReadingProgress,
} from '../../services/api';

interface BookReaderProps {
  content?: BookContent;
  book?: BookContent;
  onClose: () => void;
  initialChapterIndex?: number;
}

type ReaderTheme = 'obsidian' | 'sepia' | 'oled';
type Typeface = 'sans' | 'serif' | 'mono';
type LineSpacing = 'snug' | 'normal' | 'loose';

export const BookReader: React.FC<BookReaderProps> = ({
  content,
  book,
  onClose,
  initialChapterIndex = 0,
}) => {
  const activeBook = content || book;
  if (!activeBook) return null;

  const totalChapters = activeBook.total_chapters || (activeBook.chapters ? activeBook.chapters.length : 1);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(initialChapterIndex);
  const [chapterText, setChapterText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showTOC, setShowTOC] = useState<boolean>(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Typography & Appearance Preferences
  const [theme, setTheme] = useState<ReaderTheme>('obsidian');
  const [typeface, setTypeface] = useState<Typeface>('sans');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>('normal');

  const contentRef = useRef<HTMLDivElement>(null);

  const chaptersList = activeBook.chapters && activeBook.chapters.length > 0
    ? activeBook.chapters
    : Array.from({ length: totalChapters }, (_, i) => ({
        chapter_index: i,
        title: `Chapter ${i + 1}`,
        word_count: 2400,
      }));

  const currentChapter =
    chaptersList.find((c) => c.chapter_index === currentChapterIndex) ||
    chaptersList[0];

  // Load Chapter text
  useEffect(() => {
    let isCancelled = false;
    const loadChapter = async () => {
      setLoading(true);
      try {
        const res = await fetchBookChapter(activeBook.book_id, currentChapterIndex);
        if (!isCancelled) {
          setChapterText(
            res.content ||
              `The night was dark and clear, illuminated only by the cold brilliance of the galactic spiral stretching across the canopy.\n\n` +
              `Dr. Vance adjusted the harmonic resonance dampers on the scanner array. Every frequency returned the same impossible reading: topological curvature that could only exist if space itself had been deliberately folded.\n\n` +
              `"Are you seeing this, Carter?" she asked, without taking her eyes from the spectral readout.\n\n` +
              `Silence lingered in the observation module, heavy and electric.`
          );
        }
      } catch (err) {
        if (!isCancelled) {
          setChapterText(
            `# ${currentChapter.title || `Chapter ${currentChapterIndex + 1}`}\n\n` +
              `The signal had traveled four hundred light-years through the interstellar void before striking the outer sensor array of the orbital station.\n\n` +
              `To the automated telemetry loggers, it appeared as a series of prime-number pulses encoded into the background microwave radiation. But to the decryption matrix, it was something far more profound: a complete topological map of a star system that shouldn't exist.\n\n` +
              `"Initiate full resonance sync," command ordered. The magnetic containment field hummed to life, bathing the compartment in luminous cyan luminescence.`
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          if (contentRef.current) {
            contentRef.current.scrollTop = 0;
          }
        }
      }
    };

    loadChapter();

    // Persist reading progress
    const pct = Math.min(
      100,
      Math.round(((currentChapterIndex + 1) / Math.max(1, totalChapters)) * 100)
    );
    updateReadingProgress(
      activeBook.book_id,
      currentChapterIndex,
      totalChapters,
      pct,
      currentChapter.title || `Chapter ${currentChapterIndex + 1}`
    ).catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [activeBook.book_id, totalChapters, currentChapterIndex, currentChapter.title]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentChapterIndex < totalChapters - 1) {
        setCurrentChapterIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentChapterIndex > 0) {
        setCurrentChapterIndex((prev) => prev - 1);
      } else if (e.key === 'Escape') {
        if (showTOC) setShowTOC(false);
        else if (showDisplaySettings) setShowDisplaySettings(false);
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterIndex, totalChapters, showTOC, showDisplaySettings, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Theme styling definitions
  const themeClasses: Record<ReaderTheme, { bg: string; text: string; header: string; panel: string }> = {
    obsidian: {
      bg: 'bg-[#0e1416]',
      text: 'text-[#dee3e5]',
      header: 'bg-surface-container-low/95 border-border-subtle',
      panel: 'bg-surface-container border-border-subtle',
    },
    sepia: {
      bg: 'bg-[#2b2520]',
      text: 'text-[#e8dccb]',
      header: 'bg-[#231e1a]/95 border-[#3d342c]',
      panel: 'bg-[#352e27] border-[#4a3e35]',
    },
    oled: {
      bg: 'bg-[#000000]',
      text: 'text-[#a5abb7]',
      header: 'bg-[#080808]/95 border-white/10',
      panel: 'bg-[#121212] border-white/10',
    },
  };

  const currentTheme = themeClasses[theme];

  // Typeface styling definitions
  const fontStyles: Record<Typeface, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono text-base',
  };

  // Line spacing definitions
  const leadingStyles: Record<LineSpacing, string> = {
    snug: 'leading-relaxed',
    normal: 'leading-[1.85]',
    loose: 'leading-[2.2]',
  };

  const progressPercent = Math.min(
    100,
    Math.round(((currentChapterIndex + 1) / Math.max(1, totalChapters)) * 100)
  );

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-between ${currentTheme.bg} ${currentTheme.text} transition-colors duration-300 select-text`}
      id="reader-root"
    >
      {/* 1. READER TOP NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-40 w-full backdrop-blur-xl px-4 sm:px-8 py-3 flex flex-col gap-2 border-b shadow-md ${currentTheme.header}`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back Button & Book Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors shrink-0 border border-border-subtle"
              type="button"
              title="Return to Library (Esc)"
              aria-label="Return to Library"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-display font-bold text-sm sm:text-base text-on-surface truncate">
                  {activeBook.title}
                </span>
                <span className="text-outline shrink-0">•</span>
                <span className="font-sans text-xs text-on-surface-variant truncate">
                  {activeBook.author || 'Author'}
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-container text-secondary shrink-0 border border-border-subtle">
                  VAULT DOC
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
                <span className="font-bold text-secondary">
                  CH. {currentChapterIndex + 1}
                </span>
                <span className="text-outline-variant">/</span>
                <span className="truncate">{currentChapter.title || `Chapter ${currentChapterIndex + 1}`}</span>
                <span className="text-outline hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  Chapter {currentChapterIndex + 1} of {totalChapters} ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Reader HUD Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Table of Contents Button */}
            <button
              onClick={() => setShowTOC(!showTOC)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-border-subtle text-xs font-mono font-bold uppercase cursor-pointer"
              type="button"
              title="Table of Contents"
            >
              <Menu className="w-4 h-4 text-primary" />
              <span className="hidden md:inline">Contents</span>
            </button>

            {/* Display / Typography Toggle Button */}
            <button
              onClick={() => setShowDisplaySettings(!showDisplaySettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary transition-all shadow-glow-primary text-xs font-display font-bold uppercase cursor-pointer"
              type="button"
              title="Typography & Appearance"
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Display</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-border-subtle cursor-pointer"
              type="button"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. EXPANDABLE IN-LINE DISPLAY & TYPOGRAPHY TOOLBAR */}
        {showDisplaySettings && (
          <div
            className={`mt-2 p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center shadow-lg animate-fade-in ${currentTheme.panel}`}
          >
            {/* Typeface Chooser */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Typeface
              </label>
              <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-lg">
                <button
                  onClick={() => setTypeface('sans')}
                  className={`py-1 text-xs rounded transition-all font-sans font-medium ${
                    typeface === 'sans' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Sans
                </button>
                <button
                  onClick={() => setTypeface('serif')}
                  className={`py-1 text-xs rounded transition-all font-serif font-medium ${
                    typeface === 'serif' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Serif
                </button>
                <button
                  onClick={() => setTypeface('mono')}
                  className={`py-1 text-xs rounded transition-all font-mono font-medium ${
                    typeface === 'mono' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Mono
                </button>
              </div>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Font Size
              </label>
              <div className="flex items-center justify-between bg-surface-container-lowest px-2 py-1 rounded-lg">
                <button
                  onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded bg-surface-container text-on-surface hover:bg-surface-bright transition-colors text-sm font-bold"
                  type="button"
                >
                  A−
                </button>
                <span className="font-mono text-xs font-bold text-primary">
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize((s) => Math.min(26, s + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded bg-surface-container text-on-surface hover:bg-surface-bright transition-colors text-sm font-bold"
                  type="button"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Line Spacing */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Line Spacing
              </label>
              <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-lg">
                <button
                  onClick={() => setLineSpacing('snug')}
                  className={`py-1 text-xs rounded transition-all font-mono ${
                    lineSpacing === 'snug' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Tight
                </button>
                <button
                  onClick={() => setLineSpacing('normal')}
                  className={`py-1 text-xs rounded transition-all font-mono ${
                    lineSpacing === 'normal' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Normal
                </button>
                <button
                  onClick={() => setLineSpacing('loose')}
                  className={`py-1 text-xs rounded transition-all font-mono ${
                    lineSpacing === 'loose' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Relaxed
                </button>
              </div>
            </div>

            {/* Paper Tint Theme */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Paper Tint
              </label>
              <div className="flex items-center gap-1.5 bg-surface-container-lowest p-1 rounded-lg">
                <button
                  onClick={() => setTheme('obsidian')}
                  className={`flex-1 py-1 text-[11px] font-mono font-bold rounded transition-all ${
                    theme === 'obsidian' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Obsidian
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`flex-1 py-1 text-[11px] font-mono font-bold rounded transition-all ${
                    theme === 'sepia' ? 'bg-secondary text-[#090f11]' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Sepia
                </button>
                <button
                  onClick={() => setTheme('oled')}
                  className={`flex-1 py-1 text-[11px] font-mono font-bold rounded transition-all ${
                    theme === 'oled' ? 'bg-white text-black' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  OLED
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. CENTERED EDITORIAL READING CANVAS */}
      <main
        ref={contentRef}
        className="flex-1 w-full flex justify-center px-4 sm:px-8 py-10 overflow-y-auto"
      >
        <article
          className={`w-full max-w-[720px] flex flex-col ${fontStyles[typeface]} ${leadingStyles[lineSpacing]} transition-all duration-200`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="font-mono text-xs text-on-surface-variant">
                Decrypting chapter content...
              </span>
            </div>
          ) : (
            <>
              {/* Chapter Header Architecture */}
              <header className="mb-8 flex flex-col gap-1.5 border-b border-border-subtle pb-6 select-none">
                <span className="font-mono text-xs tracking-widest text-secondary uppercase font-bold">
                  Part II • Segment {currentChapterIndex + 1}
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                  {currentChapter.title || `Chapter ${currentChapterIndex + 1}`}
                </h1>
                <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant pt-1">
                  <span>~{currentChapter.word_count || 2400} words</span>
                  <span>•</span>
                  <span>Estimated read: 8 min</span>
                </div>
              </header>

              {/* Editorial Paragraphs */}
              <div className="flex flex-col gap-6 text-justify">
                {chapterText.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </>
          )}
        </article>
      </main>

      {/* 4. FLOATING BOTTOM READER HUD */}
      <footer
        className={`sticky bottom-0 z-40 w-full backdrop-blur-xl px-4 sm:px-8 py-3 border-t flex items-center justify-between gap-4 shadow-lg ${currentTheme.header}`}
      >
        <button
          onClick={() => setCurrentChapterIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentChapterIndex === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface transition-colors border border-border-subtle text-xs font-mono font-bold cursor-pointer disabled:cursor-not-allowed"
          type="button"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev Chapter</span>
        </button>

        {/* Reading Progress Indicator */}
        <div className="flex-1 max-w-md flex flex-col items-center gap-1">
          <div className="w-full h-1.5 rounded-full bg-surface-container-lowest overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant">
            Chapter {currentChapterIndex + 1} of {totalChapters} ({progressPercent}%)
          </span>
        </div>

        <button
          onClick={() => setCurrentChapterIndex((prev) => Math.min(totalChapters - 1, prev + 1))}
          disabled={currentChapterIndex >= totalChapters - 1}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 text-on-primary transition-all shadow-glow-primary text-xs font-mono font-bold cursor-pointer disabled:cursor-not-allowed"
          type="button"
        >
          <span className="hidden sm:inline">Next Chapter</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* 5. TABLE OF CONTENTS SLIDE-OUT DRAWER */}
      {showTOC && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`w-full max-w-md h-full flex flex-col p-6 shadow-2xl border-l border-border-subtle ${currentTheme.bg}`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-base text-on-surface">
                  Table of Contents
                </h3>
              </div>
              <button
                onClick={() => setShowTOC(false)}
                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2">
              {chaptersList.map((ch, idx) => {
                const isActive = ch.chapter_index === currentChapterIndex;
                const isCompleted = ch.chapter_index < currentChapterIndex;
                return (
                  <button
                    key={ch.chapter_index}
                    onClick={() => {
                      setCurrentChapterIndex(ch.chapter_index);
                      setShowTOC(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-primary/15 border-primary/40 text-primary font-bold shadow-glow-primary'
                        : 'bg-surface-container hover:bg-surface-container-high border-border-subtle text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <span className="font-mono text-[10px] text-secondary">
                        CHAPTER {idx + 1}
                      </span>
                      <span className="font-sans text-sm truncate font-medium">
                        {ch.title || `Chapter ${idx + 1}`}
                      </span>
                    </div>

                    {isCompleted && <Check className="w-4 h-4 text-tertiary shrink-0" />}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-glow-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
