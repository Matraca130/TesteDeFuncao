// ═════════════════════════════════════════════════════════════════
// AXON — Canonical KV Key Generation Functions
// SINGLE SOURCE OF TRUTH for all key patterns.
// Used by index.ts (Supabase deployment) and inline seed.
//
// FIX 2026-02-20: Added ALL missing exports that route files
// import. Missing named exports cause SyntaxError in ES modules
// → BOOT_ERROR on Supabase Edge Functions.
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

// ── Auth & multi-tenancy entities (used by auth.tsx) ──────────
export const userKey     = (id: string) => `user:${id}`;
export const instKey     = (id: string) => `inst:${id}`;
export const memberKey   = (instId: string, userId: string) => `membership:${instId}:${userId}`;

// ── Content hierarchy entities (used by routes-canvas, reading) ──
export const courseKey   = (id: string) => `course:${id}`;
export const topicKey    = (id: string) => `topic:${id}`;
export const subtopicKey = (id: string) => `subtopic:${id}`;

// ── Session & review entities (used by routes-sessions, reviews) ──
export const sessionKey  = (id: string) => `session:${id}`;
export const reviewKey   = (id: string) => `review:${id}`;

// ── Reading & annotations (used by routes-reading) ────────────
export const readingKey    = (studentId: string, summaryId: string) => `reading:${studentId}:${summaryId}`;
export const annotationKey = (id: string) => `annotation:${id}`;

// ── Canvas blocks & curriculum (used by routes-canvas) ────────
export const resumoBlocksKey = (courseId: string, topicId: string) => `resumo-blocks:${courseId}:${topicId}`;
export const curriculumKey   = (courseId: string) => `curriculum:${courseId}`;

// ── 3D Models (used by routes-model3d) ────────────────────────
export const model3dKey  = (id: string) => `model3d:${id}`;

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

// Auth & multi-tenancy indices (used by auth.tsx)
export const idxUserInsts    = (userId: string, instId: string) => `idx:user-insts:${userId}:${instId}`;
export const idxInstMembers  = (instId: string, userId: string) => `idx:inst-members:${instId}:${userId}`;

// Session & review indices (used by routes-sessions, reviews)
export const idxStudentSessions  = (userId: string, courseId: string, sessionId: string) => `idx:student-sessions:${userId}:${courseId}:${sessionId}`;
export const idxSessionReviews   = (sessionId: string, reviewId: string) => `idx:session-reviews:${sessionId}:${reviewId}`;

// BKT indices (used by routes-reviews)
export const idxStudentKwBkt = (userId: string, keywordId: string, subtopicId: string) => `idx:student-kw-bkt:${userId}:${keywordId}:${subtopicId}`;
export const idxStudentBkt   = (userId: string, subtopicId: string) => `idx:student-bkt:${userId}:${subtopicId}`;

// Reading & annotation indices (used by routes-reading)
export const idxStudentReading      = (studentId: string, summaryId: string) => `idx:student-reading:${studentId}:${summaryId}`;
export const idxStudentAnnotations  = (studentId: string, summaryId: string, annotationId: string) => `idx:student-annotations:${studentId}:${summaryId}:${annotationId}`;

// Content hierarchy indices (used by routes-reading)
export const idxTopicSummaries   = (topicId: string, summaryId: string) => `idx:topic-summaries:${topicId}:${summaryId}`;
export const idxSummaryKw        = (summaryId: string, kwId: string) => `idx:summary-kw:${summaryId}:${kwId}`;
export const idxKwSubtopics      = (kwId: string, subtopicId: string) => `idx:kw-subtopics:${kwId}:${subtopicId}`;

// Canvas indices (used by routes-canvas)
export const idxCourseResumoBlocks = (courseId: string, topicId: string) => `idx:course-resumo-blocks:${courseId}:${topicId}`;

// Quiz attempt/bundle indices (used by routes-quiz)
export const idxStudentAttempts  = (userId: string, attemptId: string) => `idx:student-attempts:${userId}:${attemptId}`;
export const idxKwAttempts       = (kwId: string, attemptId: string) => `idx:kw-attempts:${kwId}:${attemptId}`;
export const idxStudentBundles   = (userId: string, bundleId: string) => `idx:student-bundles:${userId}:${bundleId}`;

// 3D Model indices (used by routes-model3d)
export const idxSummaryModel3d   = (summaryId: string, modelId: string) => `idx:summary-model3d:${summaryId}:${modelId}`;
export const idxTopicModel3d     = (topicId: string, modelId: string) => `idx:topic-model3d:${topicId}:${modelId}`;
export const idxKwModel3d        = (kwId: string, modelId: string) => `idx:kw-model3d:${kwId}:${modelId}`;

// Plan indices
export const idxInstPricingPlans = (instId: string, planId: string) => `idx:inst-pricing-plans:${instId}:${planId}`;
export const idxPlanRules        = (planId: string, ruleId: string) => `idx:plan-rules:${planId}:${ruleId}`;

// AdminScope indices
export const idxInstAdminScopes  = (instId: string, scopeId: string) => `idx:inst-admin-scopes:${instId}:${scopeId}`;

// Video indices
export const idxSummaryVideos    = (sumId: string, videoId: string) => `idx:summary-videos:${sumId}:${videoId}`;

// Keyword note indices (routes-kw-notes naming convention)
export const idxKwStudentNotes   = (kwId: string, studentId: string, noteId: string) => `idx:kw-student-notes:${kwId}:${studentId}:${noteId}`;
export const idxKwProfNotes      = (kwId: string, noteId: string) => `idx:kw-prof-notes:${kwId}:${noteId}`;

// Keyword note indices (original naming — kept for backward compat)
export const idxStudentKwNotes   = (studentId: string, kwId: string, noteId: string) => `idx:student-kw-notes:${studentId}:${kwId}:${noteId}`;
export const idxProfKwNotes      = (profId: string, kwId: string, noteId: string) => `idx:prof-kw-notes:${profId}:${kwId}:${noteId}`;
export const idxStudentVideoNotes = (studentId: string, videoId: string, noteId: string) => `idx:student-video-notes:${studentId}:${videoId}:${noteId}`;

// Video note indices (routes-video-notes naming convention)
export const idxVideoNotes       = (videoId: string, studentId: string, noteId: string) => `idx:video-notes:${videoId}:${studentId}:${noteId}`;

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

  // Auth & multi-tenancy
  IDX_USER_INSTS: "idx:user-insts:",
  IDX_INST_MEMBERS: "idx:inst-members:",

  // Sessions & reviews
  IDX_STUDENT_SESSIONS: "idx:student-sessions:",
  IDX_SESSION_REVIEWS: "idx:session-reviews:",

  // Content hierarchy
  IDX_TOPIC_SUMMARIES: "idx:topic-summaries:",
  IDX_SUMMARY_KW: "idx:summary-kw:",
  IDX_KW_SUBTOPICS: "idx:kw-subtopics:",
  IDX_KW_FC: "idx:kw-fc:",

  // Quiz
  IDX_KW_QUIZ: "idx:kw-quiz:",
  IDX_SUMMARY_QUIZ: "idx:summary-quiz:",
  IDX_KW_ATTEMPTS: "idx:kw-attempts:",
  IDX_STUDENT_BUNDLES: "idx:student-bundles:",

  // Reading & annotations
  IDX_STUDENT_READING: "idx:student-reading:",
  IDX_STUDENT_ANNOTATIONS: "idx:student-annotations:",

  // Canvas
  IDX_COURSE_RESUMO_BLOCKS: "idx:course-resumo-blocks:",

  // 3D Models
  MODEL3D: "model3d:",
  IDX_SUMMARY_MODEL3D: "idx:summary-model3d:",
  IDX_TOPIC_MODEL3D: "idx:topic-model3d:",
  IDX_KW_MODEL3D: "idx:kw-model3d:",

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

  // Keyword notes (routes-kw-notes naming)
  IDX_KW_STUDENT_NOTES: "idx:kw-student-notes:",
  IDX_KW_PROF_NOTES: "idx:kw-prof-notes:",

  // Keyword notes (original naming — kept for backward compat)
  KW_STUDENT_NOTES: "kw-student-note:",
  KW_PROF_NOTES: "kw-prof-note:",
  IDX_STUDENT_KW_NOTES: "idx:student-kw-notes:",
  IDX_PROF_KW_NOTES: "idx:prof-kw-notes:",

  // Video notes
  VIDEO_NOTES: "video-note:",
  IDX_VIDEO_NOTES: "idx:video-notes:",
  IDX_STUDENT_VIDEO_NOTES: "idx:student-video-notes:",
} as const;
