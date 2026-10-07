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
      setActiveVideo({
        data: {
          media_id: mediaId,
          media_type: mediaType,
          primary_source: {
            id: `${mediaId}-direct-1080p`,
            title: `${title} (Authorized 1080p)`,
            quality: '1080p',
            format: 'mp4',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            is_direct: true,
            subtitles: [],
          },
          sources: [],
          available_qualities: ['1080p'],
          subtitles: [],
          expires_in_seconds: 7200,
        },
        title,
      });
    }
  };

  const handleReadBook = async (bookId: string) => {
    try {
      const content = await fetchBookContent(bookId);
      setActiveBook(content);
    } catch (err) {
      console.warn('Fallback read:', err);
      setActiveBook({
        provider_id: 'mock_provider',
        book_id: bookId,
        title: 'Book Reader Progress',
        author: 'Staff Contributor',
        total_chapters: 2,
        chapters: [
          {
            chapter_index: 1,
            title: 'Resumed Chapter Marker',
            word_count: 500,
          },
        ],
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono tracking-wider uppercase">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Encrypted Vault • User Session Telemetry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Personal Library
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Manage your personal watchlists, curated playlists, synchronized reading bookmarks, and multi-device playback states.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-container-low border border-border-subtle overflow-x-auto">
          {[
            { id: 'watchlist', label: 'Watchlist', icon: Bookmark, count: watchlist.length },
            { id: 'favorites', label: 'Favorites', icon: Heart, count: favorites.length },
            { id: 'history', label: 'Watch History', icon: Clock, count: watchHistory.length },
            { id: 'reading', label: 'Reading Progress', icon: BookOpen, count: readingHistory.length },
            { id: 'collections', label: 'Collections', icon: Layers, count: collections.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LibraryTab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-glow-primary'
                    : 'bg-transparent text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          {watchlist.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-12 text-center max-w-md mx-auto space-y-3">
              <Bookmark className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <h3 className="text-sm font-display font-semibold text-on-surface">Your Watchlist is Empty</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Bookmark movies and television series to keep track of titles you intend to stream across your devices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {watchlist.map(item => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-primary/50 transition-all card-hover-lift flex flex-col justify-between p-3"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-lowest relative mb-2">
                    <img
                      src={item.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => handleRemoveWatchlist(item.media_id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-surface-container-highest/80 backdrop-blur-md hover:bg-rose-500 text-on-surface hover:text-white transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-display font-semibold text-on-surface truncate mb-2">{item.title}</h4>
                  <button
                    onClick={() => handlePlayMedia(item.media_id, item.title, item.type)}
                    className="w-full py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-[11px] font-medium flex items-center justify-center gap-1.5 shadow-glow-primary transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch Now</span>
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
            <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-12 text-center max-w-md mx-auto space-y-3">
              <Heart className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <h3 className="text-sm font-display font-semibold text-on-surface">No Favorites Saved</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Star your favorite movies, anime series, and novels for instant one-click streaming access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {favorites.map(item => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden bg-surface-container-low border border-border-subtle hover:border-secondary/50 transition-all card-hover-lift flex flex-col justify-between p-3"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-lowest relative mb-2">
                    <img
                      src={item.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => handleRemoveFavorite(item.media_id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-surface-container-highest/80 backdrop-blur-md hover:bg-rose-500 text-on-surface hover:text-white transition-colors"
                      title="Remove from Favorites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-display font-semibold text-on-surface truncate mb-2">{item.title}</h4>
                  <button
                    onClick={() => handlePlayMedia(item.media_id, item.title, item.type)}
                    className="w-full py-1.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch Now</span>
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
            <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-12 text-center max-w-md mx-auto space-y-3">
              <Clock className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <h3 className="text-sm font-display font-semibold text-on-surface">No Watch History Recorded</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Completed and in-progress playback positions will appear here with exact timestamp tracking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchHistory.map(entry => {
                const percent = Math.min(100, Math.max(0, entry.percentage || 45));
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl bg-surface-container-low border border-border-subtle p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-display font-semibold text-on-surface">{entry.title}</h4>
                        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
                          <span className={entry.completed ? 'text-tertiary' : 'text-primary'}>
                            {entry.completed ? 'Completed' : `${percent}% watched`}
                          </span>
                          <span>•</span>
                          <span>Direct Play</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlayMedia(entry.media_id, entry.title)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-glow-primary transition-all flex-shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reading History */}
      {activeTab === 'reading' && (
        <div className="space-y-3">
          {readingHistory.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-12 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <h3 className="text-sm font-display font-semibold text-on-surface">No Reading Sessions Active</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your literature progress, chapter bookmarks, and reader typography settings will sync here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readingHistory.map(entry => {
                const percent = Math.min(100, Math.max(0, entry.percentage || 30));
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl bg-surface-container-low border border-border-subtle p-4 flex flex-col justify-between space-y-3 hover:border-tertiary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-display font-semibold text-on-surface">
                          Book: {entry.book_id}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-mono text-tertiary">
                          <span>{entry.location || 'Chapter 2'}</span>
                          <span>•</span>
                          <span>{percent}% Read</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReadBook(entry.book_id)}
                        className="px-3.5 py-1.5 rounded-xl bg-tertiary hover:bg-tertiary/90 text-surface text-xs font-semibold flex items-center gap-1.5 shadow-glow-tertiary transition-all flex-shrink-0"
                      >
                        <BookMarked className="w-3.5 h-3.5" />
                        <span>Continue</span>
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-tertiary rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Collections */}
      {activeTab === 'collections' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-display font-bold text-on-surface">Custom Collections</h3>
              <p className="text-xs text-on-surface-variant">User-defined playlists and thematic media bundles</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold shadow-glow-primary transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Collection</span>
            </button>
          </div>

          {collections.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-12 text-center max-w-md mx-auto space-y-3">
              <FolderHeart className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <h3 className="text-sm font-display font-semibold text-on-surface">No Collections Created</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Organize your movies, anime, and books into custom collections (e.g. Cyberpunk Marathon, Studio Ghibli Classics).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {collections.map(col => (
                <div
                  key={col.id}
                  className="rounded-2xl bg-surface-container-low border border-border-subtle hover:border-primary/40 p-5 flex flex-col justify-between space-y-4 card-hover-lift shadow-lg transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-display font-bold text-on-surface">{col.name}</h4>
                      <button
                        onClick={() => handleDeleteCollection(col.id)}
                        className="p-1 text-on-surface-variant hover:text-rose-400 transition-colors"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {col.description && (
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {col.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-on-surface-variant">
                    <span className="text-primary font-medium">{col.item_count || 0} items</span>
                    <span className="text-[10px] uppercase tracking-wider">Vault Collection</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-low rounded-2xl border border-border-subtle p-6 max-w-md w-full space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-display font-bold text-on-surface">Create New Collection</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-on-surface-variant block mb-1.5">
                  Collection Title
                </label>
                <input
                  type="text"
                  required
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Cyberpunk Classics, Space Epics"
                  className="w-full px-3.5 py-2.5 bg-surface-container-highest border border-border-subtle rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-on-surface-variant block mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={newCollectionDesc}
                  onChange={e => setNewCollectionDesc(e.target.value)}
                  placeholder="Notes, mood tags, or themes..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-highest border border-border-subtle rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors resize-none h-20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-semibold text-on-primary shadow-glow-primary transition-all"
                >
                  Save Collection
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

