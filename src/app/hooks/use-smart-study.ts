// ============================================================
// useSmartStudy — Hook for smart study session items
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Uses Agent 4 api-smart-study
// NOTE: Adapter — A4 SmartStudyRecommendation ↔ A6 SmartStudyItem
// A4: { type, resource_name, reason, priority, estimated_minutes }
// A6: { keyword_id, term, need_score, p_know, last_studied }
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { SmartStudyItem } from '../data/mock-data';
import {
  getSmartRecommendations,
  dismissRecommendation,
} from '../lib/api-client';
import type { SmartStudyRecommendation } from '../lib/types-extended';

const STUDENT_ID = 'demo-student-001'; // TODO: Replace with auth context

// — Type Adapter: Agent 4 SmartStudyRecommendation → Agent 6 SmartStudyItem —
// A4 has priority-based recommendations; A6 expects BKT-based keyword ranking.
// We approximate: priority → need_score (inverse), reason text → p_know estimate
function toA6SmartItem(rec: SmartStudyRecommendation): SmartStudyItem {
  // Map priority (1=highest need) to need_score (0-1, higher = more need)
  const need_score = Math.max(0, Math.min(1, 1 - (rec.priority - 1) * 0.2));
  // Estimate p_know as inverse of need
  const p_know = 1 - need_score;
  return {
    keyword_id: rec.resource_id,
    term: rec.resource_name,
    need_score,
    p_know,
    last_studied: rec.created_at.split('T')[0],
  };
}

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
      // REWIRED: Agent 4 api-smart-study
      const recs = await getSmartRecommendations(STUDENT_ID, 20);
      setItems(recs.map(toA6SmartItem));
    } catch (err) {
      console.error('[useSmartStudy] fetch error:', err);
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
      // Re-fetch recommendations (server generates new ones)
      const recs = await getSmartRecommendations(STUDENT_ID, 20);
      setItems(recs.map(toA6SmartItem));
      toast.success('Sessao de estudo gerada');
    } catch (err) {
      console.error('[useSmartStudy] generateSession error:', err);
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
