// ============================================================
// useQuizQuestions — CRUD hook for professor quiz questions
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Now uses Agent 4 api-client (api-quiz-content module)
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { QuizQuestion } from '../data/mock-data';
import {
  getQuizQuestionsBySummary,
  createQuizQuestion as apiCreateQuestion,
  updateQuizQuestion as apiUpdateQuestion,
  deleteQuizQuestion as apiDeleteQuestion,
} from '../lib/api-quiz-content';
import type { QuizQuestion as A4QuizQuestion } from '../lib/types-extended';

// — Type Adapter: Agent 4 QuizQuestion → Agent 6 QuizQuestion —
// A4: question_text, question_type ('multiple-choice'|'fill-blank'|'write-in'|'true-false')
// A6: question, quiz_type ('mcq'|'true_false'|'fill_blank'|'open')
const A4_TO_A6_TYPE: Record<string, QuizQuestion['quiz_type']> = {
  'multiple-choice': 'mcq',
  'true-false': 'true_false',
  'fill-blank': 'fill_blank',
  'write-in': 'open',
};
const A6_TO_A4_TYPE: Record<string, A4QuizQuestion['question_type']> = {
  'mcq': 'multiple-choice',
  'true_false': 'true-false',
  'fill_blank': 'fill-blank',
  'open': 'write-in',
};
const DIFFICULTY_MAP: Record<number, QuizQuestion['difficulty_tier']> = {
  1: 'easy', 2: 'medium', 3: 'hard', 4: 'hard', 5: 'hard',
};

function toA6Question(a4: A4QuizQuestion): QuizQuestion {
  return {
    id: a4.id,
    question: a4.question_text,
    quiz_type: A4_TO_A6_TYPE[a4.question_type] || 'mcq',
    options: a4.options,
    correct_answer: a4.correct_answer,
    keyword_id: a4.keyword_id,
    summary_id: a4.summary_id || '',
    difficulty_tier: DIFFICULTY_MAP[a4.difficulty] || 'medium',
    deleted_at: null,
  };
}

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
      // REWIRED: Agent 4 api-quiz-content
      const sid = summaryId || 'sum-femur-1';
      const a4Questions = await getQuizQuestionsBySummary(sid);
      setQuestions(a4Questions.map(toA6Question));
    } catch (err) {
      console.error('[useQuizQuestions] fetch error:', err);
      setError('Erro ao carregar perguntas');
    } finally {
      setIsLoading(false);
    }
  }, [summaryId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filteredQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          q.deleted_at === null &&
          (!keywordId || keywordId === 'all' || q.keyword_id === keywordId) &&
          (!quizType || quizType === 'all' || q.quiz_type === quizType)
      ),
    [questions, keywordId, quizType]
  );

  const createQuestion = useCallback(
    async (data: Omit<QuizQuestion, 'id' | 'deleted_at'>) => {
      setIsMutating(true);
      try {
        // REWIRED: Agent 4 api-quiz-content — adapt types
        const a4Q = await apiCreateQuestion({
          question_text: data.question,
          question_type: A6_TO_A4_TYPE[data.quiz_type] || 'multiple-choice',
          options: data.options || [],
          correct_answer: String(data.correct_answer),
          keyword_id: data.keyword_id,
          summary_id: data.summary_id || null,
          difficulty: data.difficulty_tier === 'easy' ? 1 : data.difficulty_tier === 'hard' ? 3 : 2,
          status: 'draft',
        });
        setQuestions((prev) => [...prev, toA6Question(a4Q)]);
        toast.success('Pergunta criada com sucesso');
      } catch (err) {
        console.error('[useQuizQuestions] create error:', err);
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
      // REWIRED: Agent 4 api-quiz-content
      const a4Data: Record<string, unknown> = {};
      if (data.question !== undefined) a4Data.question_text = data.question;
      if (data.quiz_type !== undefined) a4Data.question_type = A6_TO_A4_TYPE[data.quiz_type];
      if (data.options !== undefined) a4Data.options = data.options;
      if (data.correct_answer !== undefined) a4Data.correct_answer = String(data.correct_answer);
      if (data.difficulty_tier !== undefined) a4Data.difficulty = data.difficulty_tier === 'easy' ? 1 : data.difficulty_tier === 'hard' ? 3 : 2;
      await apiUpdateQuestion(id, a4Data);
      toast.success('Pergunta atualizada');
    } catch (err) {
      console.error('[useQuizQuestions] update error:', err);
      toast.error('Erro ao atualizar pergunta');
      await fetchQuestions();
    } finally {
      setIsMutating(false);
    }
  }, [fetchQuestions]);

  const deleteQuestion = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      // REWIRED: Agent 4 api-quiz-content (hard delete)
      await apiDeleteQuestion(id);
      toast.success('Pergunta eliminada');
    } catch (err) {
      console.error('[useQuizQuestions] delete error:', err);
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
