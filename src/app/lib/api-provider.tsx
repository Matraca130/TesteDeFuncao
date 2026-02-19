// ============================================================
// Axon v4.4 — API Provider (FIXED: uses config.ts)
// ============================================================
//
// FIXES APPLIED:
//   1. Uses apiBaseUrl from config.ts (NOT hardcoded Figma Make URL)
//   2. Uses supabaseAnonKey from config.ts (NOT /utils/supabase/info)
//   3. Works in both Figma Make and Production environments
// ============================================================
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiBaseUrl, supabaseAnonKey } from '../lib/config';

interface ApiClient {
  get: (path: string) => Promise<Response>;
  post: (path: string, body?: unknown) => Promise<Response>;
  put: (path: string, body?: unknown) => Promise<Response>;
  del: (path: string) => Promise<Response>;
  baseUrl: string;
}

interface ApiContextType {
  api: ApiClient;
}

const ApiContext = createContext<ApiContextType | null>(null);

export function useApi(): ApiContextType {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('[ApiProvider] useApi must be used within ApiProvider');
  }
  return ctx;
}

interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const { accessToken } = useAuth();

  const api = useMemo<ApiClient>(() => {
    const headers = (): Record<string, string> => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
    });

    return {
      baseUrl: apiBaseUrl,
      get: (path: string) => fetch(`${apiBaseUrl}${path}`, { headers: headers() }),
      post: (path: string, body?: unknown) =>
        fetch(`${apiBaseUrl}${path}`, {
          method: 'POST',
          headers: headers(),
          body: body ? JSON.stringify(body) : undefined,
        }),
      put: (path: string, body?: unknown) =>
        fetch(`${apiBaseUrl}${path}`, {
          method: 'PUT',
          headers: headers(),
          body: body ? JSON.stringify(body) : undefined,
        }),
      del: (path: string) =>
        fetch(`${apiBaseUrl}${path}`, { method: 'DELETE', headers: headers() }),
    };
  }, [accessToken]);

  return <ApiContext.Provider value={{ api }}>{children}</ApiContext.Provider>;
}
