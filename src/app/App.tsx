import React from 'react';
// @refresh reset
import { AuthProvider } from '@/app/context/AuthContext';
import { AppProvider, useApp } from '@/app/context/AppContext';
import { AdminProvider, useAdmin } from '@/app/context/AdminContext';
import { StudentDataProvider } from '@/app/context/StudentDataContext';
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { LoginPage } from '@/app/components/auth/LoginPage';
import { SignupPage } from '@/app/components/auth/SignupPage';
import { DashboardView } from '@/app/components/content/DashboardView';
import { ResumosView } from '@/app/components/content/ResumosView';
import { StudyView } from '@/app/components/content/StudyView';
import { ThreeDView } from '@/app/components/content/ThreeDView';
import { AdminPanel, AdminLoginGate } from '@/app/components/content/AdminPanel';
import { ContentApprovalList } from '@/app/components/ai/ContentApprovalList';
import { AIGeneratePanel } from '@/app/components/ai/AIGeneratePanel';
import { AIChatPanel } from '@/app/components/ai/AIChatPanel';
import { KeywordPopup } from '@/app/components/ai/KeywordPopup';
import { Sidebar, SidebarToggle } from '@/app/components/shared/Sidebar';
import { AnimatePresence, motion } from 'motion/react';

/**
 * AuthFlow — Shown when user is NOT authenticated.
 * Toggles between Login and Signup screens.
 */
function AuthFlow() {
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');

  if (mode === 'signup') {
    return (
      <SignupPage
        onSwitchToLogin={() => setMode('login')}
        onSignupSuccess={() => {
          // AuthGuard re-renders automatically when isAuthenticated becomes true
        }}
      />
    );
  }

  return (
    <LoginPage
      onSwitchToSignup={() => setMode('signup')}
      onLoginSuccess={() => {
        // AuthGuard re-renders automatically when isAuthenticated becomes true
      }}
    />
  );
}

/**
 * Mapa de vistas por modulo.
 * Cuando Programador B/C entreguen sus modulos, solo hay que:
 * 1. Reemplazar el import del placeholder por el real
 * 2. El resto del routing funciona igual
 */
function ViewRouter() {
  const { activeView } = useApp();
  const { isAdmin } = useAdmin();

  const renderView = () => {
    switch (activeView) {
      case 'study':
        return <StudyView key="study" />;
      case 'resumos':
        return <ResumosView key="resumos" />;
      case 'admin':
        // Admin session is managed by AdminContext (independent module)
        return isAdmin ? <AdminPanel key="admin" /> : <AdminLoginGate key="admin-login" />;
      case 'quiz':
        return (
          <div key="quiz" className="h-full flex items-center justify-center bg-[#f5f2ea] text-gray-400 text-sm">
            Modulo Quiz — em desenvolvimento em outra instancia
          </div>
        );

      // ── Dev 6: AI Views ──
      case 'ai-generate':
        return (
          <div key="ai-generate" className="h-full overflow-y-auto p-6 bg-[#f5f2ea]">
            <AIGeneratePanel />
          </div>
        );
      case 'ai-approval':
        return (
          <div key="ai-approval" className="h-full overflow-y-auto p-6 bg-[#f5f2ea]">
            <ContentApprovalList />
          </div>
        );
      case 'ai-chat':
        return (
          <div key="ai-chat" className="h-full overflow-y-auto bg-[#f5f2ea]">
            <AIChatPanel />
          </div>
        );

      // ── Oleada 3-4: 3D Atlas View ──
      case '3d':
        return <ThreeDView key="3d" />;

      case 'dashboard':
      default:
        return <DashboardView key="dashboard" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeView + (activeView === 'admin' ? (isAdmin ? '-auth' : '-login') : '')}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="h-full w-full min-w-0"
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * AppShell — Main layout (Sidebar + ViewRouter + Global Overlays)
 * Oleada 3-4: Added global KeywordPopup overlay controlled by AppContext
 */
function AppShell() {
  const { kwPopupOpen, kwPopupId, closeKeywordPopup, openKeywordPopup, navigateTo3D } = useApp();

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <Sidebar />
      <SidebarToggle />
      <main className="flex-1 min-w-0 h-full overflow-hidden">
        <ViewRouter />
      </main>

      {/* ── Oleada 3-4: Global Keyword Popup ──
       * Mounted once here, controlled by AppContext.
       * Any component can trigger it via openKeywordPopup(id).
       * Circular navigation: popup → related keyword → popup → 3D → back
       */}
      <AnimatePresence>
        {kwPopupOpen && kwPopupId && (
          <KeywordPopup
            keywordId={kwPopupId}
            onClose={closeKeywordPopup}
            onNavigateToKeyword={(id) => openKeywordPopup(id)}
            onNavigateTo3D={navigateTo3D}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Provider hierarchy:
 *   AuthProvider (Supabase Auth — outermost)
 *     AuthGuard (gates on isAuthenticated, fallback = login/signup)
 *       AppProvider (navigation state, current course, keyword popup, 3D nav)
 *         AdminProvider (reads useAuth for is_super_admin)
 *           StudentDataProvider (FSRS, study data)
 *             AppShell (Sidebar + ViewRouter + global KeywordPopup overlay)
 */
export default function App() {
  return (
    <AuthProvider>
      <AuthGuard fallback={<AuthFlow />}>
        <AppProvider>
          <AdminProvider>
            <StudentDataProvider>
              <AppShell />
            </StudentDataProvider>
          </AdminProvider>
        </AppProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
