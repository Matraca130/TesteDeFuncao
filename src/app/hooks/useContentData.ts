// ============================================================
// Axon v4.4 — useContentData (REWIRED by Agent 4 P3)
// NOW: imports from api-client.ts directly (3-layer rule compliant)
// BEFORE: used useApi() from api-provider.tsx (old ApiClient pattern)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { fetchContentHierarchy } from '../lib/api-client';
import type {
  Course,
  Semester,
  Section,
  Topic,
  Summary,
  Keyword,
} from '../lib/types';

export type { Course, Semester, Section, Topic, Summary, Keyword };

export type ContentEndpoint =
  | 'courses'
  | 'semesters'
  | 'sections'
  | 'topics'
  | 'summaries'
  | 'keywords';

export interface UseContentDataOptions {
  include?: ContentEndpoint[];
  autoFetch?: boolean;
}

export interface ContentData {
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  topics: Topic[];
  summaries: Summary[];
  keywords: Keyword[];
}

export interface UseContentDataReturn extends ContentData {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ALL_ENDPOINTS: ContentEndpoint[] = [
  'courses', 'semesters', 'sections', 'topics', 'summaries', 'keywords',
];

const EMPTY: ContentData = {
  courses: [],
  semesters: [],
  sections: [],
  topics: [],
  summaries: [],
  keywords: [],
};

export function useContentData(
  options: UseContentDataOptions = {},
): UseContentDataReturn {
  const { include = ALL_ENDPOINTS, autoFetch = true } = options;

  const [data, setData] = useState<ContentData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hierarchy = await fetchContentHierarchy();
      const next: ContentData = { ...EMPTY };
      for (const key of include) {
        (next as any)[key] = hierarchy[key] || [];
      }
      setData(next);
    } catch (err: any) {
      console.error('[useContentData] fetch error:', err);
      setError(err?.message || 'Failed to fetch content data');
    } finally {
      setLoading(false);
    }
  }, [include]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...data,
    loading,
    error,
    refresh,
  };
}
