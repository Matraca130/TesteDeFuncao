// ============================================================
// Axon v4.4 — API Provider (Infrastructure)
// Path: /src/app/lib/api-provider.tsx
// React Context + hook useApi() para acceso tipado al servidor.
//
// FIX (Dev3 T3.4):
//   - Now calls client.setAuthToken(accessToken) so the API client
//     actually uses the user's JWT instead of supabaseAnonKey.
// ============================================================

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createApiClient, type ApiClient } from './api-client';
import { useAuth } from '../context/AuthContext';
import { supabaseAnonKey, apiBaseUrl } from './config';

interface ApiContextValue {
  api: ApiClient;
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  // Derive from AuthContext — no more duplicate state
  const { accessToken, user } = useAuth();

  // Create API client — uses user JWT if available, falls back to supabaseAnonKey
  const api = useMemo(() => {
    const client = createApiClient();
    if (accessToken) {
      client.setAuthToken(accessToken);
    }
    return client;
  }, [accessToken]);

  const value = useMemo<ApiContextValue>(
    () => ({
      api,
      userId: user?.id ?? null,
      accessToken,
      isAuthenticated: !!accessToken && !!user,
    }),
    [api, user, accessToken],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

/**
 * Hook to access the typed API client and auth state.
 * Must be used within <ApiProvider> (which must be within <AuthProvider>).
 */
export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('useApi() must be used within <ApiProvider>');
  }
  return ctx;
}
