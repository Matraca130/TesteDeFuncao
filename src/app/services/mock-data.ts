// ══════════════════════════════════════════════════════════════
// Axon v4.4 — Mock Data (Development / Fallback)
//
// Extracted from studentApi.ts for modularity.
// Single source of mock keyword, subtopic, and chat data
// used by studentApi.ts for development fallback.
//
// NOTE: Production code uses keywordPopupApi.ts (LIVE backend).
// This file exists for local dev and as reference material.
// ══════════════════════════════════════════════════════════════

import type {
  Keyword,
  SubTopic,
  SubTopicBktState,
  KeywordPopupData,
  AIChatHistory,
} from './types';

// ── Base Keywords ──────────────────────────────────────────

export const MOCK_KEYWORD_PLEXO: Keyword = {
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
  reference_source: "Gray's Anatomy, 42nd ed.",
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-02-10T14:30:00Z',
};

export const MOCK_KEYWORD_MEDIANO: Keyword = {
  id: 'kw-nervo-mediano',
  institution_id: 'inst-1',
  term: 'Nervo Mediano',
  definition:
    'Nervo misto originado dos fasciculos lateral e medial do plexo braquial (C5-T1). Inerva os musculos flexores do antebraco e os musculos tenares da mao. Sua lesao causa a "mao de benedicao" e perda de sensibilidade nos 3.5 dedos laterais.',
  priority: 1,
  status: 'published',
  source: 'manual',
  created_by: 'user-1',
  model_3d_url: null,
  reference_source: 'Netter, Atlas de Anatomia Humana',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-02-10T14:30:00Z',
};

export const MOCK_KEYWORD_MANGUITO: Keyword = {
  id: 'kw-manguito-rotador',
  institution_id: 'inst-1',
  term: 'Manguito Rotador',
  definition:
    'Conjunto de quatro musculos (supraespinhal, infraespinhal, redondo menor e subescapular) que estabilizam a articulacao glenoumeral. Lesoes do manguito sao causa frequente de dor no ombro.',
  priority: 2,
  status: 'published',
  source: 'ai_generated',
  created_by: 'user-1',
  model_3d_url: 'rotator-cuff-3d',
  reference_source: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-02-10T14:30:00Z',
};

// ── Subtopics ──────────────────────────────────────────────

export const MOCK_SUBTOPICS_PLEXO: SubTopic[] = [
  { id: 'st-1', keyword_id: 'kw-plexo-braquial', title: 'Ramos Terminais', description: 'Nervo musculocutaneo, mediano, ulnar, radial e axilar' },
  { id: 'st-2', keyword_id: 'kw-plexo-braquial', title: 'Territorio Sensitivo', description: 'Dermatomos C5-T1 e suas areas de inervacao cutanea' },
  { id: 'st-3', keyword_id: 'kw-plexo-braquial', title: 'Lesoes Clinicas', description: 'Erb-Duchenne (C5-C6), Klumpke (C8-T1), paralisia completa' },
];

// ── Subtopic BKT States ────────────────────────────────────

export const MOCK_SUBTOPIC_STATES_PLEXO: Array<SubTopicBktState | null> = [
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
  null, // "Lesoes Clinicas" not yet evaluated
];

// ── Chat History ───────────────────────────────────────────

export const MOCK_CHAT: AIChatHistory = {
  student_id: 'student-1',
  keyword_id: 'kw-plexo-braquial',
  messages: [
    {
      role: 'user',
      content: 'Quais sao os ramos terminais do plexo braquial?',
      timestamp: '2026-02-17T09:30:00Z',
    },
    {
      role: 'assistant',
      content: 'Os **cinco ramos terminais** do plexo braquial sao:\n\n- **Nervo musculocutaneo** (C5-C7): inerva os flexores do braco\n- **Nervo mediano** (C5-T1): flexores do antebraco e musculos tenares\n- **Nervo ulnar** (C8-T1): musculos hipotenares e interosseos\n- **Nervo radial** (C5-T1): extensores do membro superior\n- **Nervo axilar** (C5-C6): deltoide e redondo menor\n\nUma dica mnemonica: **"Meu Muito Util Radial Axilar"** (Musculocutaneo, Mediano, Ulnar, Radial, Axilar).',
      timestamp: '2026-02-17T09:30:05Z',
    },
  ],
  last_message_at: '2026-02-17T09:30:05Z',
};

// ── Related Keywords ───────────────────────────────────────

export const MOCK_RELATED_PLEXO: KeywordPopupData['related_keywords'] = [
  { keyword: MOCK_KEYWORD_MEDIANO, connection_label: 'ramo terminal' },
  { keyword: MOCK_KEYWORD_MANGUITO, connection_label: 'regiao anatomica' },
];

// ── Per-keyword Mock Database ──────────────────────────────

export const MOCK_DB: Record<string, KeywordPopupData> = {
  'kw-plexo-braquial': {
    keyword: MOCK_KEYWORD_PLEXO,
    subtopics: MOCK_SUBTOPICS_PLEXO,
    subtopic_states: MOCK_SUBTOPIC_STATES_PLEXO,
    related_keywords: MOCK_RELATED_PLEXO,
    chat_history: MOCK_CHAT,
    flashcard_count: 2,
    quiz_count: 2,
  },
  'kw-nervo-mediano': {
    keyword: MOCK_KEYWORD_MEDIANO,
    subtopics: [
      { id: 'st-nm-1', keyword_id: 'kw-nervo-mediano', title: 'Trajeto e relacoes', description: 'Do plexo braquial ate o tunel do carpo' },
      { id: 'st-nm-2', keyword_id: 'kw-nervo-mediano', title: 'Sindrome do Tunel do Carpo', description: 'Compressao no retinaculum flexor' },
    ],
    subtopic_states: [
      {
        student_id: 'student-1', subtopic_id: 'st-nm-1', keyword_id: 'kw-nervo-mediano',
        p_know: 0.92, max_mastery: 0.95, stability: 18.0, delta: 0.92,
        color: 'blue', exposures: 12, correct_streak: 6,
        last_review_at: '2026-02-18T08:00:00Z', last_grade: 5,
        created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-18T08:00:00Z',
      },
      {
        student_id: 'student-1', subtopic_id: 'st-nm-2', keyword_id: 'kw-nervo-mediano',
        p_know: 0.65, max_mastery: 0.70, stability: 7.0, delta: 0.65,
        color: 'yellow', exposures: 5, correct_streak: 2,
        last_review_at: '2026-02-16T11:00:00Z', last_grade: 3,
        created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-16T11:00:00Z',
      },
    ],
    related_keywords: [
      { keyword: MOCK_KEYWORD_PLEXO, connection_label: 'origem' },
    ],
    chat_history: null,
    flashcard_count: 3,
    quiz_count: 1,
  },
  'kw-manguito-rotador': {
    keyword: MOCK_KEYWORD_MANGUITO,
    subtopics: [
      { id: 'st-mr-1', keyword_id: 'kw-manguito-rotador', title: 'Musculos componentes', description: 'SITS: Supraespinhal, Infraespinhal, Redondo menor, Subescapular' },
      { id: 'st-mr-2', keyword_id: 'kw-manguito-rotador', title: 'Teste de Jobe', description: 'Avaliacao clinica do supraespinhal' },
      { id: 'st-mr-3', keyword_id: 'kw-manguito-rotador', title: 'Lesoes e Tratamento', description: 'Tendinopatia, ruptura parcial e total' },
    ],
    subtopic_states: [
      {
        student_id: 'student-1', subtopic_id: 'st-mr-1', keyword_id: 'kw-manguito-rotador',
        p_know: 0.25, max_mastery: 0.30, stability: 2.0, delta: 0.25,
        color: 'red', exposures: 2, correct_streak: 0,
        last_review_at: '2026-02-14T16:00:00Z', last_grade: 1,
        created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-14T16:00:00Z',
      },
      null,
      null,
    ],
    related_keywords: [
      { keyword: MOCK_KEYWORD_PLEXO, connection_label: 'regiao anatomica' },
    ],
    chat_history: null,
    flashcard_count: 1,
    quiz_count: 3,
  },
};
