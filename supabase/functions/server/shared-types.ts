// ═════════════════════════════════════════════════════════════════
// AXON — Shared Type Definitions (Contract v2.1)
// This file is the SINGLE SOURCE OF TRUTH for all entity types.
// All devs import from here. DO NOT duplicate types.
// Generated: 2026-02-18
// ═════════════════════════════════════════════════════════════════

// ────────────────── COMMON ──────────────────

export type UUID = string;
export type ISODate = string; // "2026-02-18T..."
export type DateOnly = string; // "2026-02-18"

export type MembershipRole = "owner" | "admin" | "professor" | "student";
export type SummaryStatus = "draft" | "processing" | "ready" | "error";
export type FlashcardStatus = "active" | "suspended" | "deleted";
export type FlashcardSource = "ai" | "manual" | "imported";
export type QuizType = "mcq" | "true_false" | "fill_blank" | "open";
export type QuizStatus = "active" | "suspended" | "deleted";
export type InstrumentType = "flashcard" | "quiz";
export type SessionType = "flashcard" | "quiz" | "mixed";
export type BktColor = "red" | "orange" | "yellow" | "green";
export type FsrsState = 0 | 1 | 2 | 3; // New, Learning, Review, Relearning
export type FsrsGrade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";
export type StudyPlanStatus = "active" | "completed" | "archived";
export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";

// ────────────────── Dev 6: AUTH & INSTITUTIONS ──────────────────

export interface User {
  id: UUID;
  email: string;
  name: string;
  avatar_url?: string;
  is_super_admin: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Institution {
  id: UUID;
  name: string;
  slug: string;       // REQUIRED — unique URL-safe identifier
  logo_url?: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Membership {
  id: UUID;
  user_id: UUID;
  institution_id: UUID;
  role: MembershipRole;
  plan_id?: UUID;
  plan_expires_at?: ISODate;
  created_at: ISODate;
}

// ────────────────── Dev 1: CONTENT HIERARCHY ──────────────────

export interface Course {
  id: UUID;
  institution_id: UUID;
  name: string;
  color: string; // hex color
  description?: string;
  semester_count?: number;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Semester {
  id: UUID;
  course_id: UUID;
  name: string;
  order_index: number;
  created_at: ISODate;
}

export interface Section {
  id: UUID;
  semester_id: UUID;
  name: string;
  order_index: number;
  created_at: ISODate;
}

export interface Topic {
  id: UUID;
  section_id: UUID;
  name: string;
  order_index: number;
  created_at: ISODate;
}

// ────────────────── Dev 1+2: SUMMARIES & CHUNKS ──────────────────

export interface Summary {
  id: UUID;
  topic_id: UUID;
  course_id: UUID;
  title?: string;
  content_markdown: string;
  status: SummaryStatus;
  word_count?: number;
  chunk_count?: number;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface SummaryChunk {
  id: UUID;
  summary_id: UUID;
  chunk_text: string;
  chunk_index: number;
  token_count?: number;
}

// ────────────────── Dev 1: KEYWORDS & CONNECTIONS ──────────────────

export interface Keyword {
  id: UUID;
  institution_id: UUID;
  term: string;
  definition: string;
  priority: number; // 1-5
  synonyms?: string[];
  created_at: ISODate;
  updated_at: ISODate;
}

export interface KeywordInstance {
  id: UUID;
  keyword_id: UUID;
  summary_id: UUID;
  chunk_id?: UUID;
  context_snippet?: string;
  created_at: ISODate;
}

export interface SubTopic {
  id: UUID;
  keyword_id: UUID;
  title: string;
  description?: string;
  order_index?: number;
}

export interface KeywordConnection {
  id: UUID;
  keyword_a_id: UUID;
  keyword_b_id: UUID;
  relationship_type?: string;
  strength?: number; // 0-1
  created_at: ISODate;
}

// ────────────────── Dev 3: FLASHCARDS ──────────────────

export interface FlashcardCard {
  id: UUID;
  summary_id: UUID;
  keyword_id: UUID;
  front: string;
  back: string;
  status: FlashcardStatus;
  source: FlashcardSource;
  hint?: string;
  tags?: string[];
  difficulty_tier?: number;
  created_at: ISODate;
  updated_at: ISODate;
}

/** Item returned by GET /flashcards/due — used by the study session UI */
export interface DueFlashcardItem {
  cardId: UUID;
  front: string;
  back: string;
  keywordId: UUID;
  subtopicId?: UUID;
  fsrs: {
    due: ISODate;
    stability: number;
    difficulty: number;
    state: FsrsState;
    reps: number;
    lapses: number;
  };
}

// ────────────────── Dev 4: QUIZ ──────────────────

export interface QuizQuestion {
  id: UUID;
  summary_id: UUID;
  keyword_id: UUID;
  question: string;
  quiz_type: QuizType;
  status: QuizStatus;
  options?: QuizOption[];
  correct_answer?: string;
  explanation?: string;
  difficulty_tier?: number;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface QuizOption {
  label: string;
  text: string;
  is_correct: boolean;
}

// ────────────────── Dev 3-5: SPACED REPETITION STATE ──────────────────

export interface SubTopicBktState {
  student_id: UUID;
  subtopic_id: UUID;
  keyword_id: UUID;
  p_know: number;    // 0-1
  p_slip: number;
  p_guess: number;
  p_transit: number;
  stability: number;
  delta: number;
  color: BktColor;
  last_review: ISODate;
  review_count: number;
}

export interface CardFsrsState {
  student_id: UUID;
  card_id: UUID;
  due: ISODate;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: FsrsState;
  last_review: ISODate;
}

// ────────────────── Dev 3-5: REVIEWS & SESSIONS ──────────────────

export interface ReviewLog {
  id: UUID;
  session_id: UUID;
  student_id: UUID;
  item_id: UUID;          // card or quiz ID
  instrument_type: InstrumentType;
  grade: FsrsGrade;
  response_time_ms?: number;
  color_before?: BktColor;
  color_after?: BktColor;
  created_at: ISODate;
}

export interface StudySession {
  id: UUID;
  student_id: UUID;
  course_id?: UUID;
  session_type: SessionType;
  started_at: ISODate;
  ended_at?: ISODate;
  total_reviews: number;
  correct_reviews: number;
  duration_seconds?: number;
}

export interface DailyActivity {
  student_id: UUID;
  date: DateOnly;
  reviews_count: number;
  correct_count: number;
  time_spent_seconds: number;
  sessions_count: number;
  new_cards_seen: number;
  streak_day?: number;
}

// ────────────────── Dev 3-5: REVIEW REQUEST/RESPONSE ──────────────────

/** POST /reviews — body sent by client after grading a card */
export interface ReviewRequest {
  session_id: UUID;
  item_id: UUID;
  instrument_type: InstrumentType;
  grade: FsrsGrade;
  response_time_ms?: number;
}

/** POST /reviews — response from server with updated states */
export interface ReviewResponse {
  review_id: UUID;
  fsrs_update: {
    due: ISODate;
    stability: number;
    difficulty: number;
    state: FsrsState;
    reps: number;
    lapses: number;
  };
  bkt_update?: {
    p_know: number;
    color: BktColor;
    delta: number;
  };
  color_before?: BktColor;
  color_after?: BktColor;
}

// ────────────────── Dev 2: READING & ANNOTATIONS ──────────────────

export interface SummaryReadingState {
  student_id: UUID;
  summary_id: UUID;
  scroll_position: number;  // 0-100 percentage
  reading_time_seconds: number;
  last_read_at: ISODate;
  completed: boolean;
  furthest_chunk_index?: number;
}

export interface SummaryAnnotation {
  id: UUID;
  student_id: UUID;
  summary_id: UUID;
  chunk_id?: UUID;
  selected_text: string;
  note?: string;
  highlight_color: HighlightColor;
  start_offset: number;
  end_offset: number;
  created_at: ISODate;
  updated_at: ISODate;
}

// ────────────────── Dev 5: STUDY PLANS ──────────────────

export interface StudyPlan {
  id: UUID;
  student_id: UUID;
  course_id?: UUID;
  title?: string;
  status: StudyPlanStatus;
  target_date?: DateOnly;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface StudyPlanTask {
  id: UUID;
  plan_id: UUID;
  title: string;
  description?: string;
  task_type: "review" | "read" | "quiz" | "custom";
  status: TaskStatus;
  target_item_id?: UUID;
  order_index: number;
  due_date?: DateOnly;
  completed_at?: ISODate;
}

export interface StudentStats {
  student_id: UUID;
  total_reviews: number;
  total_correct: number;
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  total_time_seconds: number;
  cards_mastered: number;
  cards_learning: number;
  cards_new: number;
  last_study_date?: DateOnly;
  updated_at: ISODate;
}

// ────────────────── Dev 6: AI ──────────────────

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: ISODate;
}

export interface AIChatHistory {
  student_id: UUID;
  keyword_id: UUID;
  messages: AIChatMessage[];
  last_interaction: ISODate;
}

export interface AIGenerationResult {
  summary_id: UUID;
  generated_flashcards: number;
  generated_quiz: number;
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: ISODate;
}

// ────────────────── Dev 1/6: 3D MODELS ──────────────────

export interface Model3DAnnotation {
  id: UUID;
  label: string;
  description: string;
  position: [number, number, number];
  color: string;
  keyword_id?: UUID;
}

export interface Model3DAsset {
  id: UUID;
  name: string;
  description: string;
  summary_id: UUID;
  topic_id: UUID;
  keyword_ids: UUID[];
  file_path: string;
  file_size_bytes: number;
  file_format: 'glb' | 'gltf';
  thumbnail_path?: string;
  annotations: Model3DAnnotation[];
  camera_position: [number, number, number];
  camera_target: [number, number, number];
  scale: number;
  created_by: UUID;
  created_at: ISODate;
  updated_at: ISODate;
  status: 'active' | 'processing' | 'draft';
}

// ────────────────── Section 7: CANVAS BLOCKS ──────────────────

export type BlockType = 'heading' | 'subheading' | 'text' | 'image'
                      | 'callout' | 'divider' | 'list' | 'quote';

export interface CanvasBlockMeta {
  align?: 'left' | 'center' | 'right';
  calloutColor?: 'yellow' | 'blue' | 'green' | 'pink' | 'teal';
  imageCaption?: string;
  imageWidth?: number;        // 25-100 (percentage)
  imageFit?: 'cover' | 'contain';
  imageAspectRatio?: string;  // auto|16/9|4/3|1/1|3/4|9/16
  imageMaxHeight?: number;
  listStyle?: 'bullet' | 'numbered';
  columnGroup?: string;       // group ID for multi-column
  columnWidth?: number;       // percentage
  columnSlot?: number;        // 0, 1, 2 (max 3 columns)
}

export interface CanvasBlock {
  id: UUID;
  type: BlockType;
  content: string;
  meta?: CanvasBlockMeta;
}

/** Stored at resumo-blocks:{courseId}:{topicId} */
export interface ResumoBlocksDocument {
  course_id: UUID;
  topic_id: UUID;
  blocks: CanvasBlock[];
  block_count: number;
  updated_at: ISODate;
  updated_by: UUID;
}

// ────────────────── Section 7: CURRICULUM ──────────────────

export interface EditableTopic {
  id: UUID;
  name: string;
  order_index: number;
}

export interface EditableSection {
  id: UUID;
  name: string;
  order_index: number;
  topics: EditableTopic[];
}

export interface EditableSemester {
  id: UUID;
  name: string;
  order_index: number;
  sections: EditableSection[];
}

/** Stored at curriculum:{courseId} */
export interface CurriculumDocument {
  course_id: UUID;
  semesters: EditableSemester[];
  semester_count: number;
  updated_at: ISODate;
  updated_by: UUID;
}

// ────────────────── PLANS & ACCESS ──────────────────

export interface Plan {
  id: UUID;
  institution_id: UUID;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  is_default: boolean;
  is_trial: boolean;
  trial_duration_days?: number;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface PlanAccessRule {
  id: UUID;
  plan_id: UUID;
  scope_type: 'course' | 'semester' | 'section' | 'topic' | 'summary' | 'all';
  scope_id?: UUID;
  allows_summary: boolean;
  allows_flashcards: boolean;
  allows_quizzes: boolean;
  allows_videos: boolean;
  created_at: ISODate;
}

export interface AdminScope {
  id: UUID;
  membership_id: UUID;
  scope_type: 'course' | 'semester' | 'section' | 'all';
  scope_id?: UUID;
  created_at: ISODate;
}

export interface Video {
  id: UUID;
  summary_id: UUID;
  title: string;
  url: string;
  platform: 'youtube' | 'vimeo' | 'other';
  duration_seconds?: number;
  order_index: number;
  created_at: ISODate;
  created_by: UUID;
}

// ────────────────── API RESPONSE WRAPPERS ──────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: ISODate;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  offset: number;
  limit: number;
}
