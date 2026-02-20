// Axon v4.4 — API Quiz Content: QuizQuestion CRUD
import type { QuizQuestion } from './types-extended';
import { USE_MOCKS, API_BASE_URL, authHeaders, mockId, delay, now } from './api-core';

const _questions: QuizQuestion[] = [
  { id: 'qq-001', keyword_id: 'kw-femur', summary_id: 'sum-femur-1', institution_id: 'inst-001', question_text: 'Qual e o osso mais longo do corpo humano?', question_type: 'multiple-choice', options: ['Umero', 'Femur', 'Tibia', 'Fibula'], correct_answer: 'Femur', explanation: 'O femur e o maior e mais forte osso do esqueleto.', difficulty: 2, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-02-01T10:00:00Z', updated_at: '2025-02-01T10:00:00Z' },
  { id: 'qq-002', keyword_id: 'kw-femur', summary_id: 'sum-femur-1', institution_id: 'inst-001', question_text: 'O trocanter maior do femur serve de insercao para qual musculo?', question_type: 'fill-blank', options: [], correct_answer: 'Gluteo medio', explanation: 'O gluteo medio se insere no trocanter maior.', difficulty: 3, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-02-02T10:00:00Z', updated_at: '2025-02-02T10:00:00Z' },
  { id: 'qq-003', keyword_id: 'kw-nervo-vago', summary_id: 'sum-cranial-1', institution_id: 'inst-001', question_text: 'O nervo vago e o ___ par craniano.', question_type: 'fill-blank', options: [], correct_answer: 'X', explanation: 'O nervo vago (CN X) e o decimo par craniano.', difficulty: 1, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-02-05T10:00:00Z', updated_at: '2025-02-05T10:00:00Z' },
  { id: 'qq-004', keyword_id: 'kw-nervo-vago', summary_id: null, institution_id: 'inst-001', question_text: 'O nervo vago tem funcao simpática. Verdadeiro ou falso?', question_type: 'true-false', options: ['Verdadeiro', 'Falso'], correct_answer: 'Falso', explanation: 'O nervo vago tem funcao parassimpatica, nao simpatica.', difficulty: 1, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-02-06T10:00:00Z', updated_at: '2025-02-06T10:00:00Z' },
];

export async function getQuizQuestionsByKeyword(keywordId: string): Promise<QuizQuestion[]> {
  if (USE_MOCKS) { await delay(); return _questions.filter(q => q.keyword_id === keywordId); }
  return (await (await fetch(`${API_BASE_URL}/keywords/${keywordId}/quiz-questions`, { headers: authHeaders() })).json()).data;
}

export async function getQuizQuestionsBySummary(summaryId: string): Promise<QuizQuestion[]> {
  if (USE_MOCKS) { await delay(); return _questions.filter(q => q.summary_id === summaryId); }
  return (await (await fetch(`${API_BASE_URL}/summaries/${summaryId}/quiz-questions`, { headers: authHeaders() })).json()).data;
}

export async function getQuizQuestion(questionId: string): Promise<QuizQuestion | null> {
  if (USE_MOCKS) { await delay(); return _questions.find(q => q.id === questionId) ?? null; }
  return (await (await fetch(`${API_BASE_URL}/quiz-questions/${questionId}`, { headers: authHeaders() })).json()).data;
}

export async function createQuizQuestion(question: Partial<QuizQuestion>): Promise<QuizQuestion> {
  if (USE_MOCKS) {
    await delay();
    const n: QuizQuestion = {
      id: mockId('qq'), keyword_id: question.keyword_id || '', summary_id: question.summary_id ?? null,
      institution_id: question.institution_id || 'inst-001', question_text: question.question_text || '',
      question_type: question.question_type || 'multiple-choice', options: question.options || [],
      correct_answer: question.correct_answer || '', explanation: question.explanation ?? null,
      difficulty: question.difficulty ?? 2, status: question.status || 'draft',
      source: question.source || 'manual', created_by: question.created_by || 'demo-user',
      created_at: now(), updated_at: now(),
    };
    _questions.push(n); return n;
  }
  return (await (await fetch(`${API_BASE_URL}/quiz-questions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(question) })).json()).data;
}

export async function updateQuizQuestion(questionId: string, data: Partial<QuizQuestion>): Promise<QuizQuestion> {
  if (USE_MOCKS) {
    await delay();
    const i = _questions.findIndex(q => q.id === questionId);
    if (i === -1) throw new Error(`QuizQuestion ${questionId} not found`);
    _questions[i] = { ..._questions[i], ...data, updated_at: now() };
    return _questions[i];
  }
  return (await (await fetch(`${API_BASE_URL}/quiz-questions/${questionId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })).json()).data;
}

export async function deleteQuizQuestion(questionId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); const i = _questions.findIndex(q => q.id === questionId); if (i !== -1) _questions.splice(i, 1); return; }
  await fetch(`${API_BASE_URL}/quiz-questions/${questionId}`, { method: 'DELETE', headers: authHeaders() });
}
