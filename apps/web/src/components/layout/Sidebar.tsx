import React, { useEffect, useState } from 'react';
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
  HardDrive,
} from 'lucide-react';
import { fetchProviders } from '../../services/api';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Explore & Search', path: '/search', icon: Search },
  { name: 'Movies', path: '/movies', icon: Film },
  { name: 'Series & Anime', path: '/series', icon: Tv },
  { name: 'Books & Novels', path: '/books', icon: BookOpen },
  { name: 'My Library', path: '/library', icon: Bookmark },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const [activeProviderCount, setActiveProviderCount] = useState<number>(3);
  const [providerNames, setProviderNames] = useState<string>('TMDB, OL, Local');

  useEffect(() => {
    let mounted = true;
    fetchProviders(false)
      .then((providers) => {
        if (!mounted || !providers || providers.length === 0) return;
        const enabled = providers.filter((p) => p.is_enabled);
        setActiveProviderCount(enabled.length);
        const acronyms = enabled
          .map((p) => {
            if (p.id === 'tmdb') return 'TMDB';
            if (p.id === 'openlibrary') return 'OL';
            if (p.id === 'local-media') return 'Local NAS';
            return p.name.slice(0, 4);
          })
          .join(', ');
        setProviderNames(acronyms);
      })
      .catch(() => {
        // Fallback to default active node state
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {/* Desktop Persistent Obsidian Sidebar */}
      <aside
        className="hidden md:flex w-72 bg-surface-container-low border-r border-border-subtle flex-col justify-between shrink-0 h-screen sticky top-0 z-50 py-5 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
        aria-label="Desktop Primary Navigation"
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center shadow-glow-primary">
              <Layers className="w-5 h-5 text-on-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight text-on-surface flex items-center gap-1.5">
                OmniMedia Hub
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-secondary">
                Unified Vault
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 overflow-y-auto" aria-label="Main Navigation">
            <div className="px-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-on-surface-variant/70">
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

        {/* Footer Area: Provider Telemetry Card */}
        <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
          <div className="bg-surface-container px-3.5 py-2.5 rounded-lg flex flex-col gap-1 border border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Cluster Pipeline
              </span>
            </div>
            <p className="font-mono text-xs text-on-surface font-medium truncate">
              {activeProviderCount} Online: {providerNames}
            </p>
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-on-surface-variant font-mono">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-primary" />
              Local Storage
            </span>
            <span className="text-tertiary font-semibold">Active</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Dock */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-low/95 border-t border-border-subtle flex items-center justify-around py-2 px-1 backdrop-blur-2xl"
        aria-label="Mobile Navigation"
      >
        {navItems.slice(0, 5).concat(navItems.slice(6)).map((item) => {
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
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
