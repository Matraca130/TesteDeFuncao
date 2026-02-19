// ============================================================
// Axon v4.4 — Auth Types (FRONTEND CONTRACT)
// Moved from: src/app/types/auth.ts
// ============================================================
//
// ESTE ARCHIVO ES EL CONTRATO. Si el backend retorna algo diferente,
// el backend esta mal. Si el frontend usa tipos inline, el frontend
// esta mal. TODOS importan de aqui.
//
// Alineado con: shared-types.ts (backend) — 2026-02-19
// ============================================================

// ── Role Enum ──
export type MembershipRole = 'owner' | 'admin' | 'professor' | 'student';

// ── User ──
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

// ── Membership ──
export interface Membership {
  id: string;
  user_id: string;
  institution_id: string;
  role: MembershipRole;
  institution?: Institution;
  plan_id?: string;
  plan_expires_at?: string;
  created_at: string;
}

// ── Institution ──
export interface Institution {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

// ── Plan ──
export interface Plan {
  id: string;
  institution_id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  is_default: boolean;
  is_trial: boolean;
  trial_duration_days?: number;
  created_at: string;
  updated_at: string;
}

// ── Auth Context Shape ──
export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  memberships: Membership[];
  currentInstitution: Institution | null;
  currentMembership: Membership | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, institutionId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  selectInstitution: (instId: string) => void;
}

// ── Role Helpers ──
export const ADMIN_ROLES: MembershipRole[] = ['owner', 'admin'];

export const isAdminRole = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin';

export const canAccessAdmin = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin' || role === 'professor';

export const getRouteForRole = (role: MembershipRole): string => {
  switch (role) {
    case 'owner':     return '/admin';
    case 'admin':     return '/admin';
    case 'professor': return '/professor';
    case 'student':   return '/study';
    default:          return '/';
  }
};

// ── API Response Shapes ──
export interface AuthLoginResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    memberships: Membership[];
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface AuthSignupResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    access_token: string;
    memberships: Membership[];
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface InstitutionBySlugResponse {
  success: boolean;
  data?: Institution;
  error?: {
    message: string;
  };
}
