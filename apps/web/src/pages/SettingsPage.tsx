import React, { useEffect, useState } from 'react';
import { Settings, Key, Shield, HardDrive, CheckCircle2, RefreshCw, Eye, EyeOff, FolderSearch } from 'lucide-react';
import { HealthIndicator } from '../components/common/HealthIndicator';
import {
  fetchProviders,
  toggleProvider,
  configureProvider,
  ProviderInfo,
  fetchLocalStatus,
  scanLocalMedia,
  LocalStorageStatus,
  LocalScanSummary,
} from '../services/api';

export const SettingsPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<LocalStorageStatus | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanSummary, setScanSummary] = useState<LocalScanSummary | null>(null);

  const loadProvidersAndStorage = async () => {
    setLoading(true);
    try {
      const [list, storage] = await Promise.allSettled([
        fetchProviders(),
        fetchLocalStatus(),
      ]);

      if (list.status === 'fulfilled') {
        setProviders(list.value);
      }
      if (storage.status === 'fulfilled') {
        setLocalStatus(storage.value);
      }
    } catch (err) {
      console.warn('Error loading settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvidersAndStorage();
  }, []);

  const handleScanDirectories = async () => {
    setScanning(true);
    setScanSummary(null);
    try {
      const summary = await scanLocalMedia();
      setScanSummary(summary);
      setStatusMessage(`Scan complete: ${summary.scanned_files} files checked.`);
      const updatedStatus = await fetchLocalStatus();
      setLocalStatus(updatedStatus);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage('Scan failed to complete');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setScanning(false);
    }
  };

  const handleToggle = async (provider: ProviderInfo) => {
    try {
      await toggleProvider(provider.id, !provider.is_enabled);
      setProviders(prev =>
        prev.map(p => (p.id === provider.id ? { ...p, is_enabled: !p.is_enabled } : p))
      );
      setStatusMessage(`Updated ${provider.name}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async (providerId: string) => {
    try {
      await configureProvider(providerId, { api_key: apiKeyInput });
      setStatusMessage(`Configuration saved for ${providerId}`);
      setEditingProviderId(null);
      setApiKeyInput('');
      loadProvidersAndStorage();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-12">
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

      {statusMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Provider Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Media Providers</h2>
            <p className="text-xs text-gray-400">Phase 4 & 6 Provider Adapter Framework</p>
          </div>
          <button
            onClick={loadProvidersAndStorage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(provider => {
            const isEditing = editingProviderId === provider.id;
            return (
              <div
                key={provider.id}
                className="rounded-2xl glass-card p-5 flex flex-col justify-between space-y-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{provider.name}</h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        provider.health_status === 'healthy'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : provider.health_status === 'unconfigured'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {provider.health_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {provider.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {provider.supported_media_types.map(type => (
                      <span
                        key={type}
                        className="px-2 py-0.5 rounded bg-white/5 text-[10px] uppercase font-mono text-gray-300"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Enabled</span>
                    <button
                      onClick={() => handleToggle(provider)}
                      className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        provider.is_enabled ? 'bg-primary justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="bg-white w-3.5 h-3.5 rounded-full shadow-md transform" />
                    </button>
                  </div>

                  {provider.id === 'tmdb_provider' && (
                    <div>
                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <label className="text-[11px] text-gray-400">TMDB API Key (v3)</label>
                          <div className="relative">
                            <input
                              type={showKey ? 'text' : 'password'}
                              value={apiKeyInput}
                              onChange={e => setApiKeyInput(e.target.value)}
                              placeholder="Enter API Key"
                              className="w-full bg-background/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white pr-8 focus:outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-2 top-2 text-gray-400 hover:text-white"
                            >
                              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveConfig(provider.id)}
                              className="px-3 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary-hover font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingProviderId(null)}
                              className="px-3 py-1 bg-white/5 text-gray-300 text-xs rounded-lg hover:bg-white/10"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingProviderId(provider.id);
                            setShowKey(false);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Key className="w-3 h-3" />
                          <span>Configure Credentials</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage and Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Storage Card */}
        <div className="rounded-2xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Storage & Local Media</h2>
                <p className="text-xs text-gray-400">Phase 14 Local Media Engine</p>
              </div>
            </div>
            {localStatus && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {localStatus.indexed_local_media_count} Indexed Items
              </span>
            )}
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Mount local directory paths or network NAS shares for indexed movies, series episodes, and local EPUB/PDF collections with HTTP Range seeking.
          </p>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50 border border-white/5 font-mono text-gray-400">
              <span className="truncate max-w-[280px]">Media: {localStatus ? localStatus.media_storage_path : './data/media'}</span>
              <span className="text-[10px] text-emerald-400 font-sans font-semibold">Ready</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50 border border-white/5 font-mono text-gray-400">
              <span className="truncate max-w-[280px]">Books: {localStatus ? localStatus.books_storage_path : './data/books'}</span>
              <span className="text-[10px] text-emerald-400 font-sans font-semibold">Ready</span>
            </div>
          </div>

          {scanSummary && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Filesystem Scan Completed</span>
              </div>
              <div className="text-[11px] text-emerald-200/80">
                Scanned {scanSummary.scanned_files} files • Added {scanSummary.movies_added} movies, {scanSummary.episodes_added} episodes, {scanSummary.books_added} books.
              </div>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={handleScanDirectories}
              disabled={scanning}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Media Folders...</span>
                </>
              ) : (
                <>
                  <FolderSearch className="w-3.5 h-3.5" />
                  <span>Scan Storage Directories Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Summary */}
        <div className="rounded-2xl glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Security & Integrity</h2>
              <p className="text-xs text-gray-400">Strictly authorized sources</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            All providers adhere to the contract: zero unauthorized scrapers, no DRM circumvention, and masked credentials.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compliant provider adapter standard</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
