// ============================================================
// Axon v4.4 — Unified API Client (Agent 4 BRIDGE pattern)
// Rewired by Agent 6 — PRISM
//
// 3-Layer: UI -> Hooks -> api-client (this file)
//
// USE_MOCKS=true (default): in-memory store with simulated delay
// USE_MOCKS=false: fetch to real Hono endpoints (when available)
// ============================================================
import {
  MOCK_SUMMARIES, MOCK_KEYWORDS, MOCK_FLASHCARDS, MOCK_QUIZ_QUESTIONS,
  MOCK_VIDEOS, MOCK_STUDENT_NOTES, MOCK_VIDEO_NOTES, MOCK_SMART_STUDY,
  MOCK_STUDY_PLANS, MOCK_DAILY_ACTIVITY,
  type Summary, type Keyword, type Flashcard, type QuizQuestion,
  type Video, type StudentNote, type VideoNote, type SmartStudyItem,
  type StudyPlan, type StudyPlanItem, type DailyActivity,
} from '../data/mock-data';

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
export async function getKeywords(): Promise<Keyword[]> {
  if (USE_MOCKS) { await delay(); return [...store.keywords]; }
  const res = await fetch(`${API_BASE_URL}/keywords`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createKeyword(data: Omit<Keyword, 'id' | 'created_at' | 'deleted_at'>): Promise<Keyword> {
  if (USE_MOCKS) {
    await delay();
    const kw: Keyword = { ...data, id: mockId('kw'), created_at: now().split('T')[0], deleted_at: null };
    store.keywords.push(kw);
    return kw;
  }
  const res = await fetch(`${API_BASE_URL}/keywords`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function updateKeyword(id: string, data: Partial<Keyword>): Promise<Keyword> {
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
export async function getFlashcards(): Promise<Flashcard[]> {
  if (USE_MOCKS) { await delay(); return [...store.flashcards]; }
  const res = await fetch(`${API_BASE_URL}/flashcards`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createFlashcard(data: Omit<Flashcard, 'id' | 'deleted_at'>): Promise<Flashcard> {
  if (USE_MOCKS) {
    await delay();
    const fc: Flashcard = { ...data, id: mockId('fc'), deleted_at: null };
    store.flashcards.push(fc);
    return fc;
  }
  const res = await fetch(`${API_BASE_URL}/flashcards`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function updateFlashcard(id: string, data: Partial<Flashcard>): Promise<Flashcard> {
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
export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  if (USE_MOCKS) { await delay(); return [...store.quizQuestions]; }
  const res = await fetch(`${API_BASE_URL}/quiz-questions`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createQuizQuestion(data: Omit<QuizQuestion, 'id' | 'deleted_at'>): Promise<QuizQuestion> {
  if (USE_MOCKS) {
    await delay();
    const q: QuizQuestion = { ...data, id: mockId('qq'), deleted_at: null };
    store.quizQuestions.push(q);
    return q;
  }
  const res = await fetch(`${API_BASE_URL}/quiz-questions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function updateQuizQuestion(id: string, data: Partial<QuizQuestion>): Promise<QuizQuestion> {
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
export async function getVideos(summaryId?: string): Promise<Video[]> {
  if (USE_MOCKS) {
    await delay();
    return summaryId ? store.videos.filter(v => v.summary_id === summaryId) : [...store.videos];
  }
  const q = summaryId ? `?summary_id=${summaryId}` : '';
  const res = await fetch(`${API_BASE_URL}/videos${q}`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createVideo(data: Omit<Video, 'id' | 'deleted_at'>): Promise<Video> {
  if (USE_MOCKS) {
    await delay();
    const v: Video = { ...data, id: mockId('vid'), deleted_at: null };
    store.videos.push(v);
    return v;
  }
  const res = await fetch(`${API_BASE_URL}/videos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function updateVideo(id: string, data: Partial<Video>): Promise<Video> {
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
// VIDEO NOTES — SACRED (soft-delete only)
// ══════════════════════════════════════════════════════════════
export async function getVideoNotes(videoId: string): Promise<VideoNote[]> {
  if (USE_MOCKS) { await delay(); return store.videoNotes.filter(n => n.video_id === videoId); }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createVideoNote(videoId: string, noteText: string, timestampSeconds: number | null): Promise<VideoNote> {
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
// STUDY PLANS (student CRUD)
// ══════════════════════════════════════════════════════════════
export async function getStudyPlans(): Promise<StudyPlan[]> {
  if (USE_MOCKS) { await delay(); return [...store.studyPlans]; }
  const res = await fetch(`${API_BASE_URL}/study-plans`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createStudyPlan(data: Omit<StudyPlan, 'id' | 'created_at' | 'progress'>): Promise<StudyPlan> {
  if (USE_MOCKS) {
    await delay();
    const plan: StudyPlan = { ...data, id: mockId('sp'), progress: 0, created_at: now().split('T')[0] };
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
// DAILY ACTIVITY
// ══════════════════════════════════════════════════════════════
export async function getDailyActivity(): Promise<DailyActivity[]> {
  if (USE_MOCKS) { await delay(); return [...store.dailyActivity]; }
  const res = await fetch(`${API_BASE_URL}/daily-activity`, { headers: authHeaders() });
  return (await res.json()).data;
}
