// ============================================================
// Axon v4.4 — Keyword & Navigation Types (fuente unica de verdad)
// Consolidado desde: services/types.ts + services/spacedRepetition.ts
// ============================================================

import type { DeltaColor, Priority } from './enums';

// ── Core Entities ───────────────────────────────────────────

export interface Keyword {
  id: string;
  institution_id: string;
  term: string;
  definition: string;
  priority: Priority;
  status: string;
  source: string;
  created_by: string;
  model_3d_url: string | null;
  reference_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubTopic {
  id: string;
  keyword_id: string;
  title: string;
  description: string | null;
}

// ── Student State ──────────────────────────────────────────

export interface SubTopicBktState {
  student_id: string;
  subtopic_id: string;
  keyword_id: string;
  p_know: number;
  max_mastery: number;
  stability: number;
  delta: number;
  color: DeltaColor;
  exposures: number;
  correct_streak: number;
  last_review_at: string | null;
  last_grade: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Keyword-level mastery state for a student.
 * Used by the spaced repetition system (SM-2 / FSRS).
 *
 * Canonical version — previously duplicated in:
 *   - services/spacedRepetition.ts
 *   - app/types/student.ts
 */
export interface KeywordState {
  keyword: string;
  /** Consolidated mastery: 0 to 1 (0=novice, 1=expert) */
  mastery: number;
  /** Memory stability in days */
  stability_days: number;
  /** Next scheduled review date (ISO string) */
  due_at: string | null;
  /** Number of significant failures/lapses */
  lapses: number;
  /** Number of actual recall tests */
  exposures: number;
  /** Number of quality flashcards available for this keyword */
  card_coverage: number;
  /** Last time this keyword was reviewed */
  last_review_at: string | null;
  /** Color classification with hysteresis */
  color: 'red' | 'yellow' | 'green';
  /** Internal counter for hysteresis stability */
  color_stability_counter: number;
}

// ── AI Chat ──────────────────────────────────────────────

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIChatHistory {
  student_id: string;
  keyword_id: string;
  messages: AIChatMessage[];
  last_message_at: string;
}

// ── Keyword Popup API Response ───────────────────────────

/** KeywordPopupData — EXACTLY 7 campos */
export interface KeywordPopupData {
  keyword: Keyword;
  subtopics: SubTopic[];
  subtopic_states: Array<SubTopicBktState | null>;
  related_keywords: Array<{
    keyword: Keyword;
    connection_label: string | null;
  }>;
  chat_history: AIChatHistory | null;
  flashcard_count: number;
  quiz_count: number;
}

// ── 3D Model ─────────────────────────────────────────────

export interface ModelAnnotation {
  id: string;
  keyword_id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}
