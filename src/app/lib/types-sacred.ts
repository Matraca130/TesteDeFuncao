// Axon v4.4 — Types: SACRED entities (soft-delete only)
export interface KwStudentNote { id: string; keyword_id: string; student_id: string; content: string; created_at: string; updated_at: string; deleted_at: string | null; }
export interface KwProfNote { id: string; keyword_id: string; professor_id: string; content: string; visibility: 'visible' | 'hidden'; created_at: string; updated_at: string; }
export interface VideoNote { id: string; video_id: string; student_id: string; content: string; timestamp_ms: number | null; created_at: string; updated_at: string; deleted_at: string | null; }
export interface TextAnnotation { id: string; summary_id: string; student_id: string; original_text: string; display_text: string; color: 'yellow' | 'blue' | 'green' | 'pink'; note: string; type: 'highlight' | 'note' | 'question'; bot_reply?: string; created_at: string; updated_at: string; deleted_at: string | null; }
