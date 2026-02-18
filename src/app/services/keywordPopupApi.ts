// ══════════════════════════════════════════════════════════════
// Axon v4.4 — Keyword Popup API (LIVE backend)
// CAPA 3: UNICO ponto de contato con datos para KeywordPopup
//
// v4.4: Mock data replaced with real API calls to backend.
// Fallback to mock only for unknown keywords when backend 404s.
// Hooks (useKeywordPopup, useKeywordChat) don't change.
// ══════════════════════════════════════════════════════════════

import type {
  KeywordPopupData,
  AIChatHistory,
  AIChatMessage,
  Keyword,
  SubTopic,
  SubTopicBktState,
} from './types';

import { publicAnonKey } from '/utils/supabase/info';

// HARDCODED — backend URL
const API_BASE = 'https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-7a20cd7d';

/**
 * Helper: makes authenticated fetch to backend.
 * Uses the user's access token if stored in sessionStorage,
 * otherwise falls back to publicAnonKey.
 */
async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  // Try to get access token from Supabase session
  let token = publicAnonKey;
  try {
    const sessionStr = Object.keys(sessionStorage)
      .find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (sessionStr) {
      const session = JSON.parse(sessionStorage.getItem(sessionStr) || '{}');
      if (session?.access_token) token = session.access_token;
    }
  } catch {
    // Fallback to anonKey
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok || data.success === false) {
    const msg = data.error?.message || data.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data.data !== undefined ? data.data : data;
}

// ── Mock fallback data (used when backend returns 404) ──────

const FALLBACK_KEYWORD: Keyword = {
  id: 'unknown',
  institution_id: 'inst-1',
  term: 'Keyword',
  definition: 'Informacao nao disponivel no servidor.',
  priority: 0,
  status: 'draft',
  source: 'manual',
  created_by: 'system',
  model_3d_url: null,
  reference_source: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const FALLBACK_POPUP: KeywordPopupData = {
  keyword: FALLBACK_KEYWORD,
  subtopics: [],
  subtopic_states: [],
  related_keywords: [],
  chat_history: null,
  flashcard_count: 0,
  quiz_count: 0,
};

// ── API Functions (Capa 3) ─────────────────────────────────

export async function getKeywordPopup(keywordId: string): Promise<KeywordPopupData> {
  try {
    const data = await apiFetch(`/keyword-popup/${keywordId}`);
    return data as KeywordPopupData;
  } catch (err: unknown) {
    console.warn(`[KeywordPopupApi] /keyword-popup/${keywordId} failed, using fallback:`, err);
    return { ...FALLBACK_POPUP, keyword: { ...FALLBACK_KEYWORD, id: keywordId } };
  }
}

export async function getChatHistory(keywordId: string): Promise<AIChatHistory | null> {
  try {
    const data = await apiFetch(`/keyword-popup/${keywordId}`);
    return (data as KeywordPopupData).chat_history || null;
  } catch {
    return null;
  }
}

export async function sendChatMessage(
  keywordId: string,
  content: string
): Promise<{ reply: AIChatMessage }> {
  try {
    const data = await apiFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        keyword_id: keywordId,
        message: content,
      }),
    });

    return {
      reply: {
        role: 'assistant',
        content: data.reply || data.content || 'Sem resposta do servidor.',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      reply: {
        role: 'assistant',
        content: `Erro ao comunicar com a IA: ${message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
