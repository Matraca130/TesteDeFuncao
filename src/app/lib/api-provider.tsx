// ============================================================
// Axon v4.4 — API Provider (Dev 3)
// Provides a configured API client to the entire app
// ============================================================
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-50277a39`;

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
      Authorization: `Bearer ${accessToken || publicAnonKey}`,
    });

    return {
      baseUrl: BASE_URL,
      get: (path: string) => fetch(`${BASE_URL}${path}`, { headers: headers() }),
      post: (path: string, body?: unknown) =>
        fetch(`${BASE_URL}${path}`, {
          method: 'POST',
          headers: headers(),
          body: body ? JSON.stringify(body) : undefined,
        }),
      put: (path: string, body?: unknown) =>
        fetch(`${BASE_URL}${path}`, {
          method: 'PUT',
          headers: headers(),
          body: body ? JSON.stringify(body) : undefined,
        }),
      del: (path: string) =>
        fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: headers() }),
    };
  }, [accessToken]);

  return <ApiContext.Provider value={{ api }}>{children}</ApiContext.Provider>;
}
