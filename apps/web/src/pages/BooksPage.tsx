import React, { useState, useEffect } from 'react';
import { BookOpen, Star, User, BookMarked, AlertCircle, FileText, Search, RefreshCw, Feather } from 'lucide-react';
import {
  searchMedia,
  fetchBookContent,
  MediaItem,
  BookContent,
} from '../services/api';
import { BookReader } from '../components/reader/BookReader';

export const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchMedia(query, 'book');
      setBooks(results || []);
    } catch (err: any) {
      console.error('Failed to fetch books catalog:', err);
      setError(err?.message || 'Unable to connect to literature archive.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(searchQuery);
  };

  const handleOpenReader = async (item: MediaItem) => {
    setError(null);
    try {
      const content = await fetchBookContent(item.provider_media_id);
      setActiveBook(content);
    } catch (err: any) {
      console.error('Failed to load book chapters:', err);
      setError('Unable to load readable chapters for this title.');
    }
  };

  const filteredBooks = books.filter((b) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'webnovels') return b.provider_id === 'webnovel_provider';
    if (selectedFilter === 'classics') return b.provider_id === 'openlibrary_provider';
    if (selectedFilter === 'top_rated') return (b.rating || 0) >= 9.0;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/25 text-tertiary text-xs font-mono tracking-wider uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>DaoStream Literature Vault • Web Novels & Published Works</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Books & Web Novels
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Read world-renowned Web Novels (Cultivation, Xianxia, LitRPG, Progression Fantasy) and published library classics with chapter navigation and customizable themes.
          </p>
        </div>

        {/* Search Bar & Filter Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search novel or book title..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-surface-container-low border border-border-subtle rounded-xl text-xs text-on-surface focus:outline-none focus:border-tertiary transition-colors"
            />
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Works' },
              { id: 'webnovels', label: 'Web Novels (Cultivation)' },
              { id: 'classics', label: 'Open Library Books' },
              { id: 'top_rated', label: 'Top Rated (9.0+)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedFilter === f.id
                    ? 'bg-tertiary text-surface border-tertiary font-semibold shadow-glow-tertiary'
                    : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:border-tertiary/40 hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => fetchBooks(searchQuery)}
              title="Refresh catalog"
              className="p-2 rounded-xl bg-surface-container-low border border-border-subtle text-on-surface-variant hover:text-on-surface hover:border-tertiary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-tertiary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div key={n} className="aspect-[1/1.5] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Feather className="w-12 h-12 text-tertiary/40 animate-pulse" />
          <h3 className="text-base font-semibold text-on-surface">No books found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Try searching for titles like "Shadow Slave", "Lord of the Mysteries", "Coiling Dragon", or "Solo Leveling".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredBooks.map((book) => {
            const isWebNovel = book.provider_id === 'webnovel_provider';
            return (
              <div
                key={book.provider_media_id}
                onClick={() => handleOpenReader(book)}
                className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-tertiary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg cursor-pointer"
              >
                {/* Cover Container (1:1.5) with Spine Shadow */}
                <div className="aspect-[1/1.5] relative overflow-hidden bg-surface-container-lowest">
                  <img
                    src={
                      book.poster_url ||
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
                    }
                    alt={book.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Left Spine Overlay for Book Look */}
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

                  {/* Rating Badge */}
                  {book.rating && (
                    <div className="absolute top-2.5 left-3.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                      <Star className="w-3 h-3 fill-secondary text-secondary" />
                      <span>{Number(book.rating).toFixed(1)}</span>
                    </div>
                  )}

                  {/* Format Pill */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-tertiary/30 text-[10px] font-mono text-tertiary font-bold flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5" />
                    <span>{isWebNovel ? 'WEB NOVEL' : 'BOOK'}</span>
                  </div>

                  {/* Hover Read Overlay */}
                  <div className="absolute inset-0 bg-surface-dim/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                    <div className="w-12 h-12 rounded-full bg-tertiary text-surface flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5 fill-surface ml-0.5" />
                    </div>
                    <span className="text-[11px] font-mono text-tertiary font-medium tracking-wide">
                      READ CHAPTERS
                    </span>
                  </div>
                </div>

                {/* Book Metadata */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-tertiary transition-colors">
                      {book.title}
                    </h3>
                    {book.original_title && (
                      <p className="text-[10px] font-mono text-on-surface-variant truncate">
                        {book.original_title}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5">
                      <User className="w-3 h-3 flex-shrink-0 text-primary" />
                      <span className="truncate">
                        {book.overview?.split('.')[0] || (isWebNovel ? 'Cultivation Series' : 'Archive')}
                      </span>
                    </div>
                  </div>

                  <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-tertiary text-on-surface-variant group-hover:text-surface text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-tertiary">
                    <BookMarked className="w-3 h-3" />
                    <span>{isWebNovel ? 'Read Novel' : 'Open Reader'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Book Reader */}
      {activeBook && (
        <BookReader
          book={activeBook}
          onClose={() => setActiveBook(null)}
        />
      )}
    </div>
  );
};
