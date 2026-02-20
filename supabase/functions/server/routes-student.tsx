// Axon v4.4 — Hono Routes: Student domain (profile, stats, sessions, reviews, summaries, seed)
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

// ── Profile ──────────────────────────────────────────────
r.get("/students/:studentId/profile", async (c) => {
  try {
    const { studentId } = c.req.param();
    const profile = await kv.get(K.studentProfile(studentId));
    return c.json(ok(profile ?? null));
  } catch (e) { console.log("GET profile error:", e); return c.json(err(`Failed to get profile: ${e}`), 500); }
});

r.put("/students/:studentId/profile", async (c) => {
  try {
    const { studentId } = c.req.param();
    const data = await c.req.json();
    const existing = await kv.get(K.studentProfile(studentId));
    const updated = { ...(existing || { id: studentId }), ...data, updated_at: ts() };
    await kv.set(K.studentProfile(studentId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT profile error:", e); return c.json(err(`Failed to update profile: ${e}`), 500); }
});

// ── Stats ────────────────────────────────────────────────
r.get("/students/:studentId/stats", async (c) => {
  try {
    const { studentId } = c.req.param();
    const stats = await kv.get(K.studentStats(studentId));
    return c.json(ok(stats ?? { totalStudyMinutes: 0, totalSessions: 0, totalCardsReviewed: 0, totalQuizzesCompleted: 0, currentStreak: 0, longestStreak: 0, averageDailyMinutes: 0, lastStudyDate: null, weeklyActivity: [0,0,0,0,0,0,0] }));
  } catch (e) { console.log("GET stats error:", e); return c.json(err(`Failed to get stats: ${e}`), 500); }
});

// ── Course Progress ──────────────────────────────────────
r.get("/students/:studentId/course-progress", async (c) => {
  try {
    const { studentId } = c.req.param();
    const progress = await kv.get(K.courseProgress(studentId));
    return c.json(ok(progress ?? []));
  } catch (e) { console.log("GET course-progress error:", e); return c.json(err(`Failed to get course progress: ${e}`), 500); }
});

// ── Daily Activity ───────────────────────────────────────
r.get("/students/:studentId/daily-activity", async (c) => {
  try {
    const { studentId } = c.req.param();
    const activity = await kv.get(K.dailyActivity(studentId));
    return c.json(ok(activity ?? []));
  } catch (e) { console.log("GET daily-activity error:", e); return c.json(err(`Failed to get daily activity: ${e}`), 500); }
});

// ── Study Sessions ───────────────────────────────────────
r.get("/students/:studentId/sessions", async (c) => {
  try {
    const { studentId } = c.req.param();
    const all = await kv.getByPrefix(PFX.sessions);
    const filtered = all.filter((s: any) => s.student_id === studentId);
    return c.json(ok(filtered));
  } catch (e) { console.log("GET sessions error:", e); return c.json(err(`Failed to get sessions: ${e}`), 500); }
});

r.post("/sessions", async (c) => {
  try {
    const body = await c.req.json();
    const id = uid();
    const session = {
      id, student_id: body.student_id || '', course_id: body.course_id || '',
      topic_id: body.topic_id || null, started_at: body.started_at || ts(),
      ended_at: body.ended_at || ts(), duration_minutes: body.duration_minutes ?? 0,
      activity_type: body.activity_type || 'reading',
    };
    await kv.set(K.session(id), session);
    return c.json(ok(session), 201);
  } catch (e) { console.log("POST session error:", e); return c.json(err(`Failed to create session: ${e}`), 500); }
});

r.put("/sessions/:sessionId", async (c) => {
  try {
    const { sessionId } = c.req.param();
    const data = await c.req.json();
    const existing = await kv.get(K.session(sessionId));
    if (!existing) return c.json(err(`Session ${sessionId} not found`), 404);
    const updated = { ...existing, ...data };
    await kv.set(K.session(sessionId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT session error:", e); return c.json(err(`Failed to update session: ${e}`), 500); }
});

r.post("/sessions/:sessionId/complete", async (c) => {
  try {
    const { sessionId } = c.req.param();
    const existing = await kv.get(K.session(sessionId));
    if (!existing) return c.json(err(`Session ${sessionId} not found`), 404);
    const endedAt = ts();
    const durationMinutes = Math.round((new Date(endedAt).getTime() - new Date(existing.started_at).getTime()) / 60000);
    const updated = { ...existing, ended_at: endedAt, duration_minutes: durationMinutes };
    await kv.set(K.session(sessionId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("POST complete session error:", e); return c.json(err(`Failed to complete session: ${e}`), 500); }
});

// ── Flashcard Reviews ────────────────────────────────────
r.get("/students/:studentId/flashcard-reviews", async (c) => {
  try {
    const { studentId } = c.req.param();
    const all = await kv.getByPrefix(PFX.flashcardReviews);
    const filtered = all.filter((r: any) => r.student_id === studentId);
    return c.json(ok(filtered));
  } catch (e) { console.log("GET flashcard-reviews error:", e); return c.json(err(`Failed to get reviews: ${e}`), 500); }
});

r.post("/flashcard-reviews", async (c) => {
  try {
    const body = await c.req.json();
    const id = uid();
    const review = {
      id, student_id: body.student_id || '', card_id: body.card_id || '',
      course_id: body.course_id || '', rating: body.rating ?? 0,
      reviewed_at: body.reviewed_at || ts(),
    };
    await kv.set(K.flashcardReview(id), review);
    return c.json(ok(review), 201);
  } catch (e) { console.log("POST flashcard-review error:", e); return c.json(err(`Failed to submit review: ${e}`), 500); }
});

// ── Study Summaries (per-topic persistence) ──────────────
r.get("/students/:studentId/summaries/:courseId/:topicId", async (c) => {
  try {
    const { studentId, courseId, topicId } = c.req.param();
    const summary = await kv.get(K.studySummary(studentId, courseId, topicId));
    return c.json(ok(summary ?? null));
  } catch (e) { console.log("GET study-summary error:", e); return c.json(err(`Failed to get study summary: ${e}`), 500); }
});

r.put("/students/:studentId/summaries/:courseId/:topicId", async (c) => {
  try {
    const { studentId, courseId, topicId } = c.req.param();
    const payload = await c.req.json();
    const key = K.studySummary(studentId, courseId, topicId);
    const existing = await kv.get(key);
    const now = ts();
    const updated = existing
      ? { ...existing, ...payload, updated_at: now }
      : { id: uid(), student_id: studentId, course_id: courseId, topic_id: topicId, ...payload, created_at: now, updated_at: now };
    await kv.set(key, updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT study-summary error:", e); return c.json(err(`Failed to save study summary: ${e}`), 500); }
});

// ── Summary Reading State ────────────────────────────────
r.get("/students/:studentId/reading-state/:summaryId", async (c) => {
  try {
    const { studentId, summaryId } = c.req.param();
    const state = await kv.get(K.readingState(studentId, summaryId));
    return c.json(ok(state ?? null));
  } catch (e) { console.log("GET reading-state error:", e); return c.json(err(`Failed to get reading state: ${e}`), 500); }
});

r.put("/students/:studentId/reading-state/:summaryId", async (c) => {
  try {
    const { studentId, summaryId } = c.req.param();
    const data = await c.req.json();
    const key = K.readingState(studentId, summaryId);
    const existing = await kv.get(key);
    const now = ts();
    const updated = existing
      ? { ...existing, ...data, last_read_at: now }
      : { summary_id: summaryId, student_id: studentId, progress_percent: 0, last_position: 0, time_spent_seconds: 0, completed: false, ...data, last_read_at: now };
    await kv.set(key, updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT reading-state error:", e); return c.json(err(`Failed to save reading state: ${e}`), 500); }
});

// ── Learning Profile ─────────────────────────────────────
r.get("/students/:studentId/learning-profile", async (c) => {
  try {
    const { studentId } = c.req.param();
    const profile = await kv.get(K.learningProfile(studentId));
    return c.json(ok(profile ?? null));
  } catch (e) { console.log("GET learning-profile error:", e); return c.json(err(`Failed to get learning profile: ${e}`), 500); }
});

// ── Seed Demo Data ───────────────────────────────────────
r.post("/seed", async (c) => {
  try {
    const now = ts();
    const keys: string[] = [];
    const values: any[] = [];

    // Student profile
    const profile = { id: 'demo-student-001', user_id: 'user-student-001', name: 'Maria Silva', email: 'maria.silva@demo.med', avatar_url: null, institution_id: 'inst-001', plan_id: 'plan-premium', created_at: '2025-01-10T10:00:00Z', updated_at: now };
    keys.push(K.studentProfile(profile.id)); values.push(profile);

    // Stats
    const stats = { totalStudyMinutes: 1250, totalSessions: 45, totalCardsReviewed: 320, totalQuizzesCompleted: 12, currentStreak: 7, longestStreak: 14, averageDailyMinutes: 42, lastStudyDate: now, weeklyActivity: [30,45,60,35,50,40,55] };
    keys.push(K.studentStats('demo-student-001')); values.push(stats);

    // Daily activity
    keys.push(K.dailyActivity('demo-student-001')); values.push([
      { date: '2025-02-13', studyMinutes: 30, sessionsCount: 2, cardsReviewed: 20, retentionPercent: 85 },
      { date: '2025-02-14', studyMinutes: 45, sessionsCount: 3, cardsReviewed: 35, retentionPercent: 88 },
      { date: '2025-02-15', studyMinutes: 60, sessionsCount: 4, cardsReviewed: 50, retentionPercent: 90 },
      { date: '2025-02-16', studyMinutes: 35, sessionsCount: 2, cardsReviewed: 25, retentionPercent: 82 },
      { date: '2025-02-17', studyMinutes: 50, sessionsCount: 3, cardsReviewed: 40, retentionPercent: 87 },
      { date: '2025-02-18', studyMinutes: 40, sessionsCount: 2, cardsReviewed: 30, retentionPercent: 86 },
      { date: '2025-02-19', studyMinutes: 55, sessionsCount: 3, cardsReviewed: 45, retentionPercent: 91 },
    ]);

    // Course progress
    keys.push(K.courseProgress('demo-student-001')); values.push([
      { courseId: 'course-anatomy', courseName: 'Anatomia Humana', masteryPercent: 65, lessonsCompleted: 8, lessonsTotal: 12, flashcardsMastered: 45, flashcardsTotal: 80, quizAverageScore: 78, lastAccessedAt: now },
      { courseId: 'course-physiology', courseName: 'Fisiologia Medica', masteryPercent: 40, lessonsCompleted: 3, lessonsTotal: 10, flashcardsMastered: 15, flashcardsTotal: 50, quizAverageScore: 62, lastAccessedAt: '2025-02-18T15:00:00Z' },
    ]);

    // Sessions
    const sessions = [
      { id: 'sess-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', started_at: '2025-02-19T08:00:00Z', ended_at: '2025-02-19T08:45:00Z', duration_minutes: 45, activity_type: 'reading' },
      { id: 'sess-002', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', started_at: '2025-02-19T09:00:00Z', ended_at: '2025-02-19T09:30:00Z', duration_minutes: 30, activity_type: 'flashcard' },
      { id: 'sess-003', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-cranial', started_at: '2025-02-18T14:00:00Z', ended_at: '2025-02-18T15:00:00Z', duration_minutes: 60, activity_type: 'quiz' },
    ];
    for (const s of sessions) { keys.push(K.session(s.id)); values.push(s); }

    // Flashcard reviews
    const reviews = [
      { id: 'rev-001', student_id: 'demo-student-001', card_id: 'fc-001', course_id: 'course-anatomy', rating: 4, reviewed_at: '2025-02-19T09:05:00Z' },
      { id: 'rev-002', student_id: 'demo-student-001', card_id: 'fc-002', course_id: 'course-anatomy', rating: 3, reviewed_at: '2025-02-19T09:10:00Z' },
      { id: 'rev-003', student_id: 'demo-student-001', card_id: 'fc-003', course_id: 'course-anatomy', rating: 5, reviewed_at: '2025-02-19T09:15:00Z' },
    ];
    for (const rv of reviews) { keys.push(K.flashcardReview(rv.id)); values.push(rv); }

    // Study summary
    const studySum = { id: 'study-sum-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', course_name: 'Anatomia Humana', topic_title: 'Femur', content: '', annotations: [], keyword_mastery: { 'femur': 'green', 'trocanter': 'yellow' }, keyword_notes: { 'femur': ['Osso mais longo'] }, edit_time_minutes: 45, tags: ['anatomia', 'femur'], bookmarked: true, created_at: '2025-02-15T10:00:00Z', updated_at: now };
    keys.push(K.studySummary('demo-student-001', 'course-anatomy', 'topic-femur')); values.push(studySum);

    // Reading states
    const rs1 = { summary_id: 'sum-femur-1', student_id: 'demo-student-001', progress_percent: 85, last_position: 450, time_spent_seconds: 1200, completed: false, last_read_at: now };
    const rs2 = { summary_id: 'sum-cranial-1', student_id: 'demo-student-001', progress_percent: 100, last_position: 0, time_spent_seconds: 900, completed: true, last_read_at: '2025-02-18T15:00:00Z' };
    keys.push(K.readingState('demo-student-001', 'sum-femur-1')); values.push(rs1);
    keys.push(K.readingState('demo-student-001', 'sum-cranial-1')); values.push(rs2);

    // Learning profile
    const lp = { student_id: 'demo-student-001', total_study_minutes: 1250, total_sessions: 45, total_cards_reviewed: 320, total_quizzes_completed: 12, current_streak: 7, longest_streak: 14, average_daily_minutes: 42, last_study_date: now, weekly_activity: [30,45,60,35,50,40,55], strengths: ['Anatomia do Femur', 'Nervos Cranianos'], weaknesses: ['Fisiologia Cardiovascular', 'Histologia'] };
    keys.push(K.learningProfile('demo-student-001')); values.push(lp);

    await kv.mset(keys, values);
    console.log(`[seed] Student domain: ${keys.length} keys written`);
    return c.json(ok({ seeded: keys.length }));
  } catch (e) { console.log("POST seed error:", e); return c.json(err(`Seed failed: ${e}`), 500); }
});

export default r;
