// ══════════════════════════════════════════════════════════════
// Axon v4.2 — useKeywordPopup hook (Capa 2)
// Loads KeywordPopupData when keywordId changes.
// Components NEVER call fetch directly — they use this hook.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import * as api from '../services/keywordPopupApi';
import type { KeywordPopupData } from '../services/types';

export function useKeywordPopup(keywordId: string | null) {
  const [data, setData] = useState<KeywordPopupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keywordId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setData(null); // Clear stale data from previous keyword
    setLoading(true);
    setError(null);

    api
      .getKeywordPopup(keywordId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [keywordId]);

  return { data, loading, error };
}
