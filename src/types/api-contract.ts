// ============================================================
// Axon v4.4 — API Contract Types
// Request/Response types for the backend API
// ============================================================

import type { Grade, DeltaColor } from './enums';
import type { FlashcardCard } from './instruments';

/** FSRS state for a flashcard (student-specific) */
export interface FsrsState {
  student_id: string;
  card_id: string;
  stability: number;
  state: string;    // 'new' | 'learning' | 'review' | 'relearning'
  reps: number;
  lapses: number;
  due_at: string | null;
  last_review_at: string | null;
  updated_at: string;
}

/** A due flashcard item returned by GET /flashcards/due */
export interface DueFlashcardItem {
  card: FlashcardCard;
  fsrs_state: FsrsState;
  overdue_days: number;
}

/** Request body for POST /reviews */
export interface SubmitReviewReq {
  session_id: string;
  item_id: string;
  instrument_type: 'flashcard';
  subtopic_id: string;
  keyword_id: string;
  response_time_ms: number;
  grade: number;
}

/** Response from POST /reviews */
export interface SubmitReviewRes {
  review_id: string;
  feedback: {
    delta_before: number;
    delta_after: number;
    color_before: DeltaColor;
    color_after: DeltaColor;
    mastery: number;
    stability: number | null;
    message: string;
  };
}
