// ============================================================
// Axon v4.4 — AuthContext (WIRED by Agent 4 P3)
// NOW: calls setApiAuthToken() on login/refresh/logout
// so api-core.ts automatically includes Bearer token.
//
// FIX: Changed import from api-client → api-core so the token
// is stored in the same module that Owner/Admin read from.
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase-client';
import { supabaseAnonKey, apiBaseUrl } from '../lib/config';
import { setApiAuthToken } from '../lib/api-core';
import type { AuthUser, Membership, Institution, AuthContextType } from '../../types/auth';

const AuthContext = createContext<AuthContextType>({
  user: null, accessToken: null, memberships: [], currentInstitution: null,
  currentMembership: null, isAuthenticated: false, isLoading: true, error: null,
  login: async () => false, signup: async () => false, logout: async () => {},
  clearError: () => {}, selectInstitution: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(null);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);
  const clearError = useCallback(() => setError(null), []);

  // FIX: sync token to api-core (not api-client) so Owner/Admin get the token
  useEffect(() => {
    setApiAuthToken(accessToken);
  }, [accessToken]);

  const selectInstitution = useCallback((instId: string) => {
    const membership = memberships.find((m) => m.institution_id === instId);
    if (!membership) { console.warn(`[Auth] selectInstitution: no membership for instId=${instId}`); return; }
    setCurrentMembership(membership);
    const inst = (membership as any).institution as Institution | undefined;
    if (inst) { setCurrentInstitution(inst); }
    else { setCurrentInstitution({ id: instId, name: instId, slug: '' }); }
    console.log(`[Auth] Selected institution: ${instId}, role: ${membership.role}`);
  }, [memberships]);

  const fetchProfile = useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user); setAccessToken(token); setMemberships(data.data.memberships || []);
        console.log(`[Auth] Profile loaded: ${data.data.user.email}, ${(data.data.memberships || []).length} memberships`);
        return true;
      }
      console.warn('[Auth] /auth/me returned:', data.error?.message || 'unknown error');
      return false;
    } catch (err) { console.error('[Auth] fetchProfile error:', err); return false; }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !session?.access_token) { setIsLoading(false); return; }
        await fetchProfile(session.access_token);
      } catch (err) { console.log('[Auth] Session restore failed:', err); }
      finally { setIsLoading(false); }
    })();
  }, [fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        setAccessToken(session.access_token);
      }
      else if (event === 'SIGNED_OUT') {
        setUser(null); setAccessToken(null); setMemberships([]);
        setCurrentMembership(null); setCurrentInstitution(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({ email, password });
      if (supaErr) { setError(supaErr.message); return false; }
      const token = supaData.session?.access_token;
      if (!token) { setError('No access token'); return false; }
      const ok = await fetchProfile(token);
      if (!ok) { await supabase.auth.signOut().catch(() => {}); setError('Failed to load profile'); return false; }
      return true;
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : String(err); setError(msg); return false; }
  }, [fetchProfile]);

  const signup = useCallback(async (email: string, password: string, name: string, institutionId?: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ email, password, name, institution_id: institutionId }),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error?.message || 'Signup failed'); return false; }
      if (result.data?.access_token) { await supabase.auth.signInWithPassword({ email, password }); }
      setUser(result.data.user); setAccessToken(result.data.access_token || null); setMemberships(result.data.memberships || []);
      return true;
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : String(err); setError(msg); return false; }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = accessTokenRef.current;
      if (token) { await fetch(`${apiBaseUrl}/auth/signout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => {}); }
      await supabase.auth.signOut();
    } catch {} finally {
      setUser(null); setAccessToken(null); setMemberships([]);
      setCurrentMembership(null); setCurrentInstitution(null); setError(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, memberships, currentInstitution, currentMembership, isAuthenticated: !!user && !!accessToken, isLoading, error, login, signup, logout, clearError, selectInstitution }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType { return useContext(AuthContext); }
