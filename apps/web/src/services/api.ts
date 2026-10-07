export const API_BASE = '/api/v1';

export interface ProviderInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  supported_media_types: string[];
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unconfigured';
  is_enabled: boolean;
  config_schema?: Record<string, any>;
}

export interface MediaItem {
  provider_id: string;
  provider_media_id: string;
  title: string;
  original_title?: string;
  media_type: 'movie' | 'series' | 'anime' | 'drama' | 'book' | 'audio';
  year?: number;
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  rating?: number;
}

export interface MediaDetails extends MediaItem {
  genres: string[];
  tags: string[];
  release_date?: string;
  status?: string;
  duration_minutes?: number;
  total_seasons?: number;
  total_episodes?: number;
  seasons?: Array<{
    season_number: number;
    title?: string;
    overview?: string;
    episodes: Array<{
      id: string;
      episode_number: number;
      title?: string;
      overview?: string;
      duration_minutes?: number;
    }>;
  }>;
  author?: string;
  page_count?: number;
  isbn?: string;
  format?: string;
}

export interface PlaybackSource {
  id: string;
  title: string;
  quality: string;
  format: string;
  url: string;
  is_direct: boolean;
  subtitles?: Array<{
    id: string;
    language: string;
    label: string;
    url: string;
  }>;
}

// Token helper
export const getToken = (): string | null => localStorage.getItem('token');
export const setToken = (token: string) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export const authHeader = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  is_active: boolean;
  is_superuser: boolean;
  preferences?: Record<string, any>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

// Authentication API
export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_username: emailOrUsername, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Login failed. Check your credentials.');
  }
  const data: AuthResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function registerUser(email: string, username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Registration failed.');
  }
  const data: AuthResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

// Providers API
export async function fetchProviders(enabledOnly = false): Promise<ProviderInfo[]> {
  const res = await fetch(`${API_BASE}/providers?enabled_only=${enabledOnly}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function toggleProvider(id: string, enabled: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/providers/${id}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error('Failed to toggle provider');
  return res.json();
}

export async function configureProvider(id: string, config: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/providers/${id}/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) throw new Error('Failed to configure provider');
  return res.json();
}

// Media API
export async function searchMedia(query: string, mediaType?: string): Promise<MediaItem[]> {
  const params = new URLSearchParams({ query });
  if (mediaType) params.append('media_type', mediaType);
  const res = await fetch(`${API_BASE}/media/search?${params.toString()}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function fetchMediaDetails(mediaId: string, mediaType?: string): Promise<MediaDetails> {
  const params = new URLSearchParams();
  if (mediaType) params.append('media_type', mediaType);
  const url = `${API_BASE}/media/${mediaId}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error('Failed to fetch media details');
  return res.json();
}

export async function syncMedia(mediaId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/media/${mediaId}/sync`, {
    method: 'POST',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to sync media');
  return res.json();
}

// Playback API
export interface ResolvedPlayback {
  media_id: string;
  media_type: string;
  season_number?: number;
  episode_number?: number;
  primary_source?: PlaybackSource;
  sources: PlaybackSource[];
  available_qualities: string[];
  subtitles: Array<{ id: string; language: string; label: string; url: string; format: string }>;
  expires_in_seconds: number;
}

export async function resolvePlayback(
  mediaId: string,
  mediaType = 'movie',
  seasonNumber?: number,
  episodeNumber?: number,
  preferredQuality?: string
): Promise<ResolvedPlayback> {
  const params = new URLSearchParams({ media_type: mediaType });
  if (seasonNumber !== undefined) params.append('season_number', seasonNumber.toString());
  if (episodeNumber !== undefined) params.append('episode_number', episodeNumber.toString());
  if (preferredQuality) params.append('preferred_quality', preferredQuality);

  const res = await fetch(`${API_BASE}/playback/resolve/${mediaId}?${params.toString()}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Could not resolve playback stream');
  return res.json();
}

export async function updateWatchProgress(
  mediaId: string,
  currentTime: number,
  duration: number,
  completed = false,
  episodeId?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/library/progress/watch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({
      media_id: mediaId,
      episode_id: episodeId,
      current_time: Math.floor(currentTime),
      duration: Math.floor(duration),
      completed,
    }),
  });
  if (!res.ok) throw new Error('Failed to update watch progress');
  return res.json();
}

export async function fetchWatchProgress(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/library/progress/watch`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}

// Book & Reading Progress API
export interface BookChapter {
  chapter_index: number;
  title: string;
  word_count?: number;
}

export interface BookContent {
  provider_id: string;
  book_id: string;
  title: string;
  author?: string;
  total_chapters: number;
  chapters: BookChapter[];
}

export async function fetchBookContent(mediaId: string): Promise<BookContent> {
  const res = await fetch(`${API_BASE}/media/${mediaId}/book`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch book content');
  return res.json();
}

export async function fetchBookChapter(mediaId: string, chapterIndex: number): Promise<{ content: string }> {
  const res = await fetch(`${API_BASE}/media/${mediaId}/book/chapter/${chapterIndex}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch chapter text');
  return res.json();
}

export async function updateReadingProgress(
  mediaId: string,
  currentPage: number,
  totalPages: number,
  progressPercentage: number,
  lastLocation?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/library/progress/reading`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({
      media_id: mediaId,
      current_page: currentPage,
      total_pages: totalPages,
      progress_percentage: progressPercentage,
      last_location: lastLocation,
    }),
  });
  if (!res.ok) throw new Error('Failed to update reading progress');
  return res.json();
}

export async function fetchReadingProgress(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/library/progress/reading`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}

// Watchlist API
export async function fetchWatchlist(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/library/watchlist`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function addToWatchlist(mediaId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/library/watchlist/${mediaId}`, {
    method: 'POST',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to add to watchlist');
  return res.json();
}

export async function removeFromWatchlist(mediaId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/library/watchlist/${mediaId}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to remove from watchlist');
  return res.json();
}

// Favorites API
export async function fetchFavorites(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/library/favorites`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function addToFavorites(mediaId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/library/favorites/${mediaId}`, {
    method: 'POST',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to add to favorites');
  return res.json();
}

export async function removeFromFavorites(mediaId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/library/favorites/${mediaId}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to remove from favorites');
  return res.json();
}

// Collections API
export async function fetchCollections(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/library/collections`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createCollection(name: string, description?: string, isPublic = false): Promise<any> {
  const res = await fetch(`${API_BASE}/library/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ name, description, is_public: isPublic }),
  });
  if (!res.ok) throw new Error('Failed to create collection');
  return res.json();
}

export async function deleteCollection(collectionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/library/collections/${collectionId}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to delete collection');
  return res.json();
}

// Local Storage & Scanner API
export interface LocalStorageStatus {
  media_storage_path: string;
  media_storage_exists: boolean;
  books_storage_path: string;
  books_storage_exists: boolean;
  indexed_local_media_count: number;
}

export interface LocalScanSummary {
  scanned_files: number;
  movies_added: number;
  episodes_added: number;
  books_added: number;
  errors: string[];
}

export async function fetchLocalStatus(): Promise<LocalStorageStatus> {
  const res = await fetch(`${API_BASE}/local/status`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch local storage status');
  return res.json();
}

export async function scanLocalMedia(mediaPath?: string, booksPath?: string): Promise<LocalScanSummary> {
  const res = await fetch(`${API_BASE}/local/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ media_path: mediaPath, books_path: booksPath }),
  });
  if (!res.ok) throw new Error('Failed to scan local storage');
  return res.json();
}

// User Preferences API
export interface UserPreferences {
  preferred_quality: string;
  auto_play_next: boolean;
  default_subtitle_language: string;
  reader_theme: string;
  reader_font_size: number;
  reader_font_family: string;
  media_storage_path?: string;
  books_storage_path?: string;
}

export async function fetchUserPreferences(): Promise<UserPreferences> {
  const res = await fetch(`${API_BASE}/settings/preferences`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch user preferences');
  return res.json();
}

export async function updateUserPreferences(prefs: UserPreferences): Promise<UserPreferences> {
  const res = await fetch(`${API_BASE}/settings/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to update user preferences');
  return res.json();
}

// System Diagnostics API
export interface SystemDiagnostics {
  app_name: string;
  version: string;
  environment: string;
  python_version: string;
  os_system: string;
  cache_entries: number;
  media_counts: Record<string, number>;
  total_users: number;
  watch_sessions_count: number;
  reading_sessions_count: number;
  providers: {
    id: string;
    name: string;
    is_enabled: boolean;
    health_status: string;
    capabilities: string[];
  }[];
  storage: Record<
    string,
    {
      path: string;
      exists: boolean;
      total_gb?: number;
      used_gb?: number;
      free_gb?: number;
    }
  >;
}

export async function fetchSystemDiagnostics(): Promise<SystemDiagnostics> {
  const res = await fetch(`${API_BASE}/settings/diagnostics`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch system diagnostics');
  return res.json();
}

export async function testProviderConnection(providerId: string): Promise<{
  provider_id: string;
  name: string;
  status: string;
  is_healthy: boolean;
}> {
  const res = await fetch(`${API_BASE}/settings/providers/${providerId}/test`, {
    method: 'POST',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to test provider connection');
  return res.json();
}



