// ============================================================
// DEPRECATED — Backward-compatibility re-export shim.
// Canonical location: src/types/auth.ts
// This file will be removed in a future cleanup pass.
// ============================================================

export {
  ADMIN_ROLES,
  isAdminRole,
  canAccessAdmin,
  getRouteForRole,
} from '../../../types/auth';

export type {
  MembershipRole,
  AuthUser,
  Membership,
  Institution,
  Plan,
  AuthContextType,
  AuthLoginResponse,
  AuthSignupResponse,
  InstitutionBySlugResponse,
} from '../../../types/auth';
