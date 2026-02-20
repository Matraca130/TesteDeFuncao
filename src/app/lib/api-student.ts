// Axon v4.4 — API Student: Profile, Stats, Sessions, Reviews, Summaries, Seed
import type {
  StudentProfile, StudentStats, DailyActivity, CourseProgress,
  StudySession, FlashcardReview, StudySummary, SummaryReadingState,
} from './types';
import {
  USE_MOCKS, API_BASE_URL, authHeaders, store, mockId, delay, now,
  MOCK_STUDENT_PROFILE, MOCK_STUDENT_STATS, MOCK_DAILY_ACTIVITY, MOCK_COURSE_PROGRESS,
} from './api-core';

// ── Profile ───────────────────────────────────────────────────
export async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  if (USE_MOCKS) { await delay(); return store.studentProfiles.find(p => p.id === studentId) ?? null; }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/profile`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function updateStudentProfile(studentId: string, data: Partial<StudentProfile>): Promise<StudentProfile> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studentProfiles.findIndex(p => p.id === studentId);
    if (i === -1) throw new Error(`Student ${studentId} not found`);
    store.studentProfiles[i] = { ...store.studentProfiles[i], ...data, updated_at: now() };
    return store.studentProfiles[i];
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/profile`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

// ── Stats & Activity ──────────────────────────────────────────
export async function getStudentStats(studentId: string): Promise<StudentStats> {
  if (USE_MOCKS) { await delay(); return { ...MOCK_STUDENT_STATS }; }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/stats`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function getCourseProgress(studentId: string): Promise<CourseProgress[]> {
  if (USE_MOCKS) { await delay(); return [...MOCK_COURSE_PROGRESS]; }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/course-progress`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function getDailyActivity(studentId: string): Promise<DailyActivity[]> {
  if (USE_MOCKS) { await delay(); return [...MOCK_DAILY_ACTIVITY]; }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/daily-activity`, { headers: authHeaders() });
  return (await res.json()).data;
}

// ── Study Sessions ────────────────────────────────────────────
export async function getStudySessions(studentId: string): Promise<StudySession[]> {
  if (USE_MOCKS) { await delay(); return store.studySessions.filter(s => s.student_id === studentId); }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/sessions`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function createStudySession(session: Partial<StudySession>): Promise<StudySession> {
  if (USE_MOCKS) {
    await delay();
    const n: StudySession = {
      id: mockId('sess'), student_id: session.student_id || 'demo-student-001',
      course_id: session.course_id || '', topic_id: session.topic_id,
      started_at: session.started_at || now(), ended_at: session.ended_at || now(),
      duration_minutes: session.duration_minutes ?? 0, activity_type: session.activity_type || 'reading',
    };
    store.studySessions.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/sessions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(session) });
  return (await res.json()).data;
}

export async function updateStudySession(sessionId: string, data: Partial<StudySession>): Promise<StudySession> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studySessions.findIndex(s => s.id === sessionId);
    if (i === -1) throw new Error(`Session ${sessionId} not found`);
    store.studySessions[i] = { ...store.studySessions[i], ...data };
    return store.studySessions[i];
  }
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return (await res.json()).data;
}

export async function completeStudySession(sessionId: string): Promise<StudySession> {
  if (USE_MOCKS) {
    await delay();
    const i = store.studySessions.findIndex(s => s.id === sessionId);
    if (i === -1) throw new Error(`Session ${sessionId} not found`);
    store.studySessions[i] = { ...store.studySessions[i], ended_at: now() };
    const s = store.studySessions[i];
    s.duration_minutes = Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000);
    return s;
  }
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, { method: 'POST', headers: authHeaders() });
  return (await res.json()).data;
}

// ── Flashcard Reviews ─────────────────────────────────────────
export async function getFlashcardReviews(studentId: string): Promise<FlashcardReview[]> {
  if (USE_MOCKS) { await delay(); return store.flashcardReviews.filter(r => r.student_id === studentId); }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/flashcard-reviews`, { headers: authHeaders() });
  return (await res.json()).data;
}

export async function submitFlashcardReview(review: Partial<FlashcardReview>): Promise<FlashcardReview> {
  if (USE_MOCKS) {
    await delay();
    const n: FlashcardReview = {
      id: mockId('rev'), student_id: review.student_id || 'demo-student-001',
      card_id: review.card_id || '', course_id: review.course_id || '',
      rating: review.rating ?? 0, reviewed_at: review.reviewed_at || now(),
    };
    store.flashcardReviews.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/flashcard-reviews`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(review) });
  return (await res.json()).data;
}

// ── Study Summaries (per-topic persistence) ───────────────────
export async function getStudySummaryByTopic(studentId: string, courseId: string, topicId: string): Promise<StudySummary | null> {
  if (USE_MOCKS) {
    await delay();
    return store.studySummaries.find(s => s.student_id === studentId && s.course_id === courseId && s.topic_id === topicId) ?? null;
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/summaries/${courseId}/${topicId}`, { headers: authHeaders() });
  const json = await res.json();
  return json.data ?? null;
}

export async function saveStudySummaryByTopic(
  studentId: string, courseId: string, topicId: string,
  payload: Omit<StudySummary, 'id' | 'student_id' | 'course_id' | 'topic_id' | 'created_at' | 'updated_at'>,
): Promise<StudySummary> {
  if (USE_MOCKS) {
    await delay();
    const existing = store.studySummaries.findIndex(s => s.student_id === studentId && s.course_id === courseId && s.topic_id === topicId);
    const ts = now();
    if (existing !== -1) {
      store.studySummaries[existing] = { ...store.studySummaries[existing], ...payload, updated_at: ts };
      return store.studySummaries[existing];
    }
    const n: StudySummary = {
      id: mockId('study-sum'), student_id: studentId, course_id: courseId, topic_id: topicId,
      ...payload, created_at: ts, updated_at: ts,
    };
    store.studySummaries.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/summaries/${courseId}/${topicId}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
  });
  return (await res.json()).data;
}

// ── Summary Reading State ─────────────────────────────────────
export async function getSummaryReadingState(studentId: string, summaryId: string): Promise<SummaryReadingState | null> {
  if (USE_MOCKS) {
    await delay();
    return store.readingStates.find(r => r.student_id === studentId && r.summary_id === summaryId) ?? null;
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/reading-state/${summaryId}`, { headers: authHeaders() });
  const json = await res.json();
  return json.data ?? null;
}

export async function saveSummaryReadingState(
  studentId: string, summaryId: string,
  data: Partial<Omit<SummaryReadingState, 'student_id' | 'summary_id'>>,
): Promise<SummaryReadingState> {
  if (USE_MOCKS) {
    await delay();
    const i = store.readingStates.findIndex(r => r.student_id === studentId && r.summary_id === summaryId);
    const ts = now();
    if (i !== -1) {
      store.readingStates[i] = { ...store.readingStates[i], ...data, last_read_at: ts };
      return store.readingStates[i];
    }
    const n: SummaryReadingState = {
      summary_id: summaryId, student_id: studentId,
      progress_percent: data.progress_percent ?? 0, last_position: data.last_position ?? 0,
      time_spent_seconds: data.time_spent_seconds ?? 0, completed: data.completed ?? false,
      last_read_at: ts,
    };
    store.readingStates.push(n); return n;
  }
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/reading-state/${summaryId}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });
  return (await res.json()).data;
}

// ── Seed Demo Data ────────────────────────────────────────────
export async function seedDemoData(): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    if (!store.studentProfiles.find(p => p.id === MOCK_STUDENT_PROFILE.id)) {
      store.studentProfiles.push({ ...MOCK_STUDENT_PROFILE });
    }
    console.log('[api-student] Demo data seeded (mock mode)');
    return;
  }
  await fetch(`${API_BASE_URL}/seed`, { method: 'POST', headers: authHeaders() });
}
