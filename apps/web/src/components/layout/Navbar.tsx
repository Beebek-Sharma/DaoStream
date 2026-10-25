import React from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  return (
    <header className="h-16 border-b border-border-subtle bg-surface/85 backdrop-blur-xl sticky top-0 z-40 px-6 lg:px-8 flex items-center justify-between gap-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Mobile Branding (visible only when sidebar is hidden on small screens) */}
      <Link to="/" className="md:hidden flex items-center gap-2 group">
        <span className="font-display font-bold text-lg tracking-tight text-on-surface group-hover:text-primary transition-colors">
          DaoStream
        </span>
      </Link>

      {/* Quick Search Trigger Input Button */}
      <div className="flex-1 max-w-lg">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-sm text-on-surface-variant hover:text-on-surface transition-all group text-left shadow-sm"
          type="button"
          aria-label="Search Catalog"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="text-xs sm:text-sm font-sans truncate">
              Search movies, series, anime, books, and more...
            </span>
          </div>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-surface-container-high text-primary border border-border-subtle">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Clean Right Actions Area */}
      <div className="flex items-center gap-3">
        {/* Subtle, non-intrusive status link or spacer */}
      </div>
    </header>
  );
};

