// ============================================================
// Axon v4.4 — Route Configuration
// ============================================================
import { createBrowserRouter } from 'react-router';
import { AppNavigation } from './components/layout/AppNavigation';
import { DashboardHome } from './pages/DashboardHome';
import { ProfessorKeywordEditor } from './pages/ProfessorKeywordEditor';
import { ProfessorFlashcardEditor } from './pages/ProfessorFlashcardEditor';
import { ProfessorQuizEditor } from './pages/ProfessorQuizEditor';
import { VideoManager } from './pages/VideoManager';
import { ProfessorContentFlow } from './pages/ProfessorContentFlow';
import { VideoStudyPage } from './pages/VideoStudyPage';
import { SmartStudyPage } from './pages/SmartStudyPage';
import { StudyPlansPage } from './pages/StudyPlansPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppNavigation,
    children: [
      { index: true, Component: DashboardHome },

      // Routes: Agent 6 — Professor
      { path: 'professor/keywords', Component: ProfessorKeywordEditor },
      { path: 'professor/flashcards', Component: ProfessorFlashcardEditor },
      { path: 'professor/quizzes', Component: ProfessorQuizEditor },
      { path: 'professor/videos', Component: VideoManager },
      { path: 'professor/content-flow', Component: ProfessorContentFlow },

      // Routes: Agent 6 — Student
      { path: 'study/video/:videoId', Component: VideoStudyPage },
      { path: 'study/smart-study', Component: SmartStudyPage },
      { path: 'study/plans', Component: StudyPlansPage },

      // Catch-all
      { path: '*', element: (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-teal-300" style={{ fontSize: '5rem', fontFamily: "'Georgia', serif", fontWeight: 400, lineHeight: 1 }}>404</p>
            <p className="text-gray-500 mt-3" style={{ fontFamily: "'Inter', sans-serif" }}>Pagina nao encontrada</p>
            <p className="text-gray-400 mt-1" style={{ fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>
              A pagina que procura nao existe ou foi removida
            </p>
          </div>
        </div>
      )},
    ],
  },
]);