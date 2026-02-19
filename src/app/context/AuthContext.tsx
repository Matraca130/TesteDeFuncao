// ============================================================
// Axon v4.4 — Auth Context (Dev 3 + Dev 6 Integration Fixes)
// Provides authentication state & methods to the entire app
// Dev 6 fixes: fetchMemberships uses /auth/me, signup uses /auth/signup
// ============================================================
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import type { AuthUser, Membership, Institution, AuthContextType } from '../types/auth';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

// FIX Dev 6: Centralized API base URL for auth endpoints
const API_BASE = `${supabaseUrl}/functions/v1/make-server-50277a39`;

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

  const isAuthenticated = !!user && !!accessToken;

  // FIX Dev 6: Fetch memberships via GET /auth/me (the /memberships endpoint doesn't exist)
  // Returns memberships enriched with institution data from the backend.
  const fetchMemberships = useCallback(async (token: string): Promise<Membership[]> => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.log('[AuthContext] Failed to fetch from /auth/me, status:', res.status);
        return [];
      }
      const data = await res.json();
      // Backend returns: { success: true, data: { user, memberships } }
      if (data.success && data.data) {
        return data.data.memberships || [];
      }
      // Fallback for unexpected response shapes
      return data.memberships || [];
    } catch (err) {
      console.log('[AuthContext] Error fetching memberships:', err);
      return [];
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.log('[AuthContext] Session restore error:', sessionError.message);
          setIsLoading(false);
          return;
        }
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setUser(authUser);
          setAccessToken(session.access_token);

          const m = await fetchMemberships(session.access_token);
          setMemberships(m);

          // Auto-select if only one membership
          if (m.length === 1) {
            setCurrentMembership(m[0]);
            setCurrentInstitution(m[0].institution || null);
          }

          console.log('[AuthContext] Session restored for user:', authUser.email);
        }
      } catch (err) {
        console.log('[AuthContext] Unexpected error restoring session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setAccessToken(null);
        setMemberships([]);
        setCurrentInstitution(null);
        setCurrentMembership(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchMemberships]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        console.log('[AuthContext] Login error:', authError.message);
        setError(authError.message);
        setIsLoading(false);
        return false;
      }
      if (data.session) {
        const authUser: AuthUser = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || data.session.user.email || '',
          avatar_url: data.session.user.user_metadata?.avatar_url,
        };
        setUser(authUser);
        setAccessToken(data.session.access_token);

        const m = await fetchMemberships(data.session.access_token);
        setMemberships(m);

        if (m.length === 1) {
          setCurrentMembership(m[0]);
          setCurrentInstitution(m[0].institution || null);
        }

        console.log('[AuthContext] Login successful for:', authUser.email);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      console.log('[AuthContext] Unexpected login error:', err);
      setError('Erro inesperado ao fazer login');
      setIsLoading(false);
      return false;
    }
  }, [fetchMemberships]);

  const signup = useCallback(async (email: string, password: string, name: string, institutionId?: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      // FIX Dev 6: Correct path is /auth/signup (not /signup)
      // FIX Dev 6: Backend expects institution_id (not institutionId)
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name, institution_id: institutionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao criar conta' }));
        setError(data.error?.message || data.error || 'Erro ao criar conta');
        setIsLoading(false);
        return false;
      }

      // Auto-login after signup
      const success = await login(email, password);
      setIsLoading(false);
      return success;
    } catch (err) {
      console.log('[AuthContext] Signup error:', err);
      setError('Erro inesperado ao criar conta');
      setIsLoading(false);
      return false;
    }
  }, [login]);

  const logout = useCallback(async (): Promise<void> => {
    console.log('[AuthContext] Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setMemberships([]);
    setCurrentInstitution(null);
    setCurrentMembership(null);
    setError(null);
  }, []);

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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
