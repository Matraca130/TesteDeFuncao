// ============================================================
// DEPRECATED — Backward-compatibility re-export shim.
//
// All types have been consolidated into src/types/.
// New code should import from there directly:
//   import type { Keyword, SubTopic } from '../../../types/keyword';
//   import type { DeltaColor, Priority } from '../../../types/enums';
//
// This file will be removed in a future cleanup pass.
// ============================================================

// Re-export enums (were duplicated here, now canonical in types/enums)
export type { DeltaColor, Priority } from '../../../types/enums';

// Re-export keyword/navigation types (now canonical in types/keyword)
export type {
  Keyword,
  SubTopic,
  SubTopicBktState,
  AIChatMessage,
  AIChatHistory,
  KeywordPopupData,
  ModelAnnotation,
} from '../../../types/keyword';
