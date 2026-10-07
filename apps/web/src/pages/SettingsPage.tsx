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
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { HealthIndicator } from '../components/common/HealthIndicator';
import { useAuth } from '../context/AuthContext';
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
  const { user, isAdmin, quickLoginAdmin, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'providers' | 'preferences' | 'storage' | 'diagnostics'>('providers');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setErrorMessage(null);
    try {
      const data = await fetchSystemDiagnostics();
      setDiagnostics(data);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('403') || err?.message?.includes('Admin privileges')) {
        setErrorMessage('Administrator privileges required to access cluster diagnostics.');
      } else {
        setErrorMessage('Failed to load system diagnostics telemetry.');
      }
    } finally {
      setLoadingDiags(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      loadDiagnostics();
    }
  }, [activeTab, user]);

  const handleElevateToAdmin = async () => {
    try {
      await quickLoginAdmin();
      setStatusMessage('Switched to Administrator session (admin@mediahub.com)');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setErrorMessage('Failed to switch to administrator account.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleScanDirectories = async () => {
    setScanning(true);
    setScanSummary(null);
    setErrorMessage(null);
    try {
      const summary = await scanLocalMedia();
      setScanSummary(summary);
      setStatusMessage(`Scan complete: ${summary.scanned_files} files processed.`);
      const updatedStatus = await fetchLocalStatus();
      setLocalStatus(updatedStatus);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message?.includes('403')
        ? 'Admin privileges required to trigger filesystem scanner. Switch to Administrator.'
        : 'Filesystem scan failed.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setScanning(false);
    }
  };

  const handleToggle = async (provider: ProviderInfo) => {
    setErrorMessage(null);
    try {
      await toggleProvider(provider.id, !provider.is_enabled);
      setProviders(prev =>
        prev.map(p => (p.id === provider.id ? { ...p, is_enabled: !p.is_enabled } : p))
      );
      setStatusMessage(`Updated ${provider.name}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message?.includes('403')
        ? 'Admin privileges required to toggle media providers. Switch to Administrator.'
        : `Failed to toggle ${provider.name}.`;
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleSaveConfig = async (providerId: string) => {
    setErrorMessage(null);
    try {
      await configureProvider(providerId, { api_key: apiKeyInput });
      setStatusMessage(`Saved credentials for ${providerId}`);
      setEditingProviderId(null);
      setApiKeyInput('');
      loadData();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message?.includes('403')
        ? 'Admin privileges required to save credentials. Switch to Administrator.'
        : `Failed to configure ${providerId}.`;
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProviderId(providerId);
    setErrorMessage(null);
    try {
      const res = await testProviderConnection(providerId);
      setStatusMessage(`Provider ${res.name} test: ${res.status.toUpperCase()}`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      const msg = err?.message?.includes('403')
        ? 'Admin privileges required to ping provider links. Switch to Administrator.'
        : `Test failed for provider ${providerId}`;
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setErrorMessage(null);
    try {
      const updated = await updateUserPreferences(preferences);
      setPreferences(updated);
      setStatusMessage('User preferences updated successfully.');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to update preferences.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono tracking-wider uppercase">
            <Settings className="w-3.5 h-3.5" />
            <span>Node Governance • Cluster Diagnostics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-on-surface tracking-tight">
            Settings & Cluster Node
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Configure media providers, adjust typography engine settings, trigger filesystem indexing, and review cluster health telemetry.
          </p>
        </div>

        <HealthIndicator />
      </div>

      {/* Authentication & Role Status Card */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
        isAdmin
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
          : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
            isAdmin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isAdmin ? <Shield className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-on-surface">Active Session:</span>
              <span className="font-mono text-on-surface-variant">{user?.email || 'Guest User'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                isAdmin
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isAdmin ? 'Administrator (Full Access)' : 'Standard User (Read-Only)'}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {isAdmin
                ? 'Full cluster governance granted. You can configure providers, initiate disk indexing, and inspect live node diagnostics.'
                : 'Local directory scans, provider credentials, and system diagnostics are protected under RBAC policy.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          {!isAdmin && (
            <button
              onClick={handleElevateToAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-surface text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Switch to Administrator</span>
            </button>
          )}
          <button
            onClick={() => openAuthModal()}
            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-subtle text-xs text-on-surface-variant hover:text-on-surface transition-all"
          >
            Switch Account
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-primary/10 border border-primary/25 rounded-2xl text-xs text-primary font-mono flex items-center gap-2.5 shadow-glow-primary">
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-mono flex items-center gap-2.5 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-container-low border border-border-subtle overflow-x-auto">
        {[
          { key: 'providers', label: 'Media Providers', icon: Shield },
          { key: 'preferences', label: 'User Preferences', icon: Sliders },
          { key: 'storage', label: 'Storage & Scanners', icon: HardDrive },
          { key: 'diagnostics', label: 'Cluster Diagnostics', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-primary text-on-primary border-primary shadow-glow-primary'
                  : 'bg-transparent text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-high'
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
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-bold text-on-surface">Configured Media Providers</h2>
              <p className="text-xs text-on-surface-variant">Toggle active federated providers and manage secure access tokens</p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-subtle text-xs text-on-surface-variant hover:text-on-surface transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
              <span>Refresh Providers</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map(provider => {
              const isEditing = editingProviderId === provider.id;
              const isTesting = testingProviderId === provider.id;
              return (
                <div
                  key={provider.id}
                  className="rounded-2xl bg-surface-container-low border border-border-subtle hover:border-primary/40 p-5 flex flex-col justify-between space-y-4 card-hover-lift shadow-lg transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-bold text-on-surface text-sm">{provider.name}</h3>
                        <p className="text-[11px] font-mono text-on-surface-variant">v{provider.version} • {provider.author}</p>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-lg border ${
                          provider.health_status === 'healthy'
                            ? 'bg-tertiary/10 text-tertiary border-tertiary/30'
                            : provider.health_status === 'degraded'
                            ? 'bg-secondary/10 text-secondary border-secondary/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {provider.health_status}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                      {provider.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {provider.capabilities.map(cap => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded-lg bg-surface-container-high border border-border-subtle text-[10px] font-mono text-primary uppercase tracking-wider"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-on-surface-variant">Provider Online</span>
                      <button
                        onClick={() => handleToggle(provider)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          provider.is_enabled ? 'bg-primary' : 'bg-surface-container-highest'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-on-primary shadow-lg ring-0 transition duration-200 ease-in-out ${
                            provider.is_enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Test Ping Action */}
                    <button
                      onClick={() => handleTestProvider(provider.id)}
                      disabled={isTesting}
                      className="w-full py-1.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-subtle text-xs text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Radio className={`w-3.5 h-3.5 text-primary ${isTesting ? 'animate-pulse' : ''}`} />
                      <span>{isTesting ? 'Testing Latency...' : 'Ping Provider Link'}</span>
                    </button>

                    {/* Credentials config if TMDB */}
                    {provider.id === 'tmdb_provider' && (
                      <div>
                        {isEditing ? (
                          <div className="space-y-2 pt-2">
                            <div className="relative">
                              <input
                                type={showKey ? 'text' : 'password'}
                                placeholder="Enter API Key / Token"
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                                className="w-full bg-surface-container-highest border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary pr-8"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2.5 top-2 text-on-surface-variant hover:text-on-surface"
                              >
                                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveConfig(provider.id)}
                                className="px-3.5 py-1 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary-hover shadow-glow-primary"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProviderId(null)}
                                className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs rounded-xl hover:bg-surface-container-highest"
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
                            className="w-full py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-xs text-primary flex items-center justify-center gap-1.5 transition-colors"
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
        <form onSubmit={handleSavePreferences} className="rounded-2xl bg-surface-container-low border border-border-subtle p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h2 className="text-base font-display font-bold text-on-surface">Playback & Reader Preferences</h2>
              <p className="text-xs text-on-surface-variant">Tailor your personal viewing resolution and reading typography</p>
            </div>
            <button
              type="submit"
              disabled={savingPrefs}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-xl transition-all shadow-glow-primary disabled:opacity-50"
            >
              {savingPrefs ? 'Saving Changes...' : 'Save Preferences'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Playback Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-display font-semibold text-primary">
                <Film className="w-4 h-4" />
                <span>Video Playback Settings</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant">Preferred Streaming Quality</label>
                <select
                  value={preferences.preferred_quality}
                  onChange={e => setPreferences({ ...preferences, preferred_quality: e.target.value })}
                  className="w-full bg-surface-container-highest border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="4k">4K Ultra HD (2160p Master)</option>
                  <option value="1080p">Full HD (1080p) — Recommended</option>
                  <option value="720p">High Definition (720p)</option>
                  <option value="auto">Adaptive Auto Direct Play</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-highest border border-border-subtle">
                <div>
                  <div className="text-xs font-medium text-on-surface">Auto-Play Next Episode</div>
                  <div className="text-[11px] text-on-surface-variant">Seamlessly stream series episodes without prompts</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.auto_play_next}
                  onChange={e => setPreferences({ ...preferences, auto_play_next: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant">Default Subtitle Language</label>
                <input
                  type="text"
                  value={preferences.default_subtitle_language}
                  onChange={e => setPreferences({ ...preferences, default_subtitle_language: e.target.value })}
                  placeholder="en, ja, es..."
                  className="w-full bg-surface-container-highest border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Reader Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-display font-semibold text-tertiary">
                <BookOpen className="w-4 h-4" />
                <span>Editorial Reader Typography</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant">Reader Colorway Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'obsidian', label: 'Obsidian Dark' },
                    { id: 'sepia', label: 'Warm Sepia' },
                    { id: 'light', label: 'Clean Paper' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, reader_theme: t.id })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                        preferences.reader_theme === t.id
                          ? 'border-tertiary bg-tertiary/15 text-tertiary font-bold shadow-glow-tertiary'
                          : 'border-border-subtle bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-on-surface-variant">Editorial Font Size</span>
                  <span className="text-tertiary font-bold">{preferences.reader_font_size}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={preferences.reader_font_size}
                  onChange={e => setPreferences({ ...preferences, reader_font_size: parseInt(e.target.value) })}
                  className="w-full accent-tertiary cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant">Typography Family</label>
                <select
                  value={preferences.reader_font_family}
                  onChange={e => setPreferences({ ...preferences, reader_font_family: e.target.value })}
                  className="w-full bg-surface-container-highest border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-tertiary transition-colors"
                >
                  <option value="sans">Plus Jakarta Sans / Modern Sans</option>
                  <option value="serif">Merriweather Editorial Serif</option>
                  <option value="mono">JetBrains Mono Technical</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Storage & Scanners */}
      {activeTab === 'storage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-tertiary/15 text-tertiary border border-tertiary/25 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-bold text-on-surface">Local Media Storage Paths</h2>
                  <p className="text-xs text-on-surface-variant">Phase 14 Filesystem Direct Play</p>
                </div>
              </div>
              {localStatus && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-tertiary/15 text-tertiary border border-tertiary/30">
                  {localStatus.indexed_local_media_count} Indexed Items
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mount local folders or network NAS shares for high-throughput video streams and EPUB digital literature with HTTP Range byte-seeking.
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3.5 rounded-xl bg-surface-container-highest border border-border-subtle space-y-1">
                <div className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider">Video Mount Path</div>
                <div className="text-xs font-mono text-tertiary break-all">
                  {localStatus ? localStatus.media_storage_path : './data/media'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-highest border border-border-subtle space-y-1">
                <div className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-wider">Literature Mount Path</div>
                <div className="text-xs font-mono text-tertiary break-all">
                  {localStatus ? localStatus.books_storage_path : './data/books'}
                </div>
              </div>
            </div>

            {scanSummary && (
              <div className="p-3.5 rounded-xl bg-tertiary/10 border border-tertiary/30 text-xs text-tertiary space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Filesystem Scan Completed</span>
                </div>
                <div className="text-[11px] font-mono text-tertiary/80">
                  Processed {scanSummary.scanned_files} files • Added {scanSummary.movies_added} movies, {scanSummary.episodes_added} episodes, {scanSummary.books_added} books.
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleScanDirectories}
                disabled={scanning}
                className="w-full py-2.5 px-4 rounded-xl bg-tertiary hover:bg-tertiary/90 text-surface text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-glow-tertiary disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing Local Folders...</span>
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

          <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold text-on-surface">Security & Compliance Guardrails</h2>
                <p className="text-xs text-on-surface-variant">Strictly authorized data channels</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Every provider module enforces zero unauthorized scraping, no DRM circumvention, path traversal containment, and SSRF address protection.
            </p>
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-on-surface">
                <CheckCircle2 className="w-4 h-4 text-tertiary flex-shrink-0" />
                <span>RFC 7233 HTTP Byte Range seeking verified</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-on-surface">
                <CheckCircle2 className="w-4 h-4 text-tertiary flex-shrink-0" />
                <span>SSRF verification & path traversal sandboxing</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-on-surface">
                <CheckCircle2 className="w-4 h-4 text-tertiary flex-shrink-0" />
                <span>Credential masking & token isolation</span>
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
              <h2 className="text-base font-display font-bold text-on-surface">Cluster Diagnostics & Telemetry</h2>
              <p className="text-xs text-on-surface-variant">Real-time node metrics, database entity counts, and disk capacity</p>
            </div>
            <button
              onClick={loadDiagnostics}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-subtle text-xs text-on-surface-variant hover:text-on-surface transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDiags ? 'animate-spin text-primary' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {!isAdmin && (
            <div className="p-6 rounded-2xl bg-surface-container-low border border-amber-500/30 text-amber-300 space-y-3 shadow-xl">
              <div className="flex items-center gap-2.5 font-bold text-sm font-display">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Restricted Telemetry Endpoint (RBAC Protected)</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Hardware resource telemetry, internal cache metrics, and cluster node specifications require Administrator authorization.
              </p>
              <button
                onClick={handleElevateToAdmin}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-surface text-xs font-semibold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Elevate to Administrator (1-Click)</span>
              </button>
            </div>
          )}

          {diagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Host & Runtime */}
              <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-5 space-y-3 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  <Server className="w-4 h-4" />
                  <span>Host & Runtime</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Application:</span>
                    <span className="font-medium text-on-surface">{diagnostics.app_name} v{diagnostics.version}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Python:</span>
                    <span className="text-on-surface">{diagnostics.python_version}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Platform:</span>
                    <span className="text-on-surface">{diagnostics.os_system}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Cluster Mode:</span>
                    <span className="font-semibold text-tertiary uppercase">{diagnostics.environment}</span>
                  </div>
                </div>
              </div>

              {/* Database & Catalog */}
              <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-5 space-y-3 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-secondary uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>Catalog & Database</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Movies Indexed:</span>
                    <span className="font-semibold text-on-surface">{diagnostics.media_counts['movie'] || 0}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Series & Anime:</span>
                    <span className="font-semibold text-on-surface">{(diagnostics.media_counts['series'] || 0) + (diagnostics.media_counts['anime'] || 0)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Literature Items:</span>
                    <span className="font-semibold text-on-surface">{diagnostics.media_counts['book'] || 0}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Registered Users:</span>
                    <span className="font-semibold text-on-surface">{diagnostics.total_users}</span>
                  </div>
                </div>
              </div>

              {/* Memory Cache & Performance */}
              <div className="rounded-2xl bg-surface-container-low border border-border-subtle p-5 space-y-3 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-tertiary uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>Cache & Storage</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Active In-Memory TTL:</span>
                    <span className="font-semibold text-on-surface">{diagnostics.cache_entries} entries</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Active Sessions:</span>
                    <span className="font-semibold text-on-surface">{diagnostics.watch_sessions_count}</span>
                  </div>
                  {diagnostics.storage['media']?.free_gb !== undefined && (
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Available Disk:</span>
                      <span className="text-tertiary font-bold">{diagnostics.storage['media'].free_gb} GB</span>
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


