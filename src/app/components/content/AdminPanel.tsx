import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { headingStyle, components } from '@/app/design-system';
import * as api from '@/app/services/studentApi';
import type { StudySummary } from '@/app/types/student';
import clsx from 'clsx';
import {
  LogOut, Shield, FileText, GraduationCap,
  Layers, BookOpen, Settings, LayoutDashboard,
} from 'lucide-react';
import { ResumoCanvas } from './ResumoCanvas';

// Admin sub-modules
import { AdminOverview } from './admin/AdminOverview';
import { AdminResumos } from './admin/AdminResumos';
import { AdminQuizTab, AdminFlashcardsTab, AdminContentTab } from './admin/AdminPlaceholderTab';
import { AdminSettings } from './admin/AdminSettings';

// ══════════════════════════════════════════════════════════
// ADMIN PANEL — Hub central de administracao
//
// Estrutura:
//   Tab 'overview'    → AdminOverview (dashboard admin)
//   Tab 'resumos'     → AdminResumos (CRUD) + ResumoCanvas (editor)
//   Tab 'quiz'        → AdminQuizTab (placeholder)
//   Tab 'flashcards'  → AdminFlashcardsTab (placeholder)
//   Tab 'content'     → AdminContentTab (placeholder)
//   Tab 'settings'    → AdminSettings (sessao, conexoes)
//
// Os componentes AdminBanner (shared) e indicadores no
// Sidebar, StudyView e ResumosView apontam para ca.
// Busque "ADMIN_PLACEHOLDER" para encontrar todos os pontos
// que precisam de migracao para Supabase Auth.
// ══════════════════════════════════════════════════════════

type AdminTab = 'overview' | 'resumos' | 'quiz' | 'flashcards' | 'content' | 'settings';

const TAB_CONFIG: { id: AdminTab; label: string; icon: React.ElementType; shortLabel: string }[] = [
  { id: 'overview', label: 'Visao Geral', icon: LayoutDashboard, shortLabel: 'Geral' },
  { id: 'resumos', label: 'Resumos', icon: FileText, shortLabel: 'Resumos' },
  { id: 'quiz', label: 'Quiz', icon: GraduationCap, shortLabel: 'Quiz' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, shortLabel: 'Flash' },
  { id: 'content', label: 'Conteudo', icon: BookOpen, shortLabel: 'Cont.' },
  { id: 'settings', label: 'Configuracoes', icon: Settings, shortLabel: 'Config' },
];

export function AdminPanel() {
  const { adminLogout } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [summaries, setSummaries] = useState<StudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Canvas sub-view state (only for resumos tab)
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<StudySummary | null>(null);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setSummaries(await api.getAllSummaries()); }
    catch (err: any) { console.error('[Admin] fetch:', err); setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  // ── Resumo handlers ──
  const handleEdit = (s: StudySummary) => { setSelectedSummary(s); setShowCanvas(true); };
  const handleNewSummary = () => { setSelectedSummary(null); setShowCanvas(true); };
  const handleCanvasBack = () => { setShowCanvas(false); setSelectedSummary(null); };

  const handleSaved = (saved: StudySummary) => {
    setSummaries(prev => {
      const idx = prev.findIndex(s => s.courseId === saved.courseId && s.topicId === saved.topicId);
      if (idx >= 0) { const u = [...prev]; u[idx] = saved; return u; }
      return [saved, ...prev];
    });
    setSelectedSummary(null);
    setShowCanvas(false);
  };

  const handleDelete = async (summary: StudySummary) => {
    if (!confirm(`Deletar resumo de "${summary.topicTitle}"?`)) return;
    try {
      await api.deleteSummary(summary.courseId, summary.topicId);
      setSummaries(prev => prev.filter(s => !(s.courseId === summary.courseId && s.topicId === summary.topicId)));
    } catch (err: any) { console.error('[Admin] delete:', err); alert(`Erro: ${err.message}`); }
  };

  const handleToggleBookmark = async (summary: StudySummary) => {
    try {
      const updated = await api.saveSummary(summary.courseId, summary.topicId, { bookmarked: !summary.bookmarked });
      setSummaries(prev => prev.map(s => (s.courseId === updated.courseId && s.topicId === updated.topicId ? updated : s)));
    } catch (err: any) { console.error('[Admin] bookmark:', err); }
  };

  // ── Canvas full-screen (when editing a resumo) ──
  if (showCanvas) {
    return (
      <div className="h-full bg-[#f5f2ea] overflow-hidden">
        <ResumoCanvas
          existing={selectedSummary}
          onSaved={handleSaved}
          onCancel={handleCanvasBack}
          onDelete={selectedSummary ? () => handleDelete(selectedSummary) : undefined}
        />
      </div>
    );
  }

  // ── Tab content ──
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview summaries={summaries} onNavigateTab={setActiveTab} />;
      case 'resumos':
        return (
          <AdminResumos
            summaries={summaries}
            loading={loading}
            error={error}
            onNewSummary={handleNewSummary}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleBookmark={handleToggleBookmark}
            onRetry={fetchSummaries}
          />
        );
      case 'quiz':
        return <AdminQuizTab />;
      case 'flashcards':
        return <AdminFlashcardsTab />;
      case 'content':
        return <AdminContentTab />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  const currentTabConfig = TAB_CONFIG.find(t => t.id === activeTab);

  return (
    <div className="h-full bg-[#f5f2ea] overflow-y-auto">
      <AxonPageHeader
        title="Administrador"
        subtitle={currentTabConfig?.label || 'Painel Admin'}
        statsLeft={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Shield size={12} /> Sessao Admin
            </span>
            <p className="text-gray-500 text-sm">{summaries.length} resumos no banco</p>
          </div>
        }
        actionButton={
          <button
            onClick={adminLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-sm font-medium transition-colors border border-gray-200 hover:border-red-200"
            title="Sair da sessao admin"
          >
            <LogOut size={14} /> Sair
          </button>
        }
      />

      {/* Tab navigation */}
      <div className="px-6 pt-4 pb-0 sticky top-0 z-10 bg-[#f5f2ea]">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide">
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0',
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  )}
                >
                  <Icon size={16} className={isActive ? 'text-teal-500' : 'text-gray-400'} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
          <div className="border-b border-gray-200/60" />
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ADMIN LOGIN GATE
// ADMIN_PLACEHOLDER: Tela de login simples
// ══════════════════════════════════════════════════════════
export function AdminLoginGate() {
  const { adminLogin, setActiveView } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ADMIN_PLACEHOLDER: Login com senha hardcoded
    const success = adminLogin(password);
    if (!success) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="h-full bg-[#f5f2ea] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={clsx(
          'w-full max-w-md bg-white rounded-2xl p-8 shadow-lg border border-gray-100',
          shake && 'animate-[shake_0.5s_ease-in-out]'
        )}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-200/50">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1" style={headingStyle}>
            Area do Administrador
          </h2>
          <p className="text-sm text-gray-500">
            Acesso restrito para gerenciamento de conteudo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha de acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="Digite a senha..."
              className={clsx(
                'w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                error
                  ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400 bg-red-50/50'
                  : 'border-gray-200 focus:ring-teal-500/30 focus:border-teal-400 bg-gray-50'
              )}
              autoFocus
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 mt-1.5 font-medium"
              >
                Senha incorreta. Tente novamente.
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password.trim()}
            className={clsx(
              'w-full py-3 rounded-xl text-sm font-semibold transition-all',
              password.trim()
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-200/50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            Entrar
          </button>
        </form>

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>

        {/* ADMIN_PLACEHOLDER: Dev hint — remover em producao */}
        <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200/60">
          <p className="text-[10px] text-amber-600 font-mono text-center">
            DEV: senha = admin123
          </p>
        </div>
      </motion.div>
    </div>
  );
}
