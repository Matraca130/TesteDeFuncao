// Axon v4.4 — Types: Quiz & Learning Profile
export interface QuizAnswer { questionId: number; type: 'multiple-choice' | 'write-in' | 'fill-blank'; userAnswer: string | number; correct: boolean; timeMs: number; }
export interface QuizAttempt { id: string; student_id: string; course_id: string; topic_id: string; keyword_id?: string; quiz_type?: string; score: number; total_questions: number; correct_answers: number; time_seconds: number; answers: QuizAnswer[]; completed_at: string; }
export interface QuizBundle { session_id: string; attempts: QuizAttempt[]; summary: { total_score: number; total_questions: number; average_score: number; }; }
export interface LearningProfile { student_id: string; total_study_minutes: number; total_sessions: number; total_cards_reviewed: number; total_quizzes_completed: number; current_streak: number; longest_streak: number; average_daily_minutes: number; last_study_date: string; weekly_activity: number[]; strengths: string[]; weaknesses: string[]; }
