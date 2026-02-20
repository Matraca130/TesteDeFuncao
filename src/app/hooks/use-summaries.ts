// ============================================================
// useSummaries — Hook for summaries list
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Uses Agent 4 api-content fetchContentHierarchy
// Note: A4 Summary lacks 'title'; derived from topic name or id
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import type { Summary } from '../data/mock-data';
import { fetchContentHierarchy } from '../lib/api-client';

// — Type Adapter: Agent 4 Summary → Agent 6 Summary —
// A4: { id, topic_id, content_markdown, status, ... } — NO title
// A6: { id, title, status, topic_id }
function deriveTitle(a4Sum: { id: string; topic_id: string; content_markdown?: string }, topicNames: Map<string, string>): string {
  // Use topic name as title, fallback to first line of content or id
  const topicName = topicNames.get(a4Sum.topic_id);
  if (topicName) return topicName;
  if (a4Sum.content_markdown) {
    const firstLine = a4Sum.content_markdown.split('\n')[0].replace(/^#+\s*/, '').trim();
    if (firstLine && firstLine.length < 80) return firstLine;
  }
  return `Resumo ${a4Sum.id}`;
}

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
      // REWIRED: Agent 4 api-content — fetch entire hierarchy
      const hierarchy = await fetchContentHierarchy();
      const topicNames = new Map(hierarchy.topics.map(t => [t.id, t.name]));
      const a6Summaries: Summary[] = hierarchy.summaries.map(s => ({
        id: s.id,
        title: deriveTitle(s, topicNames),
        status: (s.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
        topic_id: s.topic_id,
      }));
      setSummaries(a6Summaries);
    } catch (err) {
      console.error('[useSummaries] fetch error:', err);
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
