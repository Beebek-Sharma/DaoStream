import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Heart,
  Clock,
  FolderHeart,
  Plus,
  Play,
  BookOpen,
  Trash2,
  BookMarked,
  Layers,
  X,
} from 'lucide-react';
import {
  fetchWatchlist,
  removeFromWatchlist,
  fetchFavorites,
  removeFromFavorites,
  fetchWatchProgress,
  fetchReadingProgress,
  fetchCollections,
  createCollection,
  deleteCollection,
  resolvePlayback,
  fetchBookContent,
  ResolvedPlayback,
  BookContent,
} from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { BookReader } from '../components/reader/BookReader';

type LibraryTab = 'watchlist' | 'favorites' | 'history' | 'reading' | 'collections';

export const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('watchlist');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  // Collection Creation Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [newCollectionDesc, setNewCollectionDesc] = useState<string>('');

  // Active Players
  const [activeVideo, setActiveVideo] = useState<{
    data: ResolvedPlayback;
    title: string;
  } | null>(null);
  const [activeBook, setActiveBook] = useState<BookContent | null>(null);

  const loadData = async () => {
    try {
      const [w, f, wh, rh, col] = await Promise.allSettled([
        fetchWatchlist(),
        fetchFavorites(),
        fetchWatchProgress(),
        fetchReadingProgress(),
        fetchCollections(),
      ]);

      if (w.status === 'fulfilled') setWatchlist(w.value);
      if (f.status === 'fulfilled') setFavorites(f.value);
      if (wh.status === 'fulfilled') setWatchHistory(wh.value);
      if (rh.status === 'fulfilled') setReadingHistory(rh.value);
      if (col.status === 'fulfilled') setCollections(col.value);
    } catch (err) {
      console.warn('Error loading library data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveWatchlist = async (mediaId: string) => {
    try {
      await removeFromWatchlist(mediaId);
      setWatchlist(prev => prev.filter(item => item.media_id !== mediaId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFavorite = async (mediaId: string) => {
    try {
      await removeFromFavorites(mediaId);
      setFavorites(prev => prev.filter(item => item.media_id !== mediaId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await createCollection(newCollectionName.trim(), newCollectionDesc.trim());
      setNewCollectionName('');
      setNewCollectionDesc('');
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollection = async (colId: string) => {
    try {
      await deleteCollection(colId);
      setCollections(prev => prev.filter(c => c.id !== colId));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayMedia = async (mediaId: string, title: string, mediaType = 'movie') => {
    try {
      const playback = await resolvePlayback(mediaId, mediaType);
      setActiveVideo({ data: playback, title });
    } catch (err) {
      console.warn('Fallback play:', err);
    }
  };

  const handleReadBook = async (bookId: string) => {
    try {
      const content = await fetchBookContent(bookId);
      setActiveBook(content);
    } catch (err) {
      console.warn('Fallback read:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Personal Library</h1>
            <p className="text-xs text-gray-400">Saved media, custom collections, and consumption history</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-background-card border border-white/5 overflow-x-auto">
          {[
            { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'history', label: 'Watch History', icon: Clock },
            { id: 'reading', label: 'Reading', icon: BookOpen },
            { id: 'collections', label: 'Collections', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LibraryTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          {watchlist.length === 0 ? (
            <div className="rounded-2xl glass-card p-12 text-center max-w-md mx-auto space-y-3">
              <Bookmark className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Your Watchlist is Empty</h3>
              <p className="text-xs text-gray-400">
                Bookmark movies and television series to keep track of titles you intend to stream.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map(item => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 p-3 flex flex-col justify-between"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-background-elevated relative mb-2">
                    <img
                      src={item.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveWatchlist(item.media_id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-500 text-white transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                  <button
                    onClick={() => handlePlayMedia(item.media_id, item.title, item.type)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-primary text-white text-[11px] font-medium flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Watch</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="rounded-2xl glass-card p-12 text-center max-w-md mx-auto space-y-3">
              <Heart className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Favorites Yet</h3>
              <p className="text-xs text-gray-400">
                Star your favorite movies, anime, and novels for quick access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favorites.map(item => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden glass-card border border-white/5 p-3 flex flex-col justify-between"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-background-elevated relative mb-2">
                    <img
                      src={item.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveFavorite(item.media_id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-500 text-white transition-colors"
                      title="Remove from Favorites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                  <button
                    onClick={() => handlePlayMedia(item.media_id, item.title, item.type)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-primary text-white text-[11px] font-medium flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Watch</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Watch History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {watchHistory.length === 0 ? (
            <div className="rounded-2xl glass-card p-12 text-center max-w-md mx-auto space-y-3">
              <Clock className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Watch History</h3>
              <p className="text-xs text-gray-400">
                Completed and in-progress playback positions will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchHistory.map(entry => (
                <div
                  key={entry.id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between border border-white/5"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white">{entry.title}</h4>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {entry.completed ? 'Completed' : `${entry.percentage || 0}% finished`}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlayMedia(entry.media_id, entry.title)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Resume</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reading History */}
      {activeTab === 'reading' && (
        <div className="space-y-3">
          {readingHistory.length === 0 ? (
            <div className="rounded-2xl glass-card p-12 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Reading History</h3>
              <p className="text-xs text-gray-400">
                Your book reading positions and bookmarks will be remembered here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {readingHistory.map(entry => (
                <div
                  key={entry.id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between border border-white/5"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white">Book: {entry.book_id}</h4>
                    <p className="text-[11px] text-emerald-400">
                      {entry.location || 'Current Chapter'} • {entry.percentage}% read
                    </p>
                  </div>
                  <button
                    onClick={() => handleReadBook(entry.book_id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>Continue Reading</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Collections */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Custom Collections</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Collection</span>
            </button>
          </div>

          {collections.length === 0 ? (
            <div className="rounded-2xl glass-card p-12 text-center max-w-md mx-auto space-y-3">
              <FolderHeart className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Custom Collections</h3>
              <p className="text-xs text-gray-400">
                Organize your media into personalized watchlists, themes, or playlists.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {collections.map(col => (
                <div
                  key={col.id}
                  className="rounded-2xl glass-card p-5 border border-white/5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{col.name}</h4>
                      <button
                        onClick={() => handleDeleteCollection(col.id)}
                        className="p-1 text-gray-400 hover:text-rose-400"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {col.description && (
                      <p className="text-xs text-gray-400 leading-relaxed">{col.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <span>{col.item_count} items</span>
                    <span className="font-mono text-[10px]">Custom Playlist</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Create Custom Collection</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Collection Name</label>
                <input
                  type="text"
                  required
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Cyberpunk Favorites, Weekend Sci-Fi"
                  className="w-full px-3 py-2 bg-background border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Description (Optional)</label>
                <textarea
                  value={newCollectionDesc}
                  onChange={e => setNewCollectionDesc(e.target.value)}
                  placeholder="Notes or themes for this collection..."
                  className="w-full px-3 py-2 bg-background border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary resize-none h-20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white shadow-glow-primary"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player */}
      {activeVideo && (
        <VideoPlayer
          playbackData={activeVideo.data}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Book Reader */}
      {activeBook && (
        <BookReader
          book={activeBook}
          onClose={() => setActiveBook(null)}
        />
      )}
    </div>
  );
};
