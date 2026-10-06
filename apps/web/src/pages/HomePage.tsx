import React from 'react';
import { Film, Tv, Sparkles, BookOpen, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const mediaCategories = [
    {
      title: 'Movies',
      desc: 'Cinematic films with multi-source resolution',
      count: 'Ready for Providers',
      icon: Film,
      href: '/movies',
      gradient: 'from-blue-600/30 to-indigo-600/30',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'TV Series',
      desc: 'Seasons and episode progress tracking',
      count: 'Ready for Providers',
      icon: Tv,
      href: '/series',
      gradient: 'from-purple-600/30 to-pink-600/30',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Anime & Dramas',
      desc: 'Episodic animation and Asian dramas',
      count: 'Ready for Providers',
      icon: Sparkles,
      href: '/anime',
      gradient: 'from-amber-600/30 to-rose-600/30',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Books & Novels',
      desc: 'First-class EPUB, PDF and novel reader',
      count: 'Ready for Providers',
      icon: BookOpen,
      href: '/books',
      gradient: 'from-emerald-600/30 to-teal-600/30',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Cinematic Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-card via-background-elevated to-background p-8 md:p-12 shadow-cinematic">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Phase 1 — Engineering Foundation Active</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            One Unified Interface for <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">All Your Media</span>
          </h1>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Personal Unified Media Hub consolidates movies, television, anime, and books under a clean, provider-agnostic architecture. Connect your authorized media libraries and streaming credentials with complete privacy.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-glow-primary hover:translate-y-[-1px]"
            >
              <span>Explore Provider Settings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-sm font-medium transition-colors"
            >
              <span>View Personal Library</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Media Domains Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Media Hub Domains</h2>
            <p className="text-xs text-gray-400">Integrated categories scheduled across development phases</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mediaCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                to={cat.href}
                className="group relative rounded-2xl glass-card p-5 hover:border-white/20 transition-all duration-300 flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-lg"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} border border-white/10 flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base group-hover:text-indigo-300 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-md font-medium border ${cat.badgeColor}`}>
                    {cat.count}
                  </span>
                  <span className="text-gray-400 group-hover:text-white transition-colors flex items-center gap-1 font-medium">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Engineering Blueprint Progress Card */}
      <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System Architecture Status</h3>
            <p className="text-xs text-gray-400">Roadmap Phase 1 (Foundation)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-background-elevated/60 border border-white/5">
            <div className="text-xs text-gray-400">Step 1.1 — Repo Initialized</div>
            <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed
            </div>
          </div>
          <div className="p-4 rounded-xl bg-background-elevated/60 border border-white/5">
            <div className="text-xs text-gray-400">Step 1.2 — FastAPI Skeleton</div>
            <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Healthy & Verified
            </div>
          </div>
          <div className="p-4 rounded-xl bg-background-elevated/60 border border-white/5">
            <div className="text-xs text-gray-400">Step 1.3 — React Shell</div>
            <div className="text-sm font-semibold text-indigo-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Active Execution
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
