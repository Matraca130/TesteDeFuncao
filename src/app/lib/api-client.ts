// ============================================================
// Axon v4.4 — API Client (Agent 4 — BRIDGE)
// UNICO archivo que hace fetch(). 3-layer rule: R06.
//
// Mode: USE_MOCKS = true  → returns mock data (Phase P1)
//       USE_MOCKS = false → makes real fetch() calls (Phase P2+)
//
// Pattern:
//   api-client.ts (this file) → hooks → UI components
//   NUNCA fetch() outside this file.
// ============================================================

import type {
  PricingPlan, PlanAccessRule, Video, AdminScope,
  KwStudentNote, KwProfNote, VideoNote,
  QuizAttempt, QuizBundle, LearningProfile,
  TextAnnotation, SummaryReadingState,
  StudentStats, DailyActivity, CourseProgress,
} from './types';

import {
  MOCK_PLANS, MOCK_PLAN_RULES,
  MOCK_VIDEOS,
  MOCK_ADMIN_SCOPES,
  MOCK_KW_STUDENT_NOTES, MOCK_KW_PROF_NOTES,
  MOCK_VIDEO_NOTES,
  MOCK_QUIZ_ATTEMPTS,
  MOCK_LEARNING_PROFILE,
  MOCK_TEXT_ANNOTATIONS,
  MOCK_STUDENT_STATS, MOCK_DAILY_ACTIVITY, MOCK_COURSE_PROGRESS,
  MOCK_READING_STATES,
} from './mock-data';

// ── Config ──────────────────────────────────────────────────
// Toggle this to false when backend endpoints are ready (Phase P2+)
const USE_MOCKS = true;

// Base URL for the real API (will be configured when backend is ready)
const API_BASE_URL = '/api'; // Placeholder — will use config.ts values

// ── Helper: UUID generator for mock IDs ─────────────────────
function mockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Helper: Simulated network delay ─────────────────────────
function delay(ms = 150): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Helper: ISO timestamp ───────────────────────────────────
function now(): string {
  return new Date().toISOString();
}

// ── In-memory mock stores (mutable copies) ──────────────────
// We clone mocks so mutations during mock mode don't persist across page loads
let _plans = [...MOCK_PLANS];
let _planRules = [...MOCK_PLAN_RULES];
let _videos = [...MOCK_VIDEOS];
let _adminScopes = [...MOCK_ADMIN_SCOPES];
let _kwStudentNotes = [...MOCK_KW_STUDENT_NOTES];
let _kwProfNotes = [...MOCK_KW_PROF_NOTES];
let _videoNotes = [...MOCK_VIDEO_NOTES];
let _quizAttempts = [...MOCK_QUIZ_ATTEMPTS];
let _textAnnotations = [...MOCK_TEXT_ANNOTATIONS];
let _readingStates = [...MOCK_READING_STATES];

// ============================================================
// Added by Agent 4 — BRIDGE
// ============================================================

// ── Plans ───────────────────────────────────────────────────

export async function getPlans(instId: string): Promise<PricingPlan[]> {
  if (USE_MOCKS) {
    await delay();
    return _plans.filter(p => p.institution_id === instId);
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans`);
  const json = await res.json();
  return json.data;
}

export async function createPlan(instId: string, plan: Partial<PricingPlan>): Promise<PricingPlan> {
  if (USE_MOCKS) {
    await delay();
    const newPlan: PricingPlan = {
      id: mockId('plan'),
      institution_id: instId,
      name: plan.name || 'Novo Plano',
      description: plan.description,
      price: plan.price ?? 0,
      currency: plan.currency || 'BRL',
      is_default: plan.is_default ?? false,
      is_trial: plan.is_trial ?? false,
      trial_duration_days: plan.trial_duration_days,
      max_students: plan.max_students,
      features: plan.features || [],
      created_at: now(),
      updated_at: now(),
    };
    _plans.push(newPlan);
    return newPlan;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan),
  });
  const json = await res.json();
  return json.data;
}

export async function updatePlan(instId: string, planId: string, data: Partial<PricingPlan>): Promise<PricingPlan> {
  if (USE_MOCKS) {
    await delay();
    const idx = _plans.findIndex(p => p.id === planId);
    if (idx === -1) throw new Error(`Plan ${planId} not found`);
    _plans[idx] = { ..._plans[idx], ...data, updated_at: now() };
    return _plans[idx];
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/plans/${planId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data;
}

export async function deletePlan(instId: string, planId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    _plans = _plans.filter(p => p.id !== planId);
    return;
  }
  await fetch(`${API_BASE_URL}/institutions/${instId}/plans/${planId}`, { method: 'DELETE' });
}

// ── Plan Rules ──────────────────────────────────────────────

export async function getPlanRules(planId: string): Promise<PlanAccessRule[]> {
  if (USE_MOCKS) {
    await delay();
    return _planRules.filter(r => r.plan_id === planId);
  }
  const res = await fetch(`${API_BASE_URL}/plans/${planId}/rules`);
  const json = await res.json();
  return json.data;
}

export async function createPlanRule(planId: string, rule: Partial<PlanAccessRule>): Promise<PlanAccessRule> {
  if (USE_MOCKS) {
    await delay();
    const newRule: PlanAccessRule = {
      id: mockId('rule'),
      plan_id: planId,
      resource_type: rule.resource_type || 'course',
      resource_id: rule.resource_id || '',
      permission: rule.permission || 'read',
      created_at: now(),
    };
    _planRules.push(newRule);
    return newRule;
  }
  const res = await fetch(`${API_BASE_URL}/plans/${planId}/rules`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rule),
  });
  const json = await res.json();
  return json.data;
}

// ── Videos ──────────────────────────────────────────────────

export async function getVideos(summaryId: string): Promise<Video[]> {
  if (USE_MOCKS) {
    await delay();
    return _videos.filter(v => v.summary_id === summaryId);
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/videos`);
  const json = await res.json();
  return json.data;
}

export async function createVideo(summaryId: string, video: Partial<Video>): Promise<Video> {
  if (USE_MOCKS) {
    await delay();
    const newVideo: Video = {
      id: mockId('vid'),
      summary_id: summaryId,
      title: video.title || 'Novo Video',
      url: video.url || '',
      duration_ms: video.duration_ms,
      thumbnail_url: video.thumbnail_url || null,
      order_index: video.order_index ?? _videos.filter(v => v.summary_id === summaryId).length,
      created_at: now(),
      updated_at: now(),
      created_by: 'demo-user',
    };
    _videos.push(newVideo);
    return newVideo;
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/videos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(video),
  });
  const json = await res.json();
  return json.data;
}

export async function updateVideo(summaryId: string, videoId: string, data: Partial<Video>): Promise<Video> {
  if (USE_MOCKS) {
    await delay();
    const idx = _videos.findIndex(v => v.id === videoId);
    if (idx === -1) throw new Error(`Video ${videoId} not found`);
    _videos[idx] = { ..._videos[idx], ...data, updated_at: now() };
    return _videos[idx];
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/videos/${videoId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data;
}

export async function deleteVideo(summaryId: string, videoId: string): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    _videos = _videos.filter(v => v.id !== videoId);
    return;
  }
  await fetch(`${API_BASE_URL}/summaries/${summaryId}/videos/${videoId}`, { method: 'DELETE' });
}

// ── Admin Scopes ────────────────────────────────────────────

export async function getAdminScopes(instId: string): Promise<AdminScope[]> {
  if (USE_MOCKS) {
    await delay();
    return _adminScopes.filter(s => s.institution_id === instId);
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/scopes`);
  const json = await res.json();
  return json.data;
}

export async function createAdminScope(instId: string, scope: Partial<AdminScope>): Promise<AdminScope> {
  if (USE_MOCKS) {
    await delay();
    const newScope: AdminScope = {
      id: mockId('scope'),
      institution_id: instId,
      user_id: scope.user_id || '',
      scope_type: scope.scope_type || 'course',
      scope_id: scope.scope_id,
      role: scope.role || 'professor',
      created_at: now(),
    };
    _adminScopes.push(newScope);
    return newScope;
  }
  const res = await fetch(`${API_BASE_URL}/institutions/${instId}/scopes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scope),
  });
  const json = await res.json();
  return json.data;
}

// ── Keyword Student Notes (SACRED — soft-delete) ────────────

export async function getKwStudentNotes(keywordId: string): Promise<KwStudentNote[]> {
  if (USE_MOCKS) {
    await delay();
    return _kwStudentNotes.filter(n => n.keyword_id === keywordId);
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes`);
  const json = await res.json();
  return json.data;
}

export async function createKwStudentNote(keywordId: string, content: string): Promise<KwStudentNote> {
  if (USE_MOCKS) {
    await delay();
    const newNote: KwStudentNote = {
      id: mockId('kw-note'),
      keyword_id: keywordId,
      student_id: 'demo-student-001',
      content,
      created_at: now(),
      updated_at: now(),
      deleted_at: null,
    };
    _kwStudentNotes.push(newNote);
    return newNote;
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
  });
  const json = await res.json();
  return json.data;
}

export async function updateKwStudentNote(keywordId: string, noteId: string, content: string): Promise<KwStudentNote> {
  if (USE_MOCKS) {
    await delay();
    const idx = _kwStudentNotes.findIndex(n => n.id === noteId);
    if (idx === -1) throw new Error(`Note ${noteId} not found`);
    _kwStudentNotes[idx] = { ..._kwStudentNotes[idx], content, updated_at: now() };
    return _kwStudentNotes[idx];
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes/${noteId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
  });
  const json = await res.json();
  return json.data;
}

// SACRED: Soft-delete — sets deleted_at, never hard deletes
export async function deleteKwStudentNote(keywordId: string, noteId: string): Promise<{ deleted: true }> {
  if (USE_MOCKS) {
    await delay();
    const idx = _kwStudentNotes.findIndex(n => n.id === noteId);
    if (idx === -1) throw new Error(`Note ${noteId} not found`);
    _kwStudentNotes[idx] = { ..._kwStudentNotes[idx], deleted_at: now(), updated_at: now() };
    return { deleted: true };
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes/${noteId}`, { method: 'DELETE' });
  const json = await res.json();
  return json.data;
}

// SACRED: Restore from soft-delete — clears deleted_at
export async function restoreKwStudentNote(keywordId: string, noteId: string): Promise<KwStudentNote> {
  if (USE_MOCKS) {
    await delay();
    const idx = _kwStudentNotes.findIndex(n => n.id === noteId);
    if (idx === -1) throw new Error(`Note ${noteId} not found`);
    _kwStudentNotes[idx] = { ..._kwStudentNotes[idx], deleted_at: null, updated_at: now() };
    return _kwStudentNotes[idx];
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/student-notes/${noteId}/restore`, { method: 'POST' });
  const json = await res.json();
  return json.data;
}

// ── Keyword Professor Notes ─────────────────────────────────

export async function getKwProfNotes(keywordId: string): Promise<KwProfNote[]> {
  if (USE_MOCKS) {
    await delay();
    return _kwProfNotes.filter(n => n.keyword_id === keywordId);
  }
  const res = await fetch(`${API_BASE_URL}/keywords/${keywordId}/prof-notes`);
  const json = await res.json();
  return json.data;
}

export async function toggleKwProfNoteVisibility(keywordId: string, noteId: string, hidden: boolean): Promise<void> {
  if (USE_MOCKS) {
    await delay();
    const idx = _kwProfNotes.findIndex(n => n.id === noteId);
    if (idx === -1) throw new Error(`Prof note ${noteId} not found`);
    _kwProfNotes[idx] = {
      ..._kwProfNotes[idx],
      visibility: hidden ? 'hidden' : 'visible',
      updated_at: now(),
    };
    return;
  }
  await fetch(`${API_BASE_URL}/keywords/${keywordId}/prof-notes/${noteId}/visibility`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden }),
  });
}

// ── Video Notes (SACRED — soft-delete) ──────────────────────

export async function getVideoNotes(videoId: string): Promise<VideoNote[]> {
  if (USE_MOCKS) {
    await delay();
    return _videoNotes.filter(n => n.video_id === videoId);
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`);
  const json = await res.json();
  return json.data;
}

export async function createVideoNote(videoId: string, content: string, timestamp_ms?: number): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const newNote: VideoNote = {
      id: mockId('vnote'),
      video_id: videoId,
      student_id: 'demo-student-001',
      content,
      timestamp_ms: timestamp_ms ?? null,
      created_at: now(),
      updated_at: now(),
      deleted_at: null,
    };
    _videoNotes.push(newNote);
    return newNote;
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, timestamp_ms }),
  });
  const json = await res.json();
  return json.data;
}

export async function updateVideoNote(videoId: string, noteId: string, data: Partial<VideoNote>): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const idx = _videoNotes.findIndex(n => n.id === noteId);
    if (idx === -1) throw new Error(`Video note ${noteId} not found`);
    _videoNotes[idx] = { ..._videoNotes[idx], ...data, updated_at: now() };
    return _videoNotes[idx];
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes/${noteId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data;
}

// SACRED: Soft-delete
export async function deleteVideoNote(videoId: string, noteId: string): Promise<{ deleted: true }> {
  if (USE_MOCKS) {
    await delay();
    const idx = _videoNotes.findIndex(n => n.id === noteId);
    if (idx === -1) throw new Error(`Video note ${noteId} not found`);
    _videoNotes[idx] = { ..._videoNotes[idx], deleted_at: now(), updated_at: now() };
    return { deleted: true };
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes/${noteId}`, { method: 'DELETE' });
  const json = await res.json();
  return json.data;
}

// SACRED: Restore from soft-delete
export async function restoreVideoNote(videoId: string, noteId: string): Promise<VideoNote> {
  if (USE_MOCKS) {
    await delay();
    const idx = _videoNotes.findIndex(n => n.id === noteId);
    if (idx === -1) throw new Error(`Video note ${noteId} not found`);
    _videoNotes[idx] = { ..._videoNotes[idx], deleted_at: null, updated_at: now() };
    return _videoNotes[idx];
  }
  const res = await fetch(`${API_BASE_URL}/videos/${videoId}/notes/${noteId}/restore`, { method: 'POST' });
  const json = await res.json();
  return json.data;
}

// ── Quiz ────────────────────────────────────────────────────

export async function getQuizAttempts(
  studentId: string,
  filters?: { keyword_id?: string; quiz_type?: string }
): Promise<QuizAttempt[]> {
  if (USE_MOCKS) {
    await delay();
    let results = _quizAttempts.filter(a => a.student_id === studentId);
    if (filters?.keyword_id) results = results.filter(a => a.keyword_id === filters.keyword_id);
    if (filters?.quiz_type) results = results.filter(a => a.quiz_type === filters.quiz_type);
    return results;
  }
  const params = new URLSearchParams({ student_id: studentId });
  if (filters?.keyword_id) params.set('keyword_id', filters.keyword_id);
  if (filters?.quiz_type) params.set('quiz_type', filters.quiz_type);
  const res = await fetch(`${API_BASE_URL}/quiz-attempts?${params}`);
  const json = await res.json();
  return json.data;
}

export async function completeQuizSession(
  studentId: string,
  sessionId: string,
  attemptIds: string[]
): Promise<QuizBundle> {
  if (USE_MOCKS) {
    await delay();
    const attempts = _quizAttempts.filter(a => attemptIds.includes(a.id));
    const totalScore = attempts.reduce((s, a) => s + a.score, 0);
    const totalQ = attempts.reduce((s, a) => s + a.total_questions, 0);
    return {
      session_id: sessionId,
      attempts,
      summary: {
        total_score: totalScore,
        total_questions: totalQ,
        average_score: totalQ > 0 ? totalScore / attempts.length : 0,
      },
    };
  }
  const res = await fetch(`${API_BASE_URL}/quiz-sessions/complete`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, session_id: sessionId, attempt_ids: attemptIds }),
  });
  const json = await res.json();
  return json.data;
}

// ── Learning Profile ────────────────────────────────────────

export async function getLearningProfile(studentId: string): Promise<LearningProfile | null> {
  if (USE_MOCKS) {
    await delay();
    if (studentId === MOCK_LEARNING_PROFILE.student_id) return { ...MOCK_LEARNING_PROFILE };
    return null;
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/learning-profile`);
  const json = await res.json();
  return json.data;
}

// ── Text Annotations (SACRED) ───────────────────────────────

export async function getTextAnnotations(summaryId: string): Promise<TextAnnotation[]> {
  if (USE_MOCKS) {
    await delay();
    return _textAnnotations.filter(a => a.summary_id === summaryId);
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/annotations`);
  const json = await res.json();
  return json.data;
}

export async function createTextAnnotation(summaryId: string, annotation: Partial<TextAnnotation>): Promise<TextAnnotation> {
  if (USE_MOCKS) {
    await delay();
    const newAnn: TextAnnotation = {
      id: mockId('ann'),
      summary_id: summaryId,
      student_id: 'demo-student-001',
      original_text: annotation.original_text || '',
      display_text: annotation.display_text || annotation.original_text || '',
      color: annotation.color || 'yellow',
      note: annotation.note || '',
      type: annotation.type || 'highlight',
      bot_reply: annotation.bot_reply,
      created_at: now(),
      updated_at: now(),
      deleted_at: null,
    };
    _textAnnotations.push(newAnn);
    return newAnn;
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/annotations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(annotation),
  });
  const json = await res.json();
  return json.data;
}

export async function updateTextAnnotation(summaryId: string, annotationId: string, data: Partial<TextAnnotation>): Promise<TextAnnotation> {
  if (USE_MOCKS) {
    await delay();
    const idx = _textAnnotations.findIndex(a => a.id === annotationId);
    if (idx === -1) throw new Error(`Annotation ${annotationId} not found`);
    _textAnnotations[idx] = { ..._textAnnotations[idx], ...data, updated_at: now() };
    return _textAnnotations[idx];
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/annotations/${annotationId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data;
}

// SACRED: Soft-delete
export async function deleteTextAnnotation(summaryId: string, annotationId: string): Promise<{ deleted: true }> {
  if (USE_MOCKS) {
    await delay();
    const idx = _textAnnotations.findIndex(a => a.id === annotationId);
    if (idx === -1) throw new Error(`Annotation ${annotationId} not found`);
    _textAnnotations[idx] = { ..._textAnnotations[idx], deleted_at: now(), updated_at: now() };
    return { deleted: true };
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/annotations/${annotationId}`, { method: 'DELETE' });
  const json = await res.json();
  return json.data;
}

// SACRED: Restore from soft-delete — clears deleted_at
export async function restoreTextAnnotation(summaryId: string, annotationId: string): Promise<TextAnnotation> {
  if (USE_MOCKS) {
    await delay();
    const idx = _textAnnotations.findIndex(a => a.id === annotationId);
    if (idx === -1) throw new Error(`Annotation ${annotationId} not found`);
    _textAnnotations[idx] = { ..._textAnnotations[idx], deleted_at: null, updated_at: now() };
    return _textAnnotations[idx];
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/annotations/${annotationId}/restore`, { method: 'POST' });
  const json = await res.json();
  return json.data;
}

// ── Reading State & Progress ────────────────────────────────

export async function getReadingState(summaryId: string, studentId: string): Promise<SummaryReadingState | null> {
  if (USE_MOCKS) {
    await delay();
    return _readingStates.find(r => r.summary_id === summaryId && r.student_id === studentId) || null;
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/reading-state?student_id=${studentId}`);
  const json = await res.json();
  return json.data;
}

export async function updateReadingState(summaryId: string, studentId: string, data: Partial<SummaryReadingState>): Promise<SummaryReadingState> {
  if (USE_MOCKS) {
    await delay();
    const idx = _readingStates.findIndex(r => r.summary_id === summaryId && r.student_id === studentId);
    if (idx >= 0) {
      _readingStates[idx] = { ..._readingStates[idx], ...data, last_read_at: now() };
      return _readingStates[idx];
    }
    const newState: SummaryReadingState = {
      summary_id: summaryId,
      student_id: studentId,
      progress_percent: data.progress_percent ?? 0,
      last_position: data.last_position ?? 0,
      time_spent_seconds: data.time_spent_seconds ?? 0,
      completed: data.completed ?? false,
      last_read_at: now(),
    };
    _readingStates.push(newState);
    return newState;
  }
  const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/reading-state`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, ...data }),
  });
  const json = await res.json();
  return json.data;
}

// ── Student Stats & Streaks ─────────────────────────────────

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  if (USE_MOCKS) {
    await delay();
    return { ...MOCK_STUDENT_STATS };
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/stats`);
  const json = await res.json();
  return json.data;
}

export async function getDailyActivity(studentId: string, days = 7): Promise<DailyActivity[]> {
  if (USE_MOCKS) {
    await delay();
    return [...MOCK_DAILY_ACTIVITY].slice(-days);
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/daily-activity?days=${days}`);
  const json = await res.json();
  return json.data;
}

export async function getCourseProgress(studentId: string): Promise<CourseProgress[]> {
  if (USE_MOCKS) {
    await delay();
    return [...MOCK_COURSE_PROGRESS];
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/course-progress`);
  const json = await res.json();
  return json.data;
}
