import React, { useState } from 'react';
import { Search, Sparkles, Film, Tv, BookOpen, Layers } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Media', icon: Layers },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'TV Series', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Sparkles },
    { id: 'books', label: 'Books', icon: BookOpen },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Federated Search</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Query across all connected metadata providers and authorized media libraries simultaneously.
        </p>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a title, series, author, or keyword..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-background-elevated border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm md:text-base transition-all"
            autoFocus
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isSelected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'bg-background-card border border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Body / State */}
      <div className="rounded-2xl glass-card p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
          <Search className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold text-white">
          {query ? `Searching for "${query}"...` : 'Enter a search term to begin'}
        </h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Federated search will query TMDB, AniList, and configured providers once Provider Integration (Phase 5 & 11) is configured.
        </p>
      </div>
    </div>
  );
};
