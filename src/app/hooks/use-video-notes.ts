// ============================================================
// useVideoNotes — SACRED CRUD hook for video annotations
// Added by Agent 6 — PRISM — P3 Hook Layer
// SACRED: Soft-delete ONLY. NEVER hard delete VideoNote.
// TODO P3+: Replace mock calls with real Agent 4 API hooks
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_VIDEO_NOTES, type VideoNote } from '../data/mock-data';
import { mockFetchAll, mockCreate, mockUpdate, mockSoftDelete, mockRestore } from '../api-client/mock-api';
import { formatTimestamp } from '../utils/media-helpers';

interface UseVideoNotesOptions {
  videoId: string;
}

interface UseVideoNotesReturn {
  activeNotes: VideoNote[];
  deletedNotes: VideoNote[];
  isLoading: boolean;
  error: string | null;
  isMutating: boolean;
  createNote: (note: string, timestampSeconds: number | null) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  softDeleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  exportNotes: () => void;
  refetch: () => void;
}

export function useVideoNotes({ videoId }: UseVideoNotesOptions): UseVideoNotesReturn {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchAll(MOCK_VIDEO_NOTES.filter((n) => n.video_id === videoId));
      setNotes(data);
    } catch {
      setError('Erro ao carregar notas');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const activeNotes = useMemo(
    () =>
      notes
        .filter((n) => n.deleted_at === null)
        .sort((a, b) => {
          if (a.timestamp_seconds === null && b.timestamp_seconds === null) return 0;
          if (a.timestamp_seconds === null) return 1;
          if (b.timestamp_seconds === null) return -1;
          return a.timestamp_seconds - b.timestamp_seconds;
        }),
    [notes]
  );

  const deletedNotes = useMemo(
    () => notes.filter((n) => n.deleted_at !== null),
    [notes]
  );

  const createNote = useCallback(
    async (noteText: string, timestampSeconds: number | null) => {
      setIsMutating(true);
      try {
        const newNote: VideoNote = {
          id: `vn-${Date.now()}`,
          student_id: 's-1',
          video_id: videoId,
          note: noteText.trim(),
          timestamp_seconds: timestampSeconds,
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
    [videoId]
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

  const exportNotes = useCallback(() => {
    const text = activeNotes
      .map((n) => {
        const ts = n.timestamp_seconds !== null ? `[${formatTimestamp(n.timestamp_seconds)}] ` : '';
        return `${ts}${n.note}`;
      })
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notas-video.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notas exportadas');
  }, [activeNotes]);

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
    exportNotes,
    refetch: fetchNotes,
  };
}