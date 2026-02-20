// Axon v4.4 — Types: Core Content Hierarchy + Enums
export type ContentStatus = 'draft' | 'published' | 'rejected' | 'approved';
export type ContentSource = 'manual' | 'ai_generated' | 'imported' | 'student' | 'ai';
export type Priority = 0 | 1 | 2 | 3;
export type RelationshipType = 'related' | 'prerequisite' | 'builds_on' | 'contrasts' | 'part_of';
export type DeltaColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue';
export type Grade = 0.00 | 0.35 | 0.65 | 0.90;
export type MembershipRole = 'owner' | 'admin' | 'professor' | 'student';

export interface Institution { id: string; name: string; slug?: string; logo_url: string | null; created_at: string; created_by?: string; }
export interface Course { id: string; institution_id: string; name: string; description: string | null; color: string; sort_order: number; created_at: string; updated_at: string; created_by?: string; }
export interface Semester { id: string; course_id: string; name: string; order_index: number; }
export interface Section { id: string; semester_id: string; name: string; image_url: string | null; order_index: number; }
export interface Topic { id: string; section_id: string; name: string; order_index: number; created_at: string; }
export interface Summary { id: string; topic_id: string; course_id: string; institution_id?: string; title?: string; content_markdown: string; status: ContentStatus; created_by: string; created_at: string; updated_at: string; version?: number; }
export interface SummaryChunk { id: string; summary_id: string; chunk_text: string; chunk_index: number; token_count?: number; }
export interface Keyword { id: string; institution_id: string; term: string; definition: string | null; priority: Priority; status: ContentStatus; source?: ContentSource; created_by: string; created_at: string; updated_at: string; subtopics?: SubTopic[]; connections?: KeywordConnection[]; }
export interface SubTopic { id: string; keyword_id: string; title: string; description: string | null; order_index?: number; status?: ContentStatus; source?: ContentSource; created_by?: string; created_at?: string; }
export interface KeywordConnection { id: string; keyword_a_id: string; keyword_b_id: string; relationship_type?: RelationshipType; strength?: number; description?: string | null; created_at: string; created_by?: string; }
export interface FlashcardCard { id: string; summary_id: string; keyword_id: string; subtopic_id: string | null; institution_id: string; front: string; back: string; image_url: string | null; status: ContentStatus; source: ContentSource; created_by: string; created_at: string; }
