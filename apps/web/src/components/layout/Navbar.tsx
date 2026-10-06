import React from 'react';
import { Search, User } from 'lucide-react';
import { HealthIndicator } from '../common/HealthIndicator';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  return (
    <header className="h-16 border-b border-white/5 glass-panel sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      {/* Search Bar / Quick Trigger */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-background-elevated/70 hover:bg-background-elevated border border-white/10 text-sm text-gray-400 hover:text-gray-200 transition-colors group text-left"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
            <span>Search movies, shows, anime, books...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/10 text-gray-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Action Area & Indicators */}
      <div className="flex items-center gap-3">
        <HealthIndicator />

        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-gray-200 hover:border-primary/50 transition-colors cursor-pointer" title="Single User Session">
            <User className="w-4 h-4 text-indigo-300" />
          </div>
        </div>
      </div>
    </header>
  );
};
