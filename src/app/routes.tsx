// ============================================================
// Axon v4.4 — Route Configuration (UNIFIED + AUTH WIRED)
//
// FIX: Previously, all routes were accessible without auth.
// Now: LandingPage is the entry point, protected routes require login.
//
// Layout hierarchy:
//   / → LandingPage (public, role selection)
//   /admin/login → AdminLoginPage (RequireGuest)
//   /professor/login → ProfessorLoginPage (RequireGuest)
//   /i/:slug → InstitutionPublicPage (public)
//   /i/:slug/login → StudentLoginPage (RequireGuest)
//   /i/:slug/signup → StudentSignupPage (RequireGuest)
//   /go → PostLoginRouter (redirects by role)
//   /select-institution → SelectInstitutionPage (RequireAuth)
//   /no-institution → NoInstitutionPage (RequireAuth)
//   /dashboard → RequireAuth → AppNavigation → DashboardHome
//   /admin/* → RequireAuth → AppNavigation → AdminShell
//   /professor/* → RequireAuth → AppNavigation → Professor editors
//   /study/* → RequireAuth → AppNavigation → Student study pages
// ============================================================

import { createBrowserRouter } from 'react-router';

// ── Public pages ─────────────────────────────────────────
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProfessorLoginPage } from './pages/ProfessorLoginPage';
import { InstitutionPublicPage } from './pages/InstitutionPublicPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';

// ── Post-login routing ───────────────────────────────────
import { PostLoginRouter } from './components/guards/PostLoginRouter';
import { SelectInstitutionPage } from './pages/SelectInstitutionPage';
import { NoInstitutionPage } from './pages/NoInstitutionPage';

// ── Auth guard wrapper ───────────────────────────────────
import { RequireAuth } from './components/guards/RequireAuth';

// ── Layout ───────────────────────────────────────────────
import { AppNavigation } from './components/layout/AppNavigation';
import { AdminShell } from './pages/AdminShell';

// ── Admin pages ──────────────────────────────────────────
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionWizard } from './pages/InstitutionWizard';
import { MemberManagement } from './pages/MemberManagement';
import { PlanManagement } from './pages/PlanManagement';
import { AdminScopesPage } from './pages/AdminScopesPage';

// ── Professor pages ──────────────────────────────────────
import { DashboardHome } from './pages/DashboardHome';
import { ProfessorKeywordEditor } from './pages/ProfessorKeywordEditor';
import { ProfessorFlashcardEditor } from './pages/ProfessorFlashcardEditor';
import { ProfessorQuizEditor } from './pages/ProfessorQuizEditor';
import { VideoManager } from './pages/VideoManager';
import { ProfessorContentFlow } from './pages/ProfessorContentFlow';

// ── Student pages ────────────────────────────────────────
import { VideoStudyPage } from './pages/VideoStudyPage';
import { SmartStudyPage } from './pages/SmartStudyPage';
import { StudyPlansPage } from './pages/StudyPlansPage';

// ── Design tokens ────────────────────────────────────────
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

// ── Auth Layout Wrapper ──────────────────────────────────
// Wraps AppNavigation inside RequireAuth so all child routes
// are protected. If not authenticated, redirects to /.
function ProtectedAppLayout() {
  return (
    <RequireAuth>
      <AppNavigation />
    </RequireAuth>
  );
}

// ── Router ───────────────────────────────────────────────
export const router = createBrowserRouter([
  // ════════════════════════════════════════════════════════
  // PUBLIC ROUTES (no auth required)
  // ════════════════════════════════════════════════════════

  // Landing page — first thing users see
  { path: '/', Component: LandingPage },

  // Auth pages (RequireGuest is built into each component)
  { path: 'admin/login', Component: AdminLoginPage },
  { path: 'professor/login', Component: ProfessorLoginPage },

  // Institution public page + student auth
  { path: 'i/:slug', Component: InstitutionPublicPage },
  { path: 'i/:slug/login', Component: StudentLoginPage },
  { path: 'i/:slug/signup', Component: StudentSignupPage },

  // ════════════════════════════════════════════════════════
  // POST-LOGIN ROUTING
  // ════════════════════════════════════════════════════════
  { path: 'go', Component: PostLoginRouter },
  { path: 'select-institution', Component: SelectInstitutionPage },
  { path: 'no-institution', Component: NoInstitutionPage },

  // ════════════════════════════════════════════════════════
  // PROTECTED ROUTES (RequireAuth via ProtectedAppLayout)
  // ════════════════════════════════════════════════════════
  {
    Component: ProtectedAppLayout,
    children: [
      // ── Dashboard Home ──
      { path: 'dashboard', Component: DashboardHome },

      // ── Admin routes ──
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

      // ── Professor routes ──
      { path: 'professor/keywords', Component: ProfessorKeywordEditor },
      { path: 'professor/flashcards', Component: ProfessorFlashcardEditor },
      { path: 'professor/quizzes', Component: ProfessorQuizEditor },
      { path: 'professor/videos', Component: VideoManager },
      { path: 'professor/content-flow', Component: ProfessorContentFlow },

      // ── Student routes ──
      { path: 'study/video/:videoId', Component: VideoStudyPage },
      { path: 'study/smart-study', Component: SmartStudyPage },
      { path: 'study/plans', Component: StudyPlansPage },

      // ── Catch-all inside protected area ──
      { path: '*', Component: NotFound },
    ],
  },
]);
