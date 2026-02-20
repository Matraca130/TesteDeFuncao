// Axon v4.4 — API Admin: Scopes, Members, Dashboard, Institution
// Phase 4: consolidated from api-admin.ts + api-client-extensions.ts
import type { AdminScope } from './types';
import { USE_MOCKS, API_BASE_URL, authHeaders, store, mockId, delay, now } from './api-core';
import type {
  MembershipFull,
  MembershipRole,
  InviteMemberPayload,
  InstitutionCreatePayload,
  ScopeOption,
} from '../../types/auth';

// ══════════════════════════════════════════════════════════════
// SCOPES — original api-admin.ts functions
// ══════════════════════════════════════════════════════════════

export async function getAdminScopes(instId: string): Promise<AdminScope[]> { if (USE_MOCKS) { await delay(); return store.adminScopes.filter(s => s.institution_id === instId); } return (await (await fetch(`${API_BASE_URL}/institutions/${instId}/scopes`, { headers: authHeaders() })).json()).data; }
export async function createAdminScope(instId: string, scope: Partial<AdminScope>): Promise<AdminScope> { if (USE_MOCKS) { await delay(); const n: AdminScope = { id: mockId('scope'), institution_id: instId, user_id: scope.user_id || '', scope_type: scope.scope_type || 'course', scope_id: scope.scope_id, role: scope.role || 'professor', created_at: now() }; store.adminScopes.push(n); return n; } return (await (await fetch(`${API_BASE_URL}/institutions/${instId}/scopes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(scope) })).json()).data; }

export async function deleteAdminScope(instId: string, scopeId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); return; }
  await fetch(`${API_BASE_URL}/institutions/${instId}/scopes/${scopeId}`, { method: 'DELETE', headers: authHeaders() });
}

export async function getScopeOptions(instId: string): Promise<ScopeOption[]> {
  if (USE_MOCKS) {
    await delay();
    return [
      { id: 'course-anatomy', name: 'Anatomia Humana', type: 'course' },
      { id: 'course-physio', name: 'Fisiologia', type: 'course' },
      { id: 'sem-1', name: 'Semestre 1', type: 'semester' },
      { id: 'sec-musculo', name: 'Sistema Musculoesqueletico', type: 'section' },
    ];
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/scope-options`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// MEMBERS — moved from api-client-extensions.ts (Phase 4)
// ══════════════════════════════════════════════════════════════

const _mockMembers: MembershipFull[] = [
  { id: 'mem-001', user_id: 'usr-001', institution_id: 'inst-001', role: 'owner', status: 'active', name: 'Dr. Maria Santos', email: 'maria@axon.edu', avatar_url: null, created_at: '2025-01-15T10:00:00Z' },
  { id: 'mem-002', user_id: 'usr-002', institution_id: 'inst-001', role: 'professor', status: 'active', name: 'Prof. Carlos Oliveira', email: 'carlos@axon.edu', avatar_url: null, created_at: '2025-01-20T10:00:00Z' },
  { id: 'mem-003', user_id: 'usr-003', institution_id: 'inst-001', role: 'student', status: 'active', name: 'Ana Lima', email: 'ana@aluno.axon.edu', avatar_url: null, created_at: '2025-02-01T10:00:00Z' },
  { id: 'mem-004', user_id: 'usr-004', institution_id: 'inst-001', role: 'professor', status: 'invited', name: 'Prof. Julia Pereira', email: 'julia@axon.edu', avatar_url: null, created_at: '2025-02-15T10:00:00Z' },
];

export async function getMembers(instId: string): Promise<MembershipFull[]> {
  if (USE_MOCKS) { await delay(); return _mockMembers.filter(m => m.institution_id === instId); }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function inviteMember(instId: string, payload: InviteMemberPayload): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay();
    const m: MembershipFull = { id: mockId('mem'), user_id: mockId('usr'), institution_id: instId, role: payload.role, status: 'invited', name: undefined, email: payload.email, avatar_url: null, created_at: now() };
    _mockMembers.push(m);
    return m;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/invite`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  return (await res.json()).data;
}

export async function updateMemberRole(instId: string, memberId: string, role: MembershipRole): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay();
    const i = _mockMembers.findIndex(m => m.id === memberId);
    if (i === -1) throw new Error(`Member ${memberId} not found`);
    _mockMembers[i] = { ..._mockMembers[i], role };
    return _mockMembers[i];
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}/role`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ role }) });
  return (await res.json()).data;
}

export async function suspendMember(instId: string, memberId: string): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay();
    const i = _mockMembers.findIndex(m => m.id === memberId);
    if (i === -1) throw new Error(`Member ${memberId} not found`);
    _mockMembers[i] = { ..._mockMembers[i], status: 'suspended' };
    return _mockMembers[i];
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}/suspend`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}

export async function removeMember(instId: string, memberId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); const i = _mockMembers.findIndex(m => m.id === memberId); if (i !== -1) _mockMembers.splice(i, 1); return; }
  await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD STATS — moved from api-client-extensions.ts (Phase 4)
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
  if (USE_MOCKS) {
    await delay();
    const members = _mockMembers.filter(m => m.institution_id === instId);
    const byRole: Record<string, number> = {};
    members.forEach(m => { byRole[m.role] = (byRole[m.role] || 0) + 1; });
    return {
      institutionName: 'Universidade Demo',
      hasInstitution: true,
      totalMembers: members.length,
      totalPlans: 2,
      activeStudents: members.filter(m => m.role === 'student' && m.status === 'active').length,
      pendingInvites: members.filter(m => m.status === 'invited').length,
      membersByRole: byRole,
    };
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/dashboard-stats`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// INSTITUTION WIZARD — moved from api-client-extensions.ts (Phase 4)
// ══════════════════════════════════════════════════════════════

export async function createInstitution(payload: InstitutionCreatePayload): Promise<any> {
  if (USE_MOCKS) {
    await delay(500);
    return { id: mockId('inst'), ...payload, owner_id: 'usr-001', created_at: now() };
  }
  const res = await fetch(`${API_BASE_URL}/institutions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
  return (await res.json()).data;
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; suggestion?: string }> {
  if (USE_MOCKS) {
    await delay(300);
    const taken = ['demo', 'test', 'admin', 'axon'];
    return { available: !taken.includes(slug), suggestion: taken.includes(slug) ? `${slug}-${Date.now() % 1000}` : undefined };
  }
  const res = await fetch(`${API_BASE_URL}/institutions/check-slug/${slug}`, { headers: authHeaders() });
  return (await res.json()).data;
}
