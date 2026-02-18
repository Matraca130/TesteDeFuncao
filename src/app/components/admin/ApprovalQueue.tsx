// ============================================================
// Axon v4.4 — ApprovalQueue (Dev 1, FASE 2)
// Batch approve/reject content items (D20)
// Wired to LIVE backend: PUT /content/batch-status
// Gap 3 fix: items derived from real data (summaries + keywords)
// Gap 6: Sonner toasts for feedback
// ============================================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ApprovalItem, ContentStatus } from '../../lib/types';
import { toast } from 'sonner';
import {
  CheckCircle, XCircle, Clock, Search,
  CheckCheck, X, FileText, Tag,
  Layers, Sparkles, Zap, AlertTriangle,
  MessageSquare, Loader2,
} from 'lucide-react';

const ENTITY_ICONS: Record<string, React.ElementType> = {
  summary: FileText,
  keyword: Tag,
  subtopic: Layers,
  flashcard: Zap,
  quiz_question: MessageSquare,
};

const ENTITY_LABELS: Record<string, string> = {
  summary: 'Resumo',
  keyword: 'Keyword',
  subtopic: 'Sub-topico',
  flashcard: 'Flashcard',
  quiz_question: 'Questao Quiz',
};

const ENTITY_COLORS: Record<string, string> = {
  summary: 'text-blue-600 bg-blue-50 border-blue-200',
  keyword: 'text-teal-600 bg-teal-50 border-teal-200',
  subtopic: 'text-violet-600 bg-violet-50 border-violet-200',
  flashcard: 'text-amber-600 bg-amber-50 border-amber-200',
  quiz_question: 'text-rose-600 bg-rose-50 border-rose-200',
};

interface ApprovalQueueProps {
  items: ApprovalItem[];
  /** Callback to propagate status changes back to parent (updates summaries/keywords/subtopics) */
  onStatusChange: (changes: { entity_type: string; id: string; new_status: ContentStatus }[]) => void;
  // Backend callback
  onBatchStatus?: (items: { entity_type: string; id: string; new_status: string; reviewer_note?: string }[]) => Promise<any>;
}

export function ApprovalQueue({ items, onStatusChange, onBatchStatus }: ApprovalQueueProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  // Track recently processed items locally (since derived items will update automatically)
  const [recentlyProcessed, setRecentlyProcessed] = useState<(ApprovalItem & { processedStatus: ContentStatus })[]>([]);

  const draftItems = useMemo(() => {
    let filtered = items.filter(i => i.status === 'draft');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.parent_info?.toLowerCase().includes(q)
      );
    }
    if (entityFilter !== 'all') {
      filtered = filtered.filter(i => i.entity_type === entityFilter);
    }
    return filtered;
  }, [items, search, entityFilter]);

  const processedItems = useMemo(() =>
    recentlyProcessed.slice(0, 10),
    [recentlyProcessed]
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === draftItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(draftItems.map(i => i.id)));
    }
  };

  const startBatchAction = (action: 'approve' | 'reject') => {
    if (selected.size === 0) return;
    setBatchAction(action);
    setReviewerNote('');
    setShowConfirm(true);
  };

  const executeBatchAction = async () => {
    if (!batchAction) return;
    const newStatus: ContentStatus = batchAction === 'approve' ? 'published' : 'rejected';

    setProcessing(true);
    try {
      if (onBatchStatus) {
        const batchItems = items
          .filter(item => selected.has(item.id))
          .map(item => ({
            entity_type: item.entity_type,
            id: item.id,
            new_status: newStatus,
            ...(reviewerNote ? { reviewer_note: reviewerNote } : {}),
          }));

        const result = await onBatchStatus(batchItems);
        console.log('[ApprovalQueue] Batch status result:', result);
      }

      // Track processed items for the "recently processed" section
      const processed = items
        .filter(item => selected.has(item.id))
        .map(item => ({ ...item, status: newStatus, processedStatus: newStatus }));
      setRecentlyProcessed(prev => [...processed, ...prev].slice(0, 20));

      // Propagate status changes to parent (updates summaries/keywords state)
      const changes = items
        .filter(item => selected.has(item.id))
        .map(item => ({ entity_type: item.entity_type, id: item.id, new_status: newStatus }));
      onStatusChange(changes);

      toast.success(
        `${selected.size} item${selected.size !== 1 ? 'ns' : ''} ${batchAction === 'approve' ? 'aprovado' : 'rejeitado'}${selected.size !== 1 ? 's' : ''}`,
      );
    } catch (err) {
      console.error('[ApprovalQueue] Batch action failed:', err);
      toast.error('Erro ao processar items');
    } finally {
      setProcessing(false);
      setSelected(new Set());
      setShowConfirm(false);
      setBatchAction(null);
    }
  };

  const handleSingleAction = async (id: string, action: 'approve' | 'reject') => {
    const newStatus: ContentStatus = action === 'approve' ? 'published' : 'rejected';
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (onBatchStatus) {
      try {
        await onBatchStatus([{ entity_type: item.entity_type, id, new_status: newStatus }]);
      } catch (err) {
        console.error('[ApprovalQueue] Single action failed:', err);
        toast.error('Erro ao processar item');
        return;
      }
    }

    // Track processed item
    setRecentlyProcessed(prev => [{ ...item, status: newStatus, processedStatus: newStatus }, ...prev].slice(0, 20));

    // Propagate to parent
    onStatusChange([{ entity_type: item.entity_type, id, new_status: newStatus }]);

    toast.success(
      `${item.title} ${action === 'approve' ? 'aprovado' : 'rejeitado'}`,
    );
  };

  const entityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.filter(i => i.status === 'draft').forEach(i => {
      counts[i.entity_type] = (counts[i.entity_type] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fila de Aprovacao</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {draftItems.length} item{draftItems.length !== 1 ? 'ns' : ''} pendente{draftItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
              <button onClick={() => startBatchAction('approve')}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm">
                <CheckCheck size={14} /> Aprovar
              </button>
              <button onClick={() => startBatchAction('reject')}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm">
                <XCircle size={14} /> Rejeitar
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar items..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setEntityFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              entityFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            Todos ({items.filter(i => i.status === 'draft').length})
          </button>
          {Object.entries(entityCounts).map(([type, count]) => {
            const Icon = ENTITY_ICONS[type] || FileText;
            return (
              <button key={type} onClick={() => setEntityFilter(type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  entityFilter === type ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={11} /> {ENTITY_LABELS[type]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Select all */}
      {draftItems.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              selected.size === draftItems.length ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
            }`}>
              {selected.size === draftItems.length && <CheckCircle size={10} className="text-white" />}
            </div>
            {selected.size === draftItems.length ? 'Deselecionar todos' : 'Selecionar todos'}
          </button>
        </div>
      )}

      {/* Queue items */}
      <div className="space-y-2">
        <AnimatePresence>
          {draftItems.map((item) => {
            const Icon = ENTITY_ICONS[item.entity_type] || FileText;
            const colors = ENTITY_COLORS[item.entity_type] || 'text-gray-600 bg-gray-50 border-gray-200';
            const isSelected = selected.has(item.id);

            return (
              <motion.div key={item.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                className={`bg-white rounded-xl border overflow-hidden transition-colors ${
                  isSelected ? 'border-teal-300 ring-1 ring-teal-200' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleSelect(item.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300 hover:border-teal-400'
                    }`}>
                    {isSelected && <CheckCircle size={12} className="text-white" />}
                  </button>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors}`}>
                    <Icon size={10} /> {ENTITY_LABELS[item.entity_type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    {item.parent_info && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.parent_info}</p>
                    )}
                  </div>
                  {item.source === 'ai_generated' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-violet-600 bg-violet-50 border border-violet-200">
                      <Sparkles size={9} /> IA
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleSingleAction(item.id, 'approve')}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Aprovar">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => handleSingleAction(item.id, 'reject')}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Rejeitar">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {draftItems.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle size={48} className="mx-auto text-emerald-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium">Fila vazia!</p>
          <p className="text-xs text-gray-400 mt-1">Todos os items foram processados.</p>
        </div>
      )}

      {/* Recently processed */}
      {processedItems.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Processados recentemente</h3>
          <div className="space-y-1">
            {processedItems.map((item, idx) => {
              const Icon = ENTITY_ICONS[item.entity_type] || FileText;
              return (
                <div key={`${item.id}-${idx}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50/50">
                  <Icon size={12} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 flex-1 truncate">{item.title}</span>
                  {item.processedStatus === 'published' ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle size={10} /> Aprovado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                      <XCircle size={10} /> Rejeitado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => !processing && setShowConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {batchAction === 'approve' ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle size={20} className="text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle size={20} className="text-red-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {batchAction === 'approve' ? 'Aprovar' : 'Rejeitar'} {selected.size} item{selected.size !== 1 ? 'ns' : ''}?
                    </h3>
                    <p className="text-sm text-gray-500">
                      {batchAction === 'approve'
                        ? 'Os items selecionados serao publicados e visiveis aos estudantes.'
                        : 'Os items selecionados serao marcados como rejeitados.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nota do revisor (opcional)</label>
                <textarea value={reviewerNote} onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="Motivo da decisao..." rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none" />
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setShowConfirm(false)} disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
                  Cancelar
                </button>
                <button onClick={executeBatchAction} disabled={processing}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm ${
                    batchAction === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50`}>
                  {processing && <Loader2 size={14} className="animate-spin" />}
                  Confirmar {batchAction === 'approve' ? 'Aprovacao' : 'Rejeicao'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}