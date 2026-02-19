// ============================================================
// Axon v4.4 — API Client (Agent 5 — FORGE Mock Layer)
// Phase P2: Mock data. Phase P3: swap to real fetch() calls.
//
// ALIGNED WITH: Agent 4 (BRIDGE) api-client.ts signatures
// - All entity functions require instId (institution_id)
// - Pattern: api-client.ts (this file) -> hooks -> UI components
// - NUNCA fetch() outside this file.
//
// When migrating to repo:
//   1. These Agent 5 functions get ADDED to Agent 4's api-client.ts
//   2. Agent 4 already has: getPlans(instId), createPlan(instId, plan), etc.
//   3. Agent 5 ADDS: getInstitution, createInstitution, getMembers, etc.
//
// \u26a0\ufe0f SCHEMA DIFFERENCES vs Agent 4 (resolve during merge):
//   - PlanAccessRule: Agent 4 uses {resource_type, resource_id, permission}
//     Agent 5 uses {scope_type, scope_id, content_types[]}
//     \u2192 Agent 5 model is richer (multiple content types per rule)
//   - AdminScope: Agent 4 uses {user_id, scope_type, scope_id, role}
//     Agent 5 uses {member_id, scope_type, scope_id, permissions[]}
//     \u2192 Agent 5 model uses granular permissions array
//   - These differences must be resolved with Agent 1 (backend)
//     before merge. The backend schema is the source of truth.
// ============================================================

import type {
  InstitutionFull,
  InstitutionCreatePayload,
  MembershipFull,
  InviteMemberPayload,
  PricingPlan,
  PlanAccessRule,
  AdminScope,
  ScopeOption,
  MembershipRole,
} from '../../types/auth';

// ── Config ──────────────────────────────────────────────────────
// Toggle to false when backend endpoints are ready (Phase P3+)
const USE_MOCKS = true;
const API_BASE_URL = '/api';

// ── Helpers ──────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
function mockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function now(): string {
  return new Date().toISOString();
}

// ── Mock Data Store (in-memory, mutable copies) ─────────────

let mockInstitution: InstitutionFull | null = {
  id: 'inst-001',
  name: 'Universidade Federal de Sao Paulo',
  slug: 'unifesp',
  owner_id: 'user-owner-001',
  description: 'Instituicao publica de ensino superior',
  default_language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  academic_model: 'semestral',
  created_at: '2025-08-15T10:00:00Z',
};

let mockMembers: MembershipFull[] = [
  {
    id: 'mem-001', user_id: 'user-owner-001', institution_id: 'inst-001',
    role: 'owner', status: 'active', name: 'Dr. Carlos Mendoza',
    email: 'carlos@unifesp.br', avatar_url: '', created_at: '2025-08-15T10:00:00Z',
  },
  {
    id: 'mem-002', user_id: 'user-002', institution_id: 'inst-001',
    role: 'admin', status: 'active', name: 'Ana Beatriz Silva',
    email: 'ana.silva@unifesp.br', avatar_url: '', created_at: '2025-09-01T14:30:00Z',
  },
  {
    id: 'mem-003', user_id: 'user-003', institution_id: 'inst-001',
    role: 'professor', status: 'active', name: 'Prof. Roberto Lima',
    email: 'roberto.lima@unifesp.br', avatar_url: '', created_at: '2025-09-10T09:15:00Z',
  },
  {
    id: 'mem-004', user_id: 'user-004', institution_id: 'inst-001',
    role: 'professor', status: 'invited', name: 'Dra. Fernanda Costa',
    email: 'fernanda.costa@unifesp.br', avatar_url: '', created_at: '2026-01-20T11:45:00Z',
  },
  {
    id: 'mem-005', user_id: 'user-005', institution_id: 'inst-001',
    role: 'student', status: 'active', name: 'Lucas Oliveira',
    email: 'lucas.oliveira@aluno.unifesp.br', avatar_url: '', created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'mem-006', user_id: 'user-006', institution_id: 'inst-001',
    role: 'student', status: 'active', name: 'Mariana Santos',
    email: 'mariana.santos@aluno.unifesp.br', avatar_url: '', created_at: '2026-02-01T08:05:00Z',
  },
  {
    id: 'mem-007', user_id: 'user-007', institution_id: 'inst-001',
    role: 'student', status: 'suspended', name: 'Pedro Almeida',
    email: 'pedro.almeida@aluno.unifesp.br', avatar_url: '', created_at: '2025-10-15T16:30:00Z',
  },
];

let mockPlans: PricingPlan[] = [
  {
    id: 'plan-001', institution_id: 'inst-001', name: 'Plano Gratuito',
    description: 'Acesso basico', price: 0, currency: 'BRL',
    is_default: true, is_trial: false, duration_days: 365,
    features: ['Acesso a resumos basicos', 'Flashcards limitados (50/mes)', 'Quiz basico'],
    max_students: 30, active: true, active_students: 12,
    created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: 'plan-002', institution_id: 'inst-001', name: 'Plano Essencial',
    description: 'Acesso completo', price: 29.9, currency: 'BRL',
    is_default: false, is_trial: false, duration_days: 30,
    features: ['Acesso completo a resumos', 'Flashcards ilimitados', 'Quiz avancado com analytics', 'Anotacoes em video'],
    max_students: 100, active: true, active_students: 45,
    created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z',
  },
  {
    id: 'plan-003', institution_id: 'inst-001', name: 'Plano Premium',
    description: 'Tudo incluso', price: 59.9, currency: 'BRL',
    is_default: false, is_trial: false, duration_days: 30,
    features: ['Tudo do Essencial', 'AI Chat ilimitado', 'Video-aulas exclusivas', 'Suporte prioritario', 'Relatorios de progresso'],
    max_students: null, active: true, active_students: 23,
    created_at: '2025-10-01T00:00:00Z', updated_at: '2025-10-01T00:00:00Z',
  },
];

let mockPlanRules: PlanAccessRule[] = [
  { id: 'rule-001', plan_id: 'plan-001', scope_type: 'course', scope_id: 'course-001', scope_name: 'Anatomia Humana', content_types: ['summaries', 'flashcards'], created_at: '2025-09-05T00:00:00Z' },
  { id: 'rule-002', plan_id: 'plan-002', scope_type: 'course', scope_id: 'course-001', scope_name: 'Anatomia Humana', content_types: ['summaries', 'flashcards', 'quiz', 'videos'], created_at: '2025-09-05T00:00:00Z' },
  { id: 'rule-003', plan_id: 'plan-002', scope_type: 'course', scope_id: 'course-002', scope_name: 'Fisiologia', content_types: ['summaries', 'flashcards', 'quiz'], created_at: '2025-10-01T00:00:00Z' },
  { id: 'rule-004', plan_id: 'plan-003', scope_type: 'course', scope_id: 'course-001', scope_name: 'Anatomia Humana', content_types: ['summaries', 'flashcards', 'quiz', 'videos', 'ai_chat'], created_at: '2025-10-01T00:00:00Z' },
  { id: 'rule-005', plan_id: 'plan-003', scope_type: 'course', scope_id: 'course-002', scope_name: 'Fisiologia', content_types: ['summaries', 'flashcards', 'quiz', 'videos', 'ai_chat'], created_at: '2025-10-01T00:00:00Z' },
];

let mockAdminScopes: AdminScope[] = [
  { id: 'scope-001', institution_id: 'inst-001', member_id: 'mem-002', member_name: 'Ana Beatriz Silva', member_email: 'ana.silva@unifesp.br', scope_type: 'course', scope_id: 'course-001', scope_name: 'Anatomia Humana', permissions: ['read', 'write', 'approve'], created_at: '2025-09-15T00:00:00Z' },
  { id: 'scope-002', institution_id: 'inst-001', member_id: 'mem-003', member_name: 'Prof. Roberto Lima', member_email: 'roberto.lima@unifesp.br', scope_type: 'course', scope_id: 'course-002', scope_name: 'Fisiologia', permissions: ['read', 'write'], created_at: '2025-10-01T00:00:00Z' },
  { id: 'scope-003', institution_id: 'inst-001', member_id: 'mem-003', member_name: 'Prof. Roberto Lima', member_email: 'roberto.lima@unifesp.br', scope_type: 'semester', scope_id: 'sem-001', scope_name: '2025.2 \u2014 Segundo Semestre', permissions: ['read'], created_at: '2025-10-15T00:00:00Z' },
];

const mockScopeOptions: ScopeOption[] = [
  { id: 'course-001', name: 'Anatomia Humana', type: 'course' },
  { id: 'course-002', name: 'Fisiologia', type: 'course' },
  { id: 'course-003', name: 'Bioquimica', type: 'course' },
  { id: 'sem-001', name: '2025.2 \u2014 Segundo Semestre', type: 'semester' },
  { id: 'sem-002', name: '2026.1 \u2014 Primeiro Semestre', type: 'semester' },
  { id: 'sec-001', name: 'Secao: Sistema Nervoso', type: 'section' },
  { id: 'sec-002', name: 'Secao: Sistema Cardiovascular', type: 'section' },
  { id: 'topic-001', name: 'Topico: Neuroanatomia Funcional', type: 'topic' },
  { id: 'topic-002', name: 'Topico: Eletrofisiologia Cardiaca', type: 'topic' },
];

// ============================================================
// Agent 5 \u2014 Institution API
// Backend: routes-institutions.tsx (Agent 1)
// ============================================================

export async function getInstitution(instId: string): Promise<InstitutionFull | null> {
  if (USE_MOCKS) {
    await delay(400);
    return mockInstitution?.id === instId ? mockInstitution : mockInstitution;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}`);
  const json = await res.json();
  return json.data;
}

export async function createInstitution(payload: InstitutionCreatePayload): Promise<InstitutionFull> {
  if (USE_MOCKS) {
    await delay(800);
    const inst: InstitutionFull = {
      id: mockId('inst'),
      owner_id: 'user-owner-001',
      ...payload,
      created_at: now(),
    };
    mockInstitution = inst;
    return inst;
  }
  const res = await fetch(`${API_BASE_URL}/institutions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json.data;
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
  if (USE_MOCKS) {
    await delay(300);
    const taken = ['unifesp', 'usp', 'unicamp', 'ufrj', 'ufmg'];
    return { available: !taken.includes(slug.toLowerCase()) };
  }
  const res = await fetch(`${API_BASE_URL}/institutions/check-slug/${slug}`);
  const json = await res.json();
  return json.data;
}

// ============================================================
// Agent 5 \u2014 Members API
// Backend: routes-members.tsx (Agent 1)
// Signature: all functions take instId for alignment with Agent 4
// ============================================================

export async function getMembers(instId: string): Promise<MembershipFull[]> {
  if (USE_MOCKS) {
    await delay(500);
    return mockMembers.filter(m => m.institution_id === instId || instId === 'inst-001');
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members`);
  const json = await res.json();
  return json.data;
}

export async function inviteMember(instId: string, payload: InviteMemberPayload): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay(600);
    const member: MembershipFull = {
      id: mockId('mem'), user_id: mockId('user'), institution_id: instId,
      role: payload.role, status: 'invited', name: '', email: payload.email,
      avatar_url: '', created_at: now(),
    };
    mockMembers = [...mockMembers, member];
    return member;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/invite`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json.data;
}

export async function updateMemberRole(instId: string, memberId: string, role: MembershipRole): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay(400);
    mockMembers = mockMembers.map((m) => m.id === memberId ? { ...m, role } : m);
    const updated = mockMembers.find((m) => m.id === memberId);
    if (!updated) throw new Error('Member not found');
    return updated;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}/role`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const json = await res.json();
  return json.data;
}

export async function suspendMember(instId: string, memberId: string): Promise<MembershipFull> {
  if (USE_MOCKS) {
    await delay(400);
    mockMembers = mockMembers.map((m) => m.id === memberId ? { ...m, status: 'suspended' as const } : m);
    const updated = mockMembers.find((m) => m.id === memberId);
    if (!updated) throw new Error('Member not found');
    return updated;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}/suspend`, {
    method: 'POST',
  });
  const json = await res.json();
  return json.data;
}

export async function removeMember(instId: string, memberId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    mockMembers = mockMembers.filter((m) => m.id !== memberId);
    return;
  }
  await fetch(`${API_BASE_URL}/institutions/${instId}/members/${memberId}`, { method: 'DELETE' });
}

// ============================================================
// Agent 5 \u2014 Plans API
// Backend: routes-plans.tsx (Agent 1)
// ALIGNED: Agent 4 signatures use Partial<PricingPlan>
// Agent 5 UI forms use PlanCreatePayload (strict) then pass to these
// functions \u2014 structurally compatible via TypeScript duck typing.
// ============================================================

export async function getPlans(instId: string): Promise<PricingPlan[]> {
  if (USE_MOCKS) {
    await delay(500);
    return mockPlans.filter(p => p.institution_id === instId || instId === 'inst-001');
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans`);
  const json = await res.json();
  return json.data;
}

export async function createPlan(instId: string, plan: Partial<PricingPlan>): Promise<PricingPlan> {
  if (USE_MOCKS) {
    await delay(600);
    const newPlan: PricingPlan = {
      id: mockId('plan'), institution_id: instId,
      name: plan.name || 'Novo Plano', description: plan.description,
      price: plan.price ?? 0, currency: plan.currency || 'BRL',
      is_default: plan.is_default ?? false, is_trial: plan.is_trial ?? false,
      trial_duration_days: plan.trial_duration_days,
      duration_days: plan.duration_days, features: plan.features || [],
      max_students: plan.max_students, active: plan.active ?? true,
      active_students: 0,
      created_at: now(), updated_at: now(),
    };
    mockPlans = [...mockPlans, newPlan];
    return newPlan;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  const json = await res.json();
  return json.data;
}

export async function updatePlan(instId: string, planId: string, data: Partial<PricingPlan>): Promise<PricingPlan> {
  if (USE_MOCKS) {
    await delay(500);
    mockPlans = mockPlans.map((p) => p.id === planId ? { ...p, ...data, updated_at: now() } : p);
    const updated = mockPlans.find((p) => p.id === planId);
    if (!updated) throw new Error('Plan not found');
    return updated;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans/${planId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data;
}

export async function deletePlan(instId: string, planId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    const plan = mockPlans.find((p) => p.id === planId);
    if (plan && (plan.active_students ?? 0) > 0) {
      throw new Error('Cannot delete plan with active students');
    }
    mockPlans = mockPlans.filter((p) => p.id !== planId);
    return;
  }
  await fetch(`${API_BASE_URL}/institutions/${instId}/plans/${planId}`, { method: 'DELETE' });
}

export async function togglePlanActive(instId: string, planId: string): Promise<PricingPlan> {
  if (USE_MOCKS) {
    await delay(300);
    mockPlans = mockPlans.map((p) => p.id === planId ? { ...p, active: !p.active, updated_at: now() } : p);
    const updated = mockPlans.find((p) => p.id === planId);
    if (!updated) throw new Error('Plan not found');
    return updated;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans/${planId}/toggle`, {
    method: 'POST',
  });
  const json = await res.json();
  return json.data;
}

// ── Plan Access Rules ───────────────────────────────────────────
// ALIGNED: Agent 4 signature: createPlanRule(planId, rule: Partial<PlanAccessRule>)

export async function getPlanRules(planId: string): Promise<PlanAccessRule[]> {
  if (USE_MOCKS) {
    await delay(400);
    return mockPlanRules.filter((r) => r.plan_id === planId);
  }
  const res = await fetch(`${API_BASE_URL}/plans/${planId}/rules`);
  const json = await res.json();
  return json.data;
}

export async function createPlanRule(planId: string, rule: Partial<PlanAccessRule>): Promise<PlanAccessRule> {
  if (USE_MOCKS) {
    await delay(500);
    const scopeOpt = mockScopeOptions.find((o) => o.id === rule.scope_id);
    const newRule: PlanAccessRule = {
      id: mockId('rule'), plan_id: planId,
      scope_type: rule.scope_type || 'course', scope_id: rule.scope_id || '',
      scope_name: scopeOpt?.name ?? rule.scope_id ?? '',
      content_types: rule.content_types || [],
      created_at: now(),
    };
    mockPlanRules = [...mockPlanRules, newRule];
    return newRule;
  }
  const res = await fetch(`${API_BASE_URL}/plans/${planId}/rules`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
  const json = await res.json();
  return json.data;
}

export async function deletePlanRule(planId: string, ruleId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    mockPlanRules = mockPlanRules.filter((r) => r.id !== ruleId);
    return;
  }
  await fetch(`${API_BASE_URL}/plans/${planId}/rules/${ruleId}`, { method: 'DELETE' });
}

// ============================================================
// Agent 5 \u2014 Admin Scopes API
// Backend: Agent 1 CRUD_ADMIN_SCOPES_DONE
// ALIGNED: Agent 4 signature: createAdminScope(instId, scope: Partial<AdminScope>)
// ============================================================

export async function getAdminScopes(instId: string, memberId?: string): Promise<AdminScope[]> {
  if (USE_MOCKS) {
    await delay(400);
    let scopes = mockAdminScopes.filter((s) => s.institution_id === instId || instId === 'inst-001');
    if (memberId) scopes = scopes.filter((s) => s.member_id === memberId);
    return scopes;
  }
  const params = memberId ? `?member_id=${memberId}` : '';
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/scopes${params}`);
  const json = await res.json();
  return json.data;
}

export async function createAdminScope(instId: string, scope: Partial<AdminScope>): Promise<AdminScope> {
  if (USE_MOCKS) {
    await delay(500);
    const scopeOpt = mockScopeOptions.find((o) => o.id === scope.scope_id);
    const member = mockMembers.find((m) => m.id === scope.member_id);
    const newScope: AdminScope = {
      id: mockId('scope'), institution_id: instId,
      member_id: scope.member_id || '', scope_type: scope.scope_type || 'course',
      scope_id: scope.scope_id || '', permissions: scope.permissions || [],
      scope_name: scopeOpt?.name ?? scope.scope_id ?? '',
      member_name: member?.name ?? '', member_email: member?.email ?? '',
      created_at: now(),
    };
    mockAdminScopes = [...mockAdminScopes, newScope];
    return newScope;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/scopes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scope),
  });
  const json = await res.json();
  return json.data;
}

export async function deleteAdminScope(instId: string, scopeId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    mockAdminScopes = mockAdminScopes.filter((s) => s.id !== scopeId);
    return;
  }
  await fetch(`${API_BASE_URL}/institutions/${instId}/scopes/${scopeId}`, { method: 'DELETE' });
}

// ── Scope Options (for dropdowns) ────────────────────────

export async function getScopeOptions(instId: string, type?: string): Promise<ScopeOption[]> {
  if (USE_MOCKS) {
    await delay(300);
    if (type) return mockScopeOptions.filter((o) => o.type === type);
    return [...mockScopeOptions];
  }
  const params = type ? `?type=${type}` : '';
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/scope-options${params}`);
  const json = await res.json();
  return json.data;
}

// ============================================================
// Agent 5 \u2014 Dashboard Stats API
// Aggregated data for AdminDashboard overview
// ============================================================

export interface DashboardStats {
  totalMembers: number;
  totalPlans: number;
  activeStudents: number;
  pendingInvites: number;
  membersByRole: Record<string, number>;
  hasInstitution: boolean;
  institutionName: string;
}

export async function getDashboardStats(instId: string): Promise<DashboardStats> {
  if (USE_MOCKS) {
    await delay(400);
    const members = mockMembers.filter(m => m.institution_id === instId || instId === 'inst-001');
    const plans = mockPlans.filter((p) => p.active && (p.institution_id === instId || instId === 'inst-001'));
    const roleCount: Record<string, number> = {};
    members.forEach((m) => { roleCount[m.role] = (roleCount[m.role] || 0) + 1; });
    return {
      totalMembers: members.length,
      totalPlans: plans.length,
      activeStudents: members.filter((m) => m.role === 'student' && m.status === 'active').length,
      pendingInvites: members.filter((m) => m.status === 'invited').length,
      membersByRole: roleCount,
      hasInstitution: mockInstitution !== null,
      institutionName: mockInstitution?.name ?? '',
    };
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/dashboard-stats`);
  const json = await res.json();
  return json.data;
}
