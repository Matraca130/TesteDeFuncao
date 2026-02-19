// ============================================================
// Axon v4.4 — Flashcard Session Types
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 1.3: Tipos locales de la sesion de flashcards
// ============================================================

import type { Grade } from '../../../types/enums';
import type { SubmitReviewRes } from '../../../types/api-contract';

// ─── Session Phase ───────────────────────────────────────────
// The session progresses through these phases:
//   loading → studying ↔ feedback → summary
//   loading → empty (no due cards)

export type SessionPhase = 'loading' | 'studying' | 'feedback' | 'summary' | 'empty';

// ─── Session Review Result ───────────────────────────────────
// Stored per-card after the student grades it.
// Used to compute the session summary statistics.

export interface SessionReviewResult {
  grade: Grade;
  feedback: SubmitReviewRes['feedback'];
  response_time_ms: number;
}
