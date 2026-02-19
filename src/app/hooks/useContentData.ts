// ============================================================
// Axon v4.4 — useContentData (shared content-fetching hook)
// Replaces the duplicated fetchData pattern in:
//   - StudyDashboard.tsx
//   - ProfessorDashboard.tsx
//   - LegacyAdminPanel.tsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../lib/api-provider';
import type {
  Course,
  Semester,
  Section,
  Topic,
  Summary,
  Keyword,
} from '../lib/types';

// Re-export so consumers can import types from here too
export type { Course, Semester, Section, Topic, Summary, Keyword };

// ── Configuration ────────────────────────────────────────

export type ContentEndpoint =
  | 'courses'
  | 'semesters'
  | 'sections'
  | 'topics'
  | 'summaries'
  | 'keywords';

const ALL_ENDPOINTS: ContentEndpoint[] = [
  'courses',
  'semesters',
  'sections',
  'topics',
  'summaries',
  'keywords',
];

export interface UseContentDataOptions {
  /**
   * Which endpoints to fetch. Defaults to all 6.
   * Use this to skip endpoints a page doesn't need
   * (e.g. ProfessorDashboard doesn't need 'keywords').
   */
  include?: ContentEndpoint[];

  /** Whether to fetch automatically on mount. Default: true */
  autoFetch?: boolean;
}

// ── Return type ─────────────────────────────────────────

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

// ── Hook ──────────────────────────────────────────────

const EMPTY: ContentData = {
  courses: [],
  semesters: [],
  sections: [],
  topics: [],
  summaries: [],
  keywords: [],
};

/**
 * Shared hook for fetching the content hierarchy from the API.
 *
 * @example
 * // Fetch everything (StudyDashboard, LegacyAdminPanel)
 * const { courses, semesters, sections, topics, summaries, keywords, loading, refresh } =
 *   useContentData();
 *
 * @example
 * // Fetch only what ProfessorDashboard needs (no keywords)
 * const { courses, semesters, sections, topics, summaries, loading, refresh } =
 *   useContentData({ include: ['courses', 'semesters', 'sections', 'topics', 'summaries'] });
 */
export function useContentData(
  options: UseContentDataOptions = {},
): UseContentDataReturn {
  const { include = ALL_ENDPOINTS, autoFetch = true } = options;
  const { api } = useApi();

  const [data, setData] = useState<ContentData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build fetch promises only for requested endpoints
      const entries = include.map((key) => ({
        key,
        promise: api.get(`/${key}`),
      }));

      const results = await Promise.allSettled(
        entries.map((e) => e.promise),
      );

      const next: ContentData = { ...EMPTY };

      for (let i = 0; i < entries.length; i++) {
        const { key } = entries[i];
        const result = results[i];

        if (result.status === 'fulfilled' && result.value.ok) {
          try {
            const json = await result.value.json();
            // API returns { [key]: [...] } or just [...]
            const arr = Array.isArray(json)
              ? json
              : Array.isArray(json[key])
              ? json[key]
              : [];
            (next as any)[key] = arr;
          } catch {
            // JSON parse failed — leave empty array
          }
        }
      }

      setData(next);
    } catch (err: any) {
      console.error('[useContentData] fetch error:', err);
      setError(err?.message || 'Failed to fetch content data');
    } finally {
      setLoading(false);
    }
  }, [api, include]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: refresh is intentionally excluded to avoid re-fetching
  // on every render when `include` array reference changes.
  // Consumers can call refresh() manually when needed.

  return {
    ...data,
    loading,
    error,
    refresh,
  };
}
