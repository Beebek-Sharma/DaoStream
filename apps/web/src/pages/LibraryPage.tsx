import React, { useState } from 'react';
import { Bookmark, Heart, Clock, FolderHeart } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'favorites' | 'history'>('watchlist');

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background-card border border-white/5">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'watchlist'
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-12 text-center max-w-lg mx-auto space-y-3 my-8">
        <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
          <FolderHeart className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Your {activeTab} is Empty</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          As you browse media in future phases, bookmark titles or watch episodes to track your personal collection here.
        </p>
      </div>
    </div>
  );
};
