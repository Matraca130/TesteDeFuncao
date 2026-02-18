import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// ══════════════════════════════════════════════════════════
// AUTH CONTEXT — Supabase Auth integration for Axon
//
// Provides: login, signup, logout, session restore
// Auth header is auto-set after login for all API calls.
// ══════════════════════════════════════════════════════════

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0c4f6a3c`;

// ── Singleton Supabase Client ──
// Survives Vite HMR reloads — prevents "Multiple GoTrueClient instances" warning.
// Symbol.for guarantees the same symbol across module re-evaluations.
const SUPA_KEY = Symbol.for('axon-supabase');

function getSupabaseClient(): SupabaseClient {
  const g = globalThis as Record<symbol, unknown>;
  if (!g[SUPA_KEY]) {
    g[SUPA_KEY] = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return g[SUPA_KEY] as SupabaseClient;
}

const supabase = getSupabaseClient();

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  institution_id: string;
  user_id: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  memberships: Membership[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  /** Helper to make authenticated API calls */
  apiFetch: (path: string, options?: RequestInit) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  memberships: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => false,
  signup: async () => false,
  logout: async () => {},
  clearError: () => {},
  apiFetch: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to always read the latest accessToken — avoids stale closure in apiFetch
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  const clearError = useCallback(() => setError(null), []);

  // ── Authenticated fetch helper ──
  // Uses ref so the callback identity is stable and always reads the latest token
  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = accessTokenRef.current;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok || data.success === false) {
      const msg = data.error?.message || data.error || `Request failed: ${res.status}`;
      console.error(`[API] ${path} error:`, msg);
      throw new Error(msg);
    }

    return data.data !== undefined ? data.data : data;
  }, []); // stable — no dependency on accessToken, reads from ref

  // ── Session restore on mount ──
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr || !session?.access_token) {
          setIsLoading(false);
          return;
        }

        // Validate session with our server
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        const data = await res.json();

        if (data.success && data.data?.user) {
          setUser(data.data.user);
          setAccessToken(session.access_token);
          setMemberships(data.data.memberships || []);
          console.log('[Auth] Session restored for:', data.data.user.email);
        }
      } catch (err: unknown) {
        console.log('[Auth] Session restore failed (user not logged in)');
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // ── Login ──
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      // Step 1: Sign in via Supabase client (sets local session cookie)
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supaErr) {
        setError(supaErr.message);
        return false;
      }

      const token = supaData.session?.access_token;
      if (!token) {
        setError('No access token received');
        return false;
      }

      // Step 2: Get user data from our server
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!result.success) {
        // Cleanup: Step 1 created a Supabase session, but Step 2 failed.
        // Without cleanup, an orphaned session persists in localStorage,
        // causing restoreSession to behave unpredictably on next page load.
        await supabase.auth.signOut().catch(() => {});
        setError(result.error?.message || 'Login failed');
        return false;
      }

      setUser(result.data.user);
      setAccessToken(result.data.access_token || token);
      setMemberships(result.data.memberships || []);
      console.log('[Auth] Login successful:', email);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Auth] Login error:', msg);
      setError(msg);
      return false;
    }
  }, []);

  // ── Signup ──
  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email, password, name }),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error?.message || 'Signup failed');
        return false;
      }

      // Auto-login after signup: set the session in Supabase client too
      if (result.data.access_token) {
        await supabase.auth.signInWithPassword({ email, password });
      }

      setUser(result.data.user);
      setAccessToken(result.data.access_token);
      setMemberships([]);
      console.log('[Auth] Signup successful:', email);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Auth] Signup error:', msg);
      setError(msg);
      return false;
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    try {
      const token = accessTokenRef.current;
      if (token) {
        await fetch(`${API_BASE}/auth/signout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
      await supabase.auth.signOut();
    } catch (err: unknown) {
      console.log('[Auth] Logout cleanup error (non-fatal):', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setMemberships([]);
      setError(null);
      console.log('[Auth] Logged out');
    }
  }, []); // stable — reads token from ref

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        memberships,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        error,
        login,
        signup,
        logout,
        clearError,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
