// ============================================================
// Axon v4.4 — Route Configuration
// Uses react-router (NOT react-router-dom)
// ============================================================
import { createBrowserRouter } from 'react-router';

// Layouts
import { RootLayout } from './components/layout/RootLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Guards
import { PostLoginRouter } from './components/guards/PostLoginRouter';
import { RequireGuest } from './components/guards/RequireGuest';
import { RequireAuth } from './components/guards/RequireAuth';

// Legacy admin panel (extracted from old App.tsx monolith)
import LegacyAdminPanel from './pages/LegacyAdminPanel';

// ── Placeholder Factory ────────────────────────────────────
function Placeholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500">
          {subtitle || 'Em construcao — Dev 5 vai implementar esta pagina.'}
        </p>
      </div>
    </div>
  );
}

// ── Page Components (placeholders until Dev 5) ─────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-xl">
          <span className="text-white text-2xl font-black">A</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Axon</h1>
        <p className="text-sm text-gray-500">Plataforma de estudo medico inteligente</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/admin/login"
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors text-center"
        >
          Admin / Owner
        </a>
        <a
          href="/professor/login"
          className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors text-center"
        >
          Professor
        </a>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Alunos: acesse pelo link da sua instituicao (/i/slug)
      </p>
    </div>
  );
}

function AdminLoginPage() {
  return (
    <RequireGuest>
      <Placeholder title="Admin Login" subtitle="Tela de login para administradores" />
    </RequireGuest>
  );
}

function ProfessorLoginPage() {
  return (
    <RequireGuest>
      <Placeholder title="Professor Login" subtitle="Tela de login para professores" />
    </RequireGuest>
  );
}

function InstitutionPublicPage() {
  return <Placeholder title="Pagina da Instituicao" />;
}

function StudentLoginPage() {
  return (
    <RequireGuest>
      <Placeholder title="Student Login" subtitle="Tela de login para alunos" />
    </RequireGuest>
  );
}

function StudentSignupPage() {
  return (
    <RequireGuest>
      <Placeholder title="Student Signup" subtitle="Cadastro de alunos" />
    </RequireGuest>
  );
}

function SelectInstitutionPage() {
  return (
    <RequireAuth>
      <Placeholder title="Selecionar Instituicao" subtitle="Escolha sua instituicao" />
    </RequireAuth>
  );
}

function NoInstitutionPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f2ea] gap-4 p-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-xl font-black">!</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Sem Instituicao</h1>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Voce nao esta vinculado a nenhuma instituicao. Entre em contato com um administrador
          para solicitar acesso.
        </p>
        <a href="/" className="text-sm text-teal-600 hover:underline mt-2">
          Voltar ao inicio
        </a>
      </div>
    </RequireAuth>
  );
}

function ProfessorDashboard() {
  return (
    <RequireAuth>
      <Placeholder title="Professor Dashboard" subtitle="Painel do professor" />
    </RequireAuth>
  );
}

function StudyDashboard() {
  return (
    <RequireAuth>
      <Placeholder title="Area do Aluno" subtitle="Painel de estudo" />
    </RequireAuth>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f2ea] gap-4">
      <h1 className="text-6xl font-black text-gray-300">404</h1>
      <p className="text-lg text-gray-500">Pagina nao encontrada</p>
      <a href="/" className="text-sm text-teal-600 hover:underline">
        Voltar ao inicio
      </a>
    </div>
  );
}

// ── Router Configuration ───────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      // ── Public routes ──
      { index: true, Component: LandingPage },
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
          // Future pages (Dev 5):
          // { path: 'members', Component: MembersPage },
          // { path: 'plans', Component: PlansPage },
          // { path: 'content', Component: ContentPage },
          // { path: 'settings', Component: SettingsPage },
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
