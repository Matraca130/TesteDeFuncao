// ============================================================
// Axon v4.4 — API Admin: Scopes, Members, Dashboard, Institution
// UPDATED: Admin area uses REAL backend (not mocks).
//
// Strategy:
//   ADMIN_LIVE = true → always fetch from real Supabase backend
//   Mock fallback only for endpoints that don't exist yet
//   (getScopeOptions) — marked with TODO.
//
// Backend endpoint mapping (after path fixes):
//   GET    /institutions/:instId/admin-scopes  → getAdminScopes
//   POST   /admin-scopes                       → createAdminScope
//   DELETE /admin-scopes/:scopeId               → deleteAdminScope
//   GET    /members/:instId                     → getMembers
//   POST   /members                             → inviteMember
//   PATCH  /members/:memberId/role              → updateMemberRole
//   PATCH  /members/:memberId/suspend           → suspendMember
//   DELETE /members/:memberId                   → removeMember
//   GET    /institutions/:instId/dashboard-stats→ getDashboardStats
//   POST   /institutions                        → createInstitution
//   GET    /institutions/check-slug/:slug       → checkSlugAvailability
// ============================================================
import type { AdminScope } from './types';
import { API_BASE_URL, authHeaders, delay, mockId, now } from './api-core';
import type {
  MembershipFull,
  MembershipRole,
  InviteMemberPayload,
  InstitutionCreatePayload,
  ScopeOption,
} from '../../types/auth';

// Admin area ALWAYS uses real backend
const ADMIN_LIVE = true;

// ── Fetch helper with error logging ─────────────────────────
async function adminFetch(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!data.success) {
    const errMsg = data.error?.message || `HTTP ${res.status}`;
    console.error(`[api-admin] ${options?.method || 'GET'} ${url} failed:`, errMsg);
    throw new Error(errMsg);
  }
  return data;
}

// ══════════════════════════════════════════════════════════════
// SCOPES
// Backend: routes-admin-scopes.tsx
// ══════════════════════════════════════════════════════════════

export async function getAdminScopes(instId: string): Promise<AdminScope[]> {
  if (!ADMIN_LIVE) {
    await delay();
    return [];
  }
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/institutions/${instId}/admin-scopes`,
      { headers: authHeaders() }
    );
    return data.data || [];
  } catch (err) {
    console.error(`[api-admin] getAdminScopes(${instId}) error:`, err);
    return [];
  }
}

export async function createAdminScope(instId: string, scope: Partial<AdminScope>): Promise<AdminScope> {
  if (!ADMIN_LIVE) {
    await delay();
    return { id: mockId('scope'), institution_id: instId, ...scope } as AdminScope;
  }
  const data = await adminFetch(
    `${API_BASE_URL}/admin-scopes`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...scope, institution_id: instId }),
    }
  );
  return data.data;
}

export async function deleteAdminScope(_instId: string, scopeId: string): Promise<void> {
  if (!ADMIN_LIVE) {
    await delay();
    return;
  }
  await adminFetch(
    `${API_BASE_URL}/admin-scopes/${scopeId}`,
    { method: 'DELETE', headers: authHeaders() }
  );
}

// TODO: Backend endpoint /institutions/:instId/scope-options does not exist yet.
// This function keeps mock data until the endpoint is created.
export async function getScopeOptions(_instId: string): Promise<ScopeOption[]> {
  await delay();
  return [
    { id: 'course-anatomy', name: 'Anatomia Humana', type: 'course' },
    { id: 'course-physio', name: 'Fisiologia', type: 'course' },
    { id: 'sem-1', name: 'Semestre 1', type: 'semester' },
    { id: 'sec-musculo', name: 'Sistema Musculoesqueletico', type: 'section' },
  ];
}

// ══════════════════════════════════════════════════════════════
// MEMBERS
// Backend: routes-members.tsx
// ══════════════════════════════════════════════════════════════

export async function getMembers(instId: string): Promise<MembershipFull[]> {
  if (!ADMIN_LIVE) {
    await delay();
    return [];
  }
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/members/${instId}`,
      { headers: authHeaders() }
    );
    return data.data || [];
  } catch (err) {
    console.error(`[api-admin] getMembers(${instId}) error:`, err);
    return [];
  }
}

export async function inviteMember(instId: string, payload: InviteMemberPayload): Promise<MembershipFull> {
  const data = await adminFetch(
    `${API_BASE_URL}/members`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        institution_id: instId,
        role: payload.role,
        email: payload.email,
      }),
    }
  );
  return data.data;
}

export async function updateMemberRole(instId: string, memberId: string, role: MembershipRole): Promise<MembershipFull> {
  const data = await adminFetch(
    `${API_BASE_URL}/members/${memberId}/role`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role, institution_id: instId }),
    }
  );
  return data.data;
}

export async function suspendMember(instId: string, memberId: string): Promise<MembershipFull> {
  const data = await adminFetch(
    `${API_BASE_URL}/members/${memberId}/suspend`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ institution_id: instId }),
    }
  );
  return data.data;
}

export async function removeMember(instId: string, memberId: string): Promise<void> {
  await adminFetch(
    `${API_BASE_URL}/members/${memberId}?institution_id=${instId}`,
    { method: 'DELETE', headers: authHeaders() }
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// Backend: routes-institutions.tsx → GET /institutions/:instId/dashboard-stats
// ══════════════════════════════════════════════════════════════

export interface DashboardStats {
  institutionName: string;
  hasInstitution: boolean;
  totalMembers: number;
  totalPlans: number;
  activeStudents: number;
  pendingInvites: number;
  membersByRole: Record<string, number>;
}

export async function getDashboardStats(instId: string): Promise<DashboardStats> {
  if (!ADMIN_LIVE) {
    await delay();
    return {
      institutionName: 'Universidade Demo',
      hasInstitution: true,
      totalMembers: 0,
      totalPlans: 0,
      activeStudents: 0,
      pendingInvites: 0,
      membersByRole: {},
    };
  }
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/institutions/${instId}/dashboard-stats`,
      { headers: authHeaders() }
    );
    return data.data;
  } catch (err) {
    console.error(`[api-admin] getDashboardStats(${instId}) error:`, err);
    // Return safe defaults on error
    return {
      institutionName: instId,
      hasInstitution: false,
      totalMembers: 0,
      totalPlans: 0,
      activeStudents: 0,
      pendingInvites: 0,
      membersByRole: {},
    };
  }
}

// ══════════════════════════════════════════════════════════════
// INSTITUTION WIZARD
// Backend: routes-institutions.tsx
// ══════════════════════════════════════════════════════════════

export async function createInstitution(payload: InstitutionCreatePayload): Promise<any> {
  const data = await adminFetch(
    `${API_BASE_URL}/institutions`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return data.data;
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; suggestion?: string }> {
  if (!ADMIN_LIVE) {
    await delay(300);
    const taken = ['demo', 'test', 'admin', 'axon'];
    return { available: !taken.includes(slug), suggestion: taken.includes(slug) ? `${slug}-${Date.now() % 1000}` : undefined };
  }
  try {
    const data = await adminFetch(
      `${API_BASE_URL}/institutions/check-slug/${slug}`,
      { headers: authHeaders() }
    );
    return data.data;
  } catch (err) {
    console.error(`[api-admin] checkSlugAvailability(${slug}) error:`, err);
    // Fallback: assume available
    return { available: true };
  }
}
