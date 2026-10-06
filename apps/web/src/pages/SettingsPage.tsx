import React, { useEffect, useState } from 'react';
import {
  Settings,
  Key,
  Shield,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  FolderSearch,
  Activity,
  Sliders,
  Radio,
  BookOpen,
  Film,
  Server,
  Database,
  Cpu,
} from 'lucide-react';
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
  fetchUserPreferences,
  updateUserPreferences,
  UserPreferences,
  fetchSystemDiagnostics,
  SystemDiagnostics,
  testProviderConnection,
} from '../services/api';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'providers' | 'preferences' | 'storage' | 'diagnostics'>('providers');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<LocalStorageStatus | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanSummary, setScanSummary] = useState<LocalScanSummary | null>(null);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);

  // User preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferred_quality: '1080p',
    auto_play_next: true,
    default_subtitle_language: 'en',
    reader_theme: 'obsidian',
    reader_font_size: 18,
    reader_font_family: 'sans',
  });
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);

  // System diagnostics state
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loadingDiags, setLoadingDiags] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, storageRes, prefsRes] = await Promise.allSettled([
        fetchProviders(),
        fetchLocalStatus(),
        fetchUserPreferences(),
      ]);

      if (listRes.status === 'fulfilled') setProviders(listRes.value);
      if (storageRes.status === 'fulfilled') setLocalStatus(storageRes.value);
      if (prefsRes.status === 'fulfilled') setPreferences(prefsRes.value);
    } catch (err) {
      console.warn('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnostics = async () => {
    setLoadingDiags(true);
    try {
      const data = await fetchSystemDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDiags(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      loadDiagnostics();
    }
  }, [activeTab]);

  const handleScanDirectories = async () => {
    setScanning(true);
    setScanSummary(null);
    try {
      const summary = await scanLocalMedia();
      setScanSummary(summary);
      setStatusMessage(`Scan complete: ${summary.scanned_files} files processed.`);
      const updatedStatus = await fetchLocalStatus();
      setLocalStatus(updatedStatus);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage('Filesystem scan failed.');
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
      setStatusMessage(`Saved credentials for ${providerId}`);
      setEditingProviderId(null);
      setApiKeyInput('');
      loadData();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProviderId(providerId);
    try {
      const res = await testProviderConnection(providerId);
      setStatusMessage(`Provider ${res.name} test: ${res.status.toUpperCase()}`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage(`Test failed for provider ${providerId}`);
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const updated = await updateUserPreferences(preferences);
      setPreferences(updated);
      setStatusMessage('User preferences updated successfully.');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to update preferences.');
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Administration</h1>
            <p className="text-xs text-gray-400">Phase 15 Provider configuration, user preferences, storage, and diagnostics</p>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {[
          { key: 'providers', label: 'Media Providers', icon: Shield },
          { key: 'preferences', label: 'User Preferences', icon: Sliders },
          { key: 'storage', label: 'Storage & Scanners', icon: HardDrive },
          { key: 'diagnostics', label: 'System Diagnostics', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Media Providers */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Configured Media Providers</h2>
              <p className="text-xs text-gray-400">Toggle active providers and manage secure API keys</p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(provider => {
              const isEditing = editingProviderId === provider.id;
              const isTesting = testingProviderId === provider.id;
              return (
                <div
                  key={provider.id}
                  className="rounded-2xl glass-card p-5 border border-white/5 flex flex-col justify-between space-y-4 hover:border-white/15 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{provider.name}</h3>
                        <p className="text-[11px] text-gray-400">v{provider.version} • {provider.author}</p>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          provider.health_status === 'healthy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : provider.health_status === 'degraded'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {provider.health_status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                      {provider.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {provider.capabilities.map(cap => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-indigo-300 uppercase tracking-wider font-semibold"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Provider Status</span>
                      <button
                        onClick={() => handleToggle(provider)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          provider.is_enabled ? 'bg-indigo-600' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            provider.is_enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Test Ping Action */}
                    <button
                      onClick={() => handleTestProvider(provider.id)}
                      disabled={isTesting}
                      className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Radio className={`w-3.5 h-3.5 text-indigo-400 ${isTesting ? 'animate-pulse' : ''}`} />
                      <span>{isTesting ? 'Testing Link...' : 'Test Connection'}</span>
                    </button>

                    {/* Credentials config if TMDB */}
                    {provider.id === 'tmdb_provider' && (
                      <div>
                        {isEditing ? (
                          <div className="space-y-2 pt-2">
                            <div className="relative">
                              <input
                                type={showKey ? 'text' : 'password'}
                                placeholder="Enter API Key / Read Access Token"
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 pr-8"
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
                            className="w-full py-1.5 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Key className="w-3 h-3" />
                            <span>Configure API Credentials</span>
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
      )}

      {/* TAB 2: User Preferences */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="rounded-2xl glass-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h2 className="text-base font-semibold text-white">Playback & Reader Preferences</h2>
              <p className="text-xs text-gray-400">Tailor your personal viewing and reading experience</p>
            </div>
            <button
              type="submit"
              disabled={savingPrefs}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/30 disabled:opacity-50"
            >
              {savingPrefs ? 'Saving Changes...' : 'Save Preferences'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Playback Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                <Film className="w-4 h-4" />
                <span>Video Playback Settings</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Preferred Streaming Quality</label>
                <select
                  value={preferences.preferred_quality}
                  onChange={e => setPreferences({ ...preferences, preferred_quality: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="4k">4K Ultra HD (2160p)</option>
                  <option value="1080p">Full HD (1080p) — Recommended</option>
                  <option value="720p">High Definition (720p)</option>
                  <option value="auto">Adaptive Auto Resolution</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5">
                <div>
                  <div className="text-xs font-medium text-white">Auto-Play Next Episode</div>
                  <div className="text-[11px] text-gray-400">Seamlessly continue series without prompts</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.auto_play_next}
                  onChange={e => setPreferences({ ...preferences, auto_play_next: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Default Subtitle Language</label>
                <input
                  type="text"
                  value={preferences.default_subtitle_language}
                  onChange={e => setPreferences({ ...preferences, default_subtitle_language: e.target.value })}
                  placeholder="en, ja, es..."
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Reader Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <BookOpen className="w-4 h-4" />
                <span>Digital Reader Settings</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Default Reading Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'obsidian', label: 'Obsidian Dark' },
                    { id: 'sepia', label: 'Warm Sepia' },
                    { id: 'light', label: 'Clean Light' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, reader_theme: t.id })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                        preferences.reader_theme === t.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold'
                          : 'border-white/5 bg-background/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-300">Default Font Size</span>
                  <span className="font-mono text-emerald-400">{preferences.reader_font_size}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={preferences.reader_font_size}
                  onChange={e => setPreferences({ ...preferences, reader_font_size: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Typography Font Family</label>
                <select
                  value={preferences.reader_font_family}
                  onChange={e => setPreferences({ ...preferences, reader_font_family: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="sans">Clean Modern Sans (Inter)</option>
                  <option value="serif">Editorial Serif (Merriweather / Georgia)</option>
                  <option value="mono">Technical Monospace</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Storage & Scanners */}
      {activeTab === 'storage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Local Media Storage Paths</h2>
                  <p className="text-xs text-gray-400">Phase 14 Filesystem Engine</p>
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

            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-background/50 border border-white/5 space-y-1">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Video Media Path</div>
                <div className="text-xs font-mono text-emerald-300 break-all">
                  {localStatus ? localStatus.media_storage_path : './data/media'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-background/50 border border-white/5 space-y-1">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Books & Literature Path</div>
                <div className="text-xs font-mono text-emerald-300 break-all">
                  {localStatus ? localStatus.books_storage_path : './data/books'}
                </div>
              </div>
            </div>

            {scanSummary && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Filesystem Scan Completed</span>
                </div>
                <div className="text-[11px] text-emerald-200/80">
                  Processed {scanSummary.scanned_files} files • Added {scanSummary.movies_added} movies, {scanSummary.episodes_added} episodes, {scanSummary.books_added} books.
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleScanDirectories}
                disabled={scanning}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Storage Folders...</span>
                  </>
                ) : (
                  <>
                    <FolderSearch className="w-3.5 h-3.5" />
                    <span>Trigger Recursive Directory Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>

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
              All providers adhere to the contract: zero unauthorized scrapers, no DRM circumvention, path traversal containment, and masked credentials.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>RFC 7233 HTTP Byte Range seeking verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SSRF URL verification & path traversal protection</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero-knowledge credential storage</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: System Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">System Diagnostics & Telemetry</h2>
              <p className="text-xs text-gray-400">Real-time server metrics, database entity counts, and disk usage</p>
            </div>
            <button
              onClick={loadDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDiags ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {diagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Host & Runtime */}
              <div className="rounded-2xl glass-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <Server className="w-4 h-4" />
                  <span>Host & Runtime</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Application:</span>
                    <span className="font-medium text-white">{diagnostics.app_name} v{diagnostics.version}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Python Version:</span>
                    <span className="font-mono text-white">{diagnostics.python_version}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Operating System:</span>
                    <span className="text-white">{diagnostics.os_system}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Environment:</span>
                    <span className="font-medium text-emerald-400 uppercase text-[11px]">{diagnostics.environment}</span>
                  </div>
                </div>
              </div>

              {/* Database & Catalog */}
              <div className="rounded-2xl glass-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>Catalog & Database</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Indexed Movies:</span>
                    <span className="font-semibold text-white">{diagnostics.media_counts['movie'] || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Series & Anime:</span>
                    <span className="font-semibold text-white">{(diagnostics.media_counts['series'] || 0) + (diagnostics.media_counts['anime'] || 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Books & Literature:</span>
                    <span className="font-semibold text-white">{diagnostics.media_counts['book'] || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Total Users:</span>
                    <span className="font-semibold text-white">{diagnostics.total_users}</span>
                  </div>
                </div>
              </div>

              {/* Memory Cache & Performance */}
              <div className="rounded-2xl glass-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>Cache & Storage</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Active TTL Cache:</span>
                    <span className="font-semibold text-white">{diagnostics.cache_entries} entries</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Watch Sessions:</span>
                    <span className="font-semibold text-white">{diagnostics.watch_sessions_count}</span>
                  </div>
                  {diagnostics.storage['media']?.free_gb !== undefined && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">Disk Free Space:</span>
                      <span className="font-mono text-emerald-400">{diagnostics.storage['media'].free_gb} GB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
