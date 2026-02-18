// ============================================================
// Axon v4.4 — API Provider (Infrastructure)
// Path: /src/app/lib/api-provider.tsx
// React Context + hook useApi() para acceso tipado al servidor.
//
// Usage:
//   <ApiProvider> wraps the app (AFTER AuthProvider)
//   const { api, userId, isAuthenticated } = useApi();
//   api.get('/flashcards/due', { course_id });
//
// Step 9: Derives token + userId from AuthContext (single source
// of truth). Previously had its own useState which was NEVER
// synced — login()/logout() were dead code, isAuthenticated was
// always false, and api always used publicAnonKey.
// ============================================================

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createApiClient, type ApiClient } from './api-client';
import { useAuth } from '../context/AuthContext';
import { publicAnonKey } from '/utils/supabase/info';

// HARDCODED — backend URL. DO NOT use projectId for this.
const API_BASE_URL = 'https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-7a20cd7d';

interface ApiContextValue {
  api: ApiClient;
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  // Step 9: Derive from AuthContext — no more duplicate state
  const { accessToken, user } = useAuth();

  // Create API client — uses user JWT if available, falls back to publicAnonKey
  const api = useMemo(
    () => createApiClient(API_BASE_URL, accessToken ?? publicAnonKey),
    [accessToken],
  );

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
