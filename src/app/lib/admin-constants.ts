// ============================================================
// Axon v4.4 — Admin Constants (Shared)
// Agent 5: FORGE
//
// Single source of truth for constants used across admin pages.
// When migrating to repo:
//   - CURRENT_INST_ID → replace with AuthContext.currentInstitution.id
//   - ROLE_CONFIG / STATUS_CONFIG → move to design-system or keep here
// ============================================================

import type { MembershipRole, MemberStatus, Permission, ScopeType } from '../../types/auth';

// ── Institution ID ──────────────────────────────────────────
// Centralized mock ID. In repo, this comes from AuthContext.currentInstitution.id
// Having it in one place makes the Phase P3 migration trivial.
export const CURRENT_INST_ID = 'inst-001';

// ── Role Display Config ─────────────────────────────────────
// Used by: RoleBadge (Dashboard, Members, Scopes), ChangeRoleDialog
export const ROLE_CONFIG: Record<MembershipRole, { label: string; className: string }> = {
  owner:     { label: 'Owner',     className: 'bg-violet-100 text-violet-700 border-violet-200' },
  admin:     { label: 'Admin',     className: 'bg-blue-100 text-blue-700 border-blue-200' },
  professor: { label: 'Professor', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  student:   { label: 'Student',   className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

// ── Status Display Config ───────────────────────────────────
// Used by: StatusBadge (Members page, potentially others)
export const STATUS_CONFIG: Record<MemberStatus, { label: string; className: string }> = {
  active:    { label: 'Ativo',     className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  invited:   { label: 'Convidado', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  suspended: { label: 'Suspenso',  className: 'bg-red-100 text-red-700 border-red-200' },
};

// ── Role Sort Order ─────────────────────────────────────────
// Used by: MemberManagement sort logic
export const ROLE_ORDER: Record<MembershipRole, number> = {
  owner: 0,
  admin: 1,
  professor: 2,
  student: 3,
};
