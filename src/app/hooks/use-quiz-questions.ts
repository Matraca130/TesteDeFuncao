// ============================================================
// useQuizQuestions — CRUD hook for professor quiz questions
// Added by Agent 6 — PRISM — P3 Hook Layer
// TODO P3+: Replace mock calls with real Agent 4 API hooks
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_QUIZ_QUESTIONS, type QuizQuestion } from '../data/mock-data';
import { mockFetchAll, mockCreate, mockUpdate, mockSoftDelete } from '../api-client/mock-api';

interface UseQuizQuestionsOptions {
  summaryId?: string;
  keywordId?: string;
  quizType?: string;
}

interface UseQuizQuestionsReturn {
  questions: QuizQuestion[];
  filteredQuestions: QuizQuestion[];
  isLoading: boolean;
  error: string | null;
  isMutating: boolean;
  createQuestion: (data: Omit<QuizQuestion, 'id' | 'deleted_at'>) => Promise<void>;
  updateQuestion: (id: string, data: Partial<QuizQuestion>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useQuizQuestions({
  summaryId,
  keywordId,
  quizType,
}: UseQuizQuestionsOptions = {}): UseQuizQuestionsReturn {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchAll(MOCK_QUIZ_QUESTIONS);
      setQuestions(data);
    } catch {
      setError('Erro ao carregar perguntas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filteredQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          q.deleted_at === null &&
          (!summaryId || q.summary_id === summaryId) &&
          (!keywordId || keywordId === 'all' || q.keyword_id === keywordId) &&
          (!quizType || quizType === 'all' || q.quiz_type === quizType)
      ),
    [questions, summaryId, keywordId, quizType]
  );

  const createQuestion = useCallback(
    async (data: Omit<QuizQuestion, 'id' | 'deleted_at'>) => {
      setIsMutating(true);
      try {
        const newQ: QuizQuestion = { ...data, id: `qq-${Date.now()}`, deleted_at: null };
        await mockCreate(newQ);
        setQuestions((prev) => [...prev, newQ]);
        toast.success('Pergunta criada com sucesso');
      } catch {
        toast.error('Erro ao criar pergunta');
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateQuestion = useCallback(async (id: string, data: Partial<QuizQuestion>) => {
    setIsMutating(true);
    try {
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...data } : q)));
      await mockUpdate({ id, ...data });
      toast.success('Pergunta atualizada');
    } catch {
      toast.error('Erro ao atualizar pergunta');
      await fetchQuestions();
    } finally {
      setIsMutating(false);
    }
  }, [fetchQuestions]);

  const deleteQuestion = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, deleted_at: new Date().toISOString() } : q))
      );
      await mockSoftDelete(id);
      toast.success('Pergunta eliminada');
    } catch {
      toast.error('Erro ao eliminar pergunta');
      await fetchQuestions();
    } finally {
      setIsMutating(false);
    }
  }, [fetchQuestions]);

  return {
    questions,
    filteredQuestions,
    isLoading,
    error,
    isMutating,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    refetch: fetchQuestions,
  };
}