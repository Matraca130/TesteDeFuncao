import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase-client';
import { supabaseAnonKey, apiBaseUrl } from '../lib/config';
import type { AuthUser, Membership, MembershipRole, Institution } from '../types/auth';

// Re-export for consumers that import from AuthContext
export type { AuthUser, Membership } from '../types/auth';

// ════════════════════════════════════════════════════════════
// AUTH CONTEXT — Supabase Auth integration for Axon v4.4
//
// Provides: login, signup, logout, session restore, selectInstitution
// Uses singleton Supabase client from lib/supabase-client.ts
//
// FIX (Dev3 T3.2):
//   - Types imported from types/auth.ts (no inline definitions)
//   - Login: signInWithPassword + GET /auth/me (no double signin)
//   - Signup: accepts optional institutionId (4th param)
//   - Added selectInstitution(), currentInstitution, currentMembership
//   - isLoading managed in login/signup via try/finally
// ════════════════════════════════════════════════════════════

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  memberships: Membership[];
  currentInstitution: Institution | null;
  currentMembership: Membership | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, institutionId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  selectInstitution: (instId: string) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  memberships: [],
  currentInstitution: null,
  currentMembership: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => false,
  signup: async () => false,
  logout: async () => {},
  selectInstitution: () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(null);
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
          console.log(`[Auth] Session restored for: ${data.data.user.email}`);
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
        setCurrentInstitution(null);
        setCurrentMembership(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ──
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      // Paso 1: signIn LOCAL (única vez)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.log(`[Auth] Login failed for ${email}: ${error.message}`);
        setError(error.message);
        return false;
      }
      const token = data.session?.access_token;
      if (!token) {
        setError('No token received');
        return false;
      }

      // Paso 2: GET /auth/me (NO POST /auth/signin)
      const res = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (!result.success) {
        await supabase.auth.signOut().catch(() => {});
        setError(result.error?.message || 'Failed to load profile');
        return false;
      }

      setUser(result.data.user);
      setAccessToken(token);
      setMemberships(result.data.memberships || []);
      console.log(`[Auth] Login successful: ${email}`);
      return true;
    } catch (err: any) {
      console.log(`[Auth] Login error: ${err.message || err}`);
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Signup ──
  const signup = useCallback(async (
    email: string,
    password: string,
    name: string,
    institutionId?: string
  ): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const body: Record<string, string> = { email, password, name };
      if (institutionId) body.institution_id = institutionId;

      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error?.message || 'Signup failed');
        return false;
      }

      // Auto-login: set the session in Supabase client
      if (result.data.access_token) {
        await supabase.auth.signInWithPassword({ email, password });
      }

      setUser(result.data.user);
      setAccessToken(result.data.access_token);
      setMemberships(result.data.memberships || []);
      console.log(`[Auth] Signup successful: ${email}`);
      return true;
    } catch (err: any) {
      console.log(`[Auth] Signup error: ${err.message || err}`);
      setError(err.message || 'Signup failed');
      return false;
    } finally {
      setIsLoading(false);
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
      setCurrentInstitution(null);
      setCurrentMembership(null);
      setError(null);
      console.log('[Auth] Logged out');
    }
  }, []); // stable — reads token from ref

  // ── Select Institution ──
  const selectInstitution = useCallback((instId: string) => {
    const m = memberships.find(m => m.institution_id === instId);
    if (m) {
      setCurrentMembership(m);
      // Fetch institution data
      fetch(`${apiBaseUrl}/institutions/${instId}`, {
        headers: { Authorization: `Bearer ${accessToken || supabaseAnonKey}` },
      })
        .then(r => r.json())
        .then(result => {
          if (result.success) {
            setCurrentInstitution(result.data);
            console.log(`[Auth] Selected institution: ${result.data.name} (role: ${m.role})`);
          }
        })
        .catch(err => console.log(`[Auth] Failed to fetch institution: ${err.message}`));
    }
  }, [memberships, accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        memberships,
        currentInstitution,
        currentMembership,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        error,
        login,
        signup,
        logout,
        selectInstitution,
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
