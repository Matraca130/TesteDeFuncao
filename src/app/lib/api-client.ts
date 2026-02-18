// ============================================================
// Axon v4.4 — API Client (typed fetch wrapper)
// Connects to the LIVE Supabase Edge Function backend
// ============================================================
import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8cb6316a`;

export interface ApiError {
  success: false;
  error: { code?: string; message: string; details?: unknown };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ApiClient {
  get: <T = unknown>(path: string, params?: Record<string, string>) => Promise<T>;
  post: <TBody = unknown, TRes = unknown>(path: string, body?: TBody) => Promise<TRes>;
  put: <TBody = unknown, TRes = unknown>(path: string, body?: TBody) => Promise<TRes>;
  del: <T = unknown>(path: string) => Promise<T>;
  /** Always uses publicAnonKey — bypasses authToken. For unauthenticated endpoints like /health */
  publicGet: <T = unknown>(path: string, params?: Record<string, string>) => Promise<T>;
  /** Always uses publicAnonKey — for auth endpoints like /auth/signin, /auth/signup */
  publicPost: <TBody = unknown, TRes = unknown>(path: string, body?: TBody) => Promise<TRes>;
  setAuthToken: (token: string | null) => void;
  getAuthToken: () => string | null;
  /** Set an async token getter (e.g. from Supabase client session). Takes priority over static authToken. */
  setTokenGetter: (fn: (() => Promise<string | null>) | null) => void;
}

export function createApiClient(): ApiClient {
  let authToken: string | null = null;
  let tokenGetter: (() => Promise<string | null>) | null = null;

  async function getAuthHeaders(): Promise<Record<string, string>> {
    let token = authToken;
    if (tokenGetter) {
      try {
        const freshToken = await tokenGetter();
        if (freshToken) token = freshToken;
      } catch (e) {
        console.warn('[API] Token getter failed, falling back to static token:', e);
      }
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || publicAnonKey}`,
    };
  }

  function publicHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
    };
  }

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
    usePublicKey = false,
  ): Promise<T> {
    let url = `${BASE_URL}${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) url += `?${qs}`;
    }

    const hdrs = usePublicKey ? publicHeaders() : await getAuthHeaders();

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: hdrs,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (networkErr) {
      console.error(`[API] ${method} ${path} network error:`, networkErr);
      throw new Error(`Network error calling ${method} ${path}: ${networkErr}`);
    }

    // Handle Supabase Edge Function JWT rejection (returns 401 before reaching our Hono router)
    if (res.status === 401 && !usePublicKey) {
      let body401: any;
      try { body401 = await res.clone().json(); } catch { body401 = {}; }
      const msg = body401?.message || body401?.error?.message || '';
      // If it's a Supabase infra-level JWT rejection (not our app's UNAUTHORIZED),
      // clear the stale token and throw a clear error
      if (msg === 'Invalid JWT' || msg === 'JWT expired') {
        console.warn(`[API] ${method} ${path}: Supabase rejected JWT (${msg}). Token may be expired.`);
        throw new Error(`AUTH_EXPIRED: ${msg}`);
      }
    }

    let json: any;
    try {
      json = await res.json();
    } catch (parseErr) {
      console.error(`[API] ${method} ${path} invalid JSON (status ${res.status}):`, parseErr);
      throw new Error(`Invalid JSON from ${method} ${path} (HTTP ${res.status})`);
    }

    if (!json.success) {
      const err = json as ApiError;
      console.error(`[API] ${method} ${path} failed:`, err.error || json);
      throw new Error(err.error?.message || json?.message || `API error: ${res.status}`);
    }

    return (json as ApiSuccess<T>).data;
  }

  return {
    get: <T = unknown>(path: string, params?: Record<string, string>) =>
      request<T>('GET', path, undefined, params),
    post: <TBody = unknown, TRes = unknown>(path: string, body?: TBody) =>
      request<TRes>('POST', path, body),
    put: <TBody = unknown, TRes = unknown>(path: string, body?: TBody) =>
      request<TRes>('PUT', path, body),
    del: <T = unknown>(path: string) =>
      request<T>('DELETE', path),
    publicGet: <T = unknown>(path: string, params?: Record<string, string>) =>
      request<T>('GET', path, undefined, params, true),
    publicPost: <TBody = unknown, TRes = unknown>(path: string, body?: TBody) =>
      request<TRes>('POST', path, body, undefined, true),
    setAuthToken: (token: string | null) => { authToken = token; },
    getAuthToken: () => authToken,
    setTokenGetter: (fn: (() => Promise<string | null>) | null) => { tokenGetter = fn; },
  };
}