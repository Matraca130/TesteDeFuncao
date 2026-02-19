// ============================================================
// Axon v4.4 — Content Entity Types (re-exports)
// Canonical definitions live in src/app/lib/types.ts
// This file provides a convenient import path from src/types/.
// ============================================================

export type {
  Course,
  Semester,
  Section,
  Topic,
  Summary,
  Keyword as ContentKeyword,
  SubTopic as ContentSubTopic,
  SummaryChunk,
  KeywordConnection,
  ContentStatus as LibContentStatus,
  ContentSource as LibContentSource,
  Priority as LibPriority,
  RelationshipType,
  BatchStatusItem,
  ApprovalItem,
  BatchStatusResult,
  ApiResponse,
  ApiError,
} from '../app/lib/types';
