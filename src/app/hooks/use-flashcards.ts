// ============================================================
// useFlashcards — CRUD hook for professor flashcards
// Added by Agent 6 — PRISM — P3 Hook Layer
//
// ⚠️ BLOCKED — Cannot rewire to Agent 4 api-client:
//   - Agent 4 has NO flashcard CRUD API for professors
//   - Agent 4 only has submitFlashcardReview() (student-facing)
//   - Requires new api-flashcards.ts module with:
//     getFlashcards(summaryId), createFlashcard(), updateFlashcard(),
//     deleteFlashcard() (soft-delete since student data)
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_FLASHCARDS, type Flashcard } from '../data/mock-data';
import { mockFetchAll, mockCreate, mockUpdate, mockSoftDelete } from '../api-client/mock-api';

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
      const data = await mockFetchAll(MOCK_FLASHCARDS);
      setFlashcards(data);
    } catch {
      setError('Erro ao carregar flashcards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const filteredFlashcards = useMemo(
    () =>
      flashcards.filter(
        (fc) =>
          fc.deleted_at === null &&
          (!summaryId || fc.summary_id === summaryId) &&
          (!keywordId || keywordId === 'all' || fc.keyword_id === keywordId)
      ),
    [flashcards, summaryId, keywordId]
  );

  const createFlashcard = useCallback(
    async (data: Omit<Flashcard, 'id' | 'deleted_at'>) => {
      setIsMutating(true);
      try {
        const newFc: Flashcard = { ...data, id: `fc-${Date.now()}`, deleted_at: null };
        await mockCreate(newFc);
        setFlashcards((prev) => [...prev, newFc]);
        toast.success('Flashcard criada com sucesso');
      } catch {
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
      await mockUpdate({ id, ...data });
      toast.success('Flashcard atualizada');
    } catch {
      toast.error('Erro ao atualizar flashcard');
      await fetchFlashcards();
    } finally {
      setIsMutating(false);
    }
  }, [fetchFlashcards]);

  const deleteFlashcard = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setFlashcards((prev) =>
        prev.map((fc) => (fc.id === id ? { ...fc, deleted_at: new Date().toISOString() } : fc))
      );
      await mockSoftDelete(id);
      toast.success('Flashcard eliminada');
    } catch {
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
