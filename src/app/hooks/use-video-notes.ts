// ============================================================
// useVideoNotes — SACRED CRUD hook for video annotations
// Added by Agent 6 — PRISM — P3 Hook Layer
// SACRED: Soft-delete ONLY. NEVER hard delete VideoNote.
// REWIRED: Now uses Agent 4 api-client (api-sacred module)
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { VideoNote } from '../data/mock-data';
import {
  getVideoNotesByVideo,
  createVideoNote as apiCreateVideoNote,
  updateVideoNote as apiUpdateVideoNote,
  softDeleteVideoNote,
  restoreVideoNote as apiRestoreVideoNote,
} from '../lib/api-client';
import type { VideoNote as A4VideoNote } from '../lib/types';
import { formatTimestamp } from '../utils/media-helpers';

// ── Type Adapter: Agent 4 VideoNote → Agent 6 VideoNote ──
// Agent 4: { content, timestamp_ms } | Agent 6: { note, timestamp_seconds }
const STUDENT_ID = 'demo-student-001'; // TODO: Replace with auth context

function toA6VideoNote(a4: A4VideoNote): VideoNote {
  return {
    id: a4.id,
    student_id: a4.student_id,
    video_id: a4.video_id,
    note: a4.content,
    timestamp_seconds: a4.timestamp_ms != null ? Math.round(a4.timestamp_ms / 1000) : null,
    created_at: a4.created_at,
    deleted_at: a4.deleted_at,
  };
}

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
      // REWIRED: Agent 4 api-sacred
      const a4Notes = await getVideoNotesByVideo(videoId, STUDENT_ID);
      setNotes(a4Notes.map(toA6VideoNote));
    } catch (err) {
      console.error('[useVideoNotes] fetch error:', err);
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
        // REWIRED: Agent 4 api-sacred — converts seconds → ms
        const timestampMs = timestampSeconds != null ? timestampSeconds * 1000 : null;
        const a4Note = await apiCreateVideoNote(videoId, STUDENT_ID, noteText.trim(), timestampMs);
        setNotes((prev) => [...prev, toA6VideoNote(a4Note)]);
        toast.success('Nota salva');
      } catch (err) {
        console.error('[useVideoNotes] create error:', err);
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
      // Optimistic update
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, note: noteText.trim() } : n)));
      // REWIRED: Agent 4 api-sacred
      await apiUpdateVideoNote(id, noteText.trim());
      toast.success('Nota atualizada');
    } catch (err) {
      console.error('[useVideoNotes] update error:', err);
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
      // Optimistic update
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, deleted_at: new Date().toISOString() } : n))
      );
      // REWIRED: Agent 4 api-sacred — softDeleteVideoNote
      await softDeleteVideoNote(id);
      toast.success('Nota eliminada (pode ser restaurada)');
    } catch (err) {
      console.error('[useVideoNotes] softDelete error:', err);
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
      // REWIRED: Agent 4 api-sacred — restoreVideoNote
      await apiRestoreVideoNote(id);
      toast.success('Nota restaurada');
    } catch (err) {
      console.error('[useVideoNotes] restore error:', err);
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
