import type { StudentProfile, StudentStats, DailyActivity, CourseProgress, StudySession, FlashcardReview, StudySummary, SummaryReadingState } from './types-student';

export const MOCK_STUDENT_PROFILE: StudentProfile = { id: 'demo-student-001', user_id: 'user-student-001', name: 'Maria Silva', email: 'maria.silva@demo.med', avatar_url: null, institution_id: 'inst-001', plan_id: 'plan-premium', created_at: '2025-01-10T10:00:00Z', updated_at: '2025-02-19T10:00:00Z' };
export const MOCK_STUDENT_STATS: StudentStats = { totalStudyMinutes: 1250, totalSessions: 45, totalCardsReviewed: 320, totalQuizzesCompleted: 12, currentStreak: 7, longestStreak: 14, averageDailyMinutes: 42, lastStudyDate: '2025-02-19T10:00:00Z', weeklyActivity: [30, 45, 60, 35, 50, 40, 55] };
export const MOCK_DAILY_ACTIVITY: DailyActivity[] = [
  { date: '2025-02-13', studyMinutes: 30, sessionsCount: 2, cardsReviewed: 20, retentionPercent: 85 },
  { date: '2025-02-14', studyMinutes: 45, sessionsCount: 3, cardsReviewed: 35, retentionPercent: 88 },
  { date: '2025-02-15', studyMinutes: 60, sessionsCount: 4, cardsReviewed: 50, retentionPercent: 90 },
  { date: '2025-02-16', studyMinutes: 35, sessionsCount: 2, cardsReviewed: 25, retentionPercent: 82 },
  { date: '2025-02-17', studyMinutes: 50, sessionsCount: 3, cardsReviewed: 40, retentionPercent: 87 },
  { date: '2025-02-18', studyMinutes: 40, sessionsCount: 2, cardsReviewed: 30, retentionPercent: 86 },
  { date: '2025-02-19', studyMinutes: 55, sessionsCount: 3, cardsReviewed: 45, retentionPercent: 91 },
];
export const MOCK_COURSE_PROGRESS: CourseProgress[] = [
  { courseId: 'course-anatomy', courseName: 'Anatomia Humana', masteryPercent: 65, lessonsCompleted: 8, lessonsTotal: 12, flashcardsMastered: 45, flashcardsTotal: 80, quizAverageScore: 78, lastAccessedAt: '2025-02-19T10:00:00Z' },
  { courseId: 'course-physiology', courseName: 'Fisiologia Medica', masteryPercent: 40, lessonsCompleted: 3, lessonsTotal: 10, flashcardsMastered: 15, flashcardsTotal: 50, quizAverageScore: 62, lastAccessedAt: '2025-02-18T15:00:00Z' },
];
export const MOCK_STUDY_SESSIONS: StudySession[] = [
  { id: 'sess-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', started_at: '2025-02-19T08:00:00Z', ended_at: '2025-02-19T08:45:00Z', duration_minutes: 45, activity_type: 'reading' },
  { id: 'sess-002', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', started_at: '2025-02-19T09:00:00Z', ended_at: '2025-02-19T09:30:00Z', duration_minutes: 30, activity_type: 'flashcard' },
  { id: 'sess-003', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-cranial', started_at: '2025-02-18T14:00:00Z', ended_at: '2025-02-18T15:00:00Z', duration_minutes: 60, activity_type: 'quiz' },
];
export const MOCK_FLASHCARD_REVIEWS: FlashcardReview[] = [
  { id: 'rev-001', student_id: 'demo-student-001', card_id: 'fc-001', course_id: 'course-anatomy', rating: 4, reviewed_at: '2025-02-19T09:05:00Z' },
  { id: 'rev-002', student_id: 'demo-student-001', card_id: 'fc-002', course_id: 'course-anatomy', rating: 3, reviewed_at: '2025-02-19T09:10:00Z' },
  { id: 'rev-003', student_id: 'demo-student-001', card_id: 'fc-003', course_id: 'course-anatomy', rating: 5, reviewed_at: '2025-02-19T09:15:00Z' },
];
export const MOCK_STUDY_SUMMARIES: StudySummary[] = [
  { id: 'study-sum-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', course_name: 'Anatomia Humana', topic_title: 'Femur', content: '', annotations: [], keyword_mastery: { 'femur': 'green', 'trocanter': 'yellow' }, keyword_notes: { 'femur': ['Osso mais longo'] }, edit_time_minutes: 45, tags: ['anatomia', 'femur'], bookmarked: true, created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-19T10:00:00Z' },
];
export const MOCK_READING_STATES: SummaryReadingState[] = [
  { summary_id: 'sum-femur-1', student_id: 'demo-student-001', progress_percent: 85, last_position: 450, time_spent_seconds: 1200, completed: false, last_read_at: '2025-02-19T10:00:00Z' },
  { summary_id: 'sum-cranial-1', student_id: 'demo-student-001', progress_percent: 100, last_position: 0, time_spent_seconds: 900, completed: true, last_read_at: '2025-02-18T15:00:00Z' },
];
