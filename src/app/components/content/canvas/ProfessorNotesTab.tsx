// ============================================================
// ProfessorNotesTab.tsx | Added by Agent 6 — PRISM — P4 Extraction
//
// Read-only professor notes panel for KeywordPopover.
// Students can toggle visibility of individual notes (local state).
//
// Extracted from KeywordPopover.tsx (was inline ProfessorNotesSection)
// TODO: Replace MOCK_PROF_NOTES with useProfessorNotes hook
//       when Agent 4 (BRIDGE) delivers the endpoint.
// ============================================================
import { useState, useMemo } from 'react';
import {
  GraduationCap, Eye, EyeOff,
  ChevronDown, ChevronRight, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../ui/collapsible';

// ── Professor Note type (internal until Agent 4 delivers) ─────
interface ProfNote {
  id: string;
  keyword_id: string;
  professor_name: string;
  note: string;
  created_at: string;
}

// ── Mock data (to be replaced by hook) ────────────────────────
const MOCK_PROF_NOTES: ProfNote[] = [
  {
    id: 'pn-1',
    keyword_id: 'kw-1',
    professor_name: 'Dr. Silva',
    note: 'Esta keyword e essencial para a prova. Focar na cadeia de transporte de eletrons.',
    created_at: '2026-01-20',
  },
  {
    id: 'pn-2',
    keyword_id: 'kw-1',
    professor_name: 'Dr. Silva',
    note: 'Revisar a relacao entre mitocondria e apoptose celular.',
    created_at: '2026-02-01',
  },
  {
    id: 'pn-3',
    keyword_id: 'kw-2',
    professor_name: 'Profa. Costa',
    note: 'Ribossomos livres vs. aderidos ao RER — distincao importante.',
    created_at: '2026-01-25',
  },
  {
    id: 'pn-4',
    keyword_id: 'kw-3',
    professor_name: 'Dr. Silva',
    note: 'Comparar DNA polimerase I, II e III. Focar na III para a prova.',
    created_at: '2026-02-03',
  },
  {
    id: 'pn-5',
    keyword_id: 'kw-4',
    professor_name: 'Profa. Costa',
    note: 'Meiose I vs Meiose II: onde ocorre a reducao cromossomica?',
    created_at: '2026-02-08',
  },
  {
    id: 'pn-6',
    keyword_id: 'kw-5',
    professor_name: 'Dr. Silva',
    note: 'Revisar as fases clara e escura da fotossintese.',
    created_at: '2026-02-10',
  },
];

// ── Exported interface ────────────────────────────────────────
/** Props for the ProfessorNotesTab sub-component. */
export interface ProfessorNotesTabProps {
  /** Keyword ID to filter professor notes. */
  keywordId: string;
}

// ── Component ─────────────────────────────────────────────────
/**
 * Read-only panel showing professor annotations for a keyword.
 *
 * Features:
 * - Filtered by `keywordId`
 * - Toggle individual note visibility (local, non-persisted)
 * - Collapsible hidden-notes drawer
 * - Staggered Motion entrance animations
 * - Graceful empty state
 */
export function ProfessorNotesTab({ keywordId }: ProfessorNotesTabProps) {
  // Filter notes for this keyword
  const allNotesForKeyword = useMemo(
    () => MOCK_PROF_NOTES.filter((n) => n.keyword_id === keywordId),
    [keywordId],
  );

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);

  const visibleNotes = useMemo(
    () => allNotesForKeyword.filter((n) => !hiddenIds.has(n.id)),
    [allNotesForKeyword, hiddenIds],
  );

  const hiddenNotes = useMemo(
    () => allNotesForKeyword.filter((n) => hiddenIds.has(n.id)),
    [allNotesForKeyword, hiddenIds],
  );

  // ── Handlers ──────────────────────────────────────────────
  const hideNote = (noteId: string) => {
    setHiddenIds((prev) => new Set(prev).add(noteId));
  };

  const restoreNote = (noteId: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="w-4 h-4 text-teal-500" />
        <span
          className="text-gray-700"
          style={{ fontSize: '0.875rem', fontWeight: 600 }}
        >
          Notas do Professor
        </span>
        {allNotesForKeyword.length > 0 && (
          <span
            className="text-gray-400 ml-auto"
            style={{ fontSize: '0.625rem' }}
          >
            {visibleNotes.length}/{allNotesForKeyword.length} visiveis
          </span>
        )}
      </div>

      {/* ── Empty state ── */}
      {allNotesForKeyword.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-4"
        >
          <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-1" />
          <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>
            Nenhuma nota do professor para esta keyword
          </p>
        </motion.div>
      ) : visibleNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-3"
        >
          <EyeOff className="w-6 h-6 text-gray-300 mx-auto mb-1" />
          <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>
            Todas as notas estao ocultas
          </p>
        </motion.div>
      ) : (
        /* ── Visible notes ── */
        <div className="space-y-2" role="list" aria-label="Notas do professor">
          <AnimatePresence mode="popLayout">
            {visibleNotes.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(i * 0.05, 0.25),
                }}
                role="listitem"
                className="group p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="text-gray-700 whitespace-pre-wrap break-words"
                      style={{ fontSize: '0.875rem' }}
                    >
                      {n.note}
                    </p>
                    <p
                      className="text-gray-400 mt-1.5 flex items-center gap-1"
                      style={{ fontSize: '0.625rem' }}
                    >
                      <GraduationCap className="w-2.5 h-2.5" />
                      {n.professor_name} — {n.created_at}
                    </p>
                  </div>
                  <button
                    onClick={() => hideNote(n.id)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1 rounded"
                    title="Ocultar nota"
                    aria-label={`Ocultar nota de ${n.professor_name}`}
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Hidden notes drawer ── */}
      {hiddenNotes.length > 0 && (
        <Collapsible
          open={showHidden}
          onOpenChange={setShowHidden}
          className="mt-3"
        >
          <CollapsibleTrigger
            className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontSize: '0.75rem' }}
          >
            {showHidden ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Notas ocultas ({hiddenNotes.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            <AnimatePresence>
              {hiddenNotes.map((n) => (
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
                    aria-label={`Mostrar nota de ${n.professor_name}`}
                  >
                    <Eye className="w-3 h-3" />
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
