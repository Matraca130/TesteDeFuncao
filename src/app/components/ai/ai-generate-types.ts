// ============================================================
// Axon v4.4 — AI Generate Panel Types (Presentation Layer)
//
// These are LOCAL presentation types for AI-generated content
// drafts. They model the server response shape for rendering
// in AIGeneratePanel and DraftItemCards.
//
// NOT duplicates of services/types.ts (backend contract types).
// These are presentation-layer types for the approval workflow.
// ============================================================

export interface GeneratedSubtopic {
  id: string;
  title: string;
  description?: string;
  status?: string;
}

export interface GeneratedKeyword {
  id: string;
  term: string;
  definition: string;
  priority: number;
  status?: string;
  subtopics: GeneratedSubtopic[];
}

export interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
  keyword_term?: string;
  subtopic_title?: string;
  status?: string;
}

export interface GeneratedQuizQuestion {
  id: string;
  quiz_type: 'multiple_choice' | 'write_in' | 'fill_blank';
  question: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
  keyword_term?: string;
  status?: string;
}

export interface GeneratedConnection {
  id: string;
  keyword_a_term: string;
  keyword_b_term: string;
  label: string;
  status?: string;
}

export interface GeneratedDraft {
  id: string;
  status: string;
  keywords: GeneratedKeyword[];
  flashcards: GeneratedFlashcard[];
  quiz_questions: GeneratedQuizQuestion[];
  suggested_connections: GeneratedConnection[];
}
