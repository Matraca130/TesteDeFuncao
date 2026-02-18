// ============================================================
// Axon v4.4 — ViewRouter
// Maps activeView to the correct component.
// Extracted from App.tsx for modularity.
// ============================================================

import React from 'react';
import { useApp } from '@/app/context/AppContext';
import { useAdmin } from '@/app/context/AdminContext';
import { AnimatePresence, motion } from 'motion/react';

// ── Content views ──
import { DashboardView } from '@/app/components/content/DashboardView';
import { AdminPanel, AdminLoginGate } from '@/app/components/content/AdminPanel';
import { PlaceholderView } from '@/app/components/content/PlaceholderView';
import { ThreeDView } from '@/app/components/content/ThreeDView';

// ── AI views (Dev 6) ──
import { ContentApprovalList } from '@/app/components/ai/ContentApprovalList';
import { AIChatPanel } from '@/app/components/ai/AIChatPanel';
import { AIGeneratePanel } from '@/app/components/ai/AIGeneratePanel';
import { BatchVerifier } from '@/app/components/content/BatchVerifier';

// ── Layout ──
import { ContentLayout } from './ContentLayout';

/**
 * ViewRouter — Maps activeView to the correct component.
 * When other devs' modules are integrated, replace PlaceholderView
 * with their real components.
 */
export function ViewRouter() {
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
          <ContentLayout key="ai-generate">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Gerar Conteudo com IA</h1>
            <p className="text-sm text-gray-500 mb-6">
              Cole o texto de um resumo e a Gemini AI gerara keywords, sub-topicos, flashcards e quiz automaticamente.
              O conteudo gerado fica como rascunho ate ser aprovado por um professor (D20).
            </p>
            <AIGeneratePanel />
          </ContentLayout>
        );

      // ── AI Chat (Dev 6) ──
      case 'ai-chat':
        return (
          <ContentLayout key="ai-chat" maxWidth="2xl" flex>
            <h1 className="text-xl font-bold text-gray-900 mb-4">Chat com Axon AI</h1>
            <div className="flex-1 min-h-0">
              <AIChatPanel />
            </div>
          </ContentLayout>
        );

      // ── AI Approval Queue (Dev 6) ──
      case 'ai-approval':
        return (
          <ContentLayout key="ai-approval">
            <ContentApprovalList />
          </ContentLayout>
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