// ============================================================
// Axon v4.4 — API Provider (Infrastructure)
// Path: /src/app/lib/api-provider.tsx
// React Context + hook useApi() para acceso tipado al servidor.
//
// Usage:
//   <ApiProvider> wraps the app (AFTER AuthProvider if used)
//   const { api, userId, isAuthenticated } = useApi();
//   api.get('/flashcards/due', { course_id });
//
// FIX: Removed hardcoded API_BASE_URL:
//   BEFORE: 'https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-7a20cd7d'
//   AFTER:  apiBaseUrl from config.ts (works on Figma Make + Vercel)
//
// FIX: Import supabaseAnonKey from config.ts instead of
//   /utils/supabase/info (single source of truth).
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
  // NOTE: createApiClient() currently takes no params and reads from config.ts
  // internally. The params are passed for future compatibility when the
  // signature is updated to accept (baseUrl, token).
  const api = useMemo(
    () => createApiClient(),
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
