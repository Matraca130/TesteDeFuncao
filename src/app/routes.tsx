// ============================================================
// Axon v4.4 — Route Configuration (Dev 5 + Dev 6 Integration)
// Uses react-router (NOT react-router-dom)
// All pages are now real implementations
// Dev 6: Added RequireGuest wrapper for LandingPage
// ============================================================
import { createBrowserRouter } from 'react-router';

// Layouts
import { RootLayout } from './components/layout/RootLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Guards
import { PostLoginRouter } from './components/guards/PostLoginRouter';
import { RequireGuest } from './components/guards/RequireGuest';

// Legacy admin panel (extracted from old App.tsx monolith)
import LegacyAdminPanel from './pages/LegacyAdminPanel';

// ── Real Page Components (Dev 5) ───────────────────────────
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProfessorLoginPage } from './pages/ProfessorLoginPage';
import { InstitutionPublicPage } from './pages/InstitutionPublicPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { SelectInstitutionPage } from './pages/SelectInstitutionPage';
import { NoInstitutionPage } from './pages/NoInstitutionPage';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { StudyDashboard } from './pages/StudyDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

// ── Router Configuration ───────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      // ── Public routes ──
      // FIX Dev 6: LandingPage wrapped with RequireGuest so authenticated users
      // are redirected to /go instead of seeing the role selection.
      // NOTE: AdminLoginPage, ProfessorLoginPage, StudentLoginPage, StudentSignupPage
      // already have RequireGuest at the component level (done by Dev 5).
      { index: true, element: <RequireGuest><LandingPage /></RequireGuest> },
      { path: 'admin/login', Component: AdminLoginPage },
      { path: 'professor/login', Component: ProfessorLoginPage },
      { path: 'i/:slug', Component: InstitutionPublicPage },
      { path: 'i/:slug/login', Component: StudentLoginPage },
      { path: 'i/:slug/signup', Component: StudentSignupPage },

      // ── Post-login router ──
      { path: 'go', Component: PostLoginRouter },

      // ── Admin area (protected by AdminLayout guards) ──
      {
        path: 'admin',
        Component: AdminLayout,
        children: [
          // LegacyAdminPanel is the index for admin routes
          { index: true, Component: LegacyAdminPanel },
        ],
      },

      // ── Professor area ──
      { path: 'professor', Component: ProfessorDashboard },

      // ── Student area ──
      { path: 'study', Component: StudyDashboard },

      // ── Utilities ──
      { path: 'select-institution', Component: SelectInstitutionPage },
      { path: 'no-institution', Component: NoInstitutionPage },

      // ── 404 ──
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
