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
const USE_MOCKS = true; // TODO: read from import.meta.env.VITE_USE_MOCKS
const API_BASE_URL = '/api'; // TODO: read from import.meta.env.VITE_API_BASE_URL

let _authToken: string | null = null;
export function setApiAuthToken(token: string | null) { _authToken = token; }
export function getApiAuthToken() { return _authToken; }
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_authToken) h['Authorization'] = `Bearer ${_authToken}`;
  return h;
}

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
// VIDEOS (professor CRUD) — polymorphic signatures
// Supports: (summaryId?, data?) for Agent 6 AND Agent 4 patterns
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

// Polymorphic: createVideo(data) OR createVideo(summaryId, data)
export async function createVideo(dataOrSummaryId: any, maybeData?: any): Promise<any> {
  let videoData: any;
  if (typeof dataOrSummaryId === 'string' && maybeData) {
    videoData = {
      title: maybeData.title,
      url: maybeData.url,
      description: maybeData.description || '',
      summary_id: dataOrSummaryId,
      duration_seconds: maybeData.duration_ms != null ? Math.round(maybeData.duration_ms / 1000) : (maybeData.duration_seconds || 0),
      order: maybeData.order_index ?? maybeData.order ?? 0,
    };
  } else {
    videoData = dataOrSummaryId;
  }
  if (USE_MOCKS) {
    await delay();
    const v: Video = { ...videoData, id: mockId('vid'), deleted_at: null };
    store.videos.push(v);
    return v;
  }
  const res = await fetch(`${API_BASE_URL}/videos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(videoData) });
  return (await res.json()).data;
}

// Polymorphic: updateVideo(id, data) OR updateVideo(summaryId, id, data)
export async function updateVideo(idOrSummaryId: string, dataOrId: any, maybeData?: any): Promise<any> {
  let id: string;
  let data: any;
  if (typeof dataOrId === 'string' && maybeData) {
    id = dataOrId;
    data = maybeData;
    if (data.duration_ms !== undefined) data.duration_seconds = Math.round(data.duration_ms / 1000);
    if (data.order_index !== undefined) data.order = data.order_index;
  } else {
    id = idOrSummaryId;
    data = dataOrId;
  }
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
// STUDENT NOTES — SACRED (soft-delete only)
// ══════════════════════════════════════════════════════════════
export async function getStudentNotes(keywordId: string): Promise<StudentNote[]> {
  if (USE_MOCKS) { await delay(); return store.studentNotes.filter(n => n.keyword_id === keywordId); }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createStudentNote(keywordId: string, noteText: string): Promise<StudentNote> {
  if (USE_MOCKS) {
    await delay();
    const n: StudentNote = { id: mockId('sn'), student_id: 's-1', keyword_id: keywordId, note: noteText, created_at: now().split('T')[0], deleted_at: null };
    store.studentNotes.push(n);
    return n;
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ note: noteText }) });
  return (await res.json()).data;
}

export async function updateStudentNote(id: string, noteText: string): Promise<StudentNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studentNotes.findIndex(n => n.id === id);
    if (i === -1) throw new Error(`StudentNote ${id} not found`);
    store.studentNotes[i] = { ...store.studentNotes[i], note: noteText };
    return store.studentNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/student-notes/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ note: noteText }) });
  return (await res.json()).data;
}

export async function softDeleteStudentNote(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studentNotes.findIndex(n => n.id === id);
    if (i !== -1) store.studentNotes[i] = { ...store.studentNotes[i], deleted_at: now() };
    return;
  }
  await fetch(`${API_BASE_URL}/student-notes/${id}/soft-delete`, { method: 'PATCH', headers: authHeaders() });
}

export async function restoreStudentNote(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studentNotes.findIndex(n => n.id === id);
    if (i !== -1) store.studentNotes[i] = { ...store.studentNotes[i], deleted_at: null };
    return;
  }
  await fetch(`${API_BASE_URL}/student-notes/${id}/restore`, { method: 'PATCH', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// VIDEO NOTES — SACRED (soft-delete only) — polymorphic
// ══════════════════════════════════════════════════════════════
export async function getVideoNotes(videoId: string): Promise<VideoNote[]> {
  if (USE_MOCKS) { await delay(); return store.videoNotes.filter(n => n.video_id === videoId); }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createVideoNote(
  videoId: string,
  noteTextOrStudentId: string,
  timestampSecondsOrNoteText: number | string | null,
  maybeTimestampMs?: number | null,
): Promise<VideoNote> {
  let noteText: string;
  let timestampSeconds: number | null;

  if (maybeTimestampMs !== undefined) {
    noteText = timestampSecondsOrNoteText as string;
    timestampSeconds = maybeTimestampMs != null ? Math.round(maybeTimestampMs / 1000) : null;
  } else {
    noteText = noteTextOrStudentId;
    timestampSeconds = timestampSecondsOrNoteText as number | null;
  }

  if (USE_MOCKS) {
    await delay();
    const n: VideoNote = { id: mockId('vn'), student_id: 's-1', video_id: videoId, note: noteText, timestamp_seconds: timestampSeconds, created_at: now().split('T')[0], deleted_at: null };
    store.videoNotes.push(n);
    return n;
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ note: noteText, timestamp_seconds: timestampSeconds }) });
  return (await res.json()).data;
}

export async function updateVideoNote(id: string, noteText: string): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videoNotes.findIndex(n => n.id === id);
    if (i === -1) throw new Error(`VideoNote ${id} not found`);
    store.videoNotes[i] = { ...store.videoNotes[i], note: noteText };
    return store.videoNotes[i];
  }
  const res = await fetch(`${API_BASE_URL}/video-notes/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ note: noteText }) });
  return (await res.json()).data;
}

export async function softDeleteVideoNote(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videoNotes.findIndex(n => n.id === id);
    if (i !== -1) store.videoNotes[i] = { ...store.videoNotes[i], deleted_at: now() };
    return;
  }
  await fetch(`${API_BASE_URL}/video-notes/${id}/soft-delete`, { method: 'PATCH', headers: authHeaders() });
}

export async function restoreVideoNote(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const i = store.videoNotes.findIndex(n => n.id === id);
    if (i !== -1) store.videoNotes[i] = { ...store.videoNotes[i], deleted_at: null };
    return;
  }
  await fetch(`${API_BASE_URL}/video-notes/${id}/restore`, { method: 'PATCH', headers: authHeaders() });
}

// ══════════════════════════════════════════════════════════════
// SMART STUDY
// ══════════════════════════════════════════════════════════════
export async function getSmartStudyItems(): Promise<SmartStudyItem[]> {
  if (USE_MOCKS) { await delay(); return [...store.smartStudy]; }
  const res = await fetch(`${API_BASE_URL}/smart-study`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function generateSmartStudySession(): Promise<SmartStudyItem[]> {
  if (USE_MOCKS) {
    await delay(1500);
    store.smartStudy = store.smartStudy.map(item => ({
      ...item,
      need_score: Math.min(1, item.need_score + (Math.random() * 0.2 - 0.1)),
      p_know: Math.min(1, item.p_know + (Math.random() * 0.15)),
      last_studied: now().split('T')[0],
    }));
    return [...store.smartStudy];
  }
  const res = await fetch(`${API_BASE_URL}/smart-study/generate`, { method: 'POST', headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// STUDY PLANS (student CRUD) — optional studentId for A4 compat
// ══════════════════════════════════════════════════════════════
export async function getStudyPlans(_studentId?: string): Promise<any[]> {
  if (USE_MOCKS) { await delay(); return [...store.studyPlans]; }
  const res = await fetch(`${API_BASE_URL}/study-plans`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createStudyPlan(data: any): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const plan: StudyPlan = {
      id: mockId('sp'),
      title: data.title || data.name || 'Novo Plano',
      description: data.description || '',
      start_date: data.start_date || now().split('T')[0],
      end_date: data.end_date || data.target_date || '',
      progress: 0,
      items: data.items || [],
      created_at: now().split('T')[0],
    };
    store.studyPlans.push(plan);
    return plan;
  }
  const res = await fetch(`${API_BASE_URL}/study-plans`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function deleteStudyPlan(id: string): Promise<void> {
  if (USE_MOCKS) { await delay(); store.studyPlans = store.studyPlans.filter(p => p.id !== id); return; }
  await fetch(`${API_BASE_URL}/study-plans/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export async function toggleStudyPlanItem(planId: string, itemId: string): Promise<StudyPlan> {
  if (USE_MOCKS) {
    await delay();
    const pi = store.studyPlans.findIndex(p => p.id === planId);
    if (pi === -1) throw new Error(`StudyPlan ${planId} not found`);
    const plan = store.studyPlans[pi];
    const updatedItems = plan.items.map((it: StudyPlanItem) => it.id === itemId ? { ...it, completed: !it.completed } : it);
    const completed = updatedItems.filter((it: StudyPlanItem) => it.completed).length;
    const progress = updatedItems.length > 0 ? Math.round((completed / updatedItems.length) * 100) : 0;
    store.studyPlans[pi] = { ...plan, items: updatedItems, progress };
    return store.studyPlans[pi];
  }
  const res = await fetch(`${API_BASE_URL}/study-plans/${planId}/items/${itemId}/toggle`, { method: 'PATCH', headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// DAILY ACTIVITY — optional studentId for A4 compat
// ══════════════════════════════════════════════════════════════
export async function getDailyActivity(_studentId?: string): Promise<DailyActivity[]> {
  if (USE_MOCKS) { await delay(); return [...store.dailyActivity]; }
  const res = await fetch(`${API_BASE_URL}/daily-activity`, { headers: authHeaders() });
  return (await res.json()).data;
}


// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// AGENT 4 API SHIMS — 23 functions imported by REWIRED hooks
// All hooks were "REWIRED" to use Agent 4 function names
// but still import from this file. These shims delegate to
// the existing mock store above.
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════

// ── Flashcard shims (use-flashcards.ts) ──────────────────────
export async function getFlashcardsBySummary(summaryId: string): Promise<any[]> {
  if (USE_MOCKS) {
    await delay();
    return store.flashcards.filter(fc => fc.summary_id === summaryId && !fc.deleted_at);
  }
  const res = await fetch(`${API_BASE_URL}/flashcards?summary_id=${summaryId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export const deleteFlashcard = softDeleteFlashcard;

// ── Keyword shims (use-keywords.ts) ──────────────────────────
export async function getKeywordsBySummary(summaryId: string): Promise<KeywordSummaryLink[]> {
  if (USE_MOCKS) {
    await delay();
    return store.keywords
      .filter(kw => kw.summary_id === summaryId && !kw.deleted_at)
      .map(kw => ({
        id: `ksl-${kw.id}-${summaryId}`,
        keyword_id: kw.id,
        summary_id: summaryId,
        created_at: kw.created_at,
      }));
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/keywords`, { headers: authHeaders() });
  return (await res.json()).data;
}

export const deleteKeyword = softDeleteKeyword;

// ── Quiz shims (use-quiz-questions.ts) ───────────────────────
export async function getQuizQuestionsBySummary(summaryId: string): Promise<any[]> {
  if (USE_MOCKS) {
    await delay();
    return store.quizQuestions.filter(q => q.summary_id === summaryId && !q.deleted_at);
  }
  const res = await fetch(`${API_BASE_URL}/quiz-questions?summary_id=${summaryId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export const deleteQuizQuestion = softDeleteQuizQuestion;

// ── Video shims (use-videos.ts) ──────────────────────────────
export async function deleteVideo(_summaryId: string, id: string): Promise<void> {
  return softDeleteVideo(id);
}

// ── Content hierarchy shim (use-summaries.ts) ────────────────
export async function fetchContentHierarchy(): Promise<{
  topics: Array<{ id: string; name: string }>;
  summaries: Array<{ id: string; topic_id: string; content_markdown?: string; status: string }>;
}> {
  if (USE_MOCKS) {
    await delay();
    const topicMap = new Map<string, string>();
    store.summaries.forEach(s => {
      if (!topicMap.has(s.topic_id)) {
        topicMap.set(s.topic_id, s.title);
      }
    });
    const topics = Array.from(topicMap.entries()).map(([id, name]) => ({ id, name }));
    const summaries = store.summaries.map(s => ({
      id: s.id,
      topic_id: s.topic_id,
      content_markdown: undefined,
      status: s.status,
    }));
    return { topics, summaries };
  }
  const res = await fetch(`${API_BASE_URL}/content/hierarchy`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ── Study Goals shims (use-study-plans.ts) ───────────────────
export async function getStudyGoals(planId: string): Promise<StudyGoal[]> {
  if (USE_MOCKS) {
    await delay();
    const plan = store.studyPlans.find(p => p.id === planId);
    if (!plan) return [];
    return plan.items.map((item: StudyPlanItem) => ({
      id: item.id,
      plan_id: planId,
      topic_id: item.keyword_id || item.summary_id || '',
      topic_name: item.title,
      target_mastery: 0.8,
      current_mastery: item.completed ? 0.85 : 0.3,
      status: item.completed ? 'completed' as const : 'in-progress' as const,
      due_date: null,
      created_at: plan.created_at,
      updated_at: plan.created_at,
    }));
  }
  const res = await fetch(`${API_BASE_URL}/study-plans/${planId}/goals`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function updateStudyGoal(goalId: string, data: Partial<StudyGoal>): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    for (const plan of store.studyPlans) {
      const itemIdx = plan.items.findIndex((i: StudyPlanItem) => i.id === goalId);
      if (itemIdx !== -1) {
        if (data.status === 'completed') {
          plan.items[itemIdx] = { ...plan.items[itemIdx], completed: true };
        } else if (data.status === 'in-progress' || data.status === 'pending') {
          plan.items[itemIdx] = { ...plan.items[itemIdx], completed: false };
        }
        const completed = plan.items.filter((i: StudyPlanItem) => i.completed).length;
        plan.progress = plan.items.length > 0 ? Math.round((completed / plan.items.length) * 100) : 0;
        return;
      }
    }
    return;
  }
  await fetch(`${API_BASE_URL}/study-goals/${goalId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
}

// ── Smart Study shims (use-smart-study.ts) ───────────────────
export async function getSmartRecommendations(_studentId: string, _limit?: number): Promise<SmartStudyRecommendation[]> {
  if (USE_MOCKS) {
    await delay();
    return store.smartStudy.map((item, i) => ({
      id: `rec-${item.keyword_id}`,
      student_id: _studentId,
      type: 'review-keyword' as const,
      resource_id: item.keyword_id,
      resource_name: item.term,
      reason: item.p_know < 0.5 ? 'Baixo dominio — revisao necessaria' : 'Revisao de manutencao',
      priority: Math.round((1 - item.p_know) * 5),
      estimated_minutes: 10 + Math.round(item.need_score * 20),
      due_date: null,
      status: 'pending' as const,
      created_at: item.last_studied || now(),
    }));
  }
  const res = await fetch(`${API_BASE_URL}/smart-study/recommendations?student_id=${_studentId}&limit=${_limit || 20}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function dismissRecommendation(recId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const kwId = recId.replace('rec-', '');
    store.smartStudy = store.smartStudy.filter(s => s.keyword_id !== kwId);
    return;
  }
  await fetch(`${API_BASE_URL}/smart-study/recommendations/${recId}/dismiss`, { method: 'PATCH', headers: authHeaders() });
}

// ── SACRED: KwStudentNote shims (use-student-notes.ts) ───────
export async function getKwStudentNotesByKeyword(kwId: string, _studentId: string): Promise<any[]> {
  if (USE_MOCKS) {
    await delay();
    return store.studentNotes.filter(n => n.keyword_id === kwId);
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${kwId}/student-notes?student_id=${_studentId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createKwStudentNote(kwId: string, _studentId: string, content: string): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const n: StudentNote = {
      id: mockId('sn'),
      student_id: _studentId,
      keyword_id: kwId,
      note: content,
      created_at: now().split('T')[0],
      deleted_at: null,
    };
    const a4Note = { ...n, content };
    store.studentNotes.push(n);
    return a4Note;
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${kwId}/student-notes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ content, student_id: _studentId }) });
  return (await res.json()).data;
}

export async function updateKwStudentNote(id: string, content: string): Promise<any> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studentNotes.findIndex(n => n.id === id);
    if (i === -1) throw new Error(`KwStudentNote ${id} not found`);
    store.studentNotes[i] = { ...store.studentNotes[i], note: content };
    return { ...store.studentNotes[i], content };
  }
  const res = await fetch(`${API_BASE_URL}/student-notes/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ content }) });
  return (await res.json()).data;
}

export const softDeleteKwStudentNote = softDeleteStudentNote;
export const restoreKwStudentNote = restoreStudentNote;

// ── SACRED: VideoNote shims (use-video-notes.ts) ─────────────
export async function getVideoNotesByVideo(videoId: string, _studentId: string): Promise<any[]> {
  if (USE_MOCKS) {
    await delay();
    return store.videoNotes
      .filter(n => n.video_id === videoId)
      .map(n => ({
        ...n,
        content: n.note,
        timestamp_ms: n.timestamp_seconds != null ? n.timestamp_seconds * 1000 : null,
      }));
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes?student_id=${_studentId}`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ══════════════════════════════════════════════════════════════
// COMMIT 3: Bridge re-exports from api-client-extensions.ts
// TECH-DEBT(Phase4): Remove after hooks import directly from api-*.ts
// ══════════════════════════════════════════════════════════════
export * from './api-client-extensions';
