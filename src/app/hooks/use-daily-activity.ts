// ============================================================
// useDailyActivity — Hook for activity heatmap data
// Added by Agent 6 — PRISM — P3 Hook Layer
// TODO P3+: Replace mock calls with real Agent 4 API hooks
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { MOCK_DAILY_ACTIVITY, type DailyActivity } from '../data/mock-data';
import { mockFetchAll } from '../api-client/mock-api';

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
      const result = await mockFetchAll(MOCK_DAILY_ACTIVITY);
      setData(result);
    } catch {
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
