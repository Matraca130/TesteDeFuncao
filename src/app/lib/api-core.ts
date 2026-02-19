// Axon v4.4 — API Core: Config, Auth, Helpers, Mock Store
import {
  MOCK_PLANS, MOCK_PLAN_RULES, MOCK_VIDEOS, MOCK_ADMIN_SCOPES,
  MOCK_KW_STUDENT_NOTES, MOCK_KW_PROF_NOTES, MOCK_VIDEO_NOTES,
  MOCK_QUIZ_ATTEMPTS, MOCK_TEXT_ANNOTATIONS,
  MOCK_STUDENT_PROFILE, MOCK_STUDENT_STATS, MOCK_DAILY_ACTIVITY,
  MOCK_COURSE_PROGRESS, MOCK_READING_STATES,
  MOCK_STUDY_SESSIONS, MOCK_FLASHCARD_REVIEWS, MOCK_STUDY_SUMMARIES,
  MOCK_COURSES, MOCK_SEMESTERS, MOCK_SECTIONS, MOCK_TOPICS,
  MOCK_SUMMARIES, MOCK_KEYWORDS, MOCK_LEARNING_PROFILE,
} from './mock-data';
import type {
  PricingPlan, PlanAccessRule, Video, AdminScope,
  KwStudentNote, KwProfNote, VideoNote, TextAnnotation,
  QuizAttempt, StudentProfile, StudySession, FlashcardReview,
  StudySummary, SummaryReadingState,
  Course, Semester, Section, Topic, Summary, Keyword,
} from './types';

export const USE_MOCKS: boolean = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'false' ? false : true;
export const API_BASE_URL: string = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL as string) || '/api';

let _authToken: string | null = null;
export function setApiAuthToken(token: string | null): void { _authToken = token; }
export function getApiAuthToken(): string | null { return _authToken; }
export function authHeaders(): Record<string, string> { const h: Record<string, string> = { 'Content-Type': 'application/json' }; if (_authToken) h['Authorization'] = `Bearer ${_authToken}`; return h; }

export function mockId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
export function delay(ms = 150): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
export function now(): string { return new Date().toISOString(); }

export const store = {
  plans: [...MOCK_PLANS] as PricingPlan[],
  planRules: [...MOCK_PLAN_RULES] as PlanAccessRule[],
  videos: [...MOCK_VIDEOS] as Video[],
  adminScopes: [...MOCK_ADMIN_SCOPES] as AdminScope[],
  kwStudentNotes: [...MOCK_KW_STUDENT_NOTES] as KwStudentNote[],
  kwProfNotes: [...MOCK_KW_PROF_NOTES] as KwProfNote[],
  videoNotes: [...MOCK_VIDEO_NOTES] as VideoNote[],
  quizAttempts: [...MOCK_QUIZ_ATTEMPTS] as QuizAttempt[],
  textAnnotations: [...MOCK_TEXT_ANNOTATIONS] as TextAnnotation[],
  readingStates: [...MOCK_READING_STATES] as SummaryReadingState[],
  studentProfiles: [{ ...MOCK_STUDENT_PROFILE }] as StudentProfile[],
  studySessions: [...MOCK_STUDY_SESSIONS] as StudySession[],
  flashcardReviews: [...MOCK_FLASHCARD_REVIEWS] as FlashcardReview[],
  studySummaries: [...MOCK_STUDY_SUMMARIES] as StudySummary[],
  courses: [...MOCK_COURSES] as Course[],
  semesters: [...MOCK_SEMESTERS] as Semester[],
  sections: [...MOCK_SECTIONS] as Section[],
  topics: [...MOCK_TOPICS] as Topic[],
  summaries: [...MOCK_SUMMARIES] as Summary[],
  keywords: [...MOCK_KEYWORDS] as Keyword[],
};

export { MOCK_STUDENT_PROFILE, MOCK_STUDENT_STATS, MOCK_DAILY_ACTIVITY, MOCK_COURSE_PROGRESS, MOCK_LEARNING_PROFILE };
