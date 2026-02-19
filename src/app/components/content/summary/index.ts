// ─── Summary Module ──────────────────────────────────────────────────────────
//
// Modularized from the original SummarySessionNew.tsx (~94 KB monolith).
// Each file is under 22 KB — safe for AI assistants to read via GitHub API.
//

// ── Components ──
export { AIQuestionItem } from './AIQuestionItem';
export { EditableKeyword } from './EditableKeyword';
export type { EditableKeywordProps } from './EditableKeyword';
export { TextAnnotationsPanel } from './TextAnnotationsPanel';
export { TextAnnotationPopup } from './TextAnnotationPopup';
export { SummaryToolbar } from './SummaryToolbar';
export { OutlineSidebar, KeywordsSidebar } from './SummarySidebars';
export { Models3DGallery } from './Models3DGallery';

// ── Hooks ──
export { useSummaryTimer } from './useSummaryTimer';
export { useTextAnnotationManager } from './useTextAnnotationManager';
export { useSummaryPersistence } from './useSummaryPersistence';

// ── Utilities ──
export { parseTextWithKeywords, getKeywordStats, getAnnotatedKeywords } from './keywordUtils';

// ── Types ──
export type {
  AnnotationColor,
  AnnotationType,
  ToolType,
  SaveStatus,
  AnnotationTabType,
  TextAnnotation,
  PendingAnnotation,
} from './types';

export { highlighterStyles } from './types';
