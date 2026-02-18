// ═══════════════════════════════════════════════════════════════
// AXON — Canonical KV Key Generation Functions
// SINGLE SOURCE OF TRUTH for all key patterns.
// Every route file imports from here. DO NOT hardcode keys.
// Generated: 2026-02-18
//
// IMPORTANT: "quiz:{id}" is the CORRECT format (not "quiz-q:{id}")
// ═══════════════════════════════════════════════════════════════

// ────────────────── PRIMARY KEYS ──────────────────

// Dev 6: Auth & Institutions
export const userKey     = (id: string) => `user:${id}`;
export const instKey     = (id: string) => `inst:${id}`;
export const memberKey   = (instId: string, userId: string) => `membership:${instId}:${userId}`;

// Dev 1: Content Hierarchy
export const courseKey   = (id: string) => `course:${id}`;
export const semesterKey = (id: string) => `semester:${id}`;
export const sectionKey  = (id: string) => `section:${id}`;
export const topicKey    = (id: string) => `topic:${id}`;

// Dev 1+2: Summaries & Chunks
export const summaryKey  = (id: string) => `summary:${id}`;
export const chunkKey    = (id: string) => `chunk:${id}`;

// Dev 1: Keywords & Connections
export const kwKey       = (id: string) => `kw:${id}`;
export const kwInstKey   = (id: string) => `kw-inst:${id}`;
export const subtopicKey = (id: string) => `subtopic:${id}`;
export const connKey     = (id: string) => `conn:${id}`;

// Dev 3: Flashcards
export const fcKey       = (id: string) => `fc:${id}`;

// Dev 4: Quiz — CORRECT format is "quiz:{id}" not "quiz-q:{id}"
export const quizKey     = (id: string) => `quiz:${id}`;

// Dev 3-5: Spaced Repetition
export const bktKey      = (studentId: string, subtopicId: string) => `bkt:${studentId}:${subtopicId}`;
export const fsrsKey     = (studentId: string, cardId: string) => `fsrs:${studentId}:${cardId}`;
export const reviewKey   = (id: string) => `review:${id}`;
export const sessionKey  = (id: string) => `session:${id}`;
export const dailyKey    = (studentId: string, date: string) => `daily:${studentId}:${date}`;

// Dev 5: Study Plans
export const planKey     = (id: string) => `plan:${id}`;
export const planTaskKey = (id: string) => `plan-task:${id}`;
export const statsKey    = (studentId: string) => `stats:${studentId}`;

// Dev 6: AI
export const chatKey     = (studentId: string, keywordId: string) => `chat:${studentId}:${keywordId}`;
export const aiDraftKey  = (summaryId: string) => `ai-draft:${summaryId}`;

// Dev 2: Reading & Annotations
export const readingKey    = (studentId: string, summaryId: string) => `reading:${studentId}:${summaryId}`;
export const annotationKey = (id: string) => `annotation:${id}`;

// Dev 1/6: 3D Models
export const model3dKey    = (id: string) => `model3d:${id}`;

// ────────────────── INDEX KEYS ──────────────────

// Dev 6: Auth indices
export const idxInstMembers  = (instId: string, userId: string) => `idx:inst-members:${instId}:${userId}`;
export const idxUserInsts    = (userId: string, instId: string) => `idx:user-insts:${userId}:${instId}`;

// Dev 1: Content hierarchy indices
export const idxInstCourses       = (instId: string, courseId: string) => `idx:inst-courses:${instId}:${courseId}`;
export const idxCourseSemesters   = (courseId: string, semId: string) => `idx:course-semesters:${courseId}:${semId}`;
export const idxSemesterSections  = (semId: string, secId: string) => `idx:semester-sections:${semId}:${secId}`;
export const idxSectionTopics     = (secId: string, topicId: string) => `idx:section-topics:${secId}:${topicId}`;

// Dev 1+2: Summary indices
export const idxTopicSummaries = (topicId: string, summaryId: string) => `idx:topic-summaries:${topicId}:${summaryId}`;
export const idxSummaryChunks  = (summaryId: string, chunkId: string) => `idx:summary-chunks:${summaryId}:${chunkId}`;

// Dev 1: Keyword indices
export const idxSummaryKw   = (summaryId: string, kwInstId: string) => `idx:summary-kw:${summaryId}:${kwInstId}`;
export const idxKwSummaries  = (kwId: string, summaryId: string) => `idx:kw-summaries:${kwId}:${summaryId}`;
export const idxInstKw       = (instId: string, kwId: string) => `idx:inst-kw:${instId}:${kwId}`;
export const idxKwSubtopics  = (kwId: string, subtopicId: string) => `idx:kw-subtopics:${kwId}:${subtopicId}`;
export const idxKwConn       = (kwId: string, connId: string) => `idx:kw-conn:${kwId}:${connId}`;

// Dev 3: Flashcard indices
export const idxSummaryFc  = (summaryId: string, fcId: string) => `idx:summary-fc:${summaryId}:${fcId}`;
export const idxKwFc       = (kwId: string, fcId: string) => `idx:kw-fc:${kwId}:${fcId}`;
export const idxStudentFc  = (studentId: string, fcId: string) => `idx:student-fc:${studentId}:${fcId}`;

// Dev 4: Quiz indices
export const idxSummaryQuiz  = (summaryId: string, quizId: string) => `idx:summary-quiz:${summaryId}:${quizId}`;
export const idxKwQuiz       = (kwId: string, quizId: string) => `idx:kw-quiz:${kwId}:${quizId}`;
export const idxStudentQuiz  = (studentId: string, quizId: string) => `idx:student-quiz:${studentId}:${quizId}`;

// Dev 3-5: Spaced repetition indices
export const idxStudentKwBkt = (studentId: string, kwId: string, subtopicId: string) => `idx:student-kw-bkt:${studentId}:${kwId}:${subtopicId}`;
export const idxStudentBkt   = (studentId: string, subtopicId: string) => `idx:student-bkt:${studentId}:${subtopicId}`;
export const idxDue          = (studentId: string, cardId: string, due: string) => `idx:due:${studentId}:${cardId}:${due}`;
export const idxStudentFsrs  = (studentId: string, cardId: string) => `idx:student-fsrs:${studentId}:${cardId}`;
export const idxSessionReviews       = (sessionId: string, reviewId: string) => `idx:session-reviews:${sessionId}:${reviewId}`;
export const idxStudentSessions      = (studentId: string, courseId: string, sessionId: string) => `idx:student-sessions:${studentId}:${courseId}:${sessionId}`;
export const idxStudentCourseSessions = (studentId: string, courseId: string, sessionId: string) => `idx:student-course-sessions:${studentId}:${courseId}:${sessionId}`;

// Dev 5: Study plan indices
export const idxStudentPlans = (studentId: string, planId: string) => `idx:student-plans:${studentId}:${planId}`;
export const idxPlanTasks    = (planId: string, courseId: string, taskId: string) => `idx:plan-tasks:${planId}:${courseId}:${taskId}`;

// Dev 2: Reading & Annotation indices
export const idxStudentAnnotations = (studentId: string, summaryId: string, annotationId: string) => `idx:student-annotations:${studentId}:${summaryId}:${annotationId}`;
export const idxStudentReading     = (studentId: string, summaryId: string) => `idx:student-reading:${studentId}:${summaryId}`;

// Dev 1/6: 3D Model indices
export const idxSummaryModel3d = (summaryId: string, modelId: string) => `idx:summary-model3d:${summaryId}:${modelId}`;
export const idxTopicModel3d   = (topicId: string, modelId: string) => `idx:topic-model3d:${topicId}:${modelId}`;
export const idxKwModel3d      = (kwId: string, modelId: string) => `idx:kw-model3d:${kwId}:${modelId}`;

// ────────────────── PREFIX CONSTANTS (for getByPrefix queries) ──────────────────

export const KV_PREFIXES = {
  // Primary
  USER: "user:", INST: "inst:", MEMBERSHIP: "membership:",
  COURSE: "course:", SEMESTER: "semester:", SECTION: "section:", TOPIC: "topic:",
  SUMMARY: "summary:", CHUNK: "chunk:",
  KW: "kw:", KW_INST: "kw-inst:", SUBTOPIC: "subtopic:", CONN: "conn:",
  FC: "fc:", QUIZ: "quiz:",
  BKT: "bkt:", FSRS: "fsrs:", REVIEW: "review:", SESSION: "session:", DAILY: "daily:",
  PLAN: "plan:", PLAN_TASK: "plan-task:", STATS: "stats:",
  CHAT: "chat:", AI_DRAFT: "ai-draft:",
  READING: "reading:", ANNOTATION: "annotation:",
  MODEL3D: "model3d:",
  // Index
  IDX_INST_MEMBERS: "idx:inst-members:",
  IDX_USER_INSTS: "idx:user-insts:",
  IDX_INST_COURSES: "idx:inst-courses:",
  IDX_COURSE_SEMESTERS: "idx:course-semesters:",
  IDX_SEMESTER_SECTIONS: "idx:semester-sections:",
  IDX_SECTION_TOPICS: "idx:section-topics:",
  IDX_TOPIC_SUMMARIES: "idx:topic-summaries:",
  IDX_SUMMARY_CHUNKS: "idx:summary-chunks:",
  IDX_SUMMARY_KW: "idx:summary-kw:",
  IDX_KW_SUMMARIES: "idx:kw-summaries:",
  IDX_INST_KW: "idx:inst-kw:",
  IDX_KW_SUBTOPICS: "idx:kw-subtopics:",
  IDX_KW_CONN: "idx:kw-conn:",
  IDX_SUMMARY_FC: "idx:summary-fc:",
  IDX_KW_FC: "idx:kw-fc:",
  IDX_STUDENT_FC: "idx:student-fc:",
  IDX_SUMMARY_QUIZ: "idx:summary-quiz:",
  IDX_KW_QUIZ: "idx:kw-quiz:",
  IDX_STUDENT_QUIZ: "idx:student-quiz:",
  IDX_STUDENT_KW_BKT: "idx:student-kw-bkt:",
  IDX_STUDENT_BKT: "idx:student-bkt:",
  IDX_DUE: "idx:due:",
  IDX_STUDENT_FSRS: "idx:student-fsrs:",
  IDX_SESSION_REVIEWS: "idx:session-reviews:",
  IDX_STUDENT_SESSIONS: "idx:student-sessions:",
  IDX_STUDENT_COURSE_SESSIONS: "idx:student-course-sessions:",
  IDX_STUDENT_PLANS: "idx:student-plans:",
  IDX_PLAN_TASKS: "idx:plan-tasks:",
  IDX_STUDENT_ANNOTATIONS: "idx:student-annotations:",
  IDX_STUDENT_READING: "idx:student-reading:",
  IDX_SUMMARY_MODEL3D: "idx:summary-model3d:",
  IDX_TOPIC_MODEL3D: "idx:topic-model3d:",
  IDX_KW_MODEL3D: "idx:kw-model3d:",
} as const;
