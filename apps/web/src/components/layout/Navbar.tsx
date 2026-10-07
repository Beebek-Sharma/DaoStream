import React from 'react';
import { Search, User as UserIcon, Bell, HardDrive, Shield } from 'lucide-react';
import { HealthIndicator } from '../common/HealthIndicator';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const { user, isAdmin, openAuthModal } = useAuth();

  return (
    <header className="h-16 border-b border-border-subtle bg-surface/85 backdrop-blur-xl sticky top-0 z-40 px-6 lg:px-8 flex items-center justify-between gap-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Quick Search Trigger Input Button */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-sm text-on-surface-variant hover:text-on-surface transition-all group text-left shadow-sm"
          type="button"
          aria-label="Quick Search"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="text-xs sm:text-sm font-sans truncate">Quick Search media, cast, isbn...</span>
          </div>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-surface-container-high text-primary border border-border-subtle">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Action Area, Node Badge & User Session */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Active Node Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full border border-border-subtle">
          <HardDrive className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[11px] uppercase font-bold tracking-wider text-on-surface">
            Active Node: Local Storage
          </span>
        </div>

        {/* Backend Health Check Badge */}
        <HealthIndicator />

        {/* Notification Bell */}
        <button
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors relative"
          title="Cluster Activity"
          type="button"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-secondary absolute top-1.5 right-1.5 animate-pulse" />
        </button>

        <div className="h-4 w-px bg-border-subtle hidden sm:block" />

        {/* User Session interactive pill */}
        <button
          onClick={openAuthModal}
          className="flex items-center gap-2.5 pl-1 text-left group hover:opacity-90 transition-opacity"
          title="Account & Role Management"
          type="button"
        >
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
            isAdmin
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {user ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-stone-400" />}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="font-sans text-xs font-semibold text-on-surface leading-tight group-hover:text-primary transition-colors flex items-center gap-1">
              {user ? user.username : 'Sign In'}
              {isAdmin && <Shield className="w-3 h-3 text-amber-400" />}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              {user ? (isAdmin ? 'Admin' : 'User') : 'Guest'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
