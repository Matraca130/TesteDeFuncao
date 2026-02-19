// ============================================================
// Axon v4.4 — Route Configuration
// ============================================================
import { createBrowserRouter } from 'react-router';
import { AgentDashboard } from './pages/AgentDashboard';
import { QuizFeedbackView } from './pages/QuizFeedbackView';
import { FlashcardFeedbackView } from './pages/FlashcardFeedbackView';
import { SummaryDiagnostic } from './pages/SummaryDiagnostic';
import { LearningProfilePage } from './pages/LearningProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, Component: AgentDashboard },

      // Routes: Agent 7 — AI Feedback routes
      { path: 'study/quiz-feedback/:bundleId', Component: QuizFeedbackView },
      { path: 'study/flashcard-feedback', Component: FlashcardFeedbackView },
      { path: 'study/summary-diagnostic/:summaryId', Component: SummaryDiagnostic },
      { path: 'study/learning-profile', Component: LearningProfilePage },

      // Catch-all
      { path: '*', Component: NotFoundPage },
    ],
  },
]);