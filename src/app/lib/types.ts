// ============================================================
// Axon v4.4 — Frontend Types for Dev 1 (Content Management)
// Aligned with backend contract (routes-content.tsx v4.4)
// ============================================================

export type ContentStatus = 'draft' | 'published' | 'rejected';
export type ContentSource = 'manual' | 'ai_generated' | 'imported';
export type Priority = 0 | 1 | 2 | 3;
export type RelationshipType = 'related' | 'prerequisite' | 'builds_on' | 'contrasts' | 'part_of';

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

// Backend: 4 fields only — id, course_id, name, order_index
// Frontend uses 'title' and 'sort_order' as aliases for readability
export interface Semester {
  id: string;
  course_id: string;
  name: string;        // backend field name
  order_index: number;  // backend field name
}

// Backend: 5 fields — id, semester_id, name, image_url, order_index
export interface Section {
  id: string;
  semester_id: string;
  name: string;         // backend field name
  image_url: string | null;
  order_index: number;  // backend field name
}

export interface Topic {
  id: string;
  section_id: string;
  name: string;         // backend field name
  order_index: number;  // backend field name
  created_at: string;
}

// Backend: 10 fields — NO title (title comes from Topic parent)
export interface Summary {
  id: string;
  topic_id: string;
  course_id: string;
  institution_id?: string;
  content_markdown: string;  // backend uses content_markdown
  status: ContentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  version?: number;
}

export interface SummaryChunk {
  id: string;
  summary_id: string;
  chunk_text: string;       // backend field name
  chunk_index: number;      // backend field name
  token_count?: number;
}

// Backend: keyword entity — NO summary_id, NO color, NO mastery
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
  // Enriched by GET /keywords/:id:
  subtopics?: SubTopic[];
  connections?: KeywordConnection[];
}

// Backend: subtopic — NO updated_at, NO institution_id
// Backend has 9 fields: id, keyword_id, title, description, order_index, status, source, created_by, created_at
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

// Batch approval types
export interface BatchStatusItem {
  entity_type: 'keyword' | 'subtopic' | 'summary' | 'flashcard' | 'quiz_question';
  id: string;
  new_status: ContentStatus;
  reviewer_note?: string;
}

// Derived approval queue item (built from summaries + keywords + subtopics)
export interface ApprovalItem {
  entity_type: 'keyword' | 'subtopic' | 'summary' | 'flashcard' | 'quiz_question';
  id: string;
  title: string;
  status: ContentStatus;
  source: string;
  created_at: string;
  parent_info?: string;
}

export interface BatchStatusResult {
  id: string;
  entity_type: string;
  success: boolean;
  new_status?: ContentStatus;
  reason?: string;
}

// API response wrapper (for reference — api-client unwraps automatically)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}