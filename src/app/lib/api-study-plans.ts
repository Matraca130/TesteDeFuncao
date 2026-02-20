// Axon v4.4 — API Study Plans: Student study schedules (NOT pricing plans)
import type { StudyPlan, StudyGoal } from './types-extended';
import { USE_MOCKS, API_BASE_URL, authHeaders, mockId, delay, now } from './api-core';

const _plans: StudyPlan[] = [
  { id: 'sp-001', student_id: 'demo-student-001', course_id: 'course-anatomy', name: 'Preparacao para Prova de Anatomia', description: 'Revisar todos os topicos do semestre 1', target_date: '2025-03-15T00:00:00Z', daily_minutes_target: 60, status: 'active', created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-19T10:00:00Z' },
];
const _goals: StudyGoal[] = [
  { id: 'sg-001', plan_id: 'sp-001', topic_id: 'topic-femur', topic_name: 'Femur', target_mastery: 90, current_mastery: 65, status: 'in-progress', due_date: '2025-03-01T00:00:00Z', created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-19T10:00:00Z' },
  { id: 'sg-002', plan_id: 'sp-001', topic_id: 'topic-cranial', topic_name: 'Nervos Cranianos', target_mastery: 85, current_mastery: 40, status: 'in-progress', due_date: '2025-03-10T00:00:00Z', created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-19T10:00:00Z' },
  { id: 'sg-003', plan_id: 'sp-001', topic_id: 'topic-tibia', topic_name: 'Tibia e Fibula', target_mastery: 80, current_mastery: 0, status: 'pending', due_date: '2025-03-12T00:00:00Z', created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z' },
];

// ── Study Plans ──────────────────────────────────────────────
export async function getStudyPlans(studentId: string, courseId?: string): Promise<StudyPlan[]> {
  if (USE_MOCKS) { await delay(); let r = _plans.filter(p => p.student_id === studentId); if (courseId) r = r.filter(p => p.course_id === courseId); return r; }
  const q = courseId ? `?course_id=${courseId}` : '';
  return (await (await fetch(`${API_BASE_URL}/students/${studentId}/study-plans${q}`, { headers: authHeaders() })).json()).data;
}

export async function createStudyPlan(plan: Partial<StudyPlan>): Promise<StudyPlan> {
  if (USE_MOCKS) {
    await delay();
    const n: StudyPlan = {
      id: mockId('sp'), student_id: plan.student_id || 'demo-student-001',
      course_id: plan.course_id || '', name: plan.name || 'Novo Plano de Estudo',
      description: plan.description ?? null, target_date: plan.target_date ?? null,
      daily_minutes_target: plan.daily_minutes_target ?? 30, status: plan.status || 'active',
      created_at: now(), updated_at: now(),
    };
    _plans.push(n); return n;
  }
  return (await (await fetch(`${API_BASE_URL}/study-plans`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(plan) })).json()).data;
}

export async function updateStudyPlan(planId: string, data: Partial<StudyPlan>): Promise<StudyPlan> {
  if (USE_MOCKS) {
    await delay();
    const i = _plans.findIndex(p => p.id === planId);
    if (i === -1) throw new Error(`StudyPlan ${planId} not found`);
    _plans[i] = { ..._plans[i], ...data, updated_at: now() };
    return _plans[i];
  }
  return (await (await fetch(`${API_BASE_URL}/study-plans/${planId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })).json()).data;
}

export async function deleteStudyPlan(planId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); const i = _plans.findIndex(p => p.id === planId); if (i !== -1) _plans.splice(i, 1); return; }
  await fetch(`${API_BASE_URL}/study-plans/${planId}`, { method: 'DELETE', headers: authHeaders() });
}

// ── Study Goals ──────────────────────────────────────────────
export async function getStudyGoals(planId: string): Promise<StudyGoal[]> {
  if (USE_MOCKS) { await delay(); return _goals.filter(g => g.plan_id === planId); }
  return (await (await fetch(`${API_BASE_URL}/study-plans/${planId}/goals`, { headers: authHeaders() })).json()).data;
}

export async function createStudyGoal(planId: string, goal: Partial<StudyGoal>): Promise<StudyGoal> {
  if (USE_MOCKS) {
    await delay();
    const n: StudyGoal = {
      id: mockId('sg'), plan_id: planId, topic_id: goal.topic_id || '',
      topic_name: goal.topic_name || '', target_mastery: goal.target_mastery ?? 80,
      current_mastery: goal.current_mastery ?? 0, status: goal.status || 'pending',
      due_date: goal.due_date ?? null, created_at: now(), updated_at: now(),
    };
    _goals.push(n); return n;
  }
  return (await (await fetch(`${API_BASE_URL}/study-plans/${planId}/goals`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(goal) })).json()).data;
}

export async function updateStudyGoal(goalId: string, data: Partial<StudyGoal>): Promise<StudyGoal> {
  if (USE_MOCKS) {
    await delay();
    const i = _goals.findIndex(g => g.id === goalId);
    if (i === -1) throw new Error(`StudyGoal ${goalId} not found`);
    _goals[i] = { ..._goals[i], ...data, updated_at: now() };
    return _goals[i];
  }
  return (await (await fetch(`${API_BASE_URL}/study-goals/${goalId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })).json()).data;
}

export async function deleteStudyGoal(goalId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); const i = _goals.findIndex(g => g.id === goalId); if (i !== -1) _goals.splice(i, 1); return; }
  await fetch(`${API_BASE_URL}/study-goals/${goalId}`, { method: 'DELETE', headers: authHeaders() });
}
