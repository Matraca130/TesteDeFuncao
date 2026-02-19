// ════════════════════════════════════════════════════════════
// AXON v4.4 — Frontend Auth Types (CONTRATO)
// SINGLE SOURCE OF TRUTH para tipos de auth en el frontend.
// Todos los archivos importan de aquí. NO definir tipos inline.
// ════════════════════════════════════════════════════════════

export type MembershipRole = 'owner' | 'admin' | 'professor' | 'student';

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
  role: MembershipRole;
  plan_id?: string;
  plan_expires_at?: string;
  created_at: string;           // NOT "joined_at"
}

export interface Institution {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

// ── Helpers ──
export const ADMIN_ROLES: MembershipRole[] = ['owner', 'admin'];

export const isAdminRole = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin';

export const canAccessAdmin = (role: MembershipRole): boolean =>
  role === 'owner' || role === 'admin' || role === 'professor';
