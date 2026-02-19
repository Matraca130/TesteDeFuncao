// ============================================================
// useStudentNotes — SACRED CRUD hook for keyword student notes
// Added by Agent 6 — PRISM — P3 Hook Layer
// SACRED: Soft-delete ONLY. NEVER hard delete KwStudentNote.
// TODO P3+: Replace mock calls with real Agent 4 API hooks
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_STUDENT_NOTES, type StudentNote } from '../data/mock-data';
import { mockFetchAll, mockCreate, mockUpdate, mockSoftDelete, mockRestore } from '../api-client/mock-api';

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
      const data = await mockFetchAll(MOCK_STUDENT_NOTES.filter((n) => n.keyword_id === keywordId));
      setNotes(data);
    } catch {
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
        const newNote: StudentNote = {
          id: `sn-${Date.now()}`,
          student_id: 's-1',
          keyword_id: keywordId,
          note: noteText.trim(),
          created_at: new Date().toISOString().split('T')[0],
          deleted_at: null,
        };
        await mockCreate(newNote);
        setNotes((prev) => [...prev, newNote]);
        toast.success('Nota salva');
      } catch {
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
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, note: noteText.trim() } : n)));
      await mockUpdate({ id, note: noteText.trim() });
      toast.success('Nota atualizada');
    } catch {
      toast.error('Erro ao atualizar nota');
      await fetchNotes();
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
      await mockSoftDelete(id);
      toast.success('Nota eliminada (pode ser restaurada)');
    } catch {
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
      await mockRestore(id);
      toast.success('Nota restaurada');
    } catch {
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
