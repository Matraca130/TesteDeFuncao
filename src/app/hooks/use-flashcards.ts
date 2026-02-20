// ============================================================
// useFlashcards — CRUD hook for professor flashcards
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Now uses Agent 4 api-client (api-flashcards module)
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Flashcard } from '../data/mock-data';
import {
  getFlashcardsBySummary,
  createFlashcard as apiCreateFlashcard,
  updateFlashcard as apiUpdateFlashcard,
  deleteFlashcard as apiDeleteFlashcard,
} from '../lib/api-client';
import type { FlashcardCard } from '../lib/types';

// — Type Adapter: Agent 4 FlashcardCard → Agent 6 Flashcard —
function toA6Flashcard(a4: FlashcardCard): Flashcard {
  return {
    id: a4.id,
    front: a4.front,
    back: a4.back,
    keyword_id: a4.keyword_id,
    summary_id: a4.summary_id,
    status: (a4.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
    deleted_at: null, // A4 uses hard delete
  };
}

interface UseFlashcardsOptions {
  summaryId?: string;
  keywordId?: string;
}

interface UseFlashcardsReturn {
  flashcards: Flashcard[];
  filteredFlashcards: Flashcard[];
  isLoading: boolean;
  error: string | null;
  isMutating: boolean;
  createFlashcard: (data: Omit<Flashcard, 'id' | 'deleted_at'>) => Promise<void>;
  updateFlashcard: (id: string, data: Partial<Flashcard>) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useFlashcards({ summaryId, keywordId }: UseFlashcardsOptions = {}): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // REWIRED: Agent 4 api-flashcards
      const sid = summaryId || 'sum-femur-1';
      const a4Cards = await getFlashcardsBySummary(sid);
      setFlashcards(a4Cards.map(toA6Flashcard));
    } catch (err) {
      console.error('[useFlashcards] fetch error:', err);
      setError('Erro ao carregar flashcards');
    } finally {
      setIsLoading(false);
    }
  }, [summaryId]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const filteredFlashcards = useMemo(
    () =>
      flashcards.filter(
        (fc) =>
          fc.deleted_at === null &&
          (!keywordId || keywordId === 'all' || fc.keyword_id === keywordId)
      ),
    [flashcards, keywordId]
  );

  const createFlashcard = useCallback(
    async (data: Omit<Flashcard, 'id' | 'deleted_at'>) => {
      setIsMutating(true);
      try {
        // REWIRED: Agent 4 api-flashcards
        const a4Card = await apiCreateFlashcard({
          front: data.front,
          back: data.back,
          keyword_id: data.keyword_id,
          summary_id: data.summary_id,
          status: data.status,
        });
        setFlashcards((prev) => [...prev, toA6Flashcard(a4Card)]);
        toast.success('Flashcard criada com sucesso');
      } catch (err) {
        console.error('[useFlashcards] create error:', err);
        toast.error('Erro ao criar flashcard');
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateFlashcard = useCallback(async (id: string, data: Partial<Flashcard>) => {
    setIsMutating(true);
    try {
      setFlashcards((prev) => prev.map((fc) => (fc.id === id ? { ...fc, ...data } : fc)));
      // REWIRED: Agent 4 api-flashcards
      await apiUpdateFlashcard(id, {
        ...(data.front !== undefined && { front: data.front }),
        ...(data.back !== undefined && { back: data.back }),
        ...(data.status !== undefined && { status: data.status }),
      });
      toast.success('Flashcard atualizada');
    } catch (err) {
      console.error('[useFlashcards] update error:', err);
      toast.error('Erro ao atualizar flashcard');
      await fetchFlashcards();
    } finally {
      setIsMutating(false);
    }
  }, [fetchFlashcards]);

  const deleteFlashcard = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setFlashcards((prev) => prev.filter((fc) => fc.id !== id));
      // REWIRED: Agent 4 api-flashcards (hard delete)
      await apiDeleteFlashcard(id);
      toast.success('Flashcard eliminada');
    } catch (err) {
      console.error('[useFlashcards] delete error:', err);
      toast.error('Erro ao eliminar flashcard');
      await fetchFlashcards();
    } finally {
      setIsMutating(false);
    }
  }, [fetchFlashcards]);

  return {
    flashcards,
    filteredFlashcards,
    isLoading,
    error,
    isMutating,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    refetch: fetchFlashcards,
  };
}
