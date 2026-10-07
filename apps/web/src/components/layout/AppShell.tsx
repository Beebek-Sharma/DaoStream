import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AudioPlayer } from '../player/AudioPlayer';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();

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
