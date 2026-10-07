import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';

// Dynamic lazy-loaded page routes for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const MoviesPage = lazy(() => import('./pages/MoviesPage').then(m => ({ default: m.MoviesPage })));
const SeriesPage = lazy(() => import('./pages/SeriesPage').then(m => ({ default: m.SeriesPage })));
const AnimePage = lazy(() => import('./pages/AnimePage').then(m => ({ default: m.AnimePage })));
const BooksPage = lazy(() => import('./pages/BooksPage').then(m => ({ default: m.BooksPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const LibraryPage = lazy(() => import('./pages/LibraryPage').then(m => ({ default: m.LibraryPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[65vh] animate-fade-in">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-xs text-gray-400 font-medium tracking-wide">Loading view...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthModal />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="search"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <SearchPage />
              </Suspense>
            }
          />
          <Route
            path="movies"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <MoviesPage />
              </Suspense>
            }
          />
          <Route
            path="series"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <SeriesPage />
              </Suspense>
            }
          />
          <Route
            path="anime"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AnimePage />
              </Suspense>
            }
          />
          <Route
            path="books"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <BooksPage />
              </Suspense>
            }
          />
          <Route
            path="library"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <LibraryPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
};

export default App;
