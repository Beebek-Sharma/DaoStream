import React, { useEffect, useState } from 'react';
import { Settings, Key, Shield, HardDrive, CheckCircle2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { HealthIndicator } from '../components/common/HealthIndicator';
import { fetchProviders, toggleProvider, configureProvider, ProviderInfo } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const list = await fetchProviders();
      setProviders(list);
    } catch (err) {
      console.warn('Using local fallback providers list:', err);
      // Fallback display if not logged in
      setProviders([
        {
          id: 'mock_media_provider',
          name: 'Sample Media Hub Provider',
          version: '1.0.0',
          description: 'Built-in reference provider supplying sample movies, series, anime, books, and authorized demo streams.',
          author: 'Media Hub Team',
          capabilities: ['search', 'metadata', 'streaming', 'books'],
          supported_media_types: ['movie', 'series', 'anime', 'book'],
          health_status: 'healthy',
          is_enabled: true,
        },
        {
          id: 'openlibrary_provider',
          name: 'Open Library Provider',
          version: '1.0.0',
          description: 'Free, open catalog of books and novels powered by the Internet Archive Open Library API.',
          author: 'Internet Archive',
          capabilities: ['search', 'metadata', 'books'],
          supported_media_types: ['book'],
          health_status: 'healthy',
          is_enabled: true,
        },
        {
          id: 'tmdb_provider',
          name: 'The Movie Database (TMDB)',
          version: '1.0.0',
          description: 'Leading community-built database for movies, television series, anime, and Asian dramas.',
          author: 'TMDB Community',
          capabilities: ['search', 'metadata', 'movie', 'series', 'anime'],
          supported_media_types: ['movie', 'series', 'anime', 'drama'],
          health_status: 'unconfigured',
          is_enabled: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

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
      loadProviders();
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
            onClick={loadProviders}
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
          <div className="pt-2 text-xs font-mono text-gray-400 bg-background/50 p-2.5 rounded-lg border border-white/5">
            ./data/media &nbsp;|&nbsp; ./data/books
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
