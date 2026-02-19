// ============================================================
// Axon v4.4 — Auth Context (FIXED: merged Dev 3 + Dev 5/6)
// ============================================================
//
// FIXES APPLIED:
//   1. Uses config.ts for apiBaseUrl (NOT hardcoded Figma Make URL)
//   2. Uses supabase-client.ts singleton (NOT inline createClient)
//   3. Imports types from types/auth.ts (NOT inline redefinition)
//   4. Includes selectInstitution + currentMembership (from Dev 5)
//   5. Has TOKEN_REFRESHED handler (from Dev 3)
//   6. Signup accepts institutionId param (from Dev 5)
//   7. MembershipRole uses canonical 4-role union (NOT 'institution_admin')
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase-client';
import { supabaseAnonKey, apiBaseUrl } from '../lib/config';
import type { AuthUser, Membership, Institution, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('[AuthContext] useAuth must be used within AuthProvider');
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to always read the latest accessToken (avoids stale closures in logout)
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  const isAuthenticated = !!user && !!accessToken;
  const clearError = useCallback(() => setError(null), []);

  // ── Helper: auto-select membership if only 1 ──
  const autoSelectMembership = useCallback((m: Membership[]) => {
    if (m.length === 1) {
      setCurrentMembership(m[0]);
      setCurrentInstitution(m[0].institution || null);
    }
  }, []);

  // ── Fetch user + memberships from GET /auth/me ──
  const fetchMe = useCallback(async (token: string): Promise<{ user: AuthUser; memberships: Membership[] } | null> => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.log('[AuthContext] GET /auth/me failed, status:', res.status);
        return null;
      }
      const data = await res.json();
      // Backend returns: { success: true, data: { user, memberships } }
      if (data.success && data.data) {
        return { user: data.data.user, memberships: data.data.memberships || [] };
      }
      // Fallback for unexpected shapes
      if (data.data?.user) return { user: data.data.user, memberships: data.memberships || [] };
      return null;
    } catch (err) {
      console.log('[AuthContext] Error fetching /auth/me:', err);
      return null;
    }
  }, []);

  // ── Session restore on mount ──
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr || !session?.access_token) {
          console.log('[AuthContext] No active session found');
          setIsLoading(false);
          return;
        }

        // Validate session with our server
        const me = await fetchMe(session.access_token);
        if (me) {
          setUser(me.user);
          setAccessToken(session.access_token);
          setMemberships(me.memberships);
          autoSelectMembership(me.memberships);
          console.log('[AuthContext] Session restored for:', me.user.email, `(${me.memberships.length} memberships)`);
        } else {
          // Fallback: backend unreachable, use Supabase session data
          const su = session.user;
          setUser({
            id: su.id,
            email: su.email || '',
            name: su.user_metadata?.name || su.email?.split('@')[0] || '',
            avatar_url: su.user_metadata?.avatar_url || null,
            is_super_admin: false,
            created_at: su.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setAccessToken(session.access_token);
          console.log('[AuthContext] Session restored (fallback, no /auth/me)');
        }
      } catch (err) {
        console.log('[AuthContext] Session restore failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [fetchMe, autoSelectMembership]);

  // ── Listen for Supabase auth state changes (token refresh, signout) ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state changed:', event);
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        console.log('[AuthContext] Token refreshed automatically');
        setAccessToken(session.access_token);
      } else if (event === 'SIGNED_OUT' || !session) {
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
      // Step 1: Sign in via Supabase client (sets local session)
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({ email, password });

      if (supaErr) {
        console.log('[AuthContext] signInWithPassword error:', supaErr.message);
        setError(supaErr.message);
        setIsLoading(false);
        return false;
      }

      const token = supaData.session?.access_token;
      if (!token) {
        setError('No access token received');
        setIsLoading(false);
        return false;
      }

      // Step 2: Get user + memberships from backend
      const me = await fetchMe(token);
      if (me) {
        setUser(me.user);
        setAccessToken(token);
        setMemberships(me.memberships);
        autoSelectMembership(me.memberships);
        console.log('[AuthContext] Login successful:', me.user.email);
      } else {
        // Fallback: use Supabase session data
        const su = supaData.session.user;
        setUser({
          id: su.id,
          email: su.email || '',
          name: su.user_metadata?.name || email.split('@')[0],
          avatar_url: su.user_metadata?.avatar_url || null,
          is_super_admin: false,
          created_at: su.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setAccessToken(token);
        console.log('[AuthContext] Login successful (fallback):', email);
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log('[AuthContext] Login error:', msg);
      setError(msg);
      setIsLoading(false);
      return false;
    }
  }, [fetchMe, autoSelectMembership]);

  // ── Signup ──
  const signup = useCallback(async (email: string, password: string, name: string, institutionId?: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ email, password, name, institution_id: institutionId }),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.error?.message || result.error || 'Signup failed');
        setIsLoading(false);
        return false;
      }

      // Auto-login after successful signup
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        console.log('[AuthContext] Auto-login after signup failed:', signInErr.message);
      }

      if (result.data?.user) {
        setUser(result.data.user);
        setAccessToken(result.data.access_token || null);
        const m = result.data.memberships || [];
        setMemberships(m);
        autoSelectMembership(m);
      }

      console.log('[AuthContext] Signup successful:', email);
      setIsLoading(false);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log('[AuthContext] Signup error:', msg);
      setError(msg);
      setIsLoading(false);
      return false;
    }
  }, [autoSelectMembership]);

  // ── Logout ──
  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = accessTokenRef.current;
      if (token) {
        await fetch(`${apiBaseUrl}/auth/signout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.log('[AuthContext] Logout cleanup error (non-fatal):', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setMemberships([]);
      setCurrentInstitution(null);
      setCurrentMembership(null);
      setError(null);
      console.log('[AuthContext] Logged out');
    }
  }, []);

  // ── Select Institution ──
  const selectInstitution = useCallback((instId: string) => {
    const membership = memberships.find((m) => m.institution_id === instId);
    if (membership) {
      setCurrentMembership(membership);
      setCurrentInstitution(membership.institution || null);
      console.log('[AuthContext] Selected institution:', instId, 'role:', membership.role);
    } else {
      console.log('[AuthContext] Institution not found in memberships:', instId);
    }
  }, [memberships]);

  const value: AuthContextType = {
    user,
    accessToken,
    memberships,
    currentInstitution,
    currentMembership,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    selectInstitution,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
