// ============================================================
// useSmartStudy — Hook for smart study session items
// Added by Agent 6 — PRISM — P3 Hook Layer
//
// ⚠️ BLOCKED — Cannot rewire to Agent 4 api-client:
//   - Agent 4 has NO smart study API
//   - SmartStudyItem requires BKT p_know + NeedScore computation
//     which depends on Agent 2's FSRS engine + Agent 3's diagnostics
//   - Agent 3 has GET /diagnostics/summary/:summaryId but it returns
//     per-summary diagnostics, not a ranked keyword list
//   - Requires new api-smart-study.ts module with:
//     getSmartStudyItems(studentId), generateStudySession()
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MOCK_SMART_STUDY, type SmartStudyItem } from '../data/mock-data';
import { mockFetchAll, mockAIGenerate } from '../api-client/mock-api';

interface UseSmartStudyReturn {
  items: SmartStudyItem[];
  sortedItems: SmartStudyItem[];
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  needAttention: number;
  mastered: number;
  total: number;
  generateSession: () => Promise<void>;
  refetch: () => void;
}

export function useSmartStudy(): UseSmartStudyReturn {
  const [items, setItems] = useState<SmartStudyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchAll(MOCK_SMART_STUDY);
      setItems(data);
    } catch {
      setError('Erro ao carregar estudo inteligente');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.need_score - a.need_score),
    [items]
  );

  const needAttention = useMemo(() => items.filter((i) => i.p_know < 0.5).length, [items]);
  const mastered = useMemo(() => items.filter((i) => i.p_know >= 0.75).length, [items]);

  const generateSession = useCallback(async () => {
    setIsGenerating(true);
    try {
      const newItems = await mockAIGenerate(MOCK_SMART_STUDY, 1500);
      setItems(newItems);
      toast.success('Sessao de estudo gerada');
    } catch {
      toast.error('Erro ao gerar sessao');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    items,
    sortedItems,
    isLoading,
    error,
    isGenerating,
    needAttention,
    mastered,
    total: items.length,
    generateSession,
    refetch: fetchItems,
  };
}
