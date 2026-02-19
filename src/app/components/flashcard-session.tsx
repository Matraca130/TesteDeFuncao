// ============================================================
// DEPRECATED — This file is a backward-compatibility shim.
//
// The monolith flashcard-session.tsx (32KB) has been decomposed
// into modular files under ./flashcard/.
//
// New code should import from './flashcard' directly:
//   import { FlashcardSession } from './flashcard';
//
// This file will be removed in a future cleanup pass.
// ============================================================

export {
  // Orchestrator (drop-in replacement)
  FlashcardSession,

  // Hook
  useFlashcardSession,

  // UI Components
  SpeedometerGauge,
  GradeButtons,
  ReviewFeedbackDisplay,
  StudentCardCreator,

  // Views
  LoadingView,
  EmptyView,
  SummaryView,
  StudyingView,

  // Constants & Utils
  GRADE_BUTTONS,
  DELTA_COLOR_META,
  COLOR_ORDER,
  gradeToInt,
  normalizeFsrsState,
  getColorMeta,
} from './flashcard';

export type {
  SessionPhase,
  SessionReviewResult,
  GradeButtonConfig,
  DeltaColorMeta,
  UseFlashcardSessionReturn,
} from './flashcard';

// Default export for lazy-load / dynamic import compatibility
export { FlashcardSession as default } from './flashcard';
