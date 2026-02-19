import { createBrowserRouter } from 'react-router';
import RootLayout from './components/RootLayout';
import LandingPage from './pages/LandingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ProfessorLoginPage from './pages/ProfessorLoginPage';
import InstitutionPublicPage from './pages/InstitutionPublicPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentSignupPage from './pages/StudentSignupPage';
import SelectInstitutionPage from './pages/SelectInstitutionPage';
import NoInstitutionPage from './pages/NoInstitutionPage';
import PostLoginRouter from './pages/PostLoginRouter';
import DashboardPage from './pages/DashboardPage';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f2ea] gap-4">
      <h1 className="text-6xl font-black text-gray-300">404</h1>
      <p className="text-lg text-gray-500">Pagina nao encontrada</p>
      <a href="/" className="text-sm text-teal-600 hover:underline">Voltar ao inicio</a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      // Public auth pages
      { index: true, Component: LandingPage },
      { path: 'admin/login', Component: AdminLoginPage },
      { path: 'professor/login', Component: ProfessorLoginPage },

      // Institution public pages
      { path: 'i/:slug', Component: InstitutionPublicPage },
      { path: 'i/:slug/login', Component: StudentLoginPage },
      { path: 'i/:slug/signup', Component: StudentSignupPage },

      // Post-auth routing
      { path: 'go', Component: PostLoginRouter },
      { path: 'select-institution', Component: SelectInstitutionPage },
      { path: 'no-institution', Component: NoInstitutionPage },

      // Dashboard (placeholder destination)
      { path: 'dashboard', Component: DashboardPage },

      // 404
      { path: '*', Component: NotFound },
    ],
  },
]);
