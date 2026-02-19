// ============================================================
// Axon v4.4 — Enum Types (fuente unica de verdad)
// ============================================================

/** Grade values used in the FSRS spaced-repetition system */
export type Grade = 0.00 | 0.35 | 0.65 | 0.90;

/** Delta color representing mastery level */
export type DeltaColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue';

/** Content lifecycle status */
export type ContentStatus = 'draft' | 'published' | 'rejected' | 'approved';

/** How content was created */
export type ContentSource = 'manual' | 'ai_generated' | 'imported' | 'student' | 'ai';

/** Priority levels for keywords */
export type Priority = 0 | 1 | 2 | 3;
