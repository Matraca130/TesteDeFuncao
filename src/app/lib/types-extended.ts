// Axon v4.4 — Types: Extended entities (Agent 4 P4 — unblock Agent 6)
import type { ContentStatus, ContentSource } from './types-core';

// ── Keyword ↔ Summary Junction ───────────────────────────────
export interface KeywordSummaryLink {
  id: string;
  keyword_id: string;
  summary_id: string;
  created_at: string;
  created_by?: string;
}

// ── Quiz Questions (content, not attempts) ───────────────────
export interface QuizQuestion {
  id: string;
  keyword_id: string;
  summary_id: string | null;
  institution_id: string;
  question_text: string;
  question_type: 'multiple-choice' | 'fill-blank' | 'write-in' | 'true-false';
  options: string[];
  correct_answer: string;
  explanation: string | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: ContentStatus;
  source: ContentSource;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Student Study Plans (NOT pricing plans) ──────────────────
export interface StudyPlan {
  id: string;
  student_id: string;
  course_id: string;
  name: string;
  description: string | null;
  target_date: string | null;
  daily_minutes_target: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface StudyGoal {
  id: string;
  plan_id: string;
  topic_id: string;
  topic_name: string;
  target_mastery: number;
  current_mastery: number;
  status: 'pending' | 'in-progress' | 'completed';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// ── Smart Study Recommendations ──────────────────────────────
export interface SmartStudyRecommendation {
  id: string;
  student_id: string;
  type: 'review-flashcard' | 'study-topic' | 'take-quiz' | 'read-summary' | 'review-keyword';
  resource_id: string;
  resource_name: string;
  reason: string;
  priority: number;
  estimated_minutes: number;
  due_date: string | null;
  status: 'pending' | 'dismissed' | 'completed';
  created_at: string;
}
