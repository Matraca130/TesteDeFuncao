// ============================================================
// Axon v4.4 — Auth Types (FRONTEND CONTRACT)
// Canonical source: TesteDeFuncao/src/types/auth.ts
// Extended by: Agent 5 (FORGE) for admin UI types
// ============================================================
//
// ESTE ARCHIVO ES EL CONTRATO. Si el backend retorna algo diferente,
// el backend esta mal. Si el frontend usa tipos inline, el frontend
// esta mal. TODOS importan de aqui.
//
// Alineado con: shared-types.ts (backend) — 2026-02-19
// ============================================================

// ── Role Enum (canonical) ──
export type MembershipRole = 'owner' | 'admin' | 'professor' | 'student';

// ── User (canonical) ──
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

// ── Membership (canonical) ──
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

// ── Institution (canonical) ──
export interface Institution {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

// ── Plan (canonical) ──
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

// ── Auth Context Shape (canonical) ──
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

// ── Role Helpers (canonical) ──
export const ADMIN_ROLES: MembershipRole[] = ['owner', 'admin'];

export const isAdminRole = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin';

export const canAccessAdmin = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin' || role === 'professor';

// Maps role to the first real page after login.
// These must match actual routes in routes.tsx.
// UPDATED: owner → /owner (OwnerDashboard), admin → /admin (AdminShell)
export const getRouteForRole = (role: MembershipRole): string => {
  switch (role) {
    case 'owner':     return '/owner';
    case 'admin':     return '/admin';
    case 'professor': return '/professor/keywords';
    case 'student':   return '/study/smart-study';
    default:          return '/dashboard';
  }
};

// ── API Response Shapes (canonical) ──
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

// ============================================================
// Agent 5 (FORGE) Extensions — Admin UI Types
// These types are ADDITIVE. They do NOT modify canonical types above.
// Backend endpoints for these are defined in Agent 1's work:
//   routes-plans.tsx, routes-members.tsx, routes-admin-scopes.tsx
// ============================================================

export type MemberStatus = 'active' | 'invited' | 'suspended';
export type ScopeType = 'course' | 'semester' | 'section' | 'topic' | 'summary';
export type Permission = 'read' | 'write' | 'delete' | 'approve';
export type ContentType = 'summaries' | 'flashcards' | 'quiz' | 'videos' | 'ai_chat';
export type AcademicModel = 'semestral' | 'trimestral' | 'libre';
export type Currency = 'BRL' | 'USD' | 'EUR';
export type Language = 'pt-BR' | 'es' | 'en';

// ── Extended Institution (for wizard / admin views) ──
export interface InstitutionFull extends Institution {
  owner_id: string;
  description?: string;
  default_language?: Language;
  timezone?: string;
  academic_model?: AcademicModel;
  plan_id?: string;
  plan_expires_at?: string;
  created_at: string;
}

// ── Extended Membership (for admin member management) ──
export interface MembershipFull extends Membership {
  status: MemberStatus;
  name?: string;
  email: string;
  avatar_url?: string;
}

// ── Pricing Plan (for plan management UI) ──
export interface PricingPlan extends Plan {
  duration_days?: number;
  features: string[];
  max_students?: number | null;
  active: boolean;
  active_students?: number;
}

// ── Plan Access Rule ──
export interface PlanAccessRule {
  id: string;
  plan_id: string;
  scope_type: ScopeType;
  scope_id: string;
  scope_name?: string;
  content_types: ContentType[];
  created_at: string;
}

// ── Admin Scope ──
export interface AdminScope {
  id: string;
  institution_id: string;
  member_id: string;
  member_name?: string;
  member_email?: string;
  scope_type: ScopeType;
  scope_id: string;
  scope_name?: string;
  permissions: Permission[];
  created_at: string;
}

// ── Scope Option (for dropdowns) ──
export interface ScopeOption {
  id: string;
  name: string;
  type: ScopeType;
}

// ── Payloads ──

export interface InstitutionCreatePayload {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  default_language: Language;
  timezone: string;
  academic_model: AcademicModel;
}

export interface InviteMemberPayload {
  email: string;
  role: Exclude<MembershipRole, 'owner'>;
}

export interface PlanCreatePayload {
  name: string;
  price: number;
  currency: Currency;
  duration_days: number;
  features: string[];
  max_students: number | null;
  active: boolean;
}

export interface PlanAccessRuleCreatePayload {
  plan_id: string;
  scope_type: ScopeType;
  scope_id: string;
  content_types: ContentType[];
}

export interface AdminScopeCreatePayload {
  institution_id: string;
  member_id: string;
  scope_type: ScopeType;
  scope_id: string;
  permissions: Permission[];
}
