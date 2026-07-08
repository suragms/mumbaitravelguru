const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5189';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onTokenRefreshed: ((token: string, refresh: string) => void) | null = null;

export function setTokens(token: string, refresh: string) {
  accessToken = token;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('mtg_token', token);
    localStorage.setItem('mtg_refresh', refresh);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mtg_token');
    localStorage.removeItem('mtg_refresh');
    localStorage.removeItem('mtg_user');
  }
}

export function loadTokens() {
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('mtg_token');
    refreshToken = localStorage.getItem('mtg_refresh');
  }
}

export function setTokenRefreshHandler(handler: (token: string, refresh: string) => void) {
  onTokenRefreshed = handler;
}

export function getStoredToken() {
  return accessToken;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  loadTokens();
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });

  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: accessToken, refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTokens(data.token, data.refreshToken);
        onTokenRefreshed?.(data.token, data.refreshToken);

        headers['Authorization'] = `Bearer ${data.token}`;
        response = await fetch(url, {
          ...options,
          headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
        });
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }
    } catch {
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}
