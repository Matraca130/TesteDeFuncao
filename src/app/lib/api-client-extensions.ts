// ══════════════════════════════════════════════════════════════
// Axon v4.4 — api-client-extensions.ts
// COMMIT 3: Bridge re-exports + TextAnnotation wrappers + Admin stubs
//
// This file is re-exported from api-client.ts via:
//   export * from './api-client-extensions';
//
// TECH-DEBT(Phase4): Re-exports violate the no-barrel rule.
// Post-merge, hooks should import directly from api-*.ts modules
// and this file + the re-export line should be deleted.
// ══════════════════════════════════════════════════════════════

import { USE_MOCKS, API_BASE_URL, authHeaders, mockId, delay, now } from './api-core';
import type {
  MembershipFull,
  MembershipRole,
  InviteMemberPayload,
  InstitutionCreatePayload,
  ScopeOption,
} from '../../types/auth';
import {
  getTextAnnotationsBySummary as _getAnnotationsBySummary,
  createTextAnnotation as _sacredCreateAnnotation,
  updateTextAnnotation as _sacredUpdateAnnotation,
  softDeleteTextAnnotation as _sacredSoftDeleteAnnotation,
  restoreTextAnnotation as _sacredRestoreAnnotation,
} from './api-sacred';

const _DEFAULT_STUDENT_ID = 'demo-student-001';

// ══════════════════════════════════════════════════════════════
// A. RE-EXPORTS from api-student.ts
//    Consumers: useStudentData.ts, useSummaryPersistence.ts
// ══════════════════════════════════════════════════════════════
export {
  getStudentProfile,
  getStudentStats,
  getCourseProgress,
  getStudySessions,
  getFlashcardReviews,
  seedDemoData,
  getStudySummaryByTopic,
  saveStudySummaryByTopic,
} from './api-student';

// ══════════════════════════════════════════════════════════════
// B. RE-EXPORTS from api-plans.ts
//    Consumers: usePlans.ts, AccessRulesSection.tsx
// ══════════════════════════════════════════════════════════════
export {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanRules,
  createPlanRule,
} from './api-plans';

// ══════════════════════════════════════════════════════════════
// C. RE-EXPORTS from api-admin.ts
//    Consumer: useAdminScopes.ts
// ══════════════════════════════════════════════════════════════
export {
  getAdminScopes,
  createAdminScope,
} from './api-admin';

// ══════════════════════════════════════════════════════════════
// D. TEXT ANNOTATION WRAPPERS
//    Consumer: useTextAnnotations.ts
//
//    Signature mismatch between Agent 4 hook calls and
//    api-sacred.ts function signatures:
//
//    Hook calls:                       api-sacred.ts expects:
//    getTextAnnotations(sumId)         getTextAnnotationsBySummary(sumId, studentId)
//    createTextAnnotation(sumId, data) createTextAnnotation(sumId, studentId, data)
//    updateTextAnnotation(sumId,id,d)  updateTextAnnotation(id, data)
//    deleteTextAnnotation(sumId, id)   softDeleteTextAnnotation(id)
//    restoreTextAnnotation(sumId, id)  restoreTextAnnotation(id)
//
//    Wrappers inject DEFAULT_STUDENT_ID and drop unused summaryId.
// ══════════════════════════════════════════════════════════════

export async function getTextAnnotations(summaryId: string): Promise<any[]> {
  return _getAnnotationsBySummary(summaryId, _DEFAULT_STUDENT_ID);
}

export async function createTextAnnotation(summaryId: string, data: any): Promise<any> {
  return _sacredCreateAnnotation(summaryId, _DEFAULT_STUDENT_ID, data);
}

export async function updateTextAnnotation(_summaryId: string, annotationId: string, data: any): Promise<any> {
  return _sacredUpdateAnnotation(annotationId, data);
}

export async function deleteTextAnnotation(_summaryId: string, annotationId: string): Promise<any> {
  return _sacredSoftDeleteAnnotation(annotationId);
}

export async function restoreTextAnnotation(_summaryId: string, annotationId: string): Promise<any> {
  return _sacredRestoreAnnotation(annotationId);
}

// ══════════════════════════════════════════════════════════════
// E. ADMIN STUBS — Members
//    Consumers: useMembers.ts, useAdminScopes.ts
// ══════════════════════════════════════════════════════════════

const _mockMembers: MembershipFull[] = [
  {
    id: 'mem-001', user_id: 'usr-001', institution_id: 'inst-001',
    role: 'owner', status: 'active',
    name: 'Dr. Maria Santos', email: 'maria@axon.edu',
    avatar_url: null, created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'mem-002', user_id: 'usr-002', institution_id: 'inst-001',
    role: 'professor', status: 'active',
    name: 'Prof. Carlos Oliveira', email: 'carlos@axon.edu',
    avatar_url: null, created_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 'mem-003', user_id: 'usr-003', institution_id: 'inst-001',
    role: 'student', status: 'active',
    name: 'Ana Lima', email: 'ana@aluno.axon.edu',
    avatar_url: null, created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'mem-004', user_id: 'usr-004', institution_id: 'inst-001',
    role: 'professor', status: 'invited',
    name: 'Prof. Julia Pereira', email: 'julia@axon.edu',
    avatar_url: null, created_at: '2025-02-15T10:00:00Z',
  },
];

export async function getMembers(instId: string): Promise<MembershipFull[]> {
  if (USE_MOCKS) {
    await delay();
    return _mockMembers.filter(m => m.institution_id === instId);
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function inviteMember(instId: string, payload: InviteMemberPayload): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay();
    const m: MembershipFull = {
      id: mockId('mem'), user_id: mockId('usr'), institution_id: instId,
      role: payload.role, status: 'invited',
      name: undefined, email: payload.email,
      avatar_url: null, created_at: now(),
    };
    _mockMembers.push(m);
    return m;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/invite`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
  });
  return (await res.json()).data;
}

export async function updateMemberRole(
  instId: string, memberId: string, role: MembershipRole,
): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay();
    const i = _mockMembers.findIndex(m => m.id === memberId);
    if (i === -1) throw new Error(`Member ${memberId} not found`);
    _mockMembers[i] = { ..._mockMembers[i], role };
    return _mockMembers[i];
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}/role`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ role }),
  });
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
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}/suspend`, {
    method: 'PATCH', headers: authHeaders(),
  });
  return (await res.json()).data;
}

export async function removeMember(instId: string, memberId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = _mockMembers.findIndex(m => m.id === memberId);
    if (i !== -1) _mockMembers.splice(i, 1);
    return;
  }
  await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
}

// ══════════════════════════════════════════════════════════════
// F. ADMIN STUBS — Scopes extras
//    Consumer: useAdminScopes.ts
// ══════════════════════════════════════════════════════════════

export async function deleteAdminScope(instId: string, scopeId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    // Soft-delete in api-core store
    return;
  }
  await fetch(`${API_BASE_URL}/institutions/${instId}/scopes/${scopeId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
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
// G. ADMIN STUBS — Plans toggle
//    Consumer: usePlans.ts
// ══════════════════════════════════════════════════════════════

export async function togglePlanActive(instId: string, planId: string): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    return { id: planId, institution_id: instId, active: true };
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans/${planId}/toggle-active`, {
    method: 'PATCH', headers: authHeaders(),
  });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// G2. STUB — deletePlanRule
//     Consumer: AccessRulesSection.tsx (Agent 5 — FORGE)
//     Does NOT exist in api-plans.ts — needs real implementation
//     in Phase 4 when backend endpoint is created.
// ══════════════════════════════════════════════════════════════

export async function deletePlanRule(planId: string, ruleId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    return;
  }
  await fetch(`${API_BASE_URL}/plans/${planId}/rules/${ruleId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
}

// ══════════════════════════════════════════════════════════════
// H. ADMIN STUBS — Dashboard stats
//    Consumer: AdminDashboard.tsx
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
// I. ADMIN STUBS — Institution Wizard
//    Consumer: InstitutionWizard.tsx
// ══════════════════════════════════════════════════════════════

export async function createInstitution(payload: InstitutionCreatePayload): Promise<any> {
  if (USE_MOCKS) {
    await delay(500);
    return {
      id: mockId('inst'),
      ...payload,
      owner_id: 'usr-001',
      created_at: now(),
    };
  }
  const res = await fetch(`${API_BASE_URL}/institutions`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
  });
  return (await res.json()).data;
}

export async function checkSlugAvailability(
  slug: string,
): Promise<{ available: boolean; suggestion?: string }> {
  if (USE_MOCKS) {
    await delay(300);
    const taken = ['demo', 'test', 'admin', 'axon'];
    return {
      available: !taken.includes(slug),
      suggestion: taken.includes(slug)
        ? `${slug}-${Date.now() % 1000}`
        : undefined,
    };
  }
  const res = await fetch(`${API_BASE_URL}/institutions/check-slug/${slug}`, { headers: authHeaders() });
  return (await res.json()).data;
}
