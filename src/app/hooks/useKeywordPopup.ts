// ══════════════════════════════════════════════════════════════
// Axon v4.4 — useKeywordPopup hook (Capa 2)
// Loads KeywordPopupData when keywordId changes.
// Components NEVER call fetch directly — they use this hook.
//
// Step 6: Now uses useApi() to inject ApiClient into service layer.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useApi } from '../lib/api-provider';
import * as popupApi from '../services/keywordPopupApi';
import type { KeywordPopupData } from '../../types/keyword';

export function useKeywordPopup(keywordId: string | null) {
  const { api } = useApi();
  const [data, setData] = useState<KeywordPopupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keywordId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    popupApi
      .getKeywordPopup(api, keywordId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, keywordId]);

  return { data, loading, error };
}
