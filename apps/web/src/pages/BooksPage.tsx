import React from 'react';
import { BookOpen, Filter, SlidersHorizontal } from 'lucide-react';

export const BooksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Books & Novels</h1>
            <p className="text-xs text-gray-400">Digital literature, EPUBs, and reading progress</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background-card border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Format: EPUB / PDF</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background-card border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span>Sort: Title</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-12 text-center max-w-lg mx-auto space-y-3 my-8">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No Books Indexed Yet</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          The dedicated e-book and novel reader will be implemented in Phase 10 with full progress bookmarks.
        </p>
      </div>
    </div>
  );
};
