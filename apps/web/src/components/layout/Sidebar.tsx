import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  Film,
  Tv,
  BookOpen,
  Bookmark,
  Settings,
  Layers,
  Sparkles,
  Radio,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Explore & Search', path: '/search', icon: Search },
  { name: 'Movies', path: '/movies', icon: Film },
  { name: 'Series', path: '/series', icon: Tv },
  { name: 'Anime', path: '/anime', icon: Sparkles },
  { name: 'Books & Novels', path: '/books', icon: BookOpen },
  { name: 'Music & Audio', path: '/music', icon: Radio },
  { name: 'My Library', path: '/library', icon: Bookmark },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <>
      {/* Desktop Persistent Obsidian Sidebar */}
      <aside
        className="hidden md:flex w-64 bg-surface-container-low border-r border-border-subtle flex-col justify-between shrink-0 h-screen sticky top-0 z-50 py-6 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
        aria-label="Desktop Primary Navigation"
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center shadow-glow-primary">
              <Layers className="w-5 h-5 text-on-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight text-on-surface">
                DaoStream
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Media Discovery Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 overflow-y-auto" aria-label="Main Navigation">
            <div className="px-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-on-surface-variant/70">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary/15 text-primary border border-primary/30 font-semibold shadow-glow-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                        }`}
                        aria-hidden="true"
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
        </div>

        {/* Clean, calm footer */}
        <div className="pt-4 border-t border-border-subtle px-2">
          <p className="text-xs text-on-surface-variant/60 font-sans">
            DaoStream &copy; 2026
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Dock */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-low/95 border-t border-border-subtle flex items-center justify-around py-2 px-1 backdrop-blur-2xl"
        aria-label="Mobile Navigation"
      >
        {[
          navItems[0], // Home
          navItems[2], // Movies
          navItems[4], // Anime
          navItems[5], // Books & Novels
          navItems[6], // Music & Audio
          navItems[7], // Library
        ].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`
              }
              aria-label={item.name}
            >
              <Icon className="w-4 h-4 mb-0.5" aria-hidden="true" />
              <span className="truncate max-w-[50px]">{item.name.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
