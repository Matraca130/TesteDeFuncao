// ═══════════════════════════════════════════════════════════════
// AXON — FSRS Engine (v4 implementation)
// PROTECTED FILE — DO NOT MODIFY WITHOUT ARCHITECT AUTHORIZATION
// This is the spaced repetition scheduling core.
// Generated: 2026-02-18
// ═══════════════════════════════════════════════════════════════

export interface FsrsCard {
  due: string;           // ISO date
  stability: number;     // memory stability in days
  difficulty: number;    // 0-10
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3; // New=0, Learning=1, Review=2, Relearning=3
  last_review: string;   // ISO date
}

export interface FsrsReviewResult {
  card: FsrsCard;
  review_log: {
    rating: 1 | 2 | 3 | 4;
    state: 0 | 1 | 2 | 3;
    due: string;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    last_elapsed_days: number;
    scheduled_days: number;
    review: string;
  };
}

// Default FSRS v4 parameters (optimized for medical education)
const DEFAULT_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: false,
};

export function createNewCard(): FsrsCard {
  return {
    due: new Date().toISOString(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    last_review: "",
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function initDifficulty(grade: number): number {
  return clamp(DEFAULT_PARAMS.w[4] - (grade - 3) * DEFAULT_PARAMS.w[5], 1, 10);
}

function initStability(grade: number): number {
  return Math.max(DEFAULT_PARAMS.w[grade - 1], 0.1);
}

function nextDifficulty(d: number, grade: number): number {
  const newD = d - DEFAULT_PARAMS.w[6] * (grade - 3);
  return clamp(
    DEFAULT_PARAMS.w[7] * initDifficulty(3) + (1 - DEFAULT_PARAMS.w[7]) * newD,
    1, 10
  );
}

function nextRecallStability(d: number, s: number, r: number, grade: number): number {
  const hardPenalty = grade === 2 ? DEFAULT_PARAMS.w[15] : 1;
  const easyBonus = grade === 4 ? DEFAULT_PARAMS.w[16] : 1;
  return (
    s *
    (1 +
      Math.exp(DEFAULT_PARAMS.w[8]) *
      (11 - d) *
      Math.pow(s, -DEFAULT_PARAMS.w[9]) *
      (Math.exp((1 - r) * DEFAULT_PARAMS.w[10]) - 1) *
      hardPenalty *
      easyBonus)
  );
}

function nextForgetStability(d: number, s: number, r: number): number {
  return (
    DEFAULT_PARAMS.w[11] *
    Math.pow(d, -DEFAULT_PARAMS.w[12]) *
    (Math.pow(s + 1, DEFAULT_PARAMS.w[13]) - 1) *
    Math.exp((1 - r) * DEFAULT_PARAMS.w[14])
  );
}

function nextInterval(s: number): number {
  const interval = Math.round(
    (s / DEFAULT_PARAMS.w[0]) *
    (Math.pow(DEFAULT_PARAMS.request_retention, 1 / DEFAULT_PARAMS.w[0]) - 1)
  );
  return clamp(interval || 1, 1, DEFAULT_PARAMS.maximum_interval);
}

function retrievability(elapsed: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsed / (9 * stability), -1);
}

export function reviewCard(card: FsrsCard, grade: 1 | 2 | 3 | 4): FsrsReviewResult {
  const now = new Date();
  const lastReview = card.last_review ? new Date(card.last_review) : now;
  const elapsed = Math.max(
    (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24),
    0
  );

  const prevState = card.state;
  let newS: number, newD: number, newState: 0 | 1 | 2 | 3;

  if (card.state === 0) {
    // New card
    newD = initDifficulty(grade);
    newS = initStability(grade);
    newState = grade === 1 ? 1 : 2;
  } else {
    // Learning/Review/Relearning
    const r = retrievability(elapsed, card.stability);
    newD = nextDifficulty(card.difficulty, grade);

    if (grade === 1) {
      // Again
      newS = nextForgetStability(newD, card.stability, r);
      newState = card.state === 2 ? 3 : 1;
    } else {
      // Hard/Good/Easy
      newS = nextRecallStability(newD, card.stability, r, grade);
      newState = 2;
    }
  }

  const interval = card.state === 0 && grade === 1 ? 0 : nextInterval(newS);
  const due = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  const newCard: FsrsCard = {
    due: due.toISOString(),
    stability: Math.round(newS * 100) / 100,
    difficulty: Math.round(newD * 100) / 100,
    elapsed_days: Math.round(elapsed * 100) / 100,
    scheduled_days: interval,
    reps: card.reps + 1,
    lapses: grade === 1 ? card.lapses + 1 : card.lapses,
    state: newState,
    last_review: now.toISOString(),
  };

  return {
    card: newCard,
    review_log: {
      rating: grade,
      state: prevState,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: newCard.elapsed_days,
      last_elapsed_days: card.elapsed_days,
      scheduled_days: newCard.scheduled_days,
      review: now.toISOString(),
    },
  };
}
