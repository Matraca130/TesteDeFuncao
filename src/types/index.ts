// ============================================================
// Axon v4.4 — Types Barrel Export
// Fuente unica de verdad para tipos compartidos.
// import { Grade, Keyword, AuthUser, ... } from '@/types';
// ============================================================

// Enums & Primitives
export type { Grade, DeltaColor, ContentStatus, ContentSource, Priority } from './enums';

// Instrument Entities
export type { FlashcardCard } from './instruments';

// API Contract
export type {
  FsrsState,
  DueFlashcardItem,
  SubmitReviewReq,
  SubmitReviewRes,
} from './api-contract';

// Keyword & Navigation
export type {
  Keyword,
  SubTopic,
  SubTopicBktState,
  KeywordState,
  AIChatMessage,
  AIChatHistory,
  KeywordPopupData,
  ModelAnnotation,
} from './keyword';

// Auth
export type {
  MembershipRole,
  AuthUser,
  Membership,
  Institution,
  Plan,
  AuthContextType,
  AuthLoginResponse,
  AuthSignupResponse,
  InstitutionBySlugResponse,
} from './auth';
export { ADMIN_ROLES, isAdminRole, canAccessAdmin, getRouteForRole } from './auth';

// Student
export type {
  StudentProfile,
  StudentPreferences,
  StudentStats,
  CourseProgress,
  TopicProgress,
  FlashcardReview,
  StudySession,
  DailyActivity,
  StudySummary,
  SummaryAnnotation,
  KeywordCollectionData,
  QuizAnswer,
  QuizAttempt,
} from './student';
