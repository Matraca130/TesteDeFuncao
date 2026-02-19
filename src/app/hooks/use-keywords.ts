// ============================================================
// useKeywords — CRUD hook for professor keywords
// Added by Agent 6 — PRISM — P3 Hook Layer
// TODO P3+: Replace mock calls with real Agent 4 API hooks
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_KEYWORDS, type Keyword } from '../data/mock-data';
import { mockFetchAll, mockCreate, mockUpdate, mockSoftDelete, mockAIGenerate } from '../api-client/mock-api';

interface UseKeywordsOptions {
  summaryId?: string;
}

interface UseKeywordsReturn {
  keywords: Keyword[];
  filteredKeywords: Keyword[];
  isLoading: boolean;
  error: string | null;
  isMutating: boolean;
  isGenerating: boolean;
  createKeyword: (data: Omit<Keyword, 'id' | 'created_at' | 'deleted_at'>) => Promise<void>;
  updateKeyword: (id: string, data: Partial<Keyword>) => Promise<void>;
  deleteKeyword: (id: string) => Promise<void>;
  generateAI: (summaryId: string) => Promise<void>;
  refetch: () => void;
}

export function useKeywords({ summaryId }: UseKeywordsOptions = {}): UseKeywordsReturn {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchKeywords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchAll(MOCK_KEYWORDS);
      setKeywords(data);
    } catch {
      setError('Erro ao carregar keywords');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const filteredKeywords = useMemo(
    () =>
      keywords.filter(
        (kw) =>
          kw.deleted_at === null &&
          (!summaryId || kw.summary_id === summaryId)
      ),
    [keywords, summaryId]
  );

  const createKeyword = useCallback(
    async (data: Omit<Keyword, 'id' | 'created_at' | 'deleted_at'>) => {
      setIsMutating(true);
      try {
        const newKw: Keyword = {
          ...data,
          id: `kw-${Date.now()}`,
          created_at: new Date().toISOString().split('T')[0],
          deleted_at: null,
        };
        await mockCreate(newKw);
        setKeywords((prev) => [...prev, newKw]);
        toast.success('Keyword criada com sucesso');
      } catch {
        toast.error('Erro ao criar keyword');
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const updateKeyword = useCallback(async (id: string, data: Partial<Keyword>) => {
    setIsMutating(true);
    try {
      setKeywords((prev) =>
        prev.map((kw) => (kw.id === id ? { ...kw, ...data } : kw))
      );
      await mockUpdate({ id, ...data });
      toast.success('Keyword atualizada');
    } catch {
      toast.error('Erro ao atualizar keyword');
      await fetchKeywords(); // rollback
    } finally {
      setIsMutating(false);
    }
  }, [fetchKeywords]);

  const deleteKeyword = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      // Soft-delete (R05)
      setKeywords((prev) =>
        prev.map((kw) =>
          kw.id === id ? { ...kw, deleted_at: new Date().toISOString() } : kw
        )
      );
      await mockSoftDelete(id);
      toast.success('Keyword eliminada');
    } catch {
      toast.error('Erro ao eliminar keyword');
      await fetchKeywords();
    } finally {
      setIsMutating(false);
    }
  }, [fetchKeywords]);

  const generateAI = useCallback(async (sid: string) => {
    setIsGenerating(true);
    try {
      const generated: Keyword = await mockAIGenerate({
        id: `kw-ai-${Date.now()}`,
        term: 'Complexo de Golgi',
        definition: 'Organela responsavel pela modificacao, empacotamento e transporte de proteinas e lipidios.',
        priority: 4,
        summary_id: sid,
        status: 'draft' as const,
        created_at: new Date().toISOString().split('T')[0],
        deleted_at: null,
      });
      setKeywords((prev) => [...prev, generated]);
      toast.success('Keyword gerada com IA');
    } catch {
      toast.error('Erro ao gerar keyword com IA');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    keywords,
    filteredKeywords,
    isLoading,
    error,
    isMutating,
    isGenerating,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    generateAI,
    refetch: fetchKeywords,
  };
}
