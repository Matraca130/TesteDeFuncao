// ============================================================
// Axon v4.4 — Route Configuration (UNIFIED)
// Merges Agent 5 (FORGE — Admin) + Agent 6 (PRISM — Professor/Student)
// into a SINGLE createBrowserRouter.
//
// Layout hierarchy:
//   / → AppNavigation (main sidebar + top bar)
//     ├── index → DashboardHome
//     ├── admin/* → AdminShell (admin sidebar layout)
//     │   ├── index → AdminDashboard
//     │   ├── wizard → InstitutionWizard
//     │   ├── members → MemberManagement
//     │   ├── plans → PlanManagement
//     │   └── scopes → AdminScopesPage
//     ├── professor/* → Professor editors
//     │   ├── keywords → ProfessorKeywordEditor
//     │   ├── flashcards → ProfessorFlashcardEditor
//     │   ├── quizzes → ProfessorQuizEditor
//     │   ├── videos → VideoManager
//     │   └── content-flow → ProfessorContentFlow
//     └── study/* → Student study pages
//         ├── video/:videoId → VideoStudyPage
//         ├── smart-study → SmartStudyPage
//         └── plans → StudyPlansPage
// ============================================================

import { createBrowserRouter } from 'react-router';

// Layout components
import { AppNavigation } from './components/layout/AppNavigation';
import { AdminShell } from './pages/AdminShell';

// Agent 5 — Admin pages
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionWizard } from './pages/InstitutionWizard';
import { MemberManagement } from './pages/MemberManagement';
import { PlanManagement } from './pages/PlanManagement';
import { AdminScopesPage } from './pages/AdminScopesPage';

// Agent 6 — Professor pages
import { DashboardHome } from './pages/DashboardHome';
import { ProfessorKeywordEditor } from './pages/ProfessorKeywordEditor';
import { ProfessorFlashcardEditor } from './pages/ProfessorFlashcardEditor';
import { ProfessorQuizEditor } from './pages/ProfessorQuizEditor';
import { VideoManager } from './pages/VideoManager';
import { ProfessorContentFlow } from './pages/ProfessorContentFlow';

// Agent 6 — Student pages
import { VideoStudyPage } from './pages/VideoStudyPage';
import { SmartStudyPage } from './pages/SmartStudyPage';
import { StudyPlansPage } from './pages/StudyPlansPage';

// Design tokens
import { headingStyle, bodyStyle } from './lib/design-tokens';

// ── 404 Page ─────────────────────────────────────────────
function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-teal-300" style={headingStyle}>
          404
        </h1>
        <p className="mt-2 text-zinc-500" style={bodyStyle}>
          Pagina nao encontrada
        </p>
        <p className="text-zinc-400 mt-1" style={{ ...bodyStyle, fontSize: '0.875rem' }}>
          A pagina que procura nao existe ou foi removida
        </p>
      </div>
    </div>
  );
}

// ── Router ───────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppNavigation,
    children: [
      // ── Home ──
      { index: true, Component: DashboardHome },

      // ── Routes: Agent 5 (FORGE — Admin & Owner) ──
      // AdminShell provides the admin sidebar navigation
      {
        path: 'admin',
        Component: AdminShell,
        children: [
          { index: true, Component: AdminDashboard },
          { path: 'wizard', Component: InstitutionWizard },
          { path: 'members', Component: MemberManagement },
          { path: 'plans', Component: PlanManagement },
          { path: 'scopes', Component: AdminScopesPage },
        ],
      },

      // ── Routes: Agent 6 (PRISM — Professor) ──
      { path: 'professor/keywords', Component: ProfessorKeywordEditor },
      { path: 'professor/flashcards', Component: ProfessorFlashcardEditor },
      { path: 'professor/quizzes', Component: ProfessorQuizEditor },
      { path: 'professor/videos', Component: VideoManager },
      { path: 'professor/content-flow', Component: ProfessorContentFlow },

      // ── Routes: Agent 6 (PRISM — Student) ──
      { path: 'study/video/:videoId', Component: VideoStudyPage },
      { path: 'study/smart-study', Component: SmartStudyPage },
      { path: 'study/plans', Component: StudyPlansPage },

      // ── Catch-all ──
      { path: '*', Component: NotFound },
    ],
  },
]);
