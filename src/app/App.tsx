import React, { useState } from 'react';
// @refresh reset

// ═══ Contexts (order matters: Auth outermost, then App, Admin) ═══
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { AppProvider, useApp } from '@/app/context/AppContext';
import { AdminProvider, useAdmin } from '@/app/context/AdminContext';
import { ApiProvider } from '@/app/lib/api-provider';

// ═══ Auth components ═══
import { AuthGuard } from '@/app/components/auth/AuthGuard';
import { LoginPage } from '@/app/components/auth/LoginPage';
import { SignupPage } from '@/app/components/auth/SignupPage';

// ═══ Layout ═══
import { Sidebar, SidebarToggle } from '@/app/components/shared/Sidebar';

// ═══ Content views ═══
import { DashboardView } from '@/app/components/content/DashboardView';
import { AdminPanel, AdminLoginGate } from '@/app/components/content/AdminPanel';
import { PlaceholderView } from '@/app/components/content/PlaceholderView';
import { ThreeDView } from '@/app/components/content/ThreeDView';

// ═══ AI views (Dev 6) ═══
import { ContentApprovalList } from '@/app/components/ai/ContentApprovalList';
import { AIChatPanel } from '@/app/components/ai/AIChatPanel';
import { AIGeneratePanel } from '@/app/components/ai/AIGeneratePanel';
import { KeywordPopup } from '@/app/components/ai/KeywordPopup';
import { BatchVerifier } from '@/app/components/content/BatchVerifier';

import { Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// ════════════════════════════════════════════════════════════════
// AXON v4.4 — Full Integrated App
//
// Architecture (v4.4 — Provider hierarchy fixed):
//   AuthProvider (outermost — manages Supabase Auth)
//     └─ ApiProvider (typed API client, reads token from auth)
//         └─ AuthGuard (login gate — blocks until authenticated)
//             └─ AppProvider (navigation, course selection, keyword popup, 3D nav)
//                 └─ AdminProvider (admin session, reads roles from AuthContext)
//                     └─ Sidebar + ViewRouter + KeywordPopup (global overlay)
//
// Navigation flow (Dev 6 — Oleada 3-4):
//   Keyword in text → click → KeywordPopup (overlay, any view)
//   KeywordPopup → "Ver en 3D" → close popup → navigate to ThreeDView
//   ThreeDView → click annotation → KeywordPopup (over ThreeDView)
//   KeywordPopup → click related keyword → popup refreshes (same component)
// ════════════════════════════════════════════════════════════════

/**
 * ViewRouter — Maps activeView to the correct component.
 * When other devs' modules are integrated, replace PlaceholderView
 * with their real components.
 */
function ViewRouter() {
  const { activeView, selectedModelId, openKeywordPopup, returnFrom3D } = useApp();
  const { isAdmin } = useAdmin();

  const renderView = () => {
    switch (activeView) {
      // ── Core modules (Devs 1-5: placeholders until integrated) ──
      case 'study':
      case 'resumos':
      case 'quiz':
      case 'flashcards':
      case 'schedule':
      case 'student-data':
        return <PlaceholderView key={activeView} viewId={activeView} />;

      // ── 3D Viewer (Dev 6 — Oleada 3-4) ──
      case '3d':
        return (
          <ThreeDView
            key="3d"
            selectedModelId={selectedModelId}
            onReturnFrom3D={returnFrom3D}
            onAnnotationClick={(kwId) => openKeywordPopup(kwId)}
          />
        );

      // ── Admin (integrated with AuthContext) ──
      case 'admin':
        return isAdmin
          ? <AdminPanel key="admin" />
          : <AdminLoginGate key="admin-login" />;

      // ── AI Generate (Dev 6) ──
      case 'ai-generate':
        return (
          <div key="ai-generate" className="h-full overflow-y-auto bg-[#f5f2ea]">
            <div className="max-w-4xl mx-auto p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-2">Gerar Conteudo com IA</h1>
              <p className="text-sm text-gray-500 mb-6">
                Cole o texto de um resumo e a Gemini AI gerara keywords, sub-topicos, flashcards e quiz automaticamente.
                O conteudo gerado fica como rascunho ate ser aprovado por um professor (D20).
              </p>
              <AIGeneratePanel />
            </div>
          </div>
        );

      // ── AI Chat (Dev 6) ──
      case 'ai-chat':
        return (
          <div key="ai-chat" className="h-full bg-[#f5f2ea] flex flex-col">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-6 min-h-0">
              <h1 className="text-xl font-bold text-gray-900 mb-4">Chat com Axon AI</h1>
              <div className="flex-1 min-h-0">
                <AIChatPanel />
              </div>
            </div>
          </div>
        );

      // ── AI Approval Queue (Dev 6) ──
      case 'ai-approval':
        return (
          <div key="ai-approval" className="h-full overflow-y-auto bg-[#f5f2ea]">
            <div className="max-w-4xl mx-auto p-6">
              <ContentApprovalList />
            </div>
          </div>
        );

      // ── Batch Endpoint Verifier ──
      case 'batch-verify':
        return <BatchVerifier key="batch-verify" />;

      // ── Dashboard (default) ──
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
 * AppShell — Main layout with Sidebar + ViewRouter + Global KeywordPopup overlay.
 * Only renders when user is authenticated.
 *
 * KeywordPopup is mounted HERE (not inside ViewRouter) so it overlays
 * ANY view including ThreeDView. This is the SINGLE mount point.
 */
function AppShell() {
  const {
    kwPopupOpen, kwPopupId,
    openKeywordPopup, closeKeywordPopup,
    navigateTo3D,
  } = useApp();

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <Sidebar />
      <SidebarToggle />
      <main className="flex-1 min-w-0 h-full overflow-hidden">
        <ViewRouter />
      </main>

      {/* Global KeywordPopup overlay — accessible from ANY view */}
      <AnimatePresence>
        {kwPopupOpen && kwPopupId && (
          <KeywordPopup
            keywordId={kwPopupId}
            onClose={closeKeywordPopup}
            onNavigateToKeyword={(id) => openKeywordPopup(id)}
            onNavigateTo3D={(modelId) => {
              closeKeywordPopup();
              navigateTo3D(modelId);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * AuthGateRouter — Shows login/signup when not authenticated.
 */
function AuthGateRouter() {
  const [authView, setAuthView] = useState<'login' | 'signup' | 'batch-verify'>('login');

  if (authView === 'batch-verify') {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-white text-sm font-semibold">Axon Dev Tools</span>
          <button
            onClick={() => setAuthView('login')}
            className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition"
          >
            Back to Login
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <BatchVerifier />
        </div>
      </div>
    );
  }

  if (authView === 'signup') {
    return (
      <SignupPage
        onSwitchToLogin={() => setAuthView('login')}
        onSignupSuccess={() => {/* AuthContext updates → AuthGuard re-renders */}}
      />
    );
  }

  return (
    <div className="relative">
      <LoginPage
        onSwitchToSignup={() => setAuthView('signup')}
        onLoginSuccess={() => {/* AuthContext updates → AuthGuard re-renders */}}
      />
      <button
        onClick={() => setAuthView('batch-verify')}
        className="fixed bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-lg transition-colors z-50"
      >
        <Zap size={12} />
        Batch Verify Endpoints
      </button>
    </div>
  );
}

/**
 * Root component — Provider hierarchy (v4.4):
 *   AuthProvider → ApiProvider → AuthGuard → AppProvider → AdminProvider → AppShell
 *
 * ApiProvider is AFTER AuthProvider so useAuth can feed tokens into useApi.
 * AuthGuard gates BEFORE AppProvider — no nav state until authenticated.
 */
export default function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <AuthGuard fallback={<AuthGateRouter />}>
          <AppProvider>
            <AdminProvider>
              <AppShell />
            </AdminProvider>
          </AppProvider>
        </AuthGuard>
      </ApiProvider>
    </AuthProvider>
  );
}