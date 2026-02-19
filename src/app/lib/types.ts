// ============================================================
// Axon v4.4 — Frontend Types (Agent 4 — BRIDGE)
// Aligned with backend contract. Single source of truth for
// all entity types used by api-client.ts and hooks.
// ============================================================

// ── Enums ───────────────────────────────────────────────────────

export type ContentStatus = 'draft' | 'published' | 'rejected' | 'approved';
export type ContentSource = 'manual' | 'ai_generated' | 'imported' | 'student' | 'ai';
export type Priority = 0 | 1 | 2 | 3;
export type RelationshipType = 'related' | 'prerequisite' | 'builds_on' | 'contrasts' | 'part_of';
export type DeltaColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue';
export type Grade = 0.00 | 0.35 | 0.65 | 0.90;
export type MembershipRole = 'owner' | 'admin' | 'professor' | 'student';

// ── Core Content Entities ───────────────────────────────────────

export interface Institution {
  id: string;
  name: string;
  slug?: string;
  logo_url: string | null;
  created_at: string;
  created_by?: string;
}

export interface Course {
  id: string;
  institution_id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Semester {
  id: string;
  course_id: string;
  name: string;
  order_index: number;
}

export interface Section {
  id: string;
  semester_id: string;
  name: string;
  image_url: string | null;
  order_index: number;
}

export interface Topic {
  id: string;
  section_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface Summary {
  id: string;
  topic_id: string;
  course_id: string;
  institution_id?: string;
  content_markdown: string;
  status: ContentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  version?: number;
}

export interface SummaryChunk {
  id: string;
  summary_id: string;
  chunk_text: string;
  chunk_index: number;
  token_count?: number;
}

export interface Keyword {
  id: string;
  institution_id: string;
  term: string;
  definition: string | null;
  priority: Priority;
  status: ContentStatus;
  source?: ContentSource;
  created_by: string;
  created_at: string;
  updated_at: string;
  subtopics?: SubTopic[];
  connections?: KeywordConnection[];
}

export interface SubTopic {
  id: string;
  keyword_id: string;
  title: string;
  description: string | null;
  order_index?: number;
  status?: ContentStatus;
  source?: ContentSource;
  created_by?: string;
  created_at?: string;
}

export interface KeywordConnection {
  id: string;
  keyword_a_id: string;
  keyword_b_id: string;
  relationship_type?: RelationshipType;
  strength?: number;
  description?: string | null;
  created_at: string;
  created_by?: string;
}

// ── Pricing Plans ───────────────────────────────────────────────

export interface PricingPlan {
  id: string;
  institution_id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  is_default: boolean;
  is_trial: boolean;
  trial_duration_days?: number;
  max_students?: number;
  features?: string[];
  created_at: string;
  updated_at: string;
}

export interface PlanAccessRule {
  id: string;
  plan_id: string;
  resource_type: 'course' | 'section' | 'feature';
  resource_id: string;
  permission: 'read' | 'write' | 'full';
  created_at: string;
}

// ── Videos ──────────────────────────────────────────────────────

export interface Video {
  id: string;
  summary_id: string;
  title: string;
  url: string;
  duration_ms?: number;
  thumbnail_url?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ── Admin Scopes ────────────────────────────────────────────────

export interface AdminScope {
  id: string;
  institution_id: string;
  user_id: string;
  scope_type: 'course' | 'section' | 'all';
  scope_id?: string;
  role: MembershipRole;
  created_at: string;
}

// ── Student Notes (SACRED — soft-delete) ────────────────────────

export interface KwStudentNote {
  id: string;
  keyword_id: string;
  student_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ── Professor Notes ─────────────────────────────────────────────

export interface KwProfNote {
  id: string;
  keyword_id: string;
  professor_id: string;
  content: string;
  visibility: 'visible' | 'hidden';
  created_at: string;
  updated_at: string;
}

// ── Video Notes (SACRED — soft-delete) ──────────────────────────

export interface VideoNote {
  id: string;
  video_id: string;
  student_id: string;
  content: string;
  timestamp_ms: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ── Quiz ────────────────────────────────────────────────────────

export interface QuizAnswer {
  questionId: number;
  type: 'multiple-choice' | 'write-in' | 'fill-blank';
  userAnswer: string | number;
  correct: boolean;
  timeMs: number;
}

export interface QuizAttempt {
  id: string;
  student_id: string;
  course_id: string;
  topic_id: string;
  keyword_id?: string;
  quiz_type?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_seconds: number;
  answers: QuizAnswer[];
  completed_at: string;
}

export interface QuizBundle {
  session_id: string;
  attempts: QuizAttempt[];
  summary: {
    total_score: number;
    total_questions: number;
    average_score: number;
  };
}

// ── Text Annotations (SACRED — soft-delete) ─────────────────────

export interface TextAnnotation {
  id: string;
  summary_id: string;
  student_id: string;
  original_text: string;
  display_text: string;
  color: 'yellow' | 'blue' | 'green' | 'pink';
  note: string;
  type: 'highlight' | 'note' | 'question';
  bot_reply?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ── Learning Profile ────────────────────────────────────────────

export interface LearningProfile {
  student_id: string;
  total_study_minutes: number;
  total_sessions: number;
  total_cards_reviewed: number;
  total_quizzes_completed: number;
  current_streak: number;
  longest_streak: number;
  average_daily_minutes: number;
  last_study_date: string;
  weekly_activity: number[];
  strengths: string[];
  weaknesses: string[];
}

// ── Student Stats ───────────────────────────────────────────────

export interface StudentStats {
  totalStudyMinutes: number;
  totalSessions: number;
  totalCardsReviewed: number;
  totalQuizzesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageDailyMinutes: number;
  lastStudyDate: string;
  weeklyActivity: number[];
}

export interface DailyActivity {
  date: string;
  studyMinutes: number;
  sessionsCount: number;
  cardsReviewed: number;
  retentionPercent?: number;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  masteryPercent: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  flashcardsMastered: number;
  flashcardsTotal: number;
  quizAverageScore: number;
  lastAccessedAt: string;
}

// ── Summary Reading State ───────────────────────────────────────

export interface SummaryReadingState {
  summary_id: string;
  student_id: string;
  progress_percent: number;
  last_position: number;
  time_spent_seconds: number;
  completed: boolean;
  last_read_at: string;
}

// ── Flashcard (FSRS) ────────────────────────────────────────────

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

// ── API Response Wrappers ───────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code?: string; message: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Student Profile ─────────────────────────────────────────────
// P3: Types needed by useStudentData / useSummaryPersistence

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  institution_id: string;
  plan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  student_id: string;
  course_id: string;
  topic_id?: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  activity_type: 'reading' | 'flashcard' | 'quiz' | 'mixed';
}

export interface FlashcardReview {
  id: string;
  student_id: string;
  card_id: string;
  course_id: string;
  rating: number;
  reviewed_at: string;
}

export interface StudySummary {
  id: string;
  student_id: string;
  course_id: string;
  topic_id: string;
  course_name: string;
  topic_title: string;
  content: string;
  annotations: StudySummaryAnnotation[];
  keyword_mastery: Record<string, string>;
  keyword_notes: Record<string, string[]>;
  edit_time_minutes: number;
  tags: string[];
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudySummaryAnnotation {
  id: string;
  type: string;
  selected_text: string;
  note: string;
  color: string;
  bot_reply?: string;
  timestamp: string;
}

// ── Keyword Popup (used by keywordPopupApi) ─────────────────────

export interface KeywordPopupData {
  keyword: Keyword;
  subtopics: SubTopic[];
  subtopic_states: SubTopicState[];
  related_keywords: Keyword[];
  chat_history: AIChatHistory | null;
  flashcard_count: number;
  quiz_count: number;
}

export interface SubTopicState {
  subtopic_id: string;
  mastery: 'none' | 'learning' | 'known';
}

export interface AIChatHistory {
  keyword_id: string;
  messages: AIChatMessage[];
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
