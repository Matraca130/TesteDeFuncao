// ============================================================
// Axon v4.4 — Unified API Client (Agent 4 BRIDGE pattern)
// Rewired by Agent 6 — PRISM
//
// 3-Layer: UI -> Hooks -> api-client (this file)
//
// USE_MOCKS=true (default): in-memory store with simulated delay
// USE_MOCKS=false: fetch to real Hono endpoints (when available)
//
// SHIMS SECTION at bottom: 23 Agent 4 function aliases that the
// REWIRED hooks import. These delegate to the existing mock store.
//
// Phase 4: barrel re-export of api-client-extensions.ts REMOVED.
// Consumers now import directly from api-*.ts modules.
// ============================================================
import {
  MOCK_SUMMARIES, MOCK_KEYWORDS, MOCK_FLASHCARDS, MOCK_QUIZ_QUESTIONS,
  MOCK_VIDEOS, MOCK_STUDENT_NOTES, MOCK_VIDEO_NOTES, MOCK_SMART_STUDY,
  MOCK_STUDY_PLANS, MOCK_DAILY_ACTIVITY,
  type Summary, type Keyword, type Flashcard, type QuizQuestion,
  type Video, type StudentNote, type VideoNote, type SmartStudyItem,
  type StudyPlan, type StudyPlanItem, type DailyActivity,
} from '../data/mock-data';

import type { KeywordSummaryLink, StudyGoal, SmartStudyRecommendation } from './types-extended';
import type { StudyPlan as A4StudyPlan } from './types-extended';

// ── Config ────────────────────────────────────────────────────────
import { apiBaseUrl } from './config';
import { setApiAuthToken, getApiAuthToken, authHeaders } from './api-core';
export { setApiAuthToken, getApiAuthToken };

const USE_MOCKS = false; 
const API_BASE_URL = apiBaseUrl;

function mockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms = 150): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function now(): string {
  return new Date().toISOString();
}

// ── In-Memory Store (mutable, survives re-renders) ────────────
const store = {
  summaries: [...MOCK_SUMMARIES] as Summary[],
  keywords: [...MOCK_KEYWORDS] as Keyword[],
  flashcards: [...MOCK_FLASHCARDS] as Flashcard[],
  quizQuestions: [...MOCK_QUIZ_QUESTIONS] as QuizQuestion[],
  videos: [...MOCK_VIDEOS] as Video[],
  studentNotes: [...MOCK_STUDENT_NOTES] as StudentNote[],
  videoNotes: [...MOCK_VIDEO_NOTES] as VideoNote[],
  smartStudy: [...MOCK_SMART_STUDY] as SmartStudyItem[],
  studyPlans: [...MOCK_STUDY_PLANS] as StudyPlan[],
  dailyActivity: [...MOCK_DAILY_ACTIVITY] as DailyActivity[],
  studyGoals: [] as StudyGoal[],
};

// ══════════════════════════════════════════════════════════════
// SUMMARIES
// ══════════════════════════════════════════════════════════════
export async function getSummaries(): Promise<Summary[]> {
  if (USE_MOCKS) { await delay(); return [...store.summaries]; }
  const res = await fetch(`${API_BASE_URL}/summaries`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function getSummaryById(id: string): Promise<Summary | undefined> {
  if (USE_MOCKS) { await delay(); return store.summaries.find(s => s.id === id); }
  const res = await fetch(`${API_BASE_URL}/summaries/${id}`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// KEYWORDS (professor CRUD)
// ══════════════════════════════════════════════════════════════
export async function getKeywords(): Promise<any[]> {
  if (USE_MOCKS) { await delay(); return [...store.keywords]; }
  const res = await fetch(`${API_BASE_URL}/keywords`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createKeyword(data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const kw: Keyword = { ...data, id: mockId('kw'), created_at: now().split('T')[0], deleted_at: null };
    store.keywords.push(kw);
    return kw;
  }
  const res = await fetch(`${API_BASE_URL}/keywords`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function updateKeyword(id: string, data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const i = store.keywords.findIndex(k => k.id === id);
    if (i === -1) throw new Error(`Keyword ${id} not found`);
    store.keywords[i] = { ...store.keywords[i], ...data };
    return store.keywords[i];
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function softDeleteKeyword(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.keywords.findIndex(k => k.id === id);
    if (i !== -1) store.keywords[i] = { ...store.keywords[i], deleted_at: now() };
    return;
  }
  await fetch(`${API_BASE_URL}/keywords/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export async function generateKeywordAI(summaryId: string): Promise<Keyword> {
  if (USE_MOCKS) {
    await delay(2000);
    const kw: Keyword = {
      id: mockId('kw-ai'), term: 'Complexo de Golgi',
      definition: 'Organela responsavel pela modificacao, empacotamento e transporte de proteinas e lipidios.',
      priority: 4, summary_id: summaryId, status: 'draft',
      created_at: now().split('T')[0], deleted_at: null,
    };
    store.keywords.push(kw);
    return kw;
  }
  const res = await fetch(`${API_BASE_URL}/keywords/generate`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ summary_id: summaryId }) });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// FLASHCARDS (professor CRUD)
// ══════════════════════════════════════════════════════════════
export async function getFlashcards(): Promise<any[]> {
  if (USE_MOCKS) { await delay(); return [...store.flashcards]; }
  const res = await fetch(`${API_BASE_URL}/flashcards`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createFlashcard(data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const fc: Flashcard = { ...data, id: mockId('fc'), deleted_at: null };
    store.flashcards.push(fc);
    return fc;
  }
  const res = await fetch(`${API_BASE_URL}/flashcards`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function updateFlashcard(id: string, data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const i = store.flashcards.findIndex(f => f.id === id);
    if (i === -1) throw new Error(`Flashcard ${id} not found`);
    store.flashcards[i] = { ...store.flashcards[i], ...data };
    return store.flashcards[i];
  }
  const res = await fetch(`${API_BASE_URL}/flashcards/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function softDeleteFlashcard(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.flashcards.findIndex(f => f.id === id);
    if (i !== -1) store.flashcards[i] = { ...store.flashcards[i], deleted_at: now() };
    return;
  }
  await fetch(`${API_BASE_URL}/flashcards/${id}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// QUIZ QUESTIONS (professor CRUD)
// ══════════════════════════════════════════════════════════════
export async function getQuizQuestions(): Promise<any[]> {
  if (USE_MOCKS) { await delay(); return [...store.quizQuestions]; }
  const res = await fetch(`${API_BASE_URL}/quiz-questions`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createQuizQuestion(data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const q: QuizQuestion = { ...data, id: mockId('qq'), deleted_at: null };
    store.quizQuestions.push(q);
    return q;
  }
  const res = await fetch(`${API_BASE_URL}/quiz-questions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function updateQuizQuestion(id: string, data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const i = store.quizQuestions.findIndex(q => q.id === id);
    if (i === -1) throw new Error(`QuizQuestion ${id} not found`);
    store.quizQuestions[i] = { ...store.quizQuestions[i], ...data };
    return store.quizQuestions[i];
  }
  const res = await fetch(`${API_BASE_URL}/quiz-questions/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function softDeleteQuizQuestion(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.quizQuestions.findIndex(q => q.id === id);
    if (i !== -1) store.quizQuestions[i] = { ...store.quizQuestions[i], deleted_at: now() };
    return;
  }
  await fetch(`${API_BASE_URL}/quiz-questions/${id}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// VIDEOS (professor CRUD)
// ══════════════════════════════════════════════════════════════
export async function getVideos(summaryId?: string): Promise<any[]> {
  if (USE_MOCKS) {
    await delay();
    return summaryId ? store.videos.filter(v => v.summary_id === summaryId) : [...store.videos];
  }
  const q = summaryId ? `?summary_id=${summaryId}` : '';
  const res = await fetch(`${API_BASE_URL}/videos${q}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createVideo(dataOrSummaryId: any, maybeData?: any): Promise<any> {
  let videoData: any;
  if (typeof dataOrSummaryId === 'string' && maybeData) {
    videoData = {
      title: maybeData.title, url: maybeData.url, description: maybeData.description || '',
      summary_id: dataOrSummaryId,
      duration_seconds: maybeData.duration_ms != null ? Math.round(maybeData.duration_ms / 1000) : (maybeData.duration_seconds || 0),
      order: maybeData.order_index ?? maybeData.order ?? 0,
    };
  } else { videoData = dataOrSummaryId; }
  if (USE_MOCKS) {
    await delay();
    const v: Video = { ...videoData, id: mockId('vid'), deleted_at: null };
    store.videos.push(v);
    return v;
  }
  const res = await fetch(`${API_BASE_URL}/videos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(videoData) });
  return (await res.json()).data;
}

export async function updateVideo(id: string, data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videos.findIndex(v => v.id === id);
    if (i === -1) throw new Error(`Video ${id} not found`);
    store.videos[i] = { ...store.videos[i], ...data };
    return store.videos[i];
  }
  const res = await fetch(`${API_BASE_URL}/videos/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function softDeleteVideo(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videos.findIndex(v => v.id === id);
    if (i !== -1) store.videos[i] = { ...store.videos[i], deleted_at: now() };
    return;
  }
  await fetch(`${API_BASE_URL}/videos/${id}`, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// STUDENT NOTES
// ══════════════════════════════════════════════════════════════
export async function getStudentNotes(summaryId: string): Promise<StudentNote[]> {
  if (USE_MOCKS) { await delay(); return store.studentNotes.filter(n => n.summary_id === summaryId); }
  const res = await fetch(`${API_BASE_URL}/student-notes?summary_id=${summaryId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function saveStudentNote(summaryId: string, content: string): Promise<StudentNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studentNotes.findIndex(n => n.summary_id === summaryId);
    if (i !== -1) {
      store.studentNotes[i] = { ...store.studentNotes[i], content, updated_at: now() };
      return store.studentNotes[i];
    }
    const n: StudentNote = { id: mockId('note'), summary_id: summaryId, content, created_at: now(), updated_at: now() };
    store.studentNotes.push(n);
    return n;
  }
  const res = await fetch(`${API_BASE_URL}/student-notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ summary_id: summaryId, content }) });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// VIDEO NOTES
// ══════════════════════════════════════════════════════════════
export async function getVideoNotes(videoId: string): Promise<VideoNote[]> {
  if (USE_MOCKS) { await delay(); return store.videoNotes.filter(n => n.video_id === videoId); }
  const res = await fetch(`${API_BASE_URL}/video-notes?video_id=${videoId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function saveVideoNote(videoId: string, content: string, timestampSeconds: number): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const n: VideoNote = { id: mockId('vnote'), video_id: videoId, content, timestamp_seconds: timestampSeconds, created_at: now() };
    store.videoNotes.push(n);
    return n;
  }
  const res = await fetch(`${API_BASE_URL}/video-notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ video_id: videoId, content, timestamp_seconds: timestampSeconds }) });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// SMART STUDY & RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════
export async function getSmartStudyItems(): Promise<SmartStudyItem[]> {
  if (USE_MOCKS) { await delay(); return [...store.smartStudy]; }
  const res = await fetch(`${API_BASE_URL}/smart-study`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function getSmartStudyRecommendations(): Promise<SmartStudyRecommendation[]> {
  if (USE_MOCKS) {
    await delay();
    return [
      { id: 'rec-1', type: 'review', title: 'Revisar Citologia', description: 'Voce errou 3 questoes sobre organelas ontem.', priority: 'high', reason: 'Performance' },
      { id: 'rec-2', type: 'new_content', title: 'Ver Proximo Video', description: 'Assista "Divisao Celular" para completar o modulo.', priority: 'medium', reason: 'Progresso' },
    ];
  }
  const res = await fetch(`${API_BASE_URL}/smart-study/recommendations`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// STUDY PLANS
// ══════════════════════════════════════════════════════════════
export async function getStudyPlans(): Promise<StudyPlan[]> {
  if (USE_MOCKS) { await delay(); return [...store.studyPlans]; }
  const res = await fetch(`${API_BASE_URL}/study-plans`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function getStudyPlanById(id: string): Promise<StudyPlan | undefined> {
  if (USE_MOCKS) { await delay(); return store.studyPlans.find(p => p.id === id); }
  const res = await fetch(`${API_BASE_URL}/study-plans/${id}`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// DAILY ACTIVITY
// ══════════════════════════════════════════════════════════════
export async function getDailyActivity(): Promise<DailyActivity[]> {
  if (USE_MOCKS) { await delay(); return [...store.dailyActivity]; }
  const res = await fetch(`${API_BASE_URL}/daily-activity`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// STUDY GOALS
// ══════════════════════════════════════════════════════════════
export async function getStudyGoals(): Promise<StudyGoal[]> {
  if (USE_MOCKS) { await delay(); return [...store.studyGoals]; }
  const res = await fetch(`${API_BASE_URL}/study-goals`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createStudyGoal(data: any): Promise<StudyGoal> {
  if (USE_MOCKS) {
    await delay();
    const g: StudyGoal = { ...data, id: mockId('goal'), created_at: now(), status: 'active' };
    store.studyGoals.push(g);
    return g;
  }
  const res = await fetch(`${API_BASE_URL}/study-goals`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// SHIMS (Agent 4 compatibility)
// ══════════════════════════════════════════════════════════════
export const getSummariesList = getSummaries;
export const getSummaryDetails = getSummaryById;
export const getFlashcardsList = getFlashcards;
export const getQuizList = getQuizQuestions;
export const getVideosList = getVideos;
export const getStudyPlan = getStudyPlanById;
export const getSmartStudy = getSmartStudyItems;
export const getRecommendations = getSmartStudyRecommendations;
export const getDailyStats = getDailyActivity;
export const getGoals = getStudyGoals;
export const addGoal = createStudyGoal;
export const updateGoal = async (id: string, data: any) => {
  if (USE_MOCKS) {
    const i = store.studyGoals.findIndex(g => g.id === id);
    if (i !== -1) store.studyGoals[i] = { ...store.studyGoals[i], ...data };
    return store.studyGoals[i];
  }
  const res = await fetch(`${API_BASE_URL}/study-goals/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
};
export const deleteGoal = async (id: string) => {
  if (USE_MOCKS) {
    const i = store.studyGoals.findIndex(g => g.id === id);
    if (i !== -1) store.studyGoals.splice(i, 1);
    return;
  }
  await fetch(`${API_BASE_URL}/study-goals/${id}`, { method: 'DELETE', headers: authHeaders() });
};
export const getKeywordLinks = async (summaryId: string): Promise<KeywordSummaryLink[]> => {
  if (USE_MOCKS) {
    await delay();
    return store.keywords
      .filter(k => k.summary_id === summaryId)
      .map(k => ({ id: k.id, keyword_id: k.id, summary_id: k.summary_id, term: k.term }));
  }
  const res = await fetch(`${API_BASE_URL}/keywords/links?summary_id=${summaryId}`, { headers: authHeaders() });
  return (await res.json()).data;
};
export const getA4StudyPlans = async (): Promise<A4StudyPlan[]> => {
  if (USE_MOCKS) { await delay(); return store.studyPlans as unknown as A4StudyPlan[]; }
  const res = await fetch(`${API_BASE_URL}/study-plans`, { headers: authHeaders() });
  return (await res.json()).data;
};
export const getA4StudyPlan = async (id: string): Promise<A4StudyPlan | undefined> => {
  if (USE_MOCKS) { await delay(); return store.studyPlans.find(p => p.id === id) as unknown as A4StudyPlan; }
  const res = await fetch(`${API_BASE_URL}/study-plans/${id}`, { headers: authHeaders() });
  return (await res.json()).data;
};
