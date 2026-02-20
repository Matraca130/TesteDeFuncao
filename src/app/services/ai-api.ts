// ============================================================
// Axon v4.4 — AI API Service Layer (Agent 7 — NEXUS)
// Architecture: UI -> Hook -> ai-api -> Backend
//
// 5 functions matching the 5 AI endpoints:
//   fetchQuizFeedback      -> POST /ai/quiz-feedback
//   fetchFlashcardFeedback -> POST /ai/flashcard-feedback
//   fetchSummaryDiagnostic -> POST /ai/summary-diagnostic
//   fetchLearningProfile   -> POST /ai/learning-profile
//   regenerateLearningProfile -> POST /ai/learning-profile/regenerate
// ============================================================
import { projectId, publicAnonKey } from '/utils/supabase/info';
import type {
  ApiResponse,
  QuizFeedbackData,
  FlashcardFeedbackData,
  SummaryDiagnosticData,
  LearningProfileData,
} from '../types/ai-types';

// Re-export types for backward compatibility
export type { ApiResponse, QuizFeedbackData, FlashcardFeedbackData, SummaryDiagnosticData, LearningProfileData };

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-722e576f`;

// -- Shared fetch helper --

async function aiPost<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`[ai-api] POST ${endpoint}`, body);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    console.error(`[ai-api] HTTP ${res.status} from ${endpoint}: ${text}`);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !json.data) {
    const errMsg = json.error?.message || 'Resposta invalida do servidor';
    console.error(`[ai-api] API error from ${endpoint}: ${errMsg}`);
    throw new Error(errMsg);
  }

  return json.data;
}

// -- API Functions --

/** A7-01: Quiz Feedback */
export async function fetchQuizFeedback(bundleId: string): Promise<QuizFeedbackData> {
  return aiPost<QuizFeedbackData>('/ai/quiz-feedback', { bundle_id: bundleId });
}

/** A7-02: Flashcard Feedback */
export async function fetchFlashcardFeedback(periodDays = 7): Promise<FlashcardFeedbackData> {
  return aiPost<FlashcardFeedbackData>('/ai/flashcard-feedback', { period_days: periodDays });
}

/** A7-03: Summary Diagnostic */
export async function fetchSummaryDiagnostic(summaryId: string): Promise<SummaryDiagnosticData> {
  return aiPost<SummaryDiagnosticData>('/ai/summary-diagnostic', { summary_id: summaryId });
}

/** A7-04: Learning Profile (cached 24h) */
export async function fetchLearningProfile(): Promise<LearningProfileData> {
  return aiPost<LearningProfileData>('/ai/learning-profile', {});
}

/** A7-05: Learning Profile Regenerate (bypass cache) */
export async function regenerateLearningProfile(): Promise<LearningProfileData> {
  return aiPost<LearningProfileData>('/ai/learning-profile/regenerate', {});
}
