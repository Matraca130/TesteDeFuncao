import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase-client';
import { supabaseAnonKey, apiBaseUrl } from '../lib/config';

// ════════════════════════════════════════════════════════════
// AUTH CONTEXT — Supabase Auth integration for Axon v4.4
//
// Provides: login, signup, logout, session restore
// Uses singleton Supabase client from lib/supabase-client.ts
//
// FIX: Removed hardcoded API_BASE URL:
//   BEFORE: 'https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-7a20cd7d'
//   AFTER:  apiBaseUrl from config.ts (works on Figma Make + Vercel)
//
// FIX: Import supabase from lib/supabase-client (not services/)
//   to ensure the same singleton is used everywhere.
//
// FIX: Import supabaseAnonKey from config.ts (not /utils/supabase/info)
//   for single source of truth.
//
// FIX: Added onAuthStateChange listener for TOKEN_REFRESHED
//   to keep accessToken in sync when Supabase auto-refreshes.
// ════════════════════════════════════════════════════════════

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
  id: string;
  user_id: string;
  institution_id: string;
  role: 'institution_admin' | 'professor' | 'student';
  joined_at: string;
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
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to always read the latest accessToken — used by logout to avoid stale closure
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  const clearError = useCallback(() => setError(null), []);

  // ── Session restore on mount ──
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr || !session?.access_token) {
          console.log('[Auth] No active session found');
          setIsLoading(false);
          return;
        }

        // Validate session with our server
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        const data = await res.json();

        if (data.success && data.data?.user) {
          setUser(data.data.user);
          setAccessToken(session.access_token);
          setMemberships(data.data.memberships || []);
          console.log('[Auth] Session restored for:', data.data.user.email);
        }
      } catch (err) {
        console.log('[Auth] Session restore failed (user not logged in)');
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // ── Listen for Supabase auth state changes (token refresh, etc.) ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        console.log('[Auth] Token refreshed automatically');
        setAccessToken(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAccessToken(null);
        setMemberships([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ──
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      // Sign in via Supabase client (sets local session cookie)
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supaErr) {
        console.error('[Auth] signInWithPassword error:', supaErr.name, supaErr.message, supaErr.status);
        setError(supaErr.message);
        return false;
      }

      const token = supaData.session?.access_token;
      if (!token) {
        setError('No access token received');
        return false;
      }

      // Get user data from our server
      const res = await fetch(`${apiBaseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!result.success) {
        // Cleanup: Supabase session created in step 1, but backend
        // rejected in step 2. Sign out to avoid orphaned session.
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
      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
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
        await fetch(`${apiBaseUrl}/auth/signout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => {});
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
