// ============================================================
// Axon v4.4 — Route Configuration
// Routes: Agent 5 (FORGE — UI Admin & Owner)
//
// ALIGNMENT with TesteDeFuncao/src/app/routes.tsx:
// - Repo has RootLayout as root, with RequireAuth/RequireGuest guards
// - Repo has AdminLayout at src/app/components/layout/AdminLayout.tsx
//   which wraps: RequireAuth > RequireRole(['owner','admin','professor'])
// - Agent 5 adds sub-routes under /admin/* for new admin pages
// - LegacyAdminPanel remains untouched at /admin (index)
//
// ── REPO MERGE GUIDE ─────────────────────────────────────
//
// In TesteDeFuncao/src/app/routes.tsx, the /admin block currently is:
//
//   {
//     path: 'admin',
//     Component: AdminLayout,     // RequireAuth + RequireRole guard
//     children: [
//       { index: true, Component: LegacyAdminPanel },
//     ],
//   },
//
// Agent 5 changes it to:
//
//   {
//     path: 'admin',
//     Component: AdminLayout,     // Keep guard wrapper
//     children: [
//       { index: true, Component: LegacyAdminPanel },  // KEEP
//       // Routes: Agent 5 (FORGE — UI Admin & Owner)
//       { path: 'dashboard', Component: AdminDashboard },
//       { path: 'wizard',    Component: InstitutionWizard },
//       { path: 'members',   Component: MemberManagement },
//       { path: 'plans',     Component: PlanManagement },
//       { path: 'scopes',    Component: AdminScopesPage },
//     ],
//   },
//
// AdminShell (sidebar) is used as a layout wrapper for Agent 5
// pages only. It can be nested inside AdminLayout's Outlet, or
// the sidebar can be merged into the repo's existing AppShell.
// ============================================================

import { createBrowserRouter } from 'react-router';
import { AdminShell } from './pages/AdminShell';
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionWizard } from './pages/InstitutionWizard';
import { MemberManagement } from './pages/MemberManagement';
import { PlanManagement } from './pages/PlanManagement';
import { AdminScopesPage } from './pages/AdminScopesPage';
import { headingStyle, bodyStyle } from './lib/design-tokens';

// ── Placeholder: In repo, this comes from components/layout/RootLayout.tsx
// In Figma Make, AdminShell handles the layout directly
function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-teal-500" style={headingStyle}>
          404
        </h1>
        <p className="mt-2 text-zinc-500" style={bodyStyle}>
          Pagina nao encontrada
        </p>
      </div>
    </div>
  );
}
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
    // In repo: path '/' with RootLayout, children include all routes
    // Here: AdminShell provides sidebar + content area for admin pages
    path: '/',
    Component: AdminShell,
    children: [
      // Routes: Agent 5 — Admin sub-routes
      // In repo these go under path: 'admin', Component: AdminLayout (guard)
      { index: true, Component: AdminDashboard },
      { path: 'admin', Component: AdminDashboard },
      { path: 'admin/wizard', Component: InstitutionWizard },
      { path: 'admin/members', Component: MemberManagement },
      { path: 'admin/plans', Component: PlanManagement },
      { path: 'admin/scopes', Component: AdminScopesPage },
      // In repo: { index: true, Component: LegacyAdminPanel } stays as /admin index
      // Agent 5 pages are COMPLEMENTARY sub-routes, not replacements
    ],
  },
  { path: '*', Component: NotFound },
]);
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
