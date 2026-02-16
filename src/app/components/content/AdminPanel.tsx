import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { headingStyle, colors, components } from '@/app/design-system';
import * as api from '@/app/services/studentApi';
import { courses } from '@/app/data/courses';
import type { StudySummary } from '@/app/types/student';
import clsx from 'clsx';
import {
  Search, Plus, Clock, Tag, Bookmark, BookmarkCheck,
  Edit3, Trash2, FileText, Loader2,
  AlertCircle, ChevronRight, LogOut, Shield,
} from 'lucide-react';
import { ResumoCanvas } from './ResumoCanvas';

// ══════════════════════════════════════════════
// ADMIN PANEL — Gerenciamento de Resumos
// Contém toda a funcionalidade de CRUD que antes
// estava no ResumosView (criar, editar, deletar).
// ══════════════════════════════════════════════

type SortMode = 'recent' | 'oldest' | 'alpha' | 'bookmarked';
type AdminSubView = 'list' | 'canvas';

const CARD = 'bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100';
const CARD_SM = 'bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-all';

export function AdminPanel() {
  const { currentCourse, isAdmin, adminLogout } = useApp();

  const [summaries, setSummaries] = useState<StudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subView, setSubView] = useState<AdminSubView>('list');
  const [selectedSummary, setSelectedSummary] = useState<StudySummary | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setSummaries(await api.getAllSummaries()); }
    catch (err: any) { console.error('[Admin] fetch:', err); setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  // Handlers
  const handleEdit = (s: StudySummary) => { setSelectedSummary(s); setSubView('canvas'); };
  const handleNewSummary = () => { setSelectedSummary(null); setSubView('canvas'); };
  const handleBack = () => { setSubView('list'); setSelectedSummary(null); };

  const handleSaved = (saved: StudySummary) => {
    setSummaries(prev => {
      const idx = prev.findIndex(s => s.courseId === saved.courseId && s.topicId === saved.topicId);
      if (idx >= 0) { const u = [...prev]; u[idx] = saved; return u; }
      return [saved, ...prev];
    });
    setSelectedSummary(null);
    setSubView('list');
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

  // Filter & sort
  const filtered = summaries
    .filter(s => {
      if (filterCourse !== 'all' && s.courseId !== filterCourse) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.topicTitle?.toLowerCase().includes(q) || s.courseName?.toLowerCase().includes(q) || s.content?.toLowerCase().includes(q) || s.tags?.some(t => t.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case 'recent': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'alpha': return (a.topicTitle || '').localeCompare(b.topicTitle || '');
        case 'bookmarked': return (b.bookmarked ? 1 : 0) - (a.bookmarked ? 1 : 0);
        default: return 0;
      }
    });

  const totalSummaries = summaries.length;

  return (
    <div className={clsx('h-full bg-[#f5f2ea]', subView === 'canvas' ? 'overflow-hidden' : 'overflow-y-auto')}>
      {subView !== 'canvas' && (
        <AxonPageHeader
          title="Administrador"
          subtitle="Gerenciamento de Resumos"
          onBack={subView !== 'list' ? handleBack : undefined}
          backLabel="Voltar"
          statsLeft={
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Shield size={12} /> Sessao Admin
              </span>
              <p className="text-gray-500 text-sm">{totalSummaries} resumos no banco</p>
            </div>
          }
          actionButton={
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewSummary}
                className={`${components.buttonPrimary.base} ${components.buttonPrimary.sizes.md} flex items-center gap-2`}
              >
                <Plus size={16} /> Novo Resumo
              </button>
              <button
                onClick={adminLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-sm font-medium transition-colors border border-gray-200 hover:border-red-200"
                title="Sair da sessao admin"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          }
        />
      )}

      {subView === 'canvas' ? (
        <div className="h-full">
          <ResumoCanvas
            existing={selectedSummary}
            onSaved={handleSaved}
            onCancel={handleBack}
            onDelete={selectedSummary ? () => handleDelete(selectedSummary) : undefined}
          />
        </div>
      ) : (
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Toolbar */}
            <div className={CARD}>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar resumos..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                  />
                </div>
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200/60 shrink-0">
                  {[{ v: 'all', l: 'Todas' }, ...courses.map(c => ({ v: c.id, l: c.name }))].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setFilterCourse(opt.v)}
                      className={clsx('px-4 py-2 text-sm font-medium rounded-md transition-all', filterCourse === opt.v ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200/60 shrink-0">
                  {([['recent', 'Recentes'], ['alpha', 'A-Z'], ['bookmarked', 'Favoritos']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setSortMode(val)}
                      className={clsx('px-3 py-2 text-sm font-medium rounded-md transition-all', sortMode === val ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                <span className="ml-3 text-gray-500 text-sm">Carregando resumos...</span>
              </div>
            )}

            {error && (
              <div className={`${CARD} text-center`}>
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-red-700 text-sm font-medium mb-1">Erro ao carregar</p>
                <p className="text-red-500 text-xs mb-4">{error}</p>
                <button onClick={fetchSummaries} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors">
                  Tentar novamente
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className={`${CARD} flex flex-col items-center py-16`}>
                <div className="p-3 rounded-xl bg-teal-50 mb-4"><FileText className="w-7 h-7 text-teal-500" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1" style={headingStyle}>Nenhum resumo encontrado</h3>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                  {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Comece criando o primeiro resumo'}
                </p>
                {!searchQuery && (
                  <button onClick={handleNewSummary} className={`${components.buttonPrimary.base} ${components.buttonPrimary.sizes.md} flex items-center gap-2`}>
                    <Plus size={16} /> Criar primeiro resumo
                  </button>
                )}
              </div>
            )}

            {/* Summary cards with admin actions */}
            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-3">
                {filtered.map((summary, idx) => (
                  <motion.div
                    key={`${summary.courseId}-${summary.topicId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <AdminSummaryRow
                      summary={summary}
                      onEdit={() => handleEdit(summary)}
                      onDelete={() => handleDelete(summary)}
                      onToggleBookmark={() => handleToggleBookmark(summary)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// ADMIN LOGIN GATE
// ADMIN_PLACEHOLDER: Tela de login simples
// ══════════════════════════════════════════════
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

        {/* ADMIN_PLACEHOLDER: Dev hint — remover em produção */}
        <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200/60">
          <p className="text-[10px] text-amber-600 font-mono text-center">
            DEV: senha = admin123
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ADMIN SUMMARY ROW — Card com ações de admin
// ══════════════════════════════════════════════
function AdminSummaryRow({ summary, onEdit, onDelete, onToggleBookmark }: {
  summary: StudySummary; onEdit: () => void; onDelete: () => void; onToggleBookmark: () => void;
}) {
  const preview = summary.content
    ? summary.content.replace(/[#*_\[\]`>-]/g, '').slice(0, 120) + (summary.content.length > 120 ? '...' : '')
    : 'Sem conteudo...';

  const accentColor = colors.courseAccents[summary.courseId] || colors.courseAccents.anatomy;

  return (
    <div className={`${CARD_SM} group`}>
      <div className="flex items-center gap-4">
        {/* Color accent */}
        <div className={clsx('w-1 self-stretch rounded-full shrink-0', accentColor.bg)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={clsx('text-[10px] font-bold uppercase tracking-wider', accentColor.text)}>
              {summary.courseName || summary.courseId}
            </span>
            {summary.bookmarked && <BookmarkCheck size={11} className="text-amber-500" />}
          </div>
          <h4 className="font-semibold text-gray-900 text-sm" style={headingStyle}>
            {summary.topicTitle || summary.topicId}
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{preview}</p>

          {/* Tags */}
          {summary.tags && summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {summary.tags.slice(0, 4).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                  {tag}
                </span>
              ))}
              {summary.tags.length > 4 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  +{summary.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[10px] text-gray-400">{formatRelativeDate(summary.updatedAt)}</p>
          {summary.editTimeMinutes > 0 && (
            <p className="text-[10px] text-gray-300 mt-0.5">{summary.editTimeMinutes}min</p>
          )}
        </div>

        {/* Admin actions — always visible */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleBookmark}
            className={clsx('p-2 rounded-xl transition-colors', summary.bookmarked ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50')}
            title="Favoritar"
          >
            {summary.bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors"
            title="Editar resumo"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            title="Deletar resumo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// Helper
// ══════════════════════════════════════════════
function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atras`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atras`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
