// ============================================================
// Axon v4.4 — Mock Data (Agent 4 — BRIDGE)
// Used as fallback when backend is unreachable.
// Aligned with backend contract field names.
// ============================================================

import type {
  PricingPlan, PlanAccessRule, Video, AdminScope,
  KwStudentNote, KwProfNote, VideoNote,
  QuizAttempt, QuizBundle, LearningProfile,
  TextAnnotation, SummaryReadingState,
  StudentStats, DailyActivity, CourseProgress,
  StudentProfile, StudySession, FlashcardReview, StudySummary,
  Course, Semester, Section, Topic, Summary, Keyword,
} from './types';

// ── Plans ───────────────────────────────────────────────────────

export const MOCK_PLANS: PricingPlan[] = [
  { id: 'plan-free', institution_id: 'inst-001', name: 'Plano Gratuito', description: 'Acesso basico para experimentar a plataforma.', price: 0, currency: 'BRL', is_default: true, is_trial: false, max_students: 50, features: ['Resumos (leitura)', 'Flashcards basicos', 'Quiz limitado'], created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
  { id: 'plan-premium', institution_id: 'inst-001', name: 'Premium Academico', description: 'Acesso completo com AI, videos e analytics avancados.', price: 49.90, currency: 'BRL', is_default: false, is_trial: false, max_students: 500, features: ['Tudo do Gratuito', 'AI Assistant', 'Videos', 'Analytics', 'Notas do professor'], created_at: '2025-02-01T10:00:00Z', updated_at: '2025-02-01T10:00:00Z' },
  { id: 'plan-trial', institution_id: 'inst-001', name: 'Trial 14 dias', description: 'Acesso completo por 14 dias.', price: 0, currency: 'BRL', is_default: false, is_trial: true, trial_duration_days: 14, max_students: 100, features: ['Acesso completo temporario'], created_at: '2025-03-01T10:00:00Z', updated_at: '2025-03-01T10:00:00Z' },
];

export const MOCK_PLAN_RULES: PlanAccessRule[] = [
  { id: 'rule-001', plan_id: 'plan-free', resource_type: 'course', resource_id: 'course-anatomy', permission: 'read', created_at: '2025-01-15T10:00:00Z' },
  { id: 'rule-002', plan_id: 'plan-premium', resource_type: 'course', resource_id: 'course-anatomy', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
  { id: 'rule-003', plan_id: 'plan-premium', resource_type: 'feature', resource_id: 'ai-assistant', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
  { id: 'rule-004', plan_id: 'plan-premium', resource_type: 'feature', resource_id: 'video-notes', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
];

// ── Videos ──────────────────────────────────────────────────────

export const MOCK_VIDEOS: Video[] = [
  { id: 'vid-femur-01', summary_id: 'sum-femur-1', title: 'Anatomia do Femur', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 2400000, thumbnail_url: null, order_index: 0, created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z', created_by: 'user-prof-001' },
  { id: 'vid-femur-02', summary_id: 'sum-femur-1', title: 'Palpacao Ossea — Femur', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 900000, thumbnail_url: null, order_index: 1, created_at: '2025-02-12T10:00:00Z', updated_at: '2025-02-12T10:00:00Z', created_by: 'user-prof-001' },
  { id: 'vid-cranial-01', summary_id: 'sum-cranial-1', title: 'Nervos Cranianos — Revisao', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 1800000, thumbnail_url: null, order_index: 0, created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-15T10:00:00Z', created_by: 'user-prof-001' },
];

// ── Admin Scopes ────────────────────────────────────────────────

export const MOCK_ADMIN_SCOPES: AdminScope[] = [
  { id: 'scope-001', institution_id: 'inst-001', user_id: 'user-prof-001', scope_type: 'all', role: 'owner', created_at: '2025-01-10T10:00:00Z' },
  { id: 'scope-002', institution_id: 'inst-001', user_id: 'user-prof-002', scope_type: 'course', scope_id: 'course-anatomy', role: 'professor', created_at: '2025-01-15T10:00:00Z' },
];

// ── Keyword Student Notes (SACRED) ──────────────────────────────

export const MOCK_KW_STUDENT_NOTES: KwStudentNote[] = [
  { id: 'kw-note-001', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'O femur articula-se com o acetabulo.', created_at: '2025-02-15T14:00:00Z', updated_at: '2025-02-15T14:00:00Z', deleted_at: null },
  { id: 'kw-note-002', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'Trocanter maior: insercao do gluteo medio.', created_at: '2025-02-16T10:00:00Z', updated_at: '2025-02-16T10:00:00Z', deleted_at: null },
  { id: 'kw-note-003', keyword_id: 'kw-femur', student_id: 'demo-student-001', content: 'Nota deletada para teste de soft-delete.', created_at: '2025-02-17T08:00:00Z', updated_at: '2025-02-17T09:00:00Z', deleted_at: '2025-02-17T09:00:00Z' },
  { id: 'kw-note-004', keyword_id: 'kw-nervo-vago', student_id: 'demo-student-001', content: 'O vago tem funcao parassimpatica.', created_at: '2025-02-18T11:00:00Z', updated_at: '2025-02-18T11:00:00Z', deleted_at: null },
];

// ── Professor Notes ─────────────────────────────────────────────

export const MOCK_KW_PROF_NOTES: KwProfNote[] = [
  { id: 'prof-note-001', keyword_id: 'kw-femur', professor_id: 'user-prof-001', content: 'Angulo de inclinacao do colo do femur: ~125 graus.', visibility: 'visible', created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z' },
  { id: 'prof-note-002', keyword_id: 'kw-femur', professor_id: 'user-prof-001', content: 'Para a prova: diferenciar fratura do colo vs trochanteriana.', visibility: 'visible', created_at: '2025-02-11T10:00:00Z', updated_at: '2025-02-11T10:00:00Z' },
  { id: 'prof-note-003', keyword_id: 'kw-nervo-vago', professor_id: 'user-prof-001', content: 'Estimulacao vagal: manobra de Valsalva para TSV.', visibility: 'visible', created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-15T10:00:00Z' },
];

// ── Video Notes (SACRED) ─────────────────────────────────────────

export const MOCK_VIDEO_NOTES: VideoNote[] = [
  { id: 'vnote-001', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Cabeca do femur — forma esferica.', timestamp_ms: 120000, created_at: '2025-02-20T10:00:00Z', updated_at: '2025-02-20T10:00:00Z', deleted_at: null },
  { id: 'vnote-002', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Linha aspera — insercao de adutores.', timestamp_ms: 480000, created_at: '2025-02-20T11:00:00Z', updated_at: '2025-02-20T11:00:00Z', deleted_at: null },
  { id: 'vnote-003', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Nota geral sobre o video.', timestamp_ms: null, created_at: '2025-02-20T12:00:00Z', updated_at: '2025-02-20T12:00:00Z', deleted_at: null },
  { id: 'vnote-004', video_id: 'vid-femur-01', student_id: 'demo-student-001', content: 'Nota deletada para teste.', timestamp_ms: 300000, created_at: '2025-02-20T13:00:00Z', updated_at: '2025-02-20T14:00:00Z', deleted_at: '2025-02-20T14:00:00Z' },
  { id: 'vnote-005', video_id: 'vid-cranial-01', student_id: 'demo-student-001', content: 'Mnemonica: Oh Oh Oh To Touch And Feel Very Good Velvet AH!', timestamp_ms: 60000, created_at: '2025-02-21T10:00:00Z', updated_at: '2025-02-21T10:00:00Z', deleted_at: null },
];

// ── Quiz Attempts ───────────────────────────────────────────────

export const MOCK_QUIZ_ATTEMPTS: QuizAttempt[] = [
  { id: 'quiz-att-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', keyword_id: 'kw-femur', quiz_type: 'multiple-choice', score: 80, total_questions: 5, correct_answers: 4, time_seconds: 180, answers: [ { questionId: 1, type: 'multiple-choice', userAnswer: 2, correct: true, timeMs: 12000 }, { questionId: 2, type: 'multiple-choice', userAnswer: 1, correct: true, timeMs: 15000 }, { questionId: 3, type: 'multiple-choice', userAnswer: 3, correct: false, timeMs: 20000 }, { questionId: 4, type: 'multiple-choice', userAnswer: 0, correct: true, timeMs: 10000 }, { questionId: 5, type: 'multiple-choice', userAnswer: 2, correct: true, timeMs: 18000 } ], completed_at: '2025-02-18T14:00:00Z' },
  { id: 'quiz-att-002', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-cranial', keyword_id: 'kw-nervo-vago', quiz_type: 'fill-blank', score: 60, total_questions: 5, correct_answers: 3, time_seconds: 240, answers: [ { questionId: 1, type: 'fill-blank', userAnswer: 'vago', correct: true, timeMs: 25000 }, { questionId: 2, type: 'fill-blank', userAnswer: 'trigemeo', correct: true, timeMs: 30000 }, { questionId: 3, type: 'fill-blank', userAnswer: 'facial', correct: false, timeMs: 35000 }, { questionId: 4, type: 'fill-blank', userAnswer: 'oculomotor', correct: true, timeMs: 20000 }, { questionId: 5, type: 'fill-blank', userAnswer: 'abducente', correct: false, timeMs: 28000 } ], completed_at: '2025-02-19T10:00:00Z' },
];

// ── Learning Profile ────────────────────────────────────────────

export const MOCK_LEARNING_PROFILE: LearningProfile = {
  student_id: 'demo-student-001', total_study_minutes: 1250, total_sessions: 45, total_cards_reviewed: 320, total_quizzes_completed: 12, current_streak: 7, longest_streak: 14, average_daily_minutes: 42, last_study_date: '2025-02-19T10:00:00Z', weekly_activity: [30, 45, 60, 35, 50, 40, 55], strengths: ['Anatomia do Femur', 'Nervos Cranianos'], weaknesses: ['Fisiologia Cardiovascular', 'Histologia'],
};

// ── Text Annotations (SACRED) ───────────────────────────────────

export const MOCK_TEXT_ANNOTATIONS: TextAnnotation[] = [
  { id: 'ann-001', summary_id: 'sum-femur-1', student_id: 'demo-student-001', original_text: 'O femur e o osso mais longo do corpo humano', display_text: 'O femur e o osso mais longo do corpo humano', color: 'yellow', note: 'Importante para prova!', type: 'highlight', created_at: '2025-02-15T14:00:00Z', updated_at: '2025-02-15T14:00:00Z', deleted_at: null },
  { id: 'ann-002', summary_id: 'sum-femur-1', student_id: 'demo-student-001', original_text: 'Cabeca do femur', display_text: 'Cabeca do femur', color: 'blue', note: 'Articulacao esferoidea com o acetabulo.', type: 'note', created_at: '2025-02-15T14:30:00Z', updated_at: '2025-02-15T14:30:00Z', deleted_at: null },
];

// ── Student Stats ───────────────────────────────────────────────

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

// ── Summary Reading State ───────────────────────────────────────

export const MOCK_READING_STATES: SummaryReadingState[] = [
  { summary_id: 'sum-femur-1', student_id: 'demo-student-001', progress_percent: 85, last_position: 450, time_spent_seconds: 1200, completed: false, last_read_at: '2025-02-19T10:00:00Z' },
  { summary_id: 'sum-cranial-1', student_id: 'demo-student-001', progress_percent: 100, last_position: 0, time_spent_seconds: 900, completed: true, last_read_at: '2025-02-18T15:00:00Z' },
];

// ── P3: Student Profile ─────────────────────────────────────────

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  id: 'demo-student-001', user_id: 'user-student-001', name: 'Maria Silva', email: 'maria.silva@demo.med', avatar_url: null, institution_id: 'inst-001', plan_id: 'plan-premium', created_at: '2025-01-10T10:00:00Z', updated_at: '2025-02-19T10:00:00Z',
};

// ── P3: Study Sessions ──────────────────────────────────────────

export const MOCK_STUDY_SESSIONS: StudySession[] = [
  { id: 'sess-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', started_at: '2025-02-19T08:00:00Z', ended_at: '2025-02-19T08:45:00Z', duration_minutes: 45, activity_type: 'reading' },
  { id: 'sess-002', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', started_at: '2025-02-19T09:00:00Z', ended_at: '2025-02-19T09:30:00Z', duration_minutes: 30, activity_type: 'flashcard' },
  { id: 'sess-003', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-cranial', started_at: '2025-02-18T14:00:00Z', ended_at: '2025-02-18T15:00:00Z', duration_minutes: 60, activity_type: 'quiz' },
];

// ── P3: Flashcard Reviews ───────────────────────────────────────

export const MOCK_FLASHCARD_REVIEWS: FlashcardReview[] = [
  { id: 'rev-001', student_id: 'demo-student-001', card_id: 'fc-001', course_id: 'course-anatomy', rating: 4, reviewed_at: '2025-02-19T09:05:00Z' },
  { id: 'rev-002', student_id: 'demo-student-001', card_id: 'fc-002', course_id: 'course-anatomy', rating: 3, reviewed_at: '2025-02-19T09:10:00Z' },
  { id: 'rev-003', student_id: 'demo-student-001', card_id: 'fc-003', course_id: 'course-anatomy', rating: 5, reviewed_at: '2025-02-19T09:15:00Z' },
];

// ── P3: Study Summaries (Resumos) ───────────────────────────────

export const MOCK_STUDY_SUMMARIES: StudySummary[] = [
  { id: 'study-sum-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', course_name: 'Anatomia Humana', topic_title: 'Femur', content: '', annotations: [], keyword_mastery: { 'femur': 'green', 'trocanter': 'yellow' }, keyword_notes: { 'femur': ['Osso mais longo'] }, edit_time_minutes: 45, tags: ['anatomia', 'femur'], bookmarked: true, created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-19T10:00:00Z' },
];

// ── P3: Content Hierarchy ───────────────────────────────────────

export const MOCK_COURSES: Course[] = [
  { id: 'course-anatomy', institution_id: 'inst-001', name: 'Anatomia Humana', description: 'Estudo completo da anatomia', color: '#14b8a6', sort_order: 0, created_at: '2025-01-10T10:00:00Z', updated_at: '2025-01-10T10:00:00Z', created_by: 'user-prof-001' },
  { id: 'course-physiology', institution_id: 'inst-001', name: 'Fisiologia Medica', description: 'Funcoes dos sistemas organicos', color: '#6366f1', sort_order: 1, created_at: '2025-01-10T10:00:00Z', updated_at: '2025-01-10T10:00:00Z', created_by: 'user-prof-001' },
];

export const MOCK_SEMESTERS: Semester[] = [
  { id: 'sem-1', course_id: 'course-anatomy', name: '1o Semestre', order_index: 0 },
  { id: 'sem-2', course_id: 'course-anatomy', name: '2o Semestre', order_index: 1 },
  { id: 'sem-3', course_id: 'course-physiology', name: '1o Semestre', order_index: 0 },
];

export const MOCK_SECTIONS: Section[] = [
  { id: 'sec-locomotor', semester_id: 'sem-1', name: 'Sistema Locomotor', image_url: null, order_index: 0 },
  { id: 'sec-nervoso', semester_id: 'sem-1', name: 'Sistema Nervoso', image_url: null, order_index: 1 },
  { id: 'sec-cardio', semester_id: 'sem-3', name: 'Sistema Cardiovascular', image_url: null, order_index: 0 },
];

export const MOCK_TOPICS: Topic[] = [
  { id: 'topic-femur', section_id: 'sec-locomotor', name: 'Femur', order_index: 0, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-tibia', section_id: 'sec-locomotor', name: 'Tibia e Fibula', order_index: 1, created_at: '2025-01-15T10:00:00Z' },
  { id: 'topic-cranial', section_id: 'sec-nervoso', name: 'Nervos Cranianos', order_index: 0, created_at: '2025-01-20T10:00:00Z' },
];

export const MOCK_SUMMARIES: Summary[] = [
  { id: 'sum-femur-1', topic_id: 'topic-femur', course_id: 'course-anatomy', institution_id: 'inst-001', content_markdown: '# Femur\n\nO femur e o osso mais longo...', status: 'published', created_by: 'user-prof-001', created_at: '2025-02-01T10:00:00Z', updated_at: '2025-02-10T10:00:00Z', version: 2 },
  { id: 'sum-cranial-1', topic_id: 'topic-cranial', course_id: 'course-anatomy', institution_id: 'inst-001', content_markdown: '# Nervos Cranianos\n\nOs 12 pares de nervos...', status: 'published', created_by: 'user-prof-001', created_at: '2025-02-05T10:00:00Z', updated_at: '2025-02-15T10:00:00Z', version: 1 },
];

export const MOCK_KEYWORDS: Keyword[] = [
  { id: 'kw-femur', institution_id: 'inst-001', term: 'Femur', definition: 'Osso mais longo do corpo humano.', priority: 2, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
  { id: 'kw-nervo-vago', institution_id: 'inst-001', term: 'Nervo Vago', definition: 'X par craniano com funcao parassimpatica.', priority: 3, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-20T10:00:00Z', updated_at: '2025-01-20T10:00:00Z' },
  { id: 'kw-trocanter', institution_id: 'inst-001', term: 'Trocanter', definition: 'Saliencia ossea do femur proximal.', priority: 1, status: 'published', source: 'manual', created_by: 'user-prof-001', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
];
