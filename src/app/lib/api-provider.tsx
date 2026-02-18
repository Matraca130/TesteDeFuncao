// ============================================================
// Axon v4.4 — API Provider (React Context + hook)
// Provides the ApiClient via useApi() hook
// ============================================================
import React, { createContext, useContext, useMemo } from 'react';
import { createApiClient, type ApiClient } from './api-client';

interface ApiContextValue {
  api: ApiClient;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ApiContextValue>(() => ({
    api: createApiClient(),
  }), []);

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('useApi() must be used within <ApiProvider>');
  }
  return ctx;
}
