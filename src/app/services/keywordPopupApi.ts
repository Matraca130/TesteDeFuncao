// ══════════════════════════════════════════════════════════════
// Axon v4.2 — Keyword Popup API (mock-first, then backend)
// CAPA 3: UNICO ponto de contato com dados para KeywordPopup
//
// IMPORTANT: This file is SEPARATE from studentApi.ts intentionally.
// studentApi.ts (owned by other devs) handles profile, stats,
// sessions, reviews, summaries, etc.
// This file handles ONLY popup + chat mock data.
//
// When backend /keyword-popup/:id is ready, swap mocks for
// real apiFetch() calls here. Hooks don't change.
// ══════════════════════════════════════════════════════════════

import type {
  KeywordPopupData,
  AIChatHistory,
  AIChatMessage,
  Keyword,
  SubTopic,
  SubTopicBktState,
} from './types';

// ── Mock Data ─────────────────────────────────────────────────

const MOCK_KEYWORD: Keyword = {
  id: 'kw-plexo-braquial',
  institution_id: 'inst-1',
  term: 'Plexo Braquial',
  definition:
    'Rede de nervos formada pelos ramos ventrais de C5 a T1, responsavel pela inervacao motora e sensitiva do membro superior. Origina-se no triangulo posterior do pescoco, passa entre os musculos escalenos e se organiza em troncos, divisoes, fasciculos e ramos terminais.',
  priority: 0,
  status: 'published',
  source: 'manual',
  created_by: 'user-1',
  model_3d_url: 'brachial-plexus-3d',
  reference_source: 'Gray\'s Anatomy, 42nd ed.',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-02-10T14:30:00Z',
};

const MOCK_SUBTOPICS: SubTopic[] = [
  { id: 'st-1', keyword_id: 'kw-plexo-braquial', title: 'Ramos Terminais', description: 'Nervo musculocutaneo, mediano, ulnar, radial e axilar' },
  { id: 'st-2', keyword_id: 'kw-plexo-braquial', title: 'Territorio Sensitivo', description: 'Dermatomos C5-T1 e suas areas de inervacao cutanea' },
  { id: 'st-3', keyword_id: 'kw-plexo-braquial', title: 'Lesoes Clinicas', description: 'Erb-Duchenne (C5-C6), Klumpke (C8-T1), paralisia completa' },
];

const MOCK_SUBTOPIC_STATES: Array<SubTopicBktState | null> = [
  {
    student_id: 'student-1', subtopic_id: 'st-1', keyword_id: 'kw-plexo-braquial',
    p_know: 0.82, max_mastery: 0.85, stability: 12.5, delta: 0.82,
    color: 'green', exposures: 8, correct_streak: 3,
    last_review_at: '2026-02-17T09:00:00Z', last_grade: 4,
    created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-17T09:00:00Z',
  },
  {
    student_id: 'student-1', subtopic_id: 'st-2', keyword_id: 'kw-plexo-braquial',
    p_know: 0.45, max_mastery: 0.60, stability: 4.2, delta: 0.45,
    color: 'orange', exposures: 4, correct_streak: 0,
    last_review_at: '2026-02-15T14:00:00Z', last_grade: 2,
    created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-15T14:00:00Z',
  },
  null,
];

const MOCK_RELATED: KeywordPopupData['related_keywords'] = [
  {
    keyword: {
      id: 'kw-nervo-mediano', institution_id: 'inst-1',
      term: 'Nervo Mediano',
      definition: 'Nervo misto originado dos fasciculos lateral e medial do plexo braquial (C5-T1).',
      priority: 1, status: 'published', source: 'manual', created_by: 'user-1',
      model_3d_url: null, reference_source: null,
      created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-10T14:30:00Z',
    },
    connection_label: 'ramo terminal',
  },
  {
    keyword: {
      id: 'kw-manguito-rotador', institution_id: 'inst-1',
      term: 'Manguito Rotador',
      definition: 'Conjunto de quatro musculos que estabilizam a articulacao glenoumeral.',
      priority: 2, status: 'published', source: 'ai_generated', created_by: 'user-1',
      model_3d_url: 'rotator-cuff-3d', reference_source: null,
      created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-10T14:30:00Z',
    },
    connection_label: 'regiao anatomica',
  },
];

const MOCK_CHAT: AIChatHistory = {
  student_id: 'student-1',
  keyword_id: 'kw-plexo-braquial',
  messages: [
    { role: 'user', content: 'Quais sao os ramos terminais do plexo braquial?', timestamp: '2026-02-17T09:30:00Z' },
    { role: 'assistant', content: 'Os cinco ramos terminais sao: Musculocutaneo (C5-C7), Mediano (C5-T1), Ulnar (C8-T1), Radial (C5-T1), Axilar (C5-C6).', timestamp: '2026-02-17T09:30:05Z' },
  ],
  last_message_at: '2026-02-17T09:30:05Z',
};

const MOCK_DB: Record<string, KeywordPopupData> = {
  'kw-plexo-braquial': {
    keyword: MOCK_KEYWORD, subtopics: MOCK_SUBTOPICS,
    subtopic_states: MOCK_SUBTOPIC_STATES, related_keywords: MOCK_RELATED,
    chat_history: MOCK_CHAT, flashcard_count: 2, quiz_count: 2,
  },
  'kw-nervo-mediano': {
    keyword: { ...MOCK_RELATED[0].keyword },
    subtopics: [
      { id: 'st-nm-1', keyword_id: 'kw-nervo-mediano', title: 'Trajeto e relacoes', description: 'Do plexo braquial ate o tunel do carpo' },
      { id: 'st-nm-2', keyword_id: 'kw-nervo-mediano', title: 'Sindrome do Tunel do Carpo', description: 'Compressao no retinaculum flexor' },
    ],
    subtopic_states: [
      { student_id: 'student-1', subtopic_id: 'st-nm-1', keyword_id: 'kw-nervo-mediano', p_know: 0.92, max_mastery: 0.95, stability: 18.0, delta: 0.92, color: 'blue', exposures: 12, correct_streak: 6, last_review_at: '2026-02-18T08:00:00Z', last_grade: 5, created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-18T08:00:00Z' },
      { student_id: 'student-1', subtopic_id: 'st-nm-2', keyword_id: 'kw-nervo-mediano', p_know: 0.65, max_mastery: 0.70, stability: 7.0, delta: 0.65, color: 'yellow', exposures: 5, correct_streak: 2, last_review_at: '2026-02-16T11:00:00Z', last_grade: 3, created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-16T11:00:00Z' },
    ],
    related_keywords: [{ keyword: MOCK_KEYWORD, connection_label: 'origem' }],
    chat_history: null, flashcard_count: 3, quiz_count: 1,
  },
  'kw-manguito-rotador': {
    keyword: { ...MOCK_RELATED[1].keyword },
    subtopics: [
      { id: 'st-mr-1', keyword_id: 'kw-manguito-rotador', title: 'Musculos componentes', description: 'SITS: Supraespinhal, Infraespinhal, Redondo menor, Subescapular' },
      { id: 'st-mr-2', keyword_id: 'kw-manguito-rotador', title: 'Teste de Jobe', description: 'Avaliacao clinica do supraespinhal' },
    ],
    subtopic_states: [
      { student_id: 'student-1', subtopic_id: 'st-mr-1', keyword_id: 'kw-manguito-rotador', p_know: 0.25, max_mastery: 0.30, stability: 2.0, delta: 0.25, color: 'red', exposures: 2, correct_streak: 0, last_review_at: '2026-02-14T16:00:00Z', last_grade: 1, created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-14T16:00:00Z' },
      null,
    ],
    related_keywords: [{ keyword: MOCK_KEYWORD, connection_label: 'regiao anatomica' }],
    chat_history: null, flashcard_count: 1, quiz_count: 3,
  },
};

// ── API Functions (Capa 3) ─────────────────────────────────────

export async function getKeywordPopup(keywordId: string): Promise<KeywordPopupData> {
  await new Promise((r) => setTimeout(r, 300));
  const data = MOCK_DB[keywordId] || MOCK_DB['kw-plexo-braquial'];
  return { ...data, keyword: { ...data.keyword, id: keywordId } };
}

export async function getChatHistory(keywordId: string): Promise<AIChatHistory | null> {
  await new Promise((r) => setTimeout(r, 200));
  // Return the chat_history for the requested keyword (may be null)
  const data = MOCK_DB[keywordId];
  return data ? data.chat_history : null;
}

export async function sendChatMessage(
  keywordId: string,
  content: string
): Promise<{ reply: AIChatMessage }> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    reply: {
      role: 'assistant',
      content: 'Excelente pergunta! Em relacao a "' + content.slice(0, 50) + '", os ramos ventrais de C5 a T1 se organizam em troncos, divisoes e fasciculos. Cada nivel tem importancia clinica distinta.',
      timestamp: new Date().toISOString(),
    },
  };
}
