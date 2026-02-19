// ============================================================
// Axon v4.4 — Flashcard Module Barrel Export
// Importa todo desde aqui: import { ... } from './flashcard'
// ============================================================

// Constants
export { GRADE_BUTTONS, DELTA_COLOR_META, COLOR_ORDER } from './constants';
export type { GradeButtonConfig, DeltaColorMeta } from './constants';

// Utilities
export { gradeToInt, normalizeFsrsState, getColorMeta } from './utils';

// Types
export type { SessionPhase, SessionReviewResult } from './types';

// UI Components (Step 2)
export { SpeedometerGauge } from './SpeedometerGauge';
export { GradeButtons } from './GradeButtons';
export { ReviewFeedbackDisplay } from './ReviewFeedbackDisplay';
export { StudentCardCreator } from './StudentCardCreator';

// Custom Hook (Step 3)
export { useFlashcardSession } from './useFlashcardSession';
export type { UseFlashcardSessionReturn } from './useFlashcardSession';
