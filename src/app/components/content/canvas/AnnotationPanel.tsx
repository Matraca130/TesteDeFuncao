// ══════════════════════════════════════════════════════════════
// ANNOTATION PANEL — Sidebar for creating/viewing annotations
// on selected text within the canvas editor
// ══════════════════════════════════════════════════════════════
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, StickyNote, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import type { SummaryAnnotation } from '@/app/types/student';

const ANNOTATION_COLORS = [
  { id: 'yellow', label: 'Amarelo', bg: 'bg-amber-100', border: 'border-l-amber-400', bgLight: 'bg-amber-50/60', ring: 'ring-amber-300' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-100', border: 'border-l-blue-400', bgLight: 'bg-blue-50/60', ring: 'ring-blue-300' },
  { id: 'green', label: 'Verde', bg: 'bg-green-100', border: 'border-l-green-400', bgLight: 'bg-green-50/60', ring: 'ring-green-300' },
  { id: 'pink', label: 'Rosa', bg: 'bg-pink-100', border: 'border-l-pink-400', bgLight: 'bg-pink-50/60', ring: 'ring-pink-300' },
] as const;

interface AnnotationPanelProps {
  annotations: SummaryAnnotation[];
  onAdd: (annotation: SummaryAnnotation) => void;
  onRemove: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  /** Currently selected text in the canvas (from window.getSelection) */
  selectedText: string;
}

export function AnnotationPanel({ annotations, onAdd, onRemove, isOpen, onToggle, selectedText }: AnnotationPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newColor, setNewColor] = useState<'yellow' | 'blue' | 'green' | 'pink'>('yellow');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = useCallback(() => {
    if (!newNote.trim()) return;
    const annotation: SummaryAnnotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newTitle.trim(),
      selectedText: selectedText.trim(),
      note: newNote.trim(),
      timestamp: new Date().toISOString(),
      color: newColor,
    };
    onAdd(annotation);
    setNewTitle('');
    setNewNote('');
    setNewColor('yellow');
    setIsCreating(false);
  }, [newTitle, newNote, newColor, selectedText, onAdd]);

  const handleDelete = useCallback((id: string) => {
    onRemove(id);
    setConfirmDelete(null);
  }, [onRemove]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
          isOpen ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        )}
        title="Anotacoes"
      >
        <StickyNote size={14} />
        <span className="hidden sm:inline">Anotacoes</span>
        {annotations.length > 0 && (
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-bold', isOpen ? 'bg-amber-200 text-amber-800' : 'bg-gray-200 text-gray-600')}>
            {annotations.length}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 320 }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 h-full bg-white border-l border-gray-200 shadow-xl z-40 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <StickyNote size={16} className="text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Anotacoes</h3>
                <span className="text-[10px] text-gray-400 font-medium">{annotations.length}</span>
              </div>
              <button onClick={onToggle} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Create button / Form */}
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition-colors border border-amber-200/60"
                >
                  <Plus size={14} />
                  Nova anotacao{selectedText ? ` sobre "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '...' : ''}"` : ''}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2.5"
                >
                  {selectedText && (
                    <div className="text-[11px] text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      &ldquo;{selectedText.slice(0, 100)}{selectedText.length > 100 ? '...' : ''}&rdquo;
                    </div>
                  )}
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Titulo (opcional)"
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                  />
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Sua anotacao..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                    autoFocus
                  />
                  {/* Color picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1">Cor:</span>
                    {ANNOTATION_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setNewColor(c.id)}
                        className={clsx('w-6 h-6 rounded-full transition-all', c.bg, newColor === c.id ? `ring-2 ${c.ring} scale-110` : 'hover:scale-105')}
                        title={c.label}
                      />
                    ))}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreate}
                      disabled={!newNote.trim()}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => { setIsCreating(false); setNewTitle(''); setNewNote(''); }}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Annotations list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {annotations.length === 0 ? (
                <div className="text-center py-10">
                  <StickyNote size={28} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Nenhuma anotacao ainda</p>
                  <p className="text-[11px] text-gray-300 mt-1">Selecione um texto e clique em "Nova anotacao"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...annotations].reverse().map(ann => {
                    const colorConf = ANNOTATION_COLORS.find(c => c.id === ann.color) || ANNOTATION_COLORS[0];
                    return (
                      <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx('border-l-4 rounded-r-xl p-3 group', colorConf.border, colorConf.bgLight)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {ann.title && <p className="text-xs font-semibold text-gray-900 mb-0.5">{ann.title}</p>}
                            {ann.selectedText && (
                              <p className="text-[10px] text-gray-500 italic mb-1.5 line-clamp-2">&ldquo;{ann.selectedText}&rdquo;</p>
                            )}
                            <p className="text-xs text-gray-700 leading-relaxed">{ann.note}</p>
                            <p className="text-[9px] text-gray-400 mt-1.5">{formatDate(ann.timestamp)}</p>
                          </div>
                          {/* Delete */}
                          {confirmDelete === ann.id ? (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => handleDelete(ann.id)} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-semibold">Sim</button>
                              <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-[10px] font-semibold">Nao</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(ann.id)}
                              className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              title="Remover"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
