// ============================================================
// StudentNotesTab.tsx | Added by Agent 6 — PRISM — P4 Extraction
//
// SACRED-compliant student notes CRUD for KeywordPopover.
// Soft-delete ONLY. NEVER hard-delete a StudentNote.
//
// Extracted from KeywordPopover.tsx (was inline StudentNotesSection)
// Follows 3-layer: UI (this) -> Hook (useStudentNotes) -> api-client
// ============================================================
import { useState } from 'react';
import {
  StickyNote, Pencil, Trash2, Undo2, Save,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { ScrollArea } from '../../ui/scroll-area';
import { Skeleton } from '../../ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../ui/collapsible';
import { useStudentNotes } from '../../../hooks/use-student-notes';

// ── Exported interface ────────────────────────────────────────
/** Props for the StudentNotesTab sub-component. */
export interface StudentNotesTabProps {
  /** Keyword ID to scope notes. */
  keywordId: string;
}

// ── Component ─────────────────────────────────────────────────
/**
 * SACRED-compliant student notes panel.
 *
 * Features:
 * - Create, edit, soft-delete, and restore personal notes
 * - Optimistic UI via `useStudentNotes` hook
 * - Collapsible "deleted notes" drawer with restore action
 * - Loading skeleton + empty illustration
 * - Staggered Motion entrance animations
 */
export function StudentNotesTab({ keywordId }: StudentNotesTabProps) {
  const {
    activeNotes,
    deletedNotes,
    isLoading,
    isMutating,
    createNote,
    updateNote,
    softDeleteNote,
    restoreNote,
  } = useStudentNotes({ keywordId });

  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // ── Handlers ──────────────────────────────────────────────
  const handleCreate = async () => {
    const text = newNote.trim();
    if (!text) return;
    await createNote(text);
    setNewNote('');
  };

  const handleStartEdit = (id: string) => {
    const note = activeNotes.find((n) => n.id === id);
    if (note) {
      setEditingId(id);
      setEditText(note.note ?? ''); // P0 FIX: defensive fallback
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await updateNote(editingId, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Keyboard: Enter to save (Shift+Enter for newline in textarea is native)
  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-16 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-md self-end" />
        </div>
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* ── Create note input ── */}
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleCreateKeyDown}
          placeholder="Escreva uma nota..."
          rows={2}
          className="flex-1 resize-none"
          aria-label="Nova nota do estudante"
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!newNote.trim() || isMutating}
          className="bg-teal-500 hover:bg-teal-600 text-white self-end"
          aria-label="Salvar nota"
        >
          <Save className="w-3 h-3" />
        </Button>
      </div>

      {/* ── Active notes list ── */}
      <ScrollArea className="max-h-48">
        {activeNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-4"
          >
            <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-1" />
            <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>
              Ainda nao tens notas para esta keyword
            </p>
            <p className="text-gray-300 mt-0.5" style={{ fontSize: '0.625rem' }}>
              Escreva acima e clique em salvar
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Notas do estudante">
            <AnimatePresence mode="popLayout">
              {activeNotes.map((n, i) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(i * 0.04, 0.2),
                  }}
                  role="listitem"
                  className="group p-2 rounded-lg border border-gray-100 hover:border-teal-200 transition-colors"
                >
                  {editingId === n.id ? (
                    /* ── Edit mode ── */
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        rows={2}
                        autoFocus
                        className="resize-none"
                        aria-label="Editar nota"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={!editText.trim() || isMutating}
                          className="bg-teal-500 hover:bg-teal-600 text-white h-7"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-7"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Read mode ── */
                    <div className="flex items-start gap-2">
                      <p
                        className="text-gray-700 flex-1 whitespace-pre-wrap break-words"
                        style={{ fontSize: '0.875rem' }}
                      >
                        {n.note}
                      </p>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleStartEdit(n.id)}
                          className="p-1 text-gray-400 hover:text-teal-600 rounded transition-colors"
                          aria-label={`Editar nota: ${n.note?.slice(0, 30) ?? ''}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => softDeleteNote(n.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          aria-label={`Eliminar nota: ${n.note?.slice(0, 30) ?? ''}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* ── Deleted notes (SACRED restore) ── */}
      {deletedNotes.length > 0 && (
        <Collapsible open={showDeleted} onOpenChange={setShowDeleted}>
          <CollapsibleTrigger
            className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontSize: '0.75rem' }}
          >
            {showDeleted ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Notas eliminadas ({deletedNotes.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            <AnimatePresence>
              {deletedNotes.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 p-1.5 rounded bg-gray-50"
                >
                  <p
                    className="text-gray-400 truncate flex-1"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {n.note}
                  </p>
                  <button
                    onClick={() => restoreNote(n.id)}
                    className="text-teal-600 hover:text-teal-700 shrink-0 p-0.5 rounded transition-colors"
                    style={{ fontSize: '0.75rem' }}
                    aria-label={`Restaurar nota: ${n.note?.slice(0, 30) ?? ''}`}
                  >
                    <Undo2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
