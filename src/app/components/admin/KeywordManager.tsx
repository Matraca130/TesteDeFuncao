// ============================================================
// Axon v4.4 — KeywordManager (Dev 1, FASE 2)
// Keywords + sub-topics management, priority editing
// Wired to LIVE backend via callbacks from App.tsx
// Aligned with backend contract (NO summary_ids on Keyword)
// Gap 5: handleUpdateSubTopic + inline edit
// Gap 6: Sonner toasts for feedback
// ============================================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Keyword, SubTopic, Priority, ContentStatus } from '../../lib/types';
import { toast } from 'sonner';
import {
  Tag, ChevronDown, ChevronRight, Plus, Trash2,
  Search, Star, ArrowUpDown, Edit3, Check,
  CheckCircle, Clock, XCircle, X, Loader2,
} from 'lucide-react';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; stars: number }> = {
  0: { label: 'Sem prioridade', color: 'text-gray-400', stars: 0 },
  1: { label: 'Baixa', color: 'text-blue-500', stars: 1 },
  2: { label: 'Media', color: 'text-amber-500', stars: 2 },
  3: { label: 'Alta', color: 'text-red-500', stars: 3 },
};

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  published: { label: 'Publicado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
};

interface KeywordManagerProps {
  keywords: Keyword[];
  onKeywordsChange: (keywords: Keyword[]) => void;
  // Backend CRUD callbacks
  onCreateKeyword?: (data: { term: string; definition: string | null; priority: number }) => Promise<Keyword | null>;
  onUpdateKeyword?: (id: string, data: Record<string, unknown>) => Promise<Keyword | null>;
  onDeleteKeyword?: (id: string) => Promise<boolean>;
  onCreateSubTopic?: (data: { keyword_id: string; title: string; description: string | null }) => Promise<any>;
  onUpdateSubTopic?: (id: string, data: { title?: string; description?: string | null }) => Promise<SubTopic | null>;
  onDeleteSubTopic?: (id: string) => Promise<boolean>;
}

type SortField = 'term' | 'priority' | 'status';

export function KeywordManager({
  keywords, onKeywordsChange,
  onCreateKeyword, onUpdateKeyword, onDeleteKeyword,
  onCreateSubTopic, onUpdateSubTopic, onDeleteSubTopic,
}: KeywordManagerProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingPriority, setEditingPriority] = useState<{ kwId: string; stId?: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKw, setNewKw] = useState({ term: '', definition: '', priority: 2 as Priority });
  const [saving, setSaving] = useState(false);
  // Inline editing state for subtopics (Gap 5)
  const [editingSubTopic, setEditingSubTopic] = useState<{ kwId: string; stId: string; title: string; description: string } | null>(null);
  const [savingSubTopic, setSavingSubTopic] = useState(false);

  const filteredKeywords = useMemo(() => {
    let kws = [...keywords];
    if (search) {
      const q = search.toLowerCase();
      kws = kws.filter(k => k.term.toLowerCase().includes(q) || k.definition?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      kws = kws.filter(k => k.status === statusFilter);
    }
    kws.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'term': diff = a.term.localeCompare(b.term); break;
        case 'priority': diff = b.priority - a.priority; break;
        case 'status': diff = a.status.localeCompare(b.status); break;
      }
      return sortAsc ? -diff : diff;
    });
    return kws;
  }, [keywords, search, sortBy, sortAsc, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updatePriority = async (kwId: string, priority: Priority) => {
    if (onUpdateKeyword) {
      const updated = await onUpdateKeyword(kwId, { priority });
      if (updated) {
        onKeywordsChange(keywords.map(k => k.id === kwId ? { ...k, ...updated } : k));
        toast.success('Prioridade atualizada');
      }
    } else {
      onKeywordsChange(keywords.map(k => k.id === kwId ? { ...k, priority } : k));
      toast.success('Prioridade atualizada localmente');
    }
    setEditingPriority(null);
  };

  const deleteKeyword = async (kwId: string) => {
    if (!confirm('Deletar esta keyword e todos seus sub-topicos?')) return;
    if (onDeleteKeyword) {
      const ok = await onDeleteKeyword(kwId);
      if (ok) {
        onKeywordsChange(keywords.filter(k => k.id !== kwId));
        toast.success('Keyword deletada com sucesso');
      } else {
        toast.error('Erro ao deletar keyword');
      }
    } else {
      onKeywordsChange(keywords.filter(k => k.id !== kwId));
      toast.success('Keyword removida localmente');
    }
  };

  const deleteSubTopic = async (kwId: string, stId: string) => {
    if (!confirm('Deletar este sub-topico?')) return;
    if (onDeleteSubTopic) {
      const ok = await onDeleteSubTopic(stId);
      if (ok) {
        onKeywordsChange(keywords.map(k => {
          if (k.id !== kwId) return k;
          return { ...k, subtopics: k.subtopics?.filter(st => st.id !== stId) };
        }));
        toast.success('Sub-topico deletado');
      } else {
        toast.error('Erro ao deletar sub-topico');
      }
    } else {
      onKeywordsChange(keywords.map(k => {
        if (k.id !== kwId) return k;
        return { ...k, subtopics: k.subtopics?.filter(st => st.id !== stId) };
      }));
      toast.success('Sub-topico removido localmente');
    }
  };

  const addKeyword = async () => {
    if (!newKw.term.trim()) return;
    setSaving(true);
    try {
      if (onCreateKeyword) {
        const created = await onCreateKeyword({
          term: newKw.term.trim(),
          definition: newKw.definition.trim() || null,
          priority: newKw.priority,
        });
        if (created) {
          onKeywordsChange([...keywords, { ...created, subtopics: [] }]);
          toast.success(`Keyword "${created.term}" criada`);
        }
      } else {
        const kw: Keyword = {
          id: `kw-${Date.now()}`,
          institution_id: 'inst-001',
          term: newKw.term.trim(),
          definition: newKw.definition.trim() || null,
          priority: newKw.priority,
          status: 'draft',
          created_at: new Date().toISOString(),
          created_by: 'user-prof-001',
          updated_at: new Date().toISOString(),
          subtopics: [],
        };
        onKeywordsChange([...keywords, kw]);
        toast.success(`Keyword "${kw.term}" criada localmente`);
      }
      setNewKw({ term: '', definition: '', priority: 2 });
      setShowAddForm(false);
    } catch (err) {
      console.error('[KeywordManager] Create keyword failed:', err);
      toast.error('Erro ao criar keyword');
    } finally {
      setSaving(false);
    }
  };

  const addSubTopic = async (kwId: string) => {
    const title = prompt('Nome do sub-topico:');
    if (!title?.trim()) return;
    if (onCreateSubTopic) {
      const created = await onCreateSubTopic({ keyword_id: kwId, title: title.trim(), description: null });
      if (created) {
        onKeywordsChange(keywords.map(k => {
          if (k.id !== kwId) return k;
          return { ...k, subtopics: [...(k.subtopics || []), created] };
        }));
        toast.success('Sub-topico criado');
      }
    } else {
      onKeywordsChange(keywords.map(k => {
        if (k.id !== kwId) return k;
        const st: SubTopic = {
          id: `st-${Date.now()}`, keyword_id: kwId, title: title.trim(),
          description: null, created_at: new Date().toISOString(),
        };
        return { ...k, subtopics: [...(k.subtopics || []), st] };
      }));
      toast.success('Sub-topico criado localmente');
    }
  };

  // Gap 5: Update subtopic handler
  const saveSubTopicEdit = async () => {
    if (!editingSubTopic) return;
    const { kwId, stId, title, description } = editingSubTopic;
    if (!title.trim()) { toast.error('Titulo obrigatorio'); return; }

    setSavingSubTopic(true);
    try {
      if (onUpdateSubTopic) {
        const updated = await onUpdateSubTopic(stId, {
          title: title.trim(),
          description: description.trim() || null,
        });
        if (updated) {
          onKeywordsChange(keywords.map(k => {
            if (k.id !== kwId) return k;
            return { ...k, subtopics: k.subtopics?.map(st => st.id === stId ? { ...st, ...updated } : st) };
          }));
          toast.success('Sub-topico atualizado');
        }
      } else {
        onKeywordsChange(keywords.map(k => {
          if (k.id !== kwId) return k;
          return { ...k, subtopics: k.subtopics?.map(st => st.id === stId ? { ...st, title: title.trim(), description: description.trim() || null } : st) };
        }));
        toast.success('Sub-topico atualizado localmente');
      }
      setEditingSubTopic(null);
    } catch (err) {
      console.error('[KeywordManager] Update subtopic failed:', err);
      toast.error('Erro ao atualizar sub-topico');
    } finally {
      setSavingSubTopic(false);
    }
  };

  const startEditSubTopic = (kwId: string, st: SubTopic) => {
    setEditingSubTopic({ kwId, stId: st.id, title: st.title, description: st.description || '' });
  };

  const PriorityStars = ({ priority, onClick }: { priority: Priority; onClick?: () => void }) => {
    const cfg = PRIORITY_CONFIG[priority];
    return (
      <button onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium hover:bg-gray-100 transition-colors ${cfg.color}`}
        title={cfg.label}>
        {Array.from({ length: 3 }, (_, i) => (
          <Star key={i} size={10} className={i < cfg.stars ? 'fill-current' : 'opacity-30'} />
        ))}
      </button>
    );
  };

  const PrioritySelector = ({ current, onSelect }: { current: Priority; onSelect: (p: Priority) => void }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="absolute right-0 top-6 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[140px]"
      onClick={(e) => e.stopPropagation()}>
      {([3, 2, 1, 0] as Priority[]).map(p => {
        const cfg = PRIORITY_CONFIG[p];
        return (
          <button key={p} onClick={() => onSelect(p)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 ${current === p ? 'bg-gray-50 font-semibold' : ''}`}>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 3 }, (_, i) => (
                <Star key={i} size={10} className={`${cfg.color} ${i < cfg.stars ? 'fill-current' : 'opacity-30'}`} />
              ))}
            </div>
            <span className={cfg.color}>{cfg.label}</span>
          </button>
        );
      })}
    </motion.div>
  );

  const draftCount = filteredKeywords.filter(k => k.status === 'draft').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Keywords</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredKeywords.length} keyword{filteredKeywords.length !== 1 ? 's' : ''}
            {draftCount > 0 && <span className="text-amber-600 ml-1">({draftCount} rascunho{draftCount !== 1 ? 's' : ''})</span>}
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Nova Keyword
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar keywords..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['all', 'draft', 'published', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'all' ? 'Todos' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100">
          <ArrowUpDown size={12} /> {sortBy === 'priority' ? 'Prioridade' : sortBy === 'term' ? 'Nome' : 'Status'}
        </button>
      </div>

      {/* Keyword list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredKeywords.map((kw) => {
            const isExp = expanded.has(kw.id);
            const stCfg = STATUS_CONFIG[kw.status];
            const StatusIcon = stCfg.icon;
            const subtopics = kw.subtopics || [];

            return (
              <motion.div key={kw.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 group cursor-pointer hover:bg-gray-50/50" onClick={() => toggleExpand(kw.id)}>
                  <span className="text-gray-400">{isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  <Tag size={15} className="text-teal-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{kw.term}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${stCfg.bg} ${stCfg.color}`}>
                        <StatusIcon size={10} /> {stCfg.label}
                      </span>
                    </div>
                    {kw.definition && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{kw.definition}</p>}
                  </div>
                  <div className="relative">
                    <PriorityStars priority={kw.priority}
                      onClick={() => setEditingPriority(editingPriority?.kwId === kw.id && !editingPriority?.stId ? null : { kwId: kw.id })} />
                    {editingPriority?.kwId === kw.id && !editingPriority?.stId && (
                      <PrioritySelector current={kw.priority} onSelect={(p) => updatePriority(kw.id, p)} />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 tabular-nums">{subtopics.length} sub-topic{subtopics.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); deleteKeyword(kw.id); }} className="p-1 rounded hover:bg-red-50">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExp && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                      <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-8">Sub-topicos</p>
                        <div className="space-y-1 ml-8">
                          {subtopics.map(st => (
                            <div key={st.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 group/st">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                              <span className="text-sm text-gray-700 flex-1">
                                {editingSubTopic?.stId === st.id ? (
                                  <input value={editingSubTopic.title}
                                    onChange={(e) => setEditingSubTopic(prev => prev ? { ...prev, title: e.target.value } : prev)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveSubTopicEdit(); if (e.key === 'Escape') setEditingSubTopic(null); }}
                                    autoFocus
                                    className="w-full px-1.5 py-0.5 rounded border border-teal-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                                ) : (
                                  st.title
                                )}
                              </span>
                              {editingSubTopic?.stId === st.id ? (
                                <>
                                  <button onClick={saveSubTopicEdit} disabled={savingSubTopic}
                                    className="p-1 rounded bg-teal-500 hover:bg-teal-600 text-white transition-colors disabled:opacity-50">
                                    {savingSubTopic ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  </button>
                                  <button onClick={() => setEditingSubTopic(null)}
                                    className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-500 transition-colors">
                                    <X size={12} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditSubTopic(kw.id, st)}
                                    className="p-1 rounded hover:bg-teal-50 text-teal-500 opacity-0 group-hover/st:opacity-100 transition-opacity">
                                    <Edit3 size={12} />
                                  </button>
                                  <button onClick={() => deleteSubTopic(kw.id, st.id)}
                                    className="p-1 rounded hover:bg-red-50 text-red-400 opacity-0 group-hover/st:opacity-100 transition-opacity">
                                    <Trash2 size={11} />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                          {subtopics.length === 0 && (
                            <p className="text-xs text-gray-400 py-2">Nenhum sub-topico (D27: BKT vive na keyword)</p>
                          )}
                          <button onClick={() => addSubTopic(kw.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50/30 transition-colors">
                            <Plus size={12} /> Adicionar sub-topico
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredKeywords.length === 0 && (
        <div className="text-center py-12">
          <Tag size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">{search ? 'Nenhuma keyword encontrada.' : 'Nenhuma keyword cadastrada.'}</p>
        </div>
      )}

      {/* Add Keyword Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowAddForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Nova Keyword</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Termo</label>
                  <input value={newKw.term} onChange={(e) => setNewKw(f => ({ ...f, term: e.target.value }))} placeholder="Ex: Femur" autoFocus
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Definicao</label>
                  <textarea value={newKw.definition} onChange={(e) => setNewKw(f => ({ ...f, definition: e.target.value }))}
                    placeholder="Definicao breve..." rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Prioridade</label>
                  <div className="flex gap-2">
                    {([0, 1, 2, 3] as Priority[]).map(p => {
                      const cfg = PRIORITY_CONFIG[p];
                      return (
                        <button key={p} onClick={() => setNewKw(f => ({ ...f, priority: p }))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                            newKw.priority === p ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}>
                          {Array.from({ length: 3 }, (_, i) => (
                            <Star key={i} size={10} className={`${cfg.color} ${i < cfg.stars ? 'fill-current' : 'opacity-30'}`} />
                          ))}
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button onClick={addKeyword} disabled={!newKw.term.trim() || saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Criar Keyword
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingPriority && <div className="fixed inset-0 z-10" onClick={() => setEditingPriority(null)} />}
    </div>
  );
}