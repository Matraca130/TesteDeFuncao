// ============================================================
// Axon v4.4 — AI Types (shared across services, hooks, pages)
// Single source of truth for all AI feedback data shapes
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface QuizFeedbackData {
  bundle_id: string;
  summary: {
    total_questions: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    time_spent_seconds: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  per_question_feedback: Array<{
    question_id: string;
    question_text: string;
    was_correct: boolean;
    student_answer: string;
    correct_answer: string;
    ai_explanation: string;
  }>;
  study_strategy: string;
  encouragement: string;
}

export interface FlashcardFeedbackData {
  period: { from?: string; to?: string; days: number };
  stats: {
    cards_reviewed: number;
    cards_mastered: number;
    cards_struggling: number;
    retention_rate: number;
    average_interval_days: number;
    streak_days: number;
  };
  struggling_cards: Array<{
    flashcard_id: string;
    front: string;
    times_failed: number;
    ai_tip: string;
  }>;
  strengths: string[];
  improvements: string[];
  ai_study_tips: string[];
  next_session_recommendation: string;
}

export interface SummaryDiagnosticData {
  summary_id: string;
  summary_title: string;
  overall_mastery: number;
  bkt_level: 'red' | 'orange' | 'yellow' | 'green';
  keywords_breakdown: Array<{
    keyword_id: string;
    term: string;
    p_know: number;
    bkt_color: string;
    status: string;
  }>;
  quiz_performance: {
    total_attempts: number;
    average_accuracy: number;
    best_topic: string;
    worst_topic: string;
  };
  flashcard_performance: {
    total_reviews: number;
    retention_rate: number;
    mastered_count: number;
  };
  ai_analysis: {
    overall_assessment: string;
    key_strengths: string[];
    gaps: string[];
    recommended_actions: string[];
    estimated_time_to_mastery: string;
  };
  study_plan_suggestion: {
    priority_keywords: string[];
    recommended_order: string[];
    daily_goal_minutes: number;
  };
}

export interface LearningProfileData {
  student_id: string;
  generated_at: string;
  cached: boolean;
  global_stats: {
    total_study_hours: number;
    total_quizzes_completed: number;
    total_flashcards_reviewed: number;
    total_keywords_studied: number;
    keywords_mastered: number;
    keywords_in_progress: number;
    keywords_weak: number;
    overall_accuracy: number;
    current_streak_days: number;
    longest_streak_days: number;
    study_consistency: number;
  };
  ai_profile: {
    learning_style: string;
    strongest_areas: string[];
    weakest_areas: string[];
    study_pattern: string;
    personality_insight: string;
  };
  ai_recommendations: {
    immediate_actions: string[];
    weekly_goals: string[];
    long_term_strategy: string;
    recommended_study_time: string;
    focus_keywords: string[];
  };
  progress_timeline: Array<{
    week: string;
    keywords_mastered: number;
    accuracy: number;
    hours_studied: number;
  }>;
  motivation: {
    message: string;
    achievement_highlight: string;
    next_milestone: string;
  };
}
