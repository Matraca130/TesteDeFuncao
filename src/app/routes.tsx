// ============================================================
// Axon v4.4 — Route Configuration (UNIFIED + AUTH WIRED)
//
// UPDATED: Added /admin/students route for AdminStudentManagement
//
// Owner and Admin are SEPARATE areas:
//   /owner  -> OwnerDashboard (sees all their institutions)
//   /admin  -> AdminShell (manages one specific institution)
// ============================================================

import { createBrowserRouter } from 'react-router';

// -- Public pages (full-screen, no sidebar) --
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProfessorLoginPage } from './pages/ProfessorLoginPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { InstitutionPublicPage } from './pages/InstitutionPublicPage';
import { SelectInstitutionPage } from './pages/SelectInstitutionPage';
import { NoInstitutionPage } from './pages/NoInstitutionPage';

// -- Owner area (full-screen, no sidebar) --
import { OwnerDashboard } from './pages/OwnerDashboard';

// -- Auth routing --
import { PostLoginRouter } from './components/guards/PostLoginRouter';

// -- Layout components --
import { AppNavigation } from './components/layout/AppNavigation';
import { AdminShell } from './pages/AdminShell';

// -- Agent 5 — Admin pages --
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionWizard } from './pages/InstitutionWizard';
import { MemberManagement } from './pages/MemberManagement';
import { PlanManagement } from './pages/PlanManagement';
import { AdminScopesPage } from './pages/AdminScopesPage';
import { AdminStudentManagement } from './pages/AdminStudentManagement';

// -- Agent 6 — Professor pages --
import { DashboardHome } from './pages/DashboardHome';
import { ProfessorKeywordEditor } from './pages/ProfessorKeywordEditor';
import { ProfessorFlashcardEditor } from './pages/ProfessorFlashcardEditor';
import { ProfessorQuizEditor } from './pages/ProfessorQuizEditor';
import { VideoManager } from './pages/VideoManager';
import { ProfessorContentFlow } from './pages/ProfessorContentFlow';

// -- Agent 6 — Student pages --
import { VideoStudyPage } from './pages/VideoStudyPage';
import { SmartStudyPage } from './pages/SmartStudyPage';
import { StudyPlansPage } from './pages/StudyPlansPage';

// -- Design tokens --
import { headingStyle, bodyStyle } from './lib/design-tokens';

// -- 404 Page --
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

// -- Router --
export const router = createBrowserRouter([
  // ============================================================
  // PUBLIC ROUTES — Full-screen, no sidebar, no auth required
  // ============================================================

  // Landing page
  { path: '/', Component: LandingPage },

  // Auth: login pages
  { path: '/admin/login', Component: AdminLoginPage },
  { path: '/professor/login', Component: ProfessorLoginPage },
  { path: '/i/:slug', Component: InstitutionPublicPage },
  { path: '/i/:slug/login', Component: StudentLoginPage },
  { path: '/i/:slug/signup', Component: StudentSignupPage },

  // Post-login router — redirects by role:
  //   owner -> /owner
  //   admin -> /admin
  //   professor -> /professor
  //   student -> /study
  { path: '/go', Component: PostLoginRouter },

  // Auth: institution selection
  { path: '/select-institution', Component: SelectInstitutionPage },
  { path: '/no-institution', Component: NoInstitutionPage },

  // ============================================================
  // OWNER AREA — Full-screen, no sidebar
  // ============================================================
  { path: '/owner', Component: OwnerDashboard },

  // ============================================================
  // APP ROUTES — With AppNavigation sidebar layout
  // ============================================================

  // Dashboard (generic home after login)
  {
    path: '/dashboard',
    Component: AppNavigation,
    children: [
      { index: true, Component: DashboardHome },
    ],
  },

  // Admin routes — getRouteForRole('admin') -> '/admin'
  // Owner can also arrive here after selecting an institution from /owner
  {
    path: '/admin',
    Component: AppNavigation,
    children: [
      {
        Component: AdminShell,
        children: [
          { index: true, Component: AdminDashboard },
          { path: 'students', Component: AdminStudentManagement },
          { path: 'wizard', Component: InstitutionWizard },
          { path: 'members', Component: MemberManagement },
          { path: 'plans', Component: PlanManagement },
          { path: 'scopes', Component: AdminScopesPage },
        ],
      },
    ],
  },

  // Professor routes
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

  // Student/Study routes
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

  // Catch-all
  { path: '*', Component: NotFound },
]);
