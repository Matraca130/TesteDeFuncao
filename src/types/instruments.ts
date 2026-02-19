// ============================================================
// Axon v4.4 — Instrument Types (Flashcards, Quizzes, etc.)
// ============================================================

import type { ContentStatus, ContentSource } from './enums';

/** A single flashcard card entity */
export interface FlashcardCard {
  id: string;
  summary_id: string;
  keyword_id: string;
  subtopic_id: string | null;
  institution_id: string;
  front: string;
  back: string;
  image_url: string | null;
  status: ContentStatus;
  source: ContentSource;
  created_by: string;
  created_at: string;
}
