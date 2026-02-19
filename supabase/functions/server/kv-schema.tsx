// Axon v4.4 — KV Key Schema + Response Helpers for Hono server
// All entity data stored in kv_store_6e4db60a with prefix-based keys.

// ── KV Key Generators ──────────────────────────────────────
export const K = {
  // Student domain
  studentProfile:   (id: string) => `axon:student:profile:${id}`,
  studentStats:     (id: string) => `axon:student:stats:${id}`,
  dailyActivity:    (id: string) => `axon:student:daily-activity:${id}`,
  courseProgress:    (id: string) => `axon:student:course-progress:${id}`,
  session:          (id: string) => `axon:session:${id}`,
  flashcardReview:  (id: string) => `axon:flashcard-review:${id}`,
  studySummary:     (sid: string, cid: string, tid: string) => `axon:study-summary:${sid}:${cid}:${tid}`,
  readingState:     (sid: string, sumId: string) => `axon:reading-state:${sid}:${sumId}`,
  learningProfile:  (id: string) => `axon:learning-profile:${id}`,

  // SACRED entities
  kwStudentNote:    (id: string) => `axon:kw-student-note:${id}`,
  kwProfNote:       (id: string) => `axon:kw-prof-note:${id}`,
  videoNote:        (id: string) => `axon:video-note:${id}`,
  textAnnotation:   (id: string) => `axon:text-annotation:${id}`,

  // Content hierarchy
  course:           (id: string) => `axon:course:${id}`,
  semester:         (id: string) => `axon:semester:${id}`,
  section:          (id: string) => `axon:section:${id}`,
  topic:            (id: string) => `axon:topic:${id}`,
  summary:          (id: string) => `axon:summary:${id}`,
  keyword:          (id: string) => `axon:keyword:${id}`,

  // Plans, Media, Admin
  plan:             (id: string) => `axon:plan:${id}`,
  planRule:         (id: string) => `axon:plan-rule:${id}`,
  video:            (id: string) => `axon:video:${id}`,
  adminScope:       (id: string) => `axon:admin-scope:${id}`,
  quizAttempt:      (id: string) => `axon:quiz-attempt:${id}`,
} as const;

// ── Prefix constants for getByPrefix queries ──────────────
export const PFX = {
  sessions:         'axon:session:',
  flashcardReviews: 'axon:flashcard-review:',
  kwStudentNotes:   'axon:kw-student-note:',
  kwProfNotes:      'axon:kw-prof-note:',
  videoNotes:       'axon:video-note:',
  textAnnotations:  'axon:text-annotation:',
  courses:          'axon:course:',
  semesters:        'axon:semester:',
  sections:         'axon:section:',
  topics:           'axon:topic:',
  summaries:        'axon:summary:',
  keywords:         'axon:keyword:',
  plans:            'axon:plan:',
  planRules:        'axon:plan-rule:',
  videos:           'axon:video:',
  adminScopes:      'axon:admin-scope:',
  quizAttempts:     'axon:quiz-attempt:',
  studySummaries:   'axon:study-summary:',
  readingStates:    'axon:reading-state:',
  learningProfiles: 'axon:learning-profile:',
  studentProfiles:  'axon:student:profile:',
} as const;

// ── Helpers ────────────────────────────────────────────────
export function uid(): string {
  return crypto.randomUUID();
}

export function ts(): string {
  return new Date().toISOString();
}

export function ok<T>(data: T) {
  return { success: true, data };
}

export function err(message: string, code?: string) {
  return { success: false, error: { code, message } };
}
