// ============================================================
// useStudentNotes — SACRED CRUD hook for keyword student notes
// Added by Agent 6 — PRISM — P3 Hook Layer
// SACRED: Soft-delete ONLY. NEVER hard delete KwStudentNote.
// REWIRED: Now uses Agent 4 api-client (api-sacred module)
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { StudentNote } from '../data/mock-data';
import {
  getKwStudentNotesByKeyword,
  createKwStudentNote as apiCreateNote,
  updateKwStudentNote as apiUpdateNote,
  softDeleteKwStudentNote,
  restoreKwStudentNote as apiRestoreNote,
} from '../lib/api-client';
import type { KwStudentNote } from '../lib/types';

// ── Type Adapter: Agent 4 KwStudentNote → Agent 6 StudentNote ──
// Agent 4: { content } | Agent 6: { note }
const STUDENT_ID = 'demo-student-001'; // TODO: Replace with auth context

function toA6StudentNote(a4: KwStudentNote): StudentNote {
  return {
    id: a4.id,
    student_id: a4.student_id,
    keyword_id: a4.keyword_id,
    // P0 FIX: handle both field names — 'content' (Agent 4 type) and 'note' (mock store)
    // When mock returns { note: '...' } without content, fallback to (a4 as any).note
    note: a4.content ?? (a4 as any).note ?? '',
    created_at: a4.created_at,
    deleted_at: a4.deleted_at,
  };
}

interface UseStudentNotesOptions {
  keywordId: string;
}

interface UseStudentNotesReturn {
  activeNotes: StudentNote[];
  deletedNotes: StudentNote[];
  isLoading: boolean;
  error: string | null;
  isMutating: boolean;
  createNote: (note: string) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  softDeleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useStudentNotes({ keywordId }: UseStudentNotesOptions): UseStudentNotesReturn {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // REWIRED: Agent 4 api-sacred
      const a4Notes = await getKwStudentNotesByKeyword(keywordId, STUDENT_ID);
      setNotes(a4Notes.map(toA6StudentNote));
    } catch (err) {
      console.error('[useStudentNotes] fetch error:', err);
      setError('Erro ao carregar notas');
    } finally {
      setIsLoading(false);
    }
  }, [keywordId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const activeNotes = useMemo(
    () => notes.filter((n) => n.deleted_at === null),
    [notes]
  );

  const deletedNotes = useMemo(
    () => notes.filter((n) => n.deleted_at !== null),
    [notes]
  );

  const createNote = useCallback(
    async (noteText: string) => {
      setIsMutating(true);
      try {
        // REWIRED: Agent 4 api-sacred — content = note
        const a4Note = await apiCreateNote(keywordId, STUDENT_ID, noteText.trim());
        setNotes((prev) => [...prev, toA6StudentNote(a4Note)]);
        toast.success('Nota salva');
      } catch (err) {
        console.error('[useStudentNotes] create error:', err);
        toast.error('Erro ao salvar nota');
      } finally {
        setIsMutating(false);
      }
    },
    [keywordId]
  );

  const updateNote = useCallback(async (id: string, noteText: string) => {
    setIsMutating(true);
    try {
      // Optimistic update
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, note: noteText.trim() } : n)));
      // REWIRED: Agent 4 api-sacred
      await apiUpdateNote(id, noteText.trim());
      toast.success('Nota atualizada');
    } catch (err) {
      console.error('[useStudentNotes] update error:', err);
      toast.error('Erro ao atualizar nota');
      await fetchNotes(); // rollback
    } finally {
      setIsMutating(false);
    }
  }, [fetchNotes]);

  // SACRED: Soft-delete ONLY
  const softDeleteNote = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, deleted_at: new Date().toISOString() } : n))
      );
      // REWIRED: Agent 4 api-sacred
      await softDeleteKwStudentNote(id);
      toast.success('Nota eliminada (pode ser restaurada)');
    } catch (err) {
      console.error('[useStudentNotes] softDelete error:', err);
      toast.error('Erro ao eliminar nota');
      await fetchNotes();
    } finally {
      setIsMutating(false);
    }
  }, [fetchNotes]);

  const restoreNote = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deleted_at: null } : n)));
      // REWIRED: Agent 4 api-sacred
      await apiRestoreNote(id);
      toast.success('Nota restaurada');
    } catch (err) {
      console.error('[useStudentNotes] restore error:', err);
      toast.error('Erro ao restaurar nota');
      await fetchNotes();
    } finally {
      setIsMutating(false);
    }
  }, [fetchNotes]);

  return {
    activeNotes,
    deletedNotes,
    isLoading,
    error,
    isMutating,
    createNote,
    updateNote,
    softDeleteNote,
    restoreNote,
    refetch: fetchNotes,
  };
}
