import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  Type,
  Check,
  Loader2,
} from 'lucide-react';
import {
  BookContent,
  fetchBookChapter,
  updateReadingProgress,
} from '../../services/api';

interface BookReaderProps {
  book: BookContent;
  onClose: () => void;
  initialChapterIndex?: number;
}

type ReaderTheme = 'dark' | 'sepia' | 'light';
type FontFamily = 'serif' | 'sans' | 'mono';

export const BookReader: React.FC<BookReaderProps> = ({
  book,
  onClose,
  initialChapterIndex = 1,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(initialChapterIndex);
  const [chapterText, setChapterText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showAppearance, setShowAppearance] = useState<boolean>(false);

  // Appearance Preferences
  const [theme, setTheme] = useState<ReaderTheme>('dark');
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [lineHeight, setLineHeight] = useState<'relaxed' | 'loose'>('relaxed');

  const contentRef = useRef<HTMLDivElement>(null);

  // Load Chapter text
  useEffect(() => {
    let isCancelled = false;
    const loadChapter = async () => {
      setLoading(true);
      try {
        const res = await fetchBookChapter(book.book_id, currentChapterIndex);
        if (!isCancelled) {
          setChapterText(res.content);
        }
      } catch (err) {
        if (!isCancelled) {
          setChapterText(
            `# Chapter ${currentChapterIndex}\n\nUnable to fetch chapter text from provider. Please verify provider connectivity.`
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

    // Sync progress
    const pct = (currentChapterIndex / Math.max(1, book.total_chapters)) * 100;
    updateReadingProgress(
      book.book_id,
      currentChapterIndex,
      book.total_chapters,
      pct,
      `Chapter ${currentChapterIndex}`
    ).catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [book.book_id, book.total_chapters, currentChapterIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentChapterIndex < book.total_chapters) {
        setCurrentChapterIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentChapterIndex > 1) {
        setCurrentChapterIndex(prev => prev - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterIndex, book.total_chapters, onClose]);

  // Theme styling classes
  const themeClasses: Record<ReaderTheme, { bg: string; text: string; header: string; card: string }> = {
    dark: {
      bg: 'bg-[#0f1117]',
      text: 'text-[#d6d9e0]',
      header: 'bg-[#141721]/90 border-white/5',
      card: 'bg-[#181b26] border-white/10',
    },
    sepia: {
      bg: 'bg-[#fbf0d9]',
      text: 'text-[#433422]',
      header: 'bg-[#f4e4c1]/90 border-[#e6d0a7]',
      card: 'bg-[#f4e4c1] border-[#dfc699]',
    },
    light: {
      bg: 'bg-[#fcfcfd]',
      text: 'text-[#1e2025]',
      header: 'bg-white/90 border-gray-200 shadow-sm',
      card: 'bg-gray-100 border-gray-300',
    },
  };

  const currentTheme = themeClasses[theme];

  const fontClass =
    fontFamily === 'serif'
      ? 'font-serif'
      : fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const currentChapter =
    book.chapters.find(c => c.chapter_index === currentChapterIndex) ||
    book.chapters[0];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${currentTheme.bg} ${currentTheme.text}`}
    >
      {/* Top Header Controls */}
      <header
        className={`px-6 py-3.5 border-b backdrop-blur-md flex items-center justify-between select-none z-20 ${currentTheme.header}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDrawer(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Table of Contents"
          >
            <List className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xs sm:text-sm font-semibold truncate max-w-xs sm:max-w-md">
              {book.title}
            </h1>
            <p className="text-[11px] opacity-60">
              {currentChapter?.title || `Chapter ${currentChapterIndex}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Appearance Settings Button */}
          <div className="relative">
            <button
              onClick={() => setShowAppearance(!showAppearance)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Appearance Settings"
            >
              <Type className="w-5 h-5" />
            </button>

            {showAppearance && (
              <div
                className={`absolute right-0 top-12 w-64 p-4 rounded-2xl border shadow-2xl space-y-4 text-xs z-30 ${currentTheme.card}`}
              >
                {/* Theme Selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-2 block">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        theme === 'dark'
                          ? 'border-primary ring-1 ring-primary bg-[#0f1117] text-white'
                          : 'bg-[#181b26] text-gray-300 border-white/5'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme('sepia')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        theme === 'sepia'
                          ? 'border-[#a67c52] ring-1 ring-[#a67c52] bg-[#fbf0d9] text-[#433422]'
                          : 'bg-[#f4e4c1] text-[#433422] border-[#e6d0a7]'
                      }`}
                    >
                      Sepia
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        theme === 'light'
                          ? 'border-indigo-600 ring-1 ring-indigo-600 bg-white text-black'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      Light
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider opacity-60 mb-2">
                    <span>Font Size</span>
                    <span>{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                      className="px-3 py-1 rounded bg-black/10 dark:bg-white/10 hover:opacity-80"
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="14"
                      max="28"
                      step="2"
                      value={fontSize}
                      onChange={e => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <button
                      onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                      className="px-3 py-1 rounded bg-black/10 dark:bg-white/10 hover:opacity-80"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Typography Family */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-2 block">
                    Typography
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['serif', 'sans', 'mono'] as FontFamily[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setFontFamily(f)}
                        className={`p-1.5 rounded-lg border capitalize text-[11px] ${
                          fontFamily === f
                            ? 'border-primary font-bold'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-2 block">
                    Line Spacing
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setLineHeight('relaxed')}
                      className={`p-1.5 rounded-lg border text-[11px] ${
                        lineHeight === 'relaxed'
                          ? 'border-primary font-bold bg-primary/10'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      Relaxed
                    </button>
                    <button
                      onClick={() => setLineHeight('loose')}
                      className={`p-1.5 rounded-lg border text-[11px] ${
                        lineHeight === 'loose'
                          ? 'border-primary font-bold bg-primary/10'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      Loose
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Exit Reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Chapter Text Area */}
      <main
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 sm:py-12 flex justify-center"
      >
        <div className="max-w-2xl w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-60">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Loading chapter content...</p>
            </div>
          ) : (
            <article
              className={`${fontClass} whitespace-pre-wrap transition-all`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight === 'relaxed' ? '1.8' : '2.2',
              }}
            >
              {chapterText}
            </article>
          )}

          {/* Chapter Navigation Buttons at bottom */}
          {!loading && (
            <div className="mt-16 pt-8 border-t border-current/10 flex items-center justify-between pb-12">
              <button
                disabled={currentChapterIndex <= 1}
                onClick={() => setCurrentChapterIndex(prev => prev - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-current/10 hover:bg-current/5 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Chapter</span>
              </button>

              <span className="text-[11px] font-mono opacity-50">
                {currentChapterIndex} / {book.total_chapters}
              </span>

              <button
                disabled={currentChapterIndex >= book.total_chapters}
                onClick={() => setCurrentChapterIndex(prev => prev + 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold shadow-glow-primary"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Table of Contents Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div
            className={`w-80 max-w-full h-full p-6 shadow-2xl flex flex-col justify-between animate-fade-in ${currentTheme.card}`}
          >
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-current/10">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Chapters</h3>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg hover:bg-current/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {book.chapters.map(c => (
                  <button
                    key={c.chapter_index}
                    onClick={() => {
                      setCurrentChapterIndex(c.chapter_index);
                      setShowDrawer(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      c.chapter_index === currentChapterIndex
                        ? 'bg-primary text-white font-semibold'
                        : 'hover:bg-current/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="truncate">{c.title}</span>
                    {c.chapter_index === currentChapterIndex && (
                      <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowDrawer(false)} />
        </div>
      )}
    </div>
  );
};
