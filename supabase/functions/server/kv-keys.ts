// ═════════════════════════════════════════════════════════════════
// AXON — Canonical KV Key Generation Functions
// SINGLE SOURCE OF TRUTH for all key patterns.
// ═════════════════════════════════════════════════════════════════

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

export const KV_PREFIXES = {
  IDX_STUDENT_ATTEMPTS: "idx:student-attempts:",
  IDX_STUDENT_FSRS: "idx:student-fsrs:",
  IDX_STUDENT_BKT: "idx:student-bkt:",
} as const;
