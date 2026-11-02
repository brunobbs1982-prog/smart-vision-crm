/**
 * Cliente HTTP do backend SMART V.I.S.I.O.N.
 * Se o backend não estiver no ar, as funções lançam erro e o frontend
 * continua usando o store local (Zustand).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sv_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('sv_token', token);
  else localStorage.removeItem('sv_token');
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string) {
  const data = await apiFetch<{ access_token: string; user: Record<string, unknown> }>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
  setToken(data.access_token);
  return data;
}

export async function apiHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${API_URL}/health`, { method: 'GET' });
    return r.ok;
  } catch {
    return false;
  }
}

export async function apiStartGmailOAuth(): Promise<{
  mode: 'demo' | 'oauth';
  authUrl?: string | null;
  message?: string;
  connection?: Record<string, unknown>;
}> {
  return apiFetch('/api/v1/channels/gmail/oauth/start');
}

export async function apiRunAgentCycle() {
  return apiFetch<{ processed: number; results: unknown[] }>('/api/v1/agent/run-cycle', {
    method: 'POST',
  });
}

export { API_URL };
