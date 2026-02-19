import type { PricingPlan, PlanAccessRule, Video, AdminScope } from './types-plans';
import type { QuizAttempt, LearningProfile } from './types-quiz';

export const MOCK_PLANS: PricingPlan[] = [
  { id: 'plan-free', institution_id: 'inst-001', name: 'Plano Gratuito', description: 'Acesso basico.', price: 0, currency: 'BRL', is_default: true, is_trial: false, max_students: 50, features: ['Resumos', 'Flashcards', 'Quiz limitado'], created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
  { id: 'plan-premium', institution_id: 'inst-001', name: 'Premium Academico', description: 'Acesso completo.', price: 49.90, currency: 'BRL', is_default: false, is_trial: false, max_students: 500, features: ['Tudo', 'AI', 'Videos', 'Analytics'], created_at: '2025-02-01T10:00:00Z', updated_at: '2025-02-01T10:00:00Z' },
  { id: 'plan-trial', institution_id: 'inst-001', name: 'Trial 14 dias', description: 'Acesso completo 14 dias.', price: 0, currency: 'BRL', is_default: false, is_trial: true, trial_duration_days: 14, max_students: 100, features: ['Temporario completo'], created_at: '2025-03-01T10:00:00Z', updated_at: '2025-03-01T10:00:00Z' },
];
export const MOCK_PLAN_RULES: PlanAccessRule[] = [
  { id: 'rule-001', plan_id: 'plan-free', resource_type: 'course', resource_id: 'course-anatomy', permission: 'read', created_at: '2025-01-15T10:00:00Z' },
  { id: 'rule-002', plan_id: 'plan-premium', resource_type: 'course', resource_id: 'course-anatomy', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
  { id: 'rule-003', plan_id: 'plan-premium', resource_type: 'feature', resource_id: 'ai-assistant', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
  { id: 'rule-004', plan_id: 'plan-premium', resource_type: 'feature', resource_id: 'video-notes', permission: 'full', created_at: '2025-02-01T10:00:00Z' },
];
export const MOCK_VIDEOS: Video[] = [
  { id: 'vid-femur-01', summary_id: 'sum-femur-1', title: 'Anatomia do Femur', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 2400000, order_index: 0, created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-10T10:00:00Z', created_by: 'user-prof-001' },
  { id: 'vid-femur-02', summary_id: 'sum-femur-1', title: 'Palpacao Ossea', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 900000, order_index: 1, created_at: '2025-02-12T10:00:00Z', updated_at: '2025-02-12T10:00:00Z', created_by: 'user-prof-001' },
  { id: 'vid-cranial-01', summary_id: 'sum-cranial-1', title: 'Nervos Cranianos', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_ms: 1800000, order_index: 0, created_at: '2025-02-15T10:00:00Z', updated_at: '2025-02-15T10:00:00Z', created_by: 'user-prof-001' },
];
export const MOCK_ADMIN_SCOPES: AdminScope[] = [
  { id: 'scope-001', institution_id: 'inst-001', user_id: 'user-prof-001', scope_type: 'all', role: 'owner', created_at: '2025-01-10T10:00:00Z' },
  { id: 'scope-002', institution_id: 'inst-001', user_id: 'user-prof-002', scope_type: 'course', scope_id: 'course-anatomy', role: 'professor', created_at: '2025-01-15T10:00:00Z' },
];
export const MOCK_QUIZ_ATTEMPTS: QuizAttempt[] = [
  { id: 'quiz-att-001', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-femur', keyword_id: 'kw-femur', quiz_type: 'multiple-choice', score: 80, total_questions: 5, correct_answers: 4, time_seconds: 180, answers: [{ questionId: 1, type: 'multiple-choice', userAnswer: 2, correct: true, timeMs: 12000 }, { questionId: 2, type: 'multiple-choice', userAnswer: 1, correct: true, timeMs: 15000 }, { questionId: 3, type: 'multiple-choice', userAnswer: 3, correct: false, timeMs: 20000 }, { questionId: 4, type: 'multiple-choice', userAnswer: 0, correct: true, timeMs: 10000 }, { questionId: 5, type: 'multiple-choice', userAnswer: 2, correct: true, timeMs: 18000 }], completed_at: '2025-02-18T14:00:00Z' },
  { id: 'quiz-att-002', student_id: 'demo-student-001', course_id: 'course-anatomy', topic_id: 'topic-cranial', keyword_id: 'kw-nervo-vago', quiz_type: 'fill-blank', score: 60, total_questions: 5, correct_answers: 3, time_seconds: 240, answers: [{ questionId: 1, type: 'fill-blank', userAnswer: 'vago', correct: true, timeMs: 25000 }, { questionId: 2, type: 'fill-blank', userAnswer: 'trigemeo', correct: true, timeMs: 30000 }, { questionId: 3, type: 'fill-blank', userAnswer: 'facial', correct: false, timeMs: 35000 }, { questionId: 4, type: 'fill-blank', userAnswer: 'oculomotor', correct: true, timeMs: 20000 }, { questionId: 5, type: 'fill-blank', userAnswer: 'abducente', correct: false, timeMs: 28000 }], completed_at: '2025-02-19T10:00:00Z' },
];
export const MOCK_LEARNING_PROFILE: LearningProfile = { student_id: 'demo-student-001', total_study_minutes: 1250, total_sessions: 45, total_cards_reviewed: 320, total_quizzes_completed: 12, current_streak: 7, longest_streak: 14, average_daily_minutes: 42, last_study_date: '2025-02-19T10:00:00Z', weekly_activity: [30, 45, 60, 35, 50, 40, 55], strengths: ['Anatomia do Femur', 'Nervos Cranianos'], weaknesses: ['Fisiologia Cardiovascular', 'Histologia'] };
