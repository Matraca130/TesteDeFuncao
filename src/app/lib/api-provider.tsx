// ============================================================
// Axon v4.4 — API Provider (Infrastructure)
// Path: /src/app/lib/api-provider.tsx
// React Context + hook useApi() para acceso tipado al servidor.
//
// Usage:
//   <ApiProvider> wraps the app
//   const { api, userId, isAuthenticated, login, logout } = useApi();
//   api.get('/flashcards/due', { course_id });
//
// Integrates with AuthContext: when user logs in via AuthContext,
// call login(accessToken, userId) to wire the API client.
// ============================================================

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createApiClient, type ApiClient } from './api-client';
import { publicAnonKey } from '/utils/supabase/info';

// HARDCODED — backend URL. DO NOT use projectId for this.
const API_BASE_URL = 'https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-7a20cd7d';

interface ApiContextValue {
  api: ApiClient;
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, uid: string) => void;
  logout: () => void;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Create API client — uses accessToken if available, falls back to publicAnonKey
  const api = useMemo(
    () => createApiClient(API_BASE_URL, accessToken ?? publicAnonKey),
    [accessToken],
  );

  const login = useCallback((token: string, uid: string) => {
    setAccessToken(token);
    setUserId(uid);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUserId(null);
  }, []);

  const value = useMemo<ApiContextValue>(
    () => ({
      api,
      userId,
      accessToken,
      isAuthenticated: !!accessToken && !!userId,
      login,
      logout,
    }),
    [api, userId, accessToken, login, logout],
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
