// ============================================================
// Axon v4.4 — Route Configuration (UNIFIED + AUTH WIRED)
//
// BEFORE: All routes were unprotected under AppNavigation.
//         LandingPage, login pages, and guards existed as dead code.
//
// NOW:    LandingPage is the entry point at /.
//         Auth pages are connected as public routes.
//         App routes (admin, professor, study) keep their paths
//         and are rendered with AppNavigation layout.
//
// Route specificity (React Router v7):
//   /admin/login     → AdminLoginPage     (static, higher priority)
//   /admin           → AppNavigation+Shell (layout, lower priority)
//   /professor/login → ProfessorLoginPage  (static, higher priority)
//   /professor/*     → AppNavigation+pages (layout, lower priority)
// ============================================================

import { createBrowserRouter } from 'react-router';

// ── Public pages (full-screen, no sidebar) ──
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProfessorLoginPage } from './pages/ProfessorLoginPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { InstitutionPublicPage } from './pages/InstitutionPublicPage';
import { SelectInstitutionPage } from './pages/SelectInstitutionPage';
import { NoInstitutionPage } from './pages/NoInstitutionPage';

// ── Auth routing ──
import { PostLoginRouter } from './components/guards/PostLoginRouter';

// ── Layout components ──
import { AppNavigation } from './components/layout/AppNavigation';
import { AdminShell } from './pages/AdminShell';

// ── Agent 5 — Admin pages ──
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionWizard } from './pages/InstitutionWizard';
import { MemberManagement } from './pages/MemberManagement';
import { PlanManagement } from './pages/PlanManagement';
import { AdminScopesPage } from './pages/AdminScopesPage';

// ── Agent 6 — Professor pages ──
import { DashboardHome } from './pages/DashboardHome';
import { ProfessorKeywordEditor } from './pages/ProfessorKeywordEditor';
import { ProfessorFlashcardEditor } from './pages/ProfessorFlashcardEditor';
import { ProfessorQuizEditor } from './pages/ProfessorQuizEditor';
import { VideoManager } from './pages/VideoManager';
import { ProfessorContentFlow } from './pages/ProfessorContentFlow';

// ── Agent 6 — Student pages ──
import { VideoStudyPage } from './pages/VideoStudyPage';
import { SmartStudyPage } from './pages/SmartStudyPage';
import { StudyPlansPage } from './pages/StudyPlansPage';

// ── Design tokens ──
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
  // ============================================================
  // PUBLIC ROUTES — Full-screen, no sidebar, no auth required
  // ============================================================

  // Landing page — FIRST thing user sees
  { path: '/', Component: LandingPage },

  // Auth: login pages (each wraps itself with RequireGuest)
  { path: '/admin/login', Component: AdminLoginPage },
  { path: '/professor/login', Component: ProfessorLoginPage },
  { path: '/i/:slug', Component: InstitutionPublicPage },
  { path: '/i/:slug/login', Component: StudentLoginPage },
  { path: '/i/:slug/signup', Component: StudentSignupPage },

  // Post-login router — redirects by role to /admin, /professor, /study
  { path: '/go', Component: PostLoginRouter },

  // Auth: institution selection (wraps itself with RequireAuth)
  { path: '/select-institution', Component: SelectInstitutionPage },
  { path: '/no-institution', Component: NoInstitutionPage },

  // ============================================================
  // APP ROUTES — With AppNavigation sidebar layout
  // These paths match what getRouteForRole() returns.
  // React Router specificity ensures /admin/login (static) matches
  // BEFORE /admin (layout) — no conflict.
  // ============================================================

  // Dashboard (generic home after login)
  {
    path: '/dashboard',
    Component: AppNavigation,
    children: [
      { index: true, Component: DashboardHome },
    ],
  },

  // Admin routes — getRouteForRole('owner'|'admin') → '/admin'
  {
    path: '/admin',
    Component: AppNavigation,
    children: [
      {
        Component: AdminShell,
        children: [
          { index: true, Component: AdminDashboard },
          { path: 'wizard', Component: InstitutionWizard },
          { path: 'members', Component: MemberManagement },
          { path: 'plans', Component: PlanManagement },
          { path: 'scopes', Component: AdminScopesPage },
        ],
      },
    ],
  },

  // Professor routes — getRouteForRole('professor') → '/professor'
  {
    path: '/professor',
    Component: AppNavigation,
    children: [
      { index: true, Component: DashboardHome },
      { path: 'keywords', Component: ProfessorKeywordEditor },
      { path: 'flashcards', Component: ProfessorFlashcardEditor },
      { path: 'quizzes', Component: ProfessorQuizEditor },
      { path: 'videos', Component: VideoManager },
      { path: 'content-flow', Component: ProfessorContentFlow },
    ],
  },

  // Student/Study routes — getRouteForRole('student') → '/study'
  {
    path: '/study',
    Component: AppNavigation,
    children: [
      { index: true, Component: SmartStudyPage },
      { path: 'video/:videoId', Component: VideoStudyPage },
      { path: 'smart-study', Component: SmartStudyPage },
      { path: 'plans', Component: StudyPlansPage },
    ],
  },

  // ── Catch-all ──
  { path: '*', Component: NotFound },
]);
