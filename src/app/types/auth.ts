// ============================================================
// Axon v4.4 — Auth Types (FRONTEND CONTRACT)
// ============================================================
//
// ESTE ARCHIVO ES EL CONTRATO. Si el backend retorna algo diferente,
// el backend esta mal. Si el frontend usa tipos inline, el frontend
// esta mal. TODOS importan de aqui.
//
// Alineado con: shared-types.ts (backend) — 2026-02-19
//
// Devs que importan de aqui:
//   Dev 3: AuthContext.tsx, AdminContext.tsx
//   Dev 4: guards/RequireAuth.tsx, guards/RequireRole.tsx, PostLoginRouter.tsx
//   Dev 5: todas las paginas de auth
//   Dev 6: SessionSplash.tsx, AuthErrorBoundary.tsx
// ============================================================

// ── Role Enum ──
// CANONICAL: 'owner' | 'admin' | 'professor' | 'student'
// 'institution_admin' NO EXISTE — era un bug del frontend antiguo.
export type MembershipRole = 'owner' | 'admin' | 'professor' | 'student';

// ── User ──
// Coincide EXACTO con lo que retorna GET /auth/me y POST /auth/signup
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;   // ISODate
  updated_at: string;   // ISODate
}

// ── Membership ──
// CORRECTO: tiene 'id' + 'created_at' (no 'joined_at')
// Backend (auth.tsx) retorna esto despues de T1.1/T1.5
export interface Membership {
  id: string;                       // crypto.randomUUID() — generado por backend
  user_id: string;
  institution_id: string;
  role: MembershipRole;
  institution?: Institution;        // Enriched by backend (GET /auth/me joins inst data)
  plan_id?: string;                 // UUID del plan asignado (null = default/free)
  plan_expires_at?: string;         // ISODate — solo para planes trial
  created_at: string;               // ISODate — NOT "joined_at"
}

// ── Institution (datos publicos) ──
// Lo que retorna GET /institutions/by-slug/:slug
export interface Institution {
  id: string;
  name: string;
  slug: string;                     // URL-friendly: a-z, 0-9, hyphens, 3-50 chars
  logo_url?: string;
}

// ── Plan (referencia — CRUD viene despues) ──
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
// Lo que useAuth() retorna. Dev 3 implementa esto.
export interface AuthContextType {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  memberships: Membership[];
  currentInstitution: Institution | null;
  currentMembership: Membership | null;

  // Derived
  isAuthenticated: boolean;         // !!user && !!accessToken
  isLoading: boolean;               // true durante session restore

  // Error
  error: string | null;
  clearError: () => void;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, institutionId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  selectInstitution: (instId: string) => void;
}

// ── Role Helpers ──
// Usa estos en vez de comparar strings manualmente.
export const ADMIN_ROLES: MembershipRole[] = ['owner', 'admin'];

/** true si el rol es 'owner' o 'admin' */
export const isAdminRole = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin';

/** true si el rol puede acceder al area admin (owner, admin, o professor) */
export const canAccessAdmin = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin' || role === 'professor';

/** Retorna la ruta de destino post-login segun el rol */
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
// Lo que el backend retorna. Usa para tipar fetch responses.

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
