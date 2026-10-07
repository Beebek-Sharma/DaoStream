import React, { useState, useEffect } from 'react';
import { BookOpen, Star, User, BookMarked, AlertCircle, FileText } from 'lucide-react';
import {
  searchMedia,
  fetchBookContent,
  MediaItem,
  BookContent,
} from '../services/api';
import { BookReader } from '../components/reader/BookReader';

const BOOK_FIXTURES: MediaItem[] = [
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-b-1',
    title: 'The Quantum Cartographer',
    media_type: 'book',
    year: 2023,
    overview: 'A profound journey through multidimensional topologies and forgotten cryptographic coordinates.',
    poster_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    rating: 9.4,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-b-2',
    title: 'Neuromancer: Reconstructed',
    media_type: 'book',
    year: 2024,
    overview: 'A cyberpunk masterpiece chronicling the cyberspace matrix, Turing registries, and digital heists.',
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    rating: 9.6,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-b-3',
    title: 'Principles of Autonomous Architecture',
    media_type: 'book',
    year: 2024,
    overview: 'Engineering resilient decentralized media nodes, localized caching topologies, and edge routing.',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    rating: 9.1,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-b-4',
    title: 'Echoes of the Obsidian Throne',
    media_type: 'book',
    year: 2022,
    overview: 'Epic dark fantasy unfolding across ancient forgotten catacombs and volcanic crystal keeps.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    rating: 8.9,
  },
  {
    provider_id: 'mock_media_provider',
    provider_media_id: 'mock-b-5',
    title: 'Cosmic Horizons & Singularity',
    media_type: 'book',
    year: 2023,
    overview: 'Theoretical physics explorations examining black hole horizons and synthetic consciousness emergence.',
    poster_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&q=80',
    rating: 9.2,
  },
];

export const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const results = await searchMedia('', 'book');
        if (results && results.length > 0) {
          const combined = [...results];
          for (const item of BOOK_FIXTURES) {
            if (!combined.some(c => c.provider_media_id === item.provider_media_id)) {
              combined.push(item);
            }
          }
          setBooks(combined);
        } else {
          setBooks(BOOK_FIXTURES);
        }
      } catch (err) {
        console.warn('Fallback book fixtures:', err);
        setBooks(BOOK_FIXTURES);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleOpenReader = async (item: MediaItem) => {
    setError(null);
    try {
      const content = await fetchBookContent(item.provider_media_id);
      setActiveBook(content);
    } catch (err) {
      console.warn('Fallback book content:', err);
      setActiveBook({
        provider_id: item.provider_id,
        book_id: item.provider_media_id,
        title: item.title,
        author: 'Dr. Eleanor Vance',
        total_chapters: 4,
        chapters: [
          {
            chapter_index: 1,
            title: 'Chapter 1: The Threshold of Coordinates',
            word_count: 540,
          },
          {
            chapter_index: 2,
            title: 'Chapter 2: Eigenvalues of the Void',
            word_count: 620,
          },
          {
            chapter_index: 3,
            title: 'Chapter 3: Resonant Topologies',
            word_count: 580,
          },
          {
            chapter_index: 4,
            title: 'Chapter 4: The Singularity Convergence',
            word_count: 710,
          },
        ],
      });
    }
  };

  const filteredBooks = books.filter(b => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'top_rated') return (b.rating || 0) >= 9.2;
    if (selectedFilter === 'recent') return (b.year || 0) >= 2024;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/25 text-tertiary text-xs font-mono tracking-wider uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Literature Vault • Editorial Typography Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Digital Literature & Novels
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Immerse yourself in clean editorial typography, chapter bookmarking, custom colorways (Obsidian, Sepia, OLED), and EPUB readers.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Literature' },
            { id: 'top_rated', label: 'Top Rated (9.2+)' },
            { id: 'recent', label: 'New Releases (2024)' },
          ].map(f => (
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
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Book Grid (1:1.5 Aspect Ratio) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="aspect-[1/1.5] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredBooks.map(book => (
            <div
              key={book.provider_media_id}
              onClick={() => handleOpenReader(book)}
              className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-tertiary/50 transition-all duration-300 card-hover-lift flex flex-col shadow-lg cursor-pointer"
            >
              {/* Cover Container (1:1.5) with Spine Shadow */}
              <div className="aspect-[1/1.5] relative overflow-hidden bg-surface-container-lowest">
                <img
                  src={book.poster_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Subtle Left Spine Overlay for Book Look */}
                <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

                {/* Rating Badge */}
                {book.rating && (
                  <div className="absolute top-2.5 left-3.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-secondary/30 text-[11px] font-mono font-semibold text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span>{book.rating}</span>
                  </div>
                )}

                {/* Format Pill */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-surface-container-highest/85 backdrop-blur-md border border-tertiary/30 text-[10px] font-mono text-tertiary font-bold flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5" />
                  <span>EPUB</span>
                </div>

                {/* Hover Read Overlay */}
                <div className="absolute inset-0 bg-surface-dim/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-tertiary text-surface flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 fill-surface ml-0.5" />
                  </div>
                  <span className="text-[11px] font-mono text-tertiary font-medium tracking-wide">
                    OPEN READER HUD
                  </span>
                </div>
              </div>

              {/* Book Metadata */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-display font-semibold text-on-surface truncate group-hover:text-tertiary transition-colors">
                    {book.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5">
                    <User className="w-3 h-3 flex-shrink-0 text-primary" />
                    <span className="truncate">{book.overview?.split('.')[0] || 'Dr. Vance'}</span>
                  </div>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-xl bg-surface-container-high group-hover:bg-tertiary text-on-surface-variant group-hover:text-surface text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-border-subtle group-hover:border-tertiary">
                  <BookMarked className="w-3 h-3" />
                  <span>Read Book</span>
                </div>
              </div>
            </div>
          ))}
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

