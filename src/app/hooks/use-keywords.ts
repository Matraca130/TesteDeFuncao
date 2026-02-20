// ============================================================
// useKeywords — CRUD hook for professor keywords
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Uses Agent 4 api-content (getKeywords) +
//          api-flashcards (KeywordSummaryLink for summary filter)
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Keyword } from '../data/mock-data';
import {
  getKeywords as apiGetKeywords,
  createKeyword as apiCreateKeyword,
  updateKeyword as apiUpdateKeyword,
  deleteKeyword as apiDeleteKeyword,
} from '../lib/api-content';
import {
  getKeywordsBySummary,
} from '../lib/api-flashcards';
import type { Keyword as A4Keyword } from '../lib/types';
import type { KeywordSummaryLink } from '../lib/types-extended';

// — Type Adapter: Agent 4 Keyword → Agent 6 Keyword —
// A4 has no summary_id (institution-level); resolved via KeywordSummaryLink
function toA6Keyword(a4: A4Keyword, summaryId?: string): Keyword {
  return {
    id: a4.id,
    term: a4.term,
    definition: a4.definition || '',
    priority: a4.priority ?? 0,
    summary_id: summaryId || '',
    status: (a4.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
    created_at: a4.created_at,
    deleted_at: null, // A4 uses hard delete
  };
}

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
      if (summaryId) {
        // REWIRED: Use KeywordSummaryLink to find keywords for this summary
        const links: KeywordSummaryLink[] = await getKeywordsBySummary(summaryId);
        const allKws = await apiGetKeywords();
        const linkedIds = new Set(links.map(l => l.keyword_id));
        const filtered = allKws.filter(kw => linkedIds.has(kw.id));
        setKeywords(filtered.map(kw => toA6Keyword(kw, summaryId)));
      } else {
        // Fetch all keywords
        const allKws = await apiGetKeywords();
        setKeywords(allKws.map(kw => toA6Keyword(kw)));
      }
    } catch (err) {
      console.error('[useKeywords] fetch error:', err);
      setError('Erro ao carregar keywords');
    } finally {
      setIsLoading(false);
    }
  }, [summaryId]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const filteredKeywords = useMemo(
    () => keywords.filter((kw) => kw.deleted_at === null),
    [keywords]
  );

  const createKeyword = useCallback(
    async (data: Omit<Keyword, 'id' | 'created_at' | 'deleted_at'>) => {
      setIsMutating(true);
      try {
        // REWIRED: Agent 4 api-content
        const a4Kw = await apiCreateKeyword({
          term: data.term,
          definition: data.definition,
          priority: data.priority,
          status: data.status,
        });
        setKeywords((prev) => [...prev, toA6Keyword(a4Kw, data.summary_id)]);
        toast.success('Keyword criada com sucesso');
      } catch (err) {
        console.error('[useKeywords] create error:', err);
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
      setKeywords((prev) => prev.map((kw) => (kw.id === id ? { ...kw, ...data } : kw)));
      // REWIRED: Agent 4 api-content
      await apiUpdateKeyword(id, {
        ...(data.term !== undefined && { term: data.term }),
        ...(data.definition !== undefined && { definition: data.definition }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.status !== undefined && { status: data.status }),
      });
      toast.success('Keyword atualizada');
    } catch (err) {
      console.error('[useKeywords] update error:', err);
      toast.error('Erro ao atualizar keyword');
      await fetchKeywords();
    } finally {
      setIsMutating(false);
    }
  }, [fetchKeywords]);

  const deleteKeyword = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setKeywords((prev) => prev.filter((kw) => kw.id !== id));
      // REWIRED: Agent 4 api-content (hard delete)
      await apiDeleteKeyword(id);
      toast.success('Keyword eliminada');
    } catch (err) {
      console.error('[useKeywords] delete error:', err);
      toast.error('Erro ao eliminar keyword');
      await fetchKeywords();
    } finally {
      setIsMutating(false);
    }
  }, [fetchKeywords]);

  const generateAI = useCallback(async (_sid: string) => {
    setIsGenerating(true);
    try {
      // TODO: Wire to Gemini AI generation endpoint when available
      const a4Kw = await apiCreateKeyword({
        term: 'Complexo de Golgi',
        definition: 'Organela responsavel pela modificacao, empacotamento e transporte de proteinas e lipidios.',
        priority: 4,
        status: 'draft',
        source: 'ai',
      });
      setKeywords((prev) => [...prev, toA6Keyword(a4Kw, _sid)]);
      toast.success('Keyword gerada com IA');
    } catch (err) {
      console.error('[useKeywords] generateAI error:', err);
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
