// Axon v4.4 — API Flashcards: FlashcardCard CRUD + KeywordSummaryLink CRUD
import type { FlashcardCard } from './types';
import type { KeywordSummaryLink } from './types-extended';
import { USE_MOCKS, API_BASE_URL, authHeaders, mockId, delay, now } from './api-core';

// ── Local mock store (avoids changing api-core) ──────────────
const _cards: FlashcardCard[] = [
  { id: 'fc-001', summary_id: 'sum-femur-1', keyword_id: 'kw-femur', subtopic_id: null, institution_id: 'inst-001', front: 'Qual e o osso mais longo do corpo?', back: 'Femur', image_url: null, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-02-01T10:00:00Z' },
  { id: 'fc-002', summary_id: 'sum-femur-1', keyword_id: 'kw-trocanter', subtopic_id: null, institution_id: 'inst-001', front: 'O que e o trocanter?', back: 'Saliencia ossea do femur proximal', image_url: null, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-02-01T10:00:00Z' },
  { id: 'fc-003', summary_id: 'sum-cranial-1', keyword_id: 'kw-nervo-vago', subtopic_id: null, institution_id: 'inst-001', front: 'Qual par craniano tem funcao parassimpatica?', back: 'X - Nervo Vago', image_url: null, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-02-05T10:00:00Z' },
];
const _links: KeywordSummaryLink[] = [
  { id: 'ksl-001', keyword_id: 'kw-femur', summary_id: 'sum-femur-1', created_at: '2025-02-01T10:00:00Z' },
  { id: 'ksl-002', keyword_id: 'kw-trocanter', summary_id: 'sum-femur-1', created_at: '2025-02-01T10:00:00Z' },
  { id: 'ksl-003', keyword_id: 'kw-nervo-vago', summary_id: 'sum-cranial-1', created_at: '2025-02-01T10:00:00Z' },
];

// ══════════════════════════════════════════════════════════════
// FlashcardCard CRUD
// ══════════════════════════════════════════════════════════════
export async function getFlashcardsBySummary(summaryId: string): Promise<FlashcardCard[]> {
  if (USE_MOCKS) { await delay(); return _cards.filter(c => c.summary_id === summaryId); }
  return (await (await fetch(`${API_BASE_URL}/summaries/${summaryId}/flashcards`, { headers: authHeaders() })).json()).data;
}

export async function getFlashcardsByKeyword(keywordId: string): Promise<FlashcardCard[]> {
  if (USE_MOCKS) { await delay(); return _cards.filter(c => c.keyword_id === keywordId); }
  return (await (await fetch(`${API_BASE_URL}/keywords/${keywordId}/flashcards`, { headers: authHeaders() })).json()).data;
}

export async function getFlashcard(cardId: string): Promise<FlashcardCard | null> {
  if (USE_MOCKS) { await delay(); return _cards.find(c => c.id === cardId) ?? null; }
  return (await (await fetch(`${API_BASE_URL}/flashcards/${cardId}`, { headers: authHeaders() })).json()).data;
}

export async function createFlashcard(card: Partial<FlashcardCard>): Promise<FlashcardCard> {
  if (USE_MOCKS) {
    await delay();
    const n: FlashcardCard = {
      id: mockId('fc'), summary_id: card.summary_id || '', keyword_id: card.keyword_id || '',
      subtopic_id: card.subtopic_id ?? null, institution_id: card.institution_id || 'inst-001',
      front: card.front || '', back: card.back || '', image_url: card.image_url ?? null,
      status: card.status || 'draft', source: card.source || 'manual',
      created_by: card.created_by || 'demo-user', created_at: now(),
    };
    _cards.push(n); return n;
  }
  return (await (await fetch(`${API_BASE_URL}/flashcards`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(card) })).json()).data;
}

export async function updateFlashcard(cardId: string, data: Partial<FlashcardCard>): Promise<FlashcardCard> {
  if (USE_MOCKS) {
    await delay();
    const i = _cards.findIndex(c => c.id === cardId);
    if (i === -1) throw new Error(`FlashcardCard ${cardId} not found`);
    _cards[i] = { ..._cards[i], ...data };
    return _cards[i];
  }
  return (await (await fetch(`${API_BASE_URL}/flashcards/${cardId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })).json()).data;
}

export async function deleteFlashcard(cardId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); const i = _cards.findIndex(c => c.id === cardId); if (i !== -1) _cards.splice(i, 1); return; }
  await fetch(`${API_BASE_URL}/flashcards/${cardId}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// KeywordSummaryLink CRUD (solves "Keyword has no summary_id")
// ══════════════════════════════════════════════════════════════
export async function getKeywordsBySummary(summaryId: string): Promise<KeywordSummaryLink[]> {
  if (USE_MOCKS) { await delay(); return _links.filter(l => l.summary_id === summaryId); }
  return (await (await fetch(`${API_BASE_URL}/summaries/${summaryId}/keyword-links`, { headers: authHeaders() })).json()).data;
}

export async function getSummariesByKeyword(keywordId: string): Promise<KeywordSummaryLink[]> {
  if (USE_MOCKS) { await delay(); return _links.filter(l => l.keyword_id === keywordId); }
  return (await (await fetch(`${API_BASE_URL}/keywords/${keywordId}/summary-links`, { headers: authHeaders() })).json()).data;
}

export async function linkKeywordToSummary(keywordId: string, summaryId: string): Promise<KeywordSummaryLink> {
  if (USE_MOCKS) {
    await delay();
    const existing = _links.find(l => l.keyword_id === keywordId && l.summary_id === summaryId);
    if (existing) return existing;
    const n: KeywordSummaryLink = { id: mockId('ksl'), keyword_id: keywordId, summary_id: summaryId, created_at: now() };
    _links.push(n); return n;
  }
  return (await (await fetch(`${API_BASE_URL}/keyword-summary-links`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ keyword_id: keywordId, summary_id: summaryId }) })).json()).data;
}

export async function unlinkKeywordFromSummary(linkId: string): Promise<void> {
  if (USE_MOCKS) { await delay(); const i = _links.findIndex(l => l.id === linkId); if (i !== -1) _links.splice(i, 1); return; }
  await fetch(`${API_BASE_URL}/keyword-summary-links/${linkId}`, { method: 'DELETE', headers: authHeaders() });
}

export async function getFlashcardsForStudent(studentId: string, courseId?: string): Promise<FlashcardCard[]> {
  if (USE_MOCKS) { await delay(); return courseId ? _cards.filter(c => c.status === 'published') : _cards.filter(c => c.status === 'published'); }
  const q = courseId ? `?course_id=${courseId}` : '';
  return (await (await fetch(`${API_BASE_URL}/students/${studentId}/flashcards${q}`, { headers: authHeaders() })).json()).data;
}
