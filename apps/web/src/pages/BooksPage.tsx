import React, { useState, useEffect } from 'react';
import { BookOpen, Star, User, BookMarked, AlertCircle } from 'lucide-react';
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
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const results = await searchMedia('', 'book');
        if (results && results.length > 0) {
          setBooks(results);
        } else {
          setBooks([
            {
              provider_id: 'mock_media_provider',
              provider_media_id: 'mock-b-1',
              title: 'The Quantum Cartographer',
              media_type: 'book',
              year: 2021,
              overview: 'A profound journey through multidimensional topologies and forgotten algorithms.',
              poster_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
              rating: 9.3,
            },
          ]);
        }
      } catch (err) {
        console.warn('Fallback book fixtures:', err);
        setBooks([
          {
            provider_id: 'mock_media_provider',
            provider_media_id: 'mock-b-1',
            title: 'The Quantum Cartographer',
            media_type: 'book',
            year: 2021,
            overview: 'A profound journey through multidimensional topologies and forgotten algorithms.',
            poster_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
            rating: 9.3,
          },
        ]);
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
        total_chapters: 2,
        chapters: [
          {
            chapter_index: 1,
            title: 'Chapter 1: The Threshold of Coordinates',
            word_count: 450,
          },
          {
            chapter_index: 2,
            title: 'Chapter 2: Eigenvalues of the Void',
            word_count: 520,
          },
        ],
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Books & Novels</h1>
            <p className="text-xs text-gray-400">Digital literature, EPUB reader, and progress bookmarks</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {books.map(book => (
            <div
              key={book.provider_media_id}
              onClick={() => handleOpenReader(book)}
              className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-cinematic hover:translate-y-[-2px] flex flex-col cursor-pointer"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-background-elevated">
                <img
                  src={book.poster_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <BookMarked className="w-5 h-5 fill-white" />
                  </div>
                </div>

                {book.rating && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{book.rating}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {book.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                    <User className="w-3 h-3" />
                    <span className="truncate">{book.overview?.replace('By ', '') || 'Author'}</span>
                  </div>
                </div>

                <div className="mt-2 text-center py-1.5 px-2 rounded-lg bg-white/5 group-hover:bg-emerald-500 text-[11px] font-medium text-gray-300 group-hover:text-white transition-colors">
                  Read Book
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
