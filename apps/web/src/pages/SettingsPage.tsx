import React from 'react';
import { Settings, Server, Key, Shield, HardDrive } from 'lucide-react';
import { HealthIndicator } from '../components/common/HealthIndicator';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
            <p className="text-xs text-gray-400">Configuration, authorized providers, and storage locations</p>
          </div>
        </div>

        <HealthIndicator />
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provider Management Card */}
        <div className="rounded-2xl glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 text-indigo-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Provider Credentials</h2>
              <p className="text-xs text-gray-400">Phase 4 & 6 Provider Adapter Framework</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Configure external metadata APIs (e.g. TMDB) and authorized playback connectors. Credentials are securely encrypted and masked.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-gray-300">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Zero-knowledge client security</span>
            </span>
          </div>
        </div>

        {/* Local Storage Card */}
        <div className="rounded-2xl glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Storage & Local Media</h2>
              <p className="text-xs text-gray-400">Phase 14 Filesystem Adapters</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Mount local directory paths or network NAS shares for indexed movies, series episodes, and local EPUB/PDF collections.
          </p>
          <div className="pt-2 text-xs font-mono text-gray-400 bg-background/50 p-2 rounded-lg border border-white/5">
            ./data/media &nbsp;|&nbsp; ./data/books
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="rounded-2xl glass-card p-6 space-y-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Application Diagnostics</h2>
              <p className="text-xs text-gray-400">Environment & service health metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-background-elevated/60 border border-white/5 space-y-1">
              <span className="text-gray-400 text-[11px]">API Route</span>
              <div className="font-mono text-white">/api/v1</div>
            </div>
            <div className="p-3 rounded-xl bg-background-elevated/60 border border-white/5 space-y-1">
              <span className="text-gray-400 text-[11px]">Architecture</span>
              <div className="text-emerald-400 font-medium">Provider-Adapter</div>
            </div>
            <div className="p-3 rounded-xl bg-background-elevated/60 border border-white/5 space-y-1">
              <span className="text-gray-400 text-[11px]">Database</span>
              <div className="font-mono text-white">SQLite (Phase 1.4)</div>
            </div>
            <div className="p-3 rounded-xl bg-background-elevated/60 border border-white/5 space-y-1">
              <span className="text-gray-400 text-[11px]">CORS Policy</span>
              <div className="text-emerald-400 font-medium">Configured</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
