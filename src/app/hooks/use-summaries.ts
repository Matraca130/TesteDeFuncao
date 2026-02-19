// ============================================================
// useSummaries — Hook for summaries list
// Added by Agent 6 — PRISM — P3 Hook Layer
// TODO P3+: Replace mockFetchAll with GET /api/summaries
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { MOCK_SUMMARIES, type Summary } from '../data/mock-data';
import { mockFetchAll } from '../api-client/mock-api';

interface UseSummariesReturn {
  summaries: Summary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  getSummaryById: (id: string) => Summary | undefined;
}

export function useSummaries(): UseSummariesReturn {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO P3+: Replace with real API call
      const data = await mockFetchAll(MOCK_SUMMARIES);
      setSummaries(data);
    } catch {
      setError('Erro ao carregar resumos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const getSummaryById = useCallback(
    (id: string) => summaries.find((s) => s.id === id),
    [summaries]
  );

  return { summaries, isLoading, error, refetch: fetchSummaries, getSummaryById };
}