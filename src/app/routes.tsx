// ============================================================
// Axon v4.4 — Route Configuration
// ============================================================
import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/layout/RootLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireGuest } from './components/guards/RequireGuest';
import { RequireAuth } from './components/guards/RequireAuth';
import { PostLoginRouter } from './components/guards/PostLoginRouter';
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProfessorLoginPage } from './pages/ProfessorLoginPage';
import { InstitutionPublicPage } from './pages/InstitutionPublicPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { SelectInstitutionPage } from './pages/SelectInstitutionPage';
import { NoInstitutionPage } from './pages/NoInstitutionPage';
import { NotFoundPage } from './pages/NotFoundPage';
import LegacyAdminPanel from './pages/LegacyAdminPanel';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, element: <RequireGuest><LandingPage /></RequireGuest> },
      { path: 'admin/login', Component: AdminLoginPage },
      { path: 'professor/login', Component: ProfessorLoginPage },
      { path: 'i/:slug', Component: InstitutionPublicPage },
      { path: 'i/:slug/login', Component: StudentLoginPage },
      { path: 'i/:slug/signup', Component: StudentSignupPage },
      { path: 'go', element: <RequireAuth><PostLoginRouter /></RequireAuth> },
      { path: 'select-institution', Component: SelectInstitutionPage },
      { path: 'no-institution', Component: NoInstitutionPage },
      {
        path: 'admin',
        Component: AdminLayout,
        children: [{ index: true, Component: LegacyAdminPanel }],
      },
      {
        path: 'professor',
        Component: AdminLayout,
        children: [{ index: true, Component: LegacyAdminPanel }],
      },
      {
        path: 'study',
        element: (
          <RequireAuth>
            <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center">
              <p className="text-sm text-gray-500">Area do aluno em construcao</p>
            </div>
          </RequireAuth>
        ),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
