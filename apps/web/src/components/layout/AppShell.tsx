import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AudioPlayer } from '../player/AudioPlayer';
import { useAuth } from '../../context/AuthContext';

export const AppShell: React.FC = () => {
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-on-surface-variant font-mono uppercase tracking-wider">
            Initializing DaoStream...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-gray-100">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onSearchClick={() => navigate('/search')} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Persistent Background Audio Player */}
      <AudioPlayer />
    </div>
  );
};
