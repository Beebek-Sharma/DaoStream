import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  Film,
  Tv,
  Sparkles,
  BookOpen,
  Bookmark,
  Settings,
  Layers,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Search', path: '/search', icon: Search },
  { name: 'Movies', path: '/movies', icon: Film },
  { name: 'Series', path: '/series', icon: Tv },
  { name: 'Anime', path: '/anime', icon: Sparkles },
  { name: 'Books', path: '/books', icon: BookOpen },
  { name: 'Library', path: '/library', icon: Bookmark },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 glass-panel border-r border-white/10 flex flex-col shrink-0 h-screen sticky top-0 z-40 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-cyan flex items-center justify-center shadow-glow-primary">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            MediaHub
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-indigo-300 border border-primary/30">
              Core
            </span>
          </h1>
          <p className="text-xs text-gray-400">Personal Unified Media</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-gray-400">
          Discover
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/20 text-white border border-primary/40 shadow-glow-primary'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'
                    }`}
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 text-xs text-gray-400 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Engine</span>
          <span className="text-gray-300 font-mono">v0.1.0 (Phase 1)</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Mode</span>
          <span className="text-emerald-400">Self-Hosted</span>
        </div>
      </div>
    </aside>
  );
};
