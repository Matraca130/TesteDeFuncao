// ============================================================
// Axon v4.4 — Mock Data for Agent 6 (PRISM)
// TODO: Replace with real API hooks when Agent 4 delivers
// ============================================================

export interface Keyword {
  id: string;
  term: string;
  definition: string;
  priority: number;
  summary_id: string;
  status: 'draft' | 'published';
  created_at: string;
  deleted_at: string | null;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  keyword_id: string;
  summary_id: string;
  status: 'draft' | 'published';
  deleted_at: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  quiz_type: 'mcq' | 'true_false' | 'fill_blank' | 'open';
  options?: string[];
  correct_answer: string | number | boolean;
  keyword_id: string;
  summary_id: string;
  difficulty_tier: 'easy' | 'medium' | 'hard';
  deleted_at: string | null;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  description: string;
  summary_id: string;
  duration_seconds: number;
  order: number;
  deleted_at: string | null;
}

export interface Summary {
  id: string;
  title: string;
  status: 'draft' | 'published';
  topic_id: string;
}

export interface StudentNote {
  id: string;
  student_id: string;
  keyword_id: string;
  note: string;
  created_at: string;
  deleted_at: string | null;
}

export interface VideoNote {
  id: string;
  student_id: string;
  video_id: string;
  note: string;
  timestamp_seconds: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface SmartStudyItem {
  keyword_id: string;
  term: string;
  need_score: number;
  p_know: number;
  last_studied: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  progress: number;
  items: StudyPlanItem[];
  created_at: string;
}

export interface StudyPlanItem {
  id: string;
  keyword_id?: string;
  summary_id?: string;
  title: string;
  completed: boolean;
}

export interface DailyActivity {
  date: string;
  minutes: number;
  sessions: number;
}

// ── Mock Summaries ──
export const MOCK_SUMMARIES: Summary[] = [
  { id: 'sum-1', title: 'Biologia Celular', status: 'published', topic_id: 'top-1' },
  { id: 'sum-2', title: 'Genetica Basica', status: 'draft', topic_id: 'top-1' },
  { id: 'sum-3', title: 'Ecologia', status: 'published', topic_id: 'top-2' },
];

// ── Mock Keywords ──
export const MOCK_KEYWORDS: Keyword[] = [
  { id: 'kw-1', term: 'Mitocondria', definition: 'Organela responsavel pela producao de energia celular (ATP) atraves da respiracao celular.', priority: 5, summary_id: 'sum-1', status: 'published', created_at: '2026-01-15', deleted_at: null },
  { id: 'kw-2', term: 'Ribossomo', definition: 'Estrutura celular responsavel pela sintese de proteinas.', priority: 4, summary_id: 'sum-1', status: 'draft', created_at: '2026-01-16', deleted_at: null },
  { id: 'kw-3', term: 'DNA Polimerase', definition: 'Enzima que catalisa a sintese de DNA durante a replicacao.', priority: 5, summary_id: 'sum-1', status: 'published', created_at: '2026-01-17', deleted_at: null },
  { id: 'kw-4', term: 'Meiose', definition: 'Tipo de divisao celular que produz celulas com metade do numero de cromossomos.', priority: 3, summary_id: 'sum-2', status: 'draft', created_at: '2026-01-18', deleted_at: null },
  { id: 'kw-5', term: 'Fotossintese', definition: 'Processo pelo qual plantas convertem luz solar em energia quimica.', priority: 4, summary_id: 'sum-3', status: 'published', created_at: '2026-01-20', deleted_at: null },
];

// ── Mock Flashcards ──
export const MOCK_FLASHCARDS: Flashcard[] = [
  { id: 'fc-1', front: 'O que e a mitocondria?', back: 'Organela responsavel pela producao de ATP.', keyword_id: 'kw-1', summary_id: 'sum-1', status: 'published', deleted_at: null },
  { id: 'fc-2', front: 'Qual a funcao do ribossomo?', back: 'Sintese de proteinas a partir do mRNA.', keyword_id: 'kw-2', summary_id: 'sum-1', status: 'draft', deleted_at: null },
  { id: 'fc-3', front: 'O que faz a DNA polimerase?', back: 'Catalisa a sintese de novas fitas de DNA.', keyword_id: 'kw-3', summary_id: 'sum-1', status: 'published', deleted_at: null },
  { id: 'fc-4', front: 'O que ocorre na meiose?', back: 'Divisao celular que reduz o numero de cromossomos pela metade.', keyword_id: 'kw-4', summary_id: 'sum-2', status: 'draft', deleted_at: null },
];

// ── Mock Quiz Questions ──
export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 'qq-1', question: 'Qual organela produz ATP?', quiz_type: 'mcq', options: ['Ribossomo', 'Mitocondria', 'Lisossomo', 'Golgi'], correct_answer: 1, keyword_id: 'kw-1', summary_id: 'sum-1', difficulty_tier: 'medium', deleted_at: null },
  { id: 'qq-2', question: 'A meiose produz celulas diploides.', quiz_type: 'true_false', correct_answer: false, keyword_id: 'kw-4', summary_id: 'sum-2', difficulty_tier: 'easy', deleted_at: null },
  { id: 'qq-3', question: 'A enzima responsavel pela replicacao do DNA e a _____.', quiz_type: 'fill_blank', correct_answer: 'DNA polimerase', keyword_id: 'kw-3', summary_id: 'sum-1', difficulty_tier: 'hard', deleted_at: null },
  { id: 'qq-4', question: 'Explique o papel dos ribossomos na sintese proteica.', quiz_type: 'open', correct_answer: 'Rubrica: mencionar mRNA, tRNA, traducao', keyword_id: 'kw-2', summary_id: 'sum-1', difficulty_tier: 'hard', deleted_at: null },
];

// ── Mock Videos ──
export const MOCK_VIDEOS: Video[] = [
  { id: 'vid-1', title: 'Introducao a Biologia Celular', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', description: 'Aula introdutoria sobre celulas e suas organelas principais.', summary_id: 'sum-1', duration_seconds: 1200, order: 1, deleted_at: null },
  { id: 'vid-2', title: 'Mitocondria em Detalhe', url: 'https://vimeo.com/123456789', description: 'Video detalhado sobre a mitocondria e producao de ATP.', summary_id: 'sum-1', duration_seconds: 900, order: 2, deleted_at: null },
  { id: 'vid-3', title: 'Genetica para Iniciantes', url: 'https://youtube.com/watch?v=abc123def', description: 'Conceitos basicos de genetica e hereditariedade.', summary_id: 'sum-2', duration_seconds: 1500, order: 1, deleted_at: null },
];

// ── Mock Student Notes ──
export const MOCK_STUDENT_NOTES: StudentNote[] = [
  { id: 'sn-1', student_id: 's-1', keyword_id: 'kw-1', note: 'Lembrar que a mitocondria tem DNA proprio!', created_at: '2026-02-01', deleted_at: null },
  { id: 'sn-2', student_id: 's-1', keyword_id: 'kw-1', note: 'Revisar cadeia de transporte de eletrons', created_at: '2026-02-05', deleted_at: null },
];

// ── Mock Video Notes ──
export const MOCK_VIDEO_NOTES: VideoNote[] = [
  { id: 'vn-1', student_id: 's-1', video_id: 'vid-1', note: 'Importante: diferenca entre celula animal e vegetal', timestamp_seconds: 154, created_at: '2026-02-10', deleted_at: null },
  { id: 'vn-2', student_id: 's-1', video_id: 'vid-1', note: 'Revisar esquema da membrana plasmatica', timestamp_seconds: 342, created_at: '2026-02-10', deleted_at: null },
  { id: 'vn-3', student_id: 's-1', video_id: 'vid-1', note: 'Nota geral sobre o video — muito boa explicacao', timestamp_seconds: null, created_at: '2026-02-11', deleted_at: null },
];

// ── Mock Smart Study ──
export const MOCK_SMART_STUDY: SmartStudyItem[] = [
  { keyword_id: 'kw-1', term: 'Mitocondria', need_score: 0.85, p_know: 0.15, last_studied: '2026-02-01' },
  { keyword_id: 'kw-4', term: 'Meiose', need_score: 0.72, p_know: 0.28, last_studied: '2026-02-05' },
  { keyword_id: 'kw-3', term: 'DNA Polimerase', need_score: 0.45, p_know: 0.55, last_studied: '2026-02-12' },
  { keyword_id: 'kw-2', term: 'Ribossomo', need_score: 0.20, p_know: 0.80, last_studied: '2026-02-14' },
  { keyword_id: 'kw-5', term: 'Fotossintese', need_score: 0.60, p_know: 0.40, last_studied: '2026-02-08' },
];

// ── Mock Study Plans ──
export const MOCK_STUDY_PLANS: StudyPlan[] = [
  {
    id: 'sp-1',
    title: 'Revisao Biologia Celular',
    description: 'Revisao completa dos conceitos de biologia celular para a prova.',
    start_date: '2026-02-15',
    end_date: '2026-03-01',
    progress: 40,
    created_at: '2026-02-14',
    items: [
      { id: 'spi-1', keyword_id: 'kw-1', title: 'Mitocondria', completed: true },
      { id: 'spi-2', keyword_id: 'kw-2', title: 'Ribossomo', completed: true },
      { id: 'spi-3', keyword_id: 'kw-3', title: 'DNA Polimerase', completed: false },
      { id: 'spi-4', summary_id: 'sum-1', title: 'Biologia Celular (resumo)', completed: false },
      { id: 'spi-5', keyword_id: 'kw-5', title: 'Fotossintese', completed: false },
    ],
  },
  {
    id: 'sp-2',
    title: 'Genetica Intensiva',
    description: 'Plano intensivo de 2 semanas para dominar genetica.',
    start_date: '2026-02-20',
    end_date: '2026-03-05',
    progress: 10,
    created_at: '2026-02-18',
    items: [
      { id: 'spi-6', keyword_id: 'kw-4', title: 'Meiose', completed: false },
      { id: 'spi-7', summary_id: 'sum-2', title: 'Genetica Basica (resumo)', completed: true },
    ],
  },
];

// ── Mock Daily Activity (365 days) ──
export const MOCK_DAILY_ACTIVITY: DailyActivity[] = Array.from({ length: 365 }, (_, i) => {
  const date = new Date('2025-02-19');
  date.setDate(date.getDate() + i);
  return {
    date: date.toISOString().split('T')[0],
    minutes: Math.random() > 0.4 ? Math.floor(Math.random() * 90) : 0,
    sessions: Math.random() > 0.4 ? Math.floor(Math.random() * 5) : 0,
  };
});
