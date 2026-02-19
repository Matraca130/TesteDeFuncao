// ============================================================
// Axon v4.4 — App Context
// Global app-level state (theme, locale, notifications)
// ============================================================
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AppContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  locale: string;
  setLocale: (locale: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('[AppContext] useApp must be used within AppProvider');
  }
  return ctx;
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [locale, setLocale] = useState('pt-BR');

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const value: AppContextType = {
    theme,
    setTheme,
    locale,
    setLocale,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
