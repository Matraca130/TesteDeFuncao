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
  Search, Clock, Tag, Bookmark, BookmarkCheck,
  Edit3, FileText, Loader2,
  AlertCircle, ChevronRight,
} from 'lucide-react';
import { CanvasBlocksRenderer } from './CanvasBlocksRenderer';

// ══════════════════════════════════════════════
// RESUMOS VIEW — Visualização de Estudante (somente leitura)
// Para criar/editar/deletar, use o AdminPanel.
// ══════════════════════════════════════════════

type SortMode = 'recent' | 'oldest' | 'alpha' | 'bookmarked';
type SubView = 'list' | 'detail';

const CARD = 'bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100';
const CARD_SM = 'bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-all';

export function ResumosView() {
  const { currentCourse } = useApp();

  const [summaries, setSummaries] = useState<StudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subView, setSubView] = useState<SubView>('list');
  const [selectedSummary, setSelectedSummary] = useState<StudySummary | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setSummaries(await api.getAllSummaries()); }
    catch (err: any) { console.error('[Resumos] fetch:', err); setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  // Handlers
  const handleOpenDetail = (s: StudySummary) => { setSelectedSummary(s); setSubView('detail'); };
  const handleBack = () => { setSubView('list'); setSelectedSummary(null); };

  const handleToggleBookmark = async (summary: StudySummary) => {
    try {
      const updated = await api.saveSummary(summary.courseId, summary.topicId, { bookmarked: !summary.bookmarked });
      setSummaries(prev => prev.map(s => (s.courseId === updated.courseId && s.topicId === updated.topicId ? updated : s)));
      if (selectedSummary?.courseId === updated.courseId && selectedSummary?.topicId === updated.topicId) setSelectedSummary(updated);
    } catch (err: any) { console.error('[Resumos] bookmark:', err); }
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

  // Stats
  const totalSummaries = summaries.length;
  const bookmarkedCount = summaries.filter(s => s.bookmarked).length;
  const totalEditTime = summaries.reduce((s, r) => s + (r.editTimeMinutes || 0), 0);

  return (
    <div className="h-full bg-[#f5f2ea] overflow-y-auto">
      <AxonPageHeader
        title="Resumos"
        subtitle={currentCourse.name}
        onBack={subView !== 'list' ? handleBack : undefined}
        backLabel="Voltar aos resumos"
        statsLeft={<p className="text-gray-500 text-sm">Seus resumos de estudo</p>}
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {subView === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* KPI Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <KPICard icon={<FileText className="w-5 h-5 text-teal-600" />} label="Total de Resumos" value={String(totalSummaries)} trend={`${courses.length} materias`} color="bg-teal-50" />
                  <KPICard icon={<BookmarkCheck className="w-5 h-5 text-amber-600" />} label="Favoritos" value={String(bookmarkedCount)} trend={totalSummaries > 0 ? `${Math.round((bookmarkedCount / totalSummaries) * 100)}%` : '0%'} color="bg-amber-50" />
                  <KPICard icon={<Clock className="w-5 h-5 text-teal-600" />} label="Tempo de Estudo" value={totalEditTime > 60 ? `${Math.floor(totalEditTime / 60)}h ${totalEditTime % 60}m` : `${totalEditTime}m`} trend="total acumulado" color="bg-teal-50" />
                </div>

                {/* Toolbar */}
                <div className={`${CARD} mb-6`}>
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
                    <p className="text-red-700 text-sm font-medium mb-1">Erro ao carregar resumos</p>
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
                    <p className="text-sm text-gray-500 mb-2 text-center max-w-sm">
                      {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Ainda nao ha resumos publicados.'}
                    </p>
                  </div>
                )}

                {/* Summary cards — read-only */}
                {!loading && !error && filtered.length > 0 && (
                  <div className="space-y-4">
                    {filtered.map((summary, idx) => (
                      <motion.div
                        key={`${summary.courseId}-${summary.topicId}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <SummaryRow
                          summary={summary}
                          onOpen={() => handleOpenDetail(summary)}
                          onToggleBookmark={() => handleToggleBookmark(summary)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {subView === 'detail' && selectedSummary && (
              <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SummaryDetail
                  summary={selectedSummary}
                  onToggleBookmark={() => handleToggleBookmark(selectedSummary)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// KPI Card
// ══════════════════════════════════════════════
function KPICard({ icon, label, value, trend, color }: { icon: React.ReactNode; label: string; value: string; trend: string; color: string }) {
  return (
    <div className={CARD_SM}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-2.5 rounded-xl', color)}>{icon}</div>
        <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-gray-500 bg-gray-50">
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  );
}

// ═════════════════════════════════════════════
// Summary Row — Read-only (no edit/delete)
// ═════════════════════════════════════════════
function SummaryRow({ summary, onOpen, onToggleBookmark }: {
  summary: StudySummary; onOpen: () => void; onToggleBookmark: () => void;
}) {
  const preview = summary.content
    ? summary.content.replace(/[#*_\[\]`>-]/g, '').slice(0, 160) + (summary.content.length > 160 ? '...' : '')
    : 'Sem conteudo ainda...';

  const accentColor = colors.courseAccents[summary.courseId] || colors.courseAccents.anatomy;

  return (
    <div className={`${CARD_SM} cursor-pointer group`} onClick={onOpen}>
      <div className="flex items-start gap-4">
        {/* Color accent bar */}
        <div className={clsx('w-1 self-stretch rounded-full shrink-0', accentColor.bg)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('text-[10px] font-bold uppercase tracking-wider', accentColor.text)}>
              {summary.courseName || summary.courseId}
            </span>
            {summary.bookmarked && <BookmarkCheck size={12} className="text-amber-500" />}
          </div>

          <h4 className="font-semibold text-gray-900 mb-1.5" style={headingStyle}>
            {summary.topicTitle || summary.topicId}
          </h4>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{preview}</p>

          {/* Tags */}
          {summary.tags && summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {summary.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeDate(summary.updatedAt)}</span>
            {summary.editTimeMinutes > 0 && <span>{summary.editTimeMinutes}min de estudo</span>}
          </div>
        </div>

        {/* Bookmark only */}
        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={e => { e.stopPropagation(); onToggleBookmark(); }} className={clsx('p-2 rounded-xl transition-colors', summary.bookmarked ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50')} title="Favoritar">
            {summary.bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>

        <ChevronRight size={18} className="text-gray-300 self-center shrink-0" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// Summary Detail — Read-only (no edit/delete)
// ══════════════════════════════════════════════
function SummaryDetail({ summary, onToggleBookmark }: {
  summary: StudySummary; onToggleBookmark: () => void;
}) {
  const accentColor = colors.courseAccents[summary.courseId] || colors.courseAccents.anatomy;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className={CARD}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={clsx('text-xs font-bold uppercase tracking-wider', accentColor.text)}>
                {summary.courseName || summary.courseId}
              </span>
              {summary.bookmarked && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">Favorito</span>
              )}
            </div>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-900 tracking-tight leading-[1.1]" style={headingStyle}>
              {summary.topicTitle || summary.topicId}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleBookmark} className={clsx('p-2.5 rounded-xl transition-colors', summary.bookmarked ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100')} title="Favoritar">
              {summary.bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock size={12} />Atualizado {formatRelativeDate(summary.updatedAt)}</span>
          <span className="flex items-center gap-1"><FileText size={12} />Criado {formatRelativeDate(summary.createdAt)}</span>
          {summary.editTimeMinutes > 0 && <span>{summary.editTimeMinutes} min de estudo</span>}
        </div>

        {summary.tags && summary.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {summary.tags.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium flex items-center gap-1">
                <Tag size={10} />{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900" style={headingStyle}>Conteudo do Resumo</h3>
            <p className="text-sm text-gray-500">
              {summary.content ? `${summary.content.split(/\s+/).length} palavras` : 'Sem conteudo'}
            </p>
          </div>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          {summary.canvasBlocks ? (
            <CanvasBlocksRenderer blocksJson={summary.canvasBlocks} />
          ) : (
            <>
              {renderMarkdownLite(summary.content || '')}
              {!summary.content && <p className="text-gray-400 italic">Sem conteudo publicado.</p>}
            </>
          )}
        </div>
      </motion.div>

      {/* Annotations */}
      {summary.annotations && summary.annotations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={CARD}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900" style={headingStyle}>Anotacoes</h3>
              <p className="text-sm text-gray-500">{summary.annotations.length} anotacao{summary.annotations.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
          <div className="space-y-4">
            {summary.annotations.map(ann => {
              const borderMap: Record<string, string> = {
                yellow: 'border-l-amber-400', blue: 'border-l-blue-400',
                green: 'border-l-green-400', pink: 'border-l-pink-400',
              };
              const bgMap: Record<string, string> = {
                yellow: 'bg-amber-50/60', blue: 'bg-blue-50/60',
                green: 'bg-green-50/60', pink: 'bg-pink-50/60',
              };
              return (
                <div key={ann.id} className={clsx('border-l-4 rounded-r-xl p-4', borderMap[ann.color] || 'border-l-gray-300', bgMap[ann.color] || 'bg-gray-50/60')}>
                  {ann.title && <p className="text-sm font-semibold text-gray-900 mb-1" style={headingStyle}>{ann.title}</p>}
                  {ann.selectedText && <p className="text-xs text-gray-500 italic mb-2">&ldquo;{ann.selectedText}&rdquo;</p>}
                  <p className="text-sm text-gray-700">{ann.note}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{formatRelativeDate(ann.timestamp)}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// Helpers
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

/** Simple markdown-lite renderer for summary content */
function renderMarkdownLite(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { elements.push(<br key={i} />); return; }

    if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-sm font-bold text-gray-900 mt-5 mb-2" style={headingStyle}>{trimmed.slice(4)}</h4>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2" style={headingStyle}>{trimmed.slice(3)}</h3>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3" style={headingStyle}>{trimmed.slice(2)}</h2>);
    } else if (trimmed.startsWith('- ')) {
      const content = trimmed.slice(2);
      elements.push(
        <div key={i} className="flex items-start gap-2 ml-1 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
          <span className="text-sm text-gray-700 leading-relaxed">{renderInline(content)}</span>
        </div>
      );
    } else if (trimmed === '---') {
      elements.push(<hr key={i} className="my-6 border-gray-200" />);
    } else {
      elements.push(<p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{renderInline(trimmed)}</p>);
    }
  });

  return <>{elements}</>;
}

/** Render bold and inline styles */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
