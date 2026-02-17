// ============================================================
// Axon v4.2 — FSRS Engine (Server-side copy)
// ============================================================
// BKT (Bayesian Knowledge Tracing) + FSRS (Free Spaced Repetition Scheduler)
// This is the single source of truth for all algorithmic computations.
// DO NOT modify without lead authorization.
// ============================================================

// ── Exported Constants ─────────────────────────────────────

/** FSRS weight 8 — controls lapse stability recovery. 0 = no adjustment. */
export const W8_DEFAULT = 0.0;

/** D30: Flashcard BKT contribution multiplier */
export const FLASHCARD_MULTIPLIER = 1.00;

/** Quiz BKT contribution multiplier (lower because quiz answers are multiple-choice) */
export const QUIZ_MULTIPLIER = 0.60;

/** D30: BKT multiplier applied when grade = Hard (0.35) — reduced learning gain */
export const HARD_BKT_MULTIPLIER = 0.40;

// ── BKT Internal Parameters ───────────────────────────────

/** Probability of knowledge transition (learning) per exposure */
const P_TRANSIT = 0.10;

/** Probability of slip (student knows but answers incorrectly) */
const P_SLIP = 0.05;

/** Probability of guess (student doesn't know but answers correctly) */
const P_GUESS = 0.20;

// ── Grade Mapping (D16) ───────────────────────────────────

/**
 * Maps grade values to BKT parameters.
 * D16: Flashcard uses self-evaluation with 4 buttons.
 * Grade → { correct: was the response correct?, gradeMult: learning gain multiplier }
 */
export const GRADE_TO_BKT: Record<number, { correct: boolean; gradeMult: number }> = {
  0.00: { correct: false, gradeMult: 1.00 },  // Again — lapse
  0.35: { correct: true,  gradeMult: 0.40 },  // Hard  — correct but reduced gain
  0.65: { correct: true,  gradeMult: 1.00 },  // Good  — correct, full gain
  0.90: { correct: true,  gradeMult: 1.00 },  // Easy  — correct, full gain
};

/** Valid grade values for validation */
export const VALID_GRADES = [0.00, 0.35, 0.65, 0.90];

/** Grade labels for UI display */
export const GRADE_LABELS: Record<number, string> = {
  0.00: 'Again',
  0.35: 'Hard',
  0.65: 'Good',
  0.90: 'Easy',
};

// ── BKT Functions ──────────────────────────────────────────

/**
 * Update BKT mastery using Bayesian Knowledge Tracing.
 *
 * Standard BKT posterior update:
 *   If correct:   P(L|obs) = P(L)*(1-P(S)) / [P(L)*(1-P(S)) + (1-P(L))*P(G)]
 *   If incorrect:  P(L|obs) = P(L)*P(S) / [P(L)*P(S) + (1-P(L))*(1-P(G))]
 * Then learning transition: P(L') = P(L|obs) + (1-P(L|obs)) * P(T) * typeMult * gradeMult
 *
 * @param p_know - Current probability of knowing (0-1)
 * @param max_mastery - Historical max mastery (unused in v1, reserved for extensions)
 * @param correct - Whether the response was correct
 * @param type - 'flashcard' or 'quiz' (determines type multiplier, D30)
 * @param gradeMult - Grade-based multiplier for learning gain
 * @returns New p_know value (0-1)
 */
export function updateBKT(
  p_know: number,
  max_mastery: number,
  correct: boolean,
  type: 'flashcard' | 'quiz',
  gradeMult: number
): number {
  const typeMult = type === 'flashcard' ? FLASHCARD_MULTIPLIER : QUIZ_MULTIPLIER;

  // Step 1: Bayesian posterior update
  let p_posterior: number;
  if (correct) {
    const numerator = p_know * (1 - P_SLIP);
    const denominator = numerator + (1 - p_know) * P_GUESS;
    p_posterior = denominator > 0 ? numerator / denominator : p_know;
  } else {
    const numerator = p_know * P_SLIP;
    const denominator = numerator + (1 - p_know) * (1 - P_GUESS);
    p_posterior = denominator > 0 ? numerator / denominator : p_know;
  }

  // Step 2: Learning transition with multipliers
  const rawGain = (1 - p_posterior) * P_TRANSIT * typeMult * gradeMult;
  const newMastery = Math.min(1.0, Math.max(0.0, p_posterior + rawGain));

  return newMastery;
}

// ── FSRS Functions ─────────────────────────────────────────

/**
 * Get initial stability for a new card based on first review grade.
 * Higher grades → longer initial intervals before next review.
 *
 * @param grade - First review grade (0.00, 0.35, 0.65, 0.90)
 * @returns Initial stability in days
 */
export function getInitialS(grade: number): number {
  if (grade <= 0.00) return 0.4;   // Again → ~10 hours
  if (grade <= 0.35) return 0.6;   // Hard  → ~14 hours
  if (grade <= 0.65) return 2.5;   // Good  → 2.5 days
  return 7.0;                       // Easy  → 7 days
}

/**
 * Compute retrievability (probability of recall) using exponential forgetting curve.
 * R(t, S) = exp(-t/S)
 *
 * @param daysSince - Days since last review
 * @param stability - Current stability in days
 * @returns Retrievability (0-1)
 */
export function getR(daysSince: number, stability: number): number {
  if (stability <= 0) return 0;
  if (daysSince <= 0) return 1;
  return Math.exp(-daysSince / stability);
}

/**
 * Compute new stability after a review (FSRS update).
 *
 * Success path: stability increases based on grade and "desirable difficulty" (lower R → bigger gain)
 * Lapse path (grade=0.00): stability drops to ~20% (relearning needed)
 *
 * @param stability - Current stability in days
 * @param grade - Review grade (0.00, 0.35, 0.65, 0.90)
 * @param R - Current retrievability (from getR)
 * @param isRecovering - Whether mastery is below historical max
 * @param w8 - FSRS weight 8 (model parameter for tuning)
 * @returns { newS: new stability in days, isLapse: whether this was a lapse }
 */
export function calcFSRS(
  stability: number,
  grade: number,
  R: number,
  isRecovering: boolean,
  w8: number
): { newS: number; isLapse: boolean } {
  // Lapse: grade = Again (0.00) — student forgot
  if (grade === 0.00) {
    // Stability drops significantly on lapse
    // Formula: S' = max(0.1, S * 0.2 * (1 + w8))
    const newS = Math.max(0.1, stability * 0.2 * (1 + w8));
    return { newS, isLapse: true };
  }

  // Successful review: stability increases
  // Grade modifier: Hard gets less increase, Easy gets more
  const gradeModifier = grade <= 0.35 ? 0.8 : grade <= 0.65 ? 1.0 : 1.3;

  // Retrievability bonus: more overdue (lower R) → bigger stability gain
  // This implements "desirable difficulty" — the spacing effect
  const retrievabilityBonus = 1.0 + (1.0 - R) * 0.5;

  // Recovery penalty: slightly less gain when recovering from a mastery dip
  const recoveryPenalty = isRecovering ? 0.9 : 1.0;

  const newS = stability * retrievabilityBonus * gradeModifier * recoveryPenalty * (1 + w8);

  return { newS: Math.max(0.1, newS), isLapse: false };
}

// ── Display & Threshold Functions ──────────────────────────

/**
 * Compute display mastery adjusted for time decay.
 * Used for delta/color calculations — NOT stored permanently.
 * displayMastery = mastery * R(daysSince, stability)
 *
 * @param mastery - Raw BKT mastery (p_know)
 * @param daysSince - Days since last review
 * @param stability - Current stability
 * @returns Adjusted mastery (0-1)
 */
export function getDisplayMastery(
  mastery: number,
  daysSince: number,
  stability: number
): number {
  if (daysSince <= 0 || stability <= 0) return mastery;
  const R = getR(daysSince, stability);
  return mastery * R;
}

/**
 * Get mastery threshold based on keyword priority.
 * Priority 1 (most important) → highest threshold (hardest to turn green).
 * Priority 5 (least important) → lowest threshold (easier to turn green).
 *
 * @param priority - Keyword priority (1-5)
 * @returns Threshold value (0-1)
 */
export function getThreshold(priority: number): number {
  const thresholds: Record<number, number> = {
    1: 0.90,
    2: 0.80,
    3: 0.70,
    4: 0.60,
    5: 0.50,
  };
  return thresholds[priority] ?? 0.70;
}

/**
 * Map delta (displayMastery / threshold) to a DeltaColor.
 *
 * delta >= 1.10 → blue   (overlearned — well above threshold)
 * delta >= 1.00 → green  (at threshold — mastered)
 * delta >= 0.85 → yellow (close — almost there)
 * delta >= 0.50 → orange (needs work)
 * delta <  0.50 → red    (struggling)
 *
 * @param delta - Ratio of displayMastery to threshold
 * @returns { color: DeltaColor name, hex: CSS hex color }
 */
export function getColorFromDelta(delta: number): { color: string; hex: string } {
  if (delta >= 1.10) return { color: 'blue',   hex: '#3B82F6' };
  if (delta >= 1.00) return { color: 'green',  hex: '#22C55E' };
  if (delta >= 0.85) return { color: 'yellow', hex: '#EAB308' };
  if (delta >= 0.50) return { color: 'orange', hex: '#F97316' };
  return { color: 'red', hex: '#EF4444' };
}

// ── Factory Functions ──────────────────────────────────────

/**
 * Create initial BKT state for a new subtopic.
 * D24: Sub-topic is the evaluable unit.
 * D27: If keyword has no sub-topics, subtopic_id = keyword_id.
 */
export function createInitialBktState(
  studentId: string,
  subtopicId: string,
  keywordId: string
) {
  return {
    student_id: studentId,
    subtopic_id: subtopicId,
    keyword_id: keywordId,
    p_know: 0,
    max_mastery: 0,
    stability: 0,
    delta: 0,
    color: 'red' as const,
    exposures: 0,
    lapses: 0,
    due_at: null as string | null,
    last_review_at: null as string | null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Create initial FSRS state for a new flashcard card.
 * D36: Only flashcards have individual FSRS state.
 */
export function createInitialCardFsrs(
  studentId: string,
  cardId: string
) {
  return {
    student_id: studentId,
    card_id: cardId,
    stability: 0,
    state: 'new' as const,
    reps: 0,
    lapses: 0,
    due_at: null as string | null,
    last_review_at: null as string | null,
    updated_at: new Date().toISOString(),
  };
}
