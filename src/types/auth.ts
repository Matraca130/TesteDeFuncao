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

export const getRouteForRole = (role: MembershipRole): string => {
  switch (role) {
    case 'owner':     return '/admin';
    case 'admin':     return '/admin';
    case 'professor': return '/professor';
    case 'student':   return '/study';
    default:          return '/';
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
// Extends canonical Institution with fields returned by GET /institutions/:id
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
// Extends canonical Membership with fields from GET /members endpoint
export interface MembershipFull extends Membership {
  status: MemberStatus;
  name?: string;
  email: string;
  avatar_url?: string;
}

// ── Pricing Plan (for plan management UI) ──
// Extends canonical Plan with admin-specific fields
//
// MERGE NOTE: Agent 4's api-client.ts imports "PricingPlan" from ./types
// but it was NEVER DEFINED in the repo's types.ts (phantom import).
// THIS is the first actual definition. Agent 4's mock constructor used:
//   { id, institution_id, name, description, price, currency, is_default,
//     is_trial, trial_duration_days, max_students, features, created_at, updated_at }
// Our PricingPlan extends Plan (which has those base fields) + adds
// duration_days, features, max_students, active, active_students.
// Agent 4 mock code needs to add: active = true when constructing.
export interface PricingPlan extends Plan {
  duration_days?: number;
  features: string[];
  max_students?: number | null;
  active: boolean;
  active_students?: number;
}

// ── Plan Access Rule ──
//
// MERGE NOTE: Agent 4's api-client.ts imports "PlanAccessRule" from ./types
// but it was NEVER DEFINED (phantom import). Agent 4's mock constructor
// inferred a simpler shape:
//   { id, plan_id, resource_type, resource_id, permission, created_at }
// Our definition uses richer fields aligned with Agent 1's backend:
//   resource_type → scope_type  (aligns with backend scope model)
//   resource_id  → scope_id    (aligns with backend scope model)
//   permission   → content_types[] (array: multiple content types per rule)
// When merging, update Agent 4's createPlanRule mock to use these field names.
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
//
// MERGE NOTE: Agent 4's api-client.ts imports "AdminScope" from ./types
// but it was NEVER DEFINED (phantom import). Agent 4's mock constructor
// inferred a simpler shape:
//   { id, institution_id, user_id, scope_type, scope_id, role, created_at }
// Our definition uses richer fields aligned with Agent 1's backend:
//   user_id → member_id   (membership-centric, not user-centric)
//   role    → permissions[] (granular: ['read','write','delete','approve'])
// Also adds: member_name, member_email, scope_name for display.
// When merging, update Agent 4's createAdminScope mock to use these fields.
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
