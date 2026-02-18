// ============================================================
// Axon v4.2 — API Provider (Infrastructure)
// Path: /src/app/lib/api-provider.tsx
// React Context + hook useApi() para acceso tipado al servidor.
//
// Usage:
//   <ApiProvider> wraps the app
//   const { api, userId, isAuthenticated } = useApi();
//   api.get('/flashcards/due', { course_id });
//
// When backend is not ready, components use MOCK data directly
// from /src/app/lib/mock-data.ts. When backend is ready, swap
// to api.get/post calls — the same hook, different data source.
// ============================================================

import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createApiClient, type ApiClient } from './api-client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const SERVER_PREFIX = '/make-server-7a20cd7d';
const BASE_URL = `https://${projectId}.supabase.co/functions/v1${SERVER_PREFIX}`;

interface ApiContextValue {
  api: ApiClient;
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setUserId: (id: string | null) => void;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Create API client — uses accessToken if available, falls back to publicAnonKey
  const api = useMemo(
    () => createApiClient(BASE_URL, accessToken ?? publicAnonKey),
    [accessToken],
  );

  const value = useMemo<ApiContextValue>(
    () => ({
      api,
      userId,
      accessToken,
      isAuthenticated: !!accessToken && !!userId,
      setAccessToken,
      setUserId,
    }),
    [api, userId, accessToken],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

/**
 * Hook to access the typed API client and auth state.
 * Must be used within <ApiProvider>.
 */
export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('useApi() must be used within <ApiProvider>');
  }
  return ctx;
}