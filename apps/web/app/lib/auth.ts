const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface TokensResponse {
  access_token: string;
  refresh_token: string;
}

interface UserResponse {
  _id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

// --- Token helpers (localStorage) ---

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

export function setTokens(tokens: TokensResponse): void {
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// --- API calls ---

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { ...options, headers });

  // If 401 & we have a refresh token, try to refresh
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed.access_token}`;
      const retryRes = await fetch(url, { ...options, headers });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ message: retryRes.statusText }));
        throw new Error(err.message || 'Request failed');
      }
      return retryRes.json();
    } else {
      clearTokens();
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json();
}

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<TokensResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Registration failed');
  }

  const tokens: TokensResponse = await res.json();
  setTokens(tokens);
  return tokens;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<TokensResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Login failed');
  }

  const tokens: TokensResponse = await res.json();
  setTokens(tokens);
  return tokens;
}

export async function refreshTokens(): Promise<TokensResponse | null> {
  const rt = getRefreshToken();
  if (!rt) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });

    if (!res.ok) return null;

    const tokens: TokensResponse = await res.json();
    setTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore errors during logout
  } finally {
    clearTokens();
  }
}

export async function fetchCurrentUser(): Promise<UserResponse | null> {
  try {
    return await apiFetch('/auth/me');
  } catch {
    return null;
  }
}

export { type TokensResponse, type UserResponse };
