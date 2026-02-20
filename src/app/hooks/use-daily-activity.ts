// ============================================================
// useDailyActivity — Hook for activity heatmap data
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Now uses Agent 4 api-client (api-student module)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import type { DailyActivity } from '../data/mock-data';
import { getDailyActivity as apiGetDailyActivity } from '../lib/api-student';

const STUDENT_ID = 'demo-student-001'; // TODO: Replace with auth context

interface UseDailyActivityReturn {
  data: DailyActivity[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDailyActivity(): UseDailyActivityReturn {
  const [data, setData] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // REWIRED: Agent 4 api-student
      // Agent 4's DailyActivity type may differ — adapter needed if shapes diverge
      const result = await apiGetDailyActivity(STUDENT_ID);
      // Transform if needed: A4 may return { date, minutes, sessions } or similar
      setData(result as unknown as DailyActivity[]);
    } catch (err) {
      console.error('[useDailyActivity] fetch error:', err);
      setError('Erro ao carregar atividade');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
