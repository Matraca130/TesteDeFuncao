// Axon v4.4 — API Smart Study: Recommendations (BKT/FSRS computation stubbed until Agent 2+3)
import type { SmartStudyRecommendation } from './types-extended';
import { USE_MOCKS, API_BASE_URL, authHeaders, delay, now } from './api-core';

const _recs: SmartStudyRecommendation[] = [
  { id: 'ssr-001', student_id: 'demo-student-001', type: 'review-flashcard', resource_id: 'fc-001', resource_name: 'Femur — Osso mais longo', reason: 'Revisao programada (FSRS): intervalo venceu ha 2 dias', priority: 1, estimated_minutes: 5, due_date: '2025-02-17T00:00:00Z', status: 'pending', created_at: '2025-02-19T08:00:00Z' },
  { id: 'ssr-002', student_id: 'demo-student-001', type: 'study-topic', resource_id: 'topic-tibia', resource_name: 'Tibia e Fibula', reason: 'Topico nao iniciado; parte do plano de estudo ativo', priority: 2, estimated_minutes: 30, due_date: '2025-03-12T00:00:00Z', status: 'pending', created_at: '2025-02-19T08:00:00Z' },
  { id: 'ssr-003', student_id: 'demo-student-001', type: 'take-quiz', resource_id: 'kw-nervo-vago', resource_name: 'Quiz: Nervo Vago', reason: 'BKT P(know) = 0.45 — abaixo do threshold de maestria', priority: 3, estimated_minutes: 10, due_date: null, status: 'pending', created_at: '2025-02-19T08:00:00Z' },
  { id: 'ssr-004', student_id: 'demo-student-001', type: 'read-summary', resource_id: 'sum-cranial-1', resource_name: 'Resumo: Nervos Cranianos', reason: 'Leitura 100% mas retencao estimada < 70% (curva de esquecimento)', priority: 4, estimated_minutes: 15, due_date: null, status: 'pending', created_at: '2025-02-19T08:00:00Z' },
];

export async function getSmartRecommendations(studentId: string, limit = 10): Promise<SmartStudyRecommendation[]> {
  if (USE_MOCKS) {
    await delay(200);
    return _recs.filter(r => r.student_id === studentId && r.status === 'pending').sort((a, b) => a.priority - b.priority).slice(0, limit);
  }
  return (await (await fetch(`${API_BASE_URL}/students/${studentId}/smart-recommendations?limit=${limit}`, { headers: authHeaders() })).json()).data;
}

export async function dismissRecommendation(recId: string): Promise<SmartStudyRecommendation> {
  if (USE_MOCKS) {
    await delay();
    const i = _recs.findIndex(r => r.id === recId);
    if (i === -1) throw new Error(`Recommendation ${recId} not found`);
    _recs[i] = { ..._recs[i], status: 'dismissed' };
    return _recs[i];
  }
  return (await (await fetch(`${API_BASE_URL}/smart-recommendations/${recId}/dismiss`, { method: 'PATCH', headers: authHeaders() })).json()).data;
}

export async function completeRecommendation(recId: string): Promise<SmartStudyRecommendation> {
  if (USE_MOCKS) {
    await delay();
    const i = _recs.findIndex(r => r.id === recId);
    if (i === -1) throw new Error(`Recommendation ${recId} not found`);
    _recs[i] = { ..._recs[i], status: 'completed' };
    return _recs[i];
  }
  return (await (await fetch(`${API_BASE_URL}/smart-recommendations/${recId}/complete`, { method: 'PATCH', headers: authHeaders() })).json()).data;
}
