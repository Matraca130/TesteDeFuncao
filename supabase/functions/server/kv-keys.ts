// ═════════════════════════════════════════════════════════════════
// AXON — Canonical KV Key Generation Functions
// SINGLE SOURCE OF TRUTH for all key patterns.
// Used by index.ts (Supabase deployment) and inline seed.
// ═════════════════════════════════════════════════════════════════

// ── Core entities ──────────────────────────────────────────────
export const summaryKey  = (id: string) => `summary:${id}`;
export const kwKey       = (id: string) => `kw:${id}`;
export const fcKey       = (id: string) => `fc:${id}`;
export const quizKey     = (id: string) => `quiz:${id}`;
export const bktKey      = (studentId: string, subtopicId: string) => `bkt:${studentId}:${subtopicId}`;
export const fsrsKey     = (studentId: string, cardId: string) => `fsrs:${studentId}:${cardId}`;
export const dailyKey    = (studentId: string, date: string) => `daily:${studentId}:${date}`;
export const statsKey    = (studentId: string) => `stats:${studentId}`;
export const quizAttemptKey  = (id: string) => `quiz-attempt:${id}`;
export const quizBundleKey   = (id: string) => `quiz-bundle:${id}`;
export const learningProfileKey = (studentId: string) => `learning-profile:${studentId}`;

// ── Sessions & Reviews ────────────────────────────────────────
export const sessionKey  = (id: string) => `session:${id}`;
export const reviewKey   = (id: string) => `review:${id}`;

// ── Reading & Annotations ─────────────────────────────────────
export const readingKey    = (studentId: string, summaryId: string) => `reading:${studentId}:${summaryId}`;
export const annotationKey = (id: string) => `annotation:${id}`;

// ── Content hierarchy (used by routes-reading full payload) ───
export const topicKey    = (id: string) => `topic:${id}`;
export const subtopicKey = (id: string) => `subtopic:${id}`;

// ── ATLAS P1: Plans, PlanRules, AdminScopes ───────────────────
export const pricingPlanKey  = (id: string) => `pricing-plan:${id}`;
export const planRuleKey     = (id: string) => `plan-rule:${id}`;
export const adminScopeKey   = (id: string) => `admin-scope:${id}`;

// ── ATLAS P1: Videos ──────────────────────────────────────────
export const videoKey        = (id: string) => `video:${id}`;

// ── SCRIBE: Keyword Notes (Student + Professor) ──────────────
export const kwStudentNoteKey = (id: string) => `kw-student-note:${id}`;
export const kwProfNoteKey    = (id: string) => `kw-prof-note:${id}`;
export const kwNoteVisKey     = (kwId: string) => `kw-note-vis:${kwId}`;

// ── SCRIBE: Video Notes ──────────────────────────────────────
export const videoNoteKey     = (id: string) => `video-note:${id}`;

// ── Index key functions ──────────────────────────────────────
// Flashcard indices
export const idxKwFc         = (kwId: string, fcId: string) => `idx:kw-fc:${kwId}:${fcId}`;
export const idxSummaryFc    = (sumId: string, fcId: string) => `idx:summary-fc:${sumId}:${fcId}`;
export const idxDue          = (studentId: string, cardId: string, date: string) => `idx:due:${studentId}:${cardId}:${date}`;
export const idxStudentFsrs  = (studentId: string, cardId: string) => `idx:student-fsrs:${studentId}:${cardId}`;

// Session indices
export const idxStudentSessions = (studentId: string, courseId: string, sessionId: string) => `idx:student-sessions:${studentId}:${courseId}:${sessionId}`;
export const idxSessionReviews  = (sessionId: string, reviewId: string) => `idx:session-reviews:${sessionId}:${reviewId}`;

// BKT indices
export const idxStudentBkt   = (studentId: string, subtopicId: string) => `idx:student-bkt:${studentId}:${subtopicId}`;
export const idxStudentKwBkt = (studentId: string, keywordId: string, subtopicId: string) => `idx:student-kw-bkt:${studentId}:${keywordId}:${subtopicId}`;

// Reading indices
export const idxStudentReading     = (studentId: string, summaryId: string) => `idx:student-reading:${studentId}:${summaryId}`;
export const idxStudentAnnotations = (studentId: string, summaryId: string, annotationId: string) => `idx:student-annotations:${studentId}:${summaryId}:${annotationId}`;

// Content hierarchy indices
export const idxTopicSummaries = (topicId: string, summaryId: string) => `idx:topic-summaries:${topicId}:${summaryId}`;

// Plan indices
export const idxInstPricingPlans = (instId: string, planId: string) => `idx:inst-pricing-plans:${instId}:${planId}`;
export const idxPlanRules        = (planId: string, ruleId: string) => `idx:plan-rules:${planId}:${ruleId}`;

// AdminScope indices
export const idxInstAdminScopes  = (instId: string, scopeId: string) => `idx:inst-admin-scopes:${instId}:${scopeId}`;

// Video indices
export const idxSummaryVideos    = (sumId: string, videoId: string) => `idx:summary-videos:${sumId}:${videoId}`;

// Note indices
export const idxStudentKwNotes   = (studentId: string, kwId: string, noteId: string) => `idx:student-kw-notes:${studentId}:${kwId}:${noteId}`;
export const idxProfKwNotes      = (profId: string, kwId: string, noteId: string) => `idx:prof-kw-notes:${profId}:${kwId}:${noteId}`;
export const idxStudentVideoNotes = (studentId: string, videoId: string, noteId: string) => `idx:student-video-notes:${studentId}:${videoId}:${noteId}`;

// Quiz indices
export const idxKwQuiz           = (kwId: string, qId: string) => `idx:kw-quiz:${kwId}:${qId}`;
export const idxSummaryQuiz      = (sumId: string, qId: string) => `idx:summary-quiz:${sumId}:${qId}`;

// ── Prefix constants for getByPrefix queries ─────────────────
export const KV_PREFIXES = {
  // Student state
  IDX_STUDENT_ATTEMPTS: "idx:student-attempts:",
  IDX_STUDENT_FSRS: "idx:student-fsrs:",
  IDX_STUDENT_BKT: "idx:student-bkt:",
  IDX_STUDENT_KW_BKT: "idx:student-kw-bkt:",
  // Sessions
  IDX_STUDENT_SESSIONS: "idx:student-sessions:",
  IDX_SESSION_REVIEWS: "idx:session-reviews:",
  // Reading
  IDX_STUDENT_READING: "idx:student-reading:",
  IDX_STUDENT_ANNOTATIONS: "idx:student-annotations:",
  // Content hierarchy
  IDX_TOPIC_SUMMARIES: "idx:topic-summaries:",
  IDX_SUMMARY_KW: "idx:summary-kw:",
  IDX_KW_SUBTOPICS: "idx:kw-subtopics:",
  IDX_KW_FC: "idx:kw-fc:",
  IDX_KW_QUIZ: "idx:kw-quiz:",
  IDX_KW_ATTEMPTS: "idx:kw-attempts:",
  // Plans
  PRICING_PLANS: "pricing-plan:",
  PLAN_RULES: "plan-rule:",
  IDX_INST_PRICING_PLANS: "idx:inst-pricing-plans:",
  IDX_PLAN_RULES: "idx:plan-rules:",
  // Admin
  ADMIN_SCOPES: "admin-scope:",
  IDX_INST_ADMIN_SCOPES: "idx:inst-admin-scopes:",
  // Videos
  VIDEOS: "video:",
  IDX_SUMMARY_VIDEOS: "idx:summary-videos:",
  // Notes
  KW_STUDENT_NOTES: "kw-student-note:",
  KW_PROF_NOTES: "kw-prof-note:",
  VIDEO_NOTES: "video-note:",
  IDX_STUDENT_KW_NOTES: "idx:student-kw-notes:",
  IDX_PROF_KW_NOTES: "idx:prof-kw-notes:",
  IDX_STUDENT_VIDEO_NOTES: "idx:student-video-notes:",
} as const;
