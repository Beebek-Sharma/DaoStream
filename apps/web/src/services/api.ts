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
  media_type: 'movie' | 'series' | 'anime' | 'drama' | 'book';
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

