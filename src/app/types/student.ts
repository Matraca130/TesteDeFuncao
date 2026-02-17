// ============================================================
// Axon -- Student Data Types
// ============================================================

export interface KeywordState {
  keyword: string;
  mastery: number;
  stability_days: number;
  due_at: string | null;
  lapses: number;
  exposures: number;
  card_coverage: number;
  last_review_at: string | null;
  color: 'red' | 'yellow' | 'green';
  color_stability_counter: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  university?: string;
  course?: string;
  semester?: number;
  enrolledCourseIds: string[];
  createdAt: string;
  preferences: StudentPreferences;
}

export interface StudentPreferences {
  theme: 'dark' | 'light';
  language: string;
  dailyGoalMinutes: number;
  notificationsEnabled: boolean;
  spacedRepetitionAlgorithm: 'sm2' | 'fsrs' | 'simple';
}

export interface StudentStats {
  totalStudyMinutes: number;
  totalSessions: number;
  totalCardsReviewed: number;
  totalQuizzesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageDailyMinutes: number;
  lastStudyDate: string;
  weeklyActivity: number[];
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  masteryPercent: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  flashcardsMastered: number;
  flashcardsTotal: number;
  quizAverageScore: number;
  lastAccessedAt: string;
  topicProgress: TopicProgress[];
}

export interface TopicProgress {
  topicId: string;
  topicTitle: string;
  sectionId: string;
  sectionTitle: string;
  masteryPercent: number;
  flashcardsDue: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  reviewCount: number;
  keywords?: Record<string, KeywordState>;
}

export interface FlashcardReview {
  cardId: number;
  topicId: string;
  courseId: string;
  reviewedAt: string;
  rating: 1 | 2 | 3 | 4 | 5;
  responseTimeMs: number;
  ease: number;
  interval: number;
  repetitions: number;
  keywords?: { primary: string[]; secondary: string[] };
}

export interface StudySession {
  id: string;
  studentId: string;
  courseId: string;
  topicId?: string;
  type: 'flashcards' | 'quiz' | 'reading' | 'video' | 'mixed';
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  cardsReviewed?: number;
  quizScore?: number;
  notes?: string;
}

export interface DailyActivity {
  date: string;
  studyMinutes: number;
  sessionsCount: number;
  cardsReviewed: number;
  retentionPercent?: number;
}

export interface StudySummary {
  id: string;
  studentId: string;
  courseId: string;
  topicId: string;
  courseName: string;
  topicTitle: string;
  content: string;
  canvasBlocks?: string; // JSON-serialized canvas blocks for rich editor
  annotations: SummaryAnnotation[];
  keywordMastery?: Record<string, string>;
  keywordNotes?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
  editTimeMinutes: number;
  tags: string[];
  bookmarked: boolean;
}

export interface SummaryAnnotation {
  id: string;
  title: string;
  selectedText: string;
  note: string;
  timestamp: string;
  color: 'yellow' | 'blue' | 'green' | 'pink';
}

export interface KeywordCollectionData {
  courseId: string;
  topicId?: string;
  keywords: Record<string, KeywordState>;
  lastUpdated: string;
}

// ── Quiz Attempt ──
export interface QuizAnswer {
  questionId: number;
  type: 'multiple-choice' | 'write-in' | 'fill-blank';
  userAnswer: string | number;
  correct: boolean;
  timeMs: number;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  courseId: string;
  topicId: string;
  courseName: string;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSeconds: number;
  answers: QuizAnswer[];
  completedAt: string;
}
