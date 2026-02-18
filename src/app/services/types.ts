// ══════════════════════════════════════════════════════════════
// Axon v4.2 — Shared types for KeywordPopup + 3D navigation
//
// Frontend-specific types for the popup vertical.
// Extends shared-types.ts (backend) with popup-specific fields
// like model_3d_url, reference_source, DeltaColor 'blue', etc.
//
// When shared-types.ts is updated, align these accordingly.
// ══════════════════════════════════════════════════════════════

export type DeltaColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue';
export type Priority = 0 | 1 | 2 | 3;

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

export interface SubTopicBktState {
  student_id: string;
  subtopic_id: string;
  keyword_id: string;
  p_know: number;
  max_mastery: number;
  stability: number;
  delta: number; // 0-1+ (probability of knowing)
  color: DeltaColor;
  exposures: number;
  correct_streak: number;
  last_review_at: string | null;
  last_grade: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Chat message role:
 *   'user'      — student message
 *   'assistant'  — AI reply (used by our popup chat)
 *   'model'      — AI reply (used by aiService.ts / Gemini API)
 *
 * Both 'assistant' and 'model' are valid AI response roles.
 * Our UI checks `role === 'user'` for alignment, so both
 * non-user roles render identically as AI messages.
 */
export interface AIChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: string;
}

export interface AIChatHistory {
  student_id: string;
  keyword_id: string;
  messages: AIChatMessage[];
  last_message_at: string;
}

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

/** 3D model annotation point — used by ThreeDView */
export interface ModelAnnotation {
  id: string;
  keyword_id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
}
