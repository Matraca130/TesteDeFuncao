// ══════════════════════════════════════════════════════════════
// Axon v4.4 — Keyword Popup API (LIVE backend)
// CAPA 3: UNICO ponto de contato con datos para KeywordPopup
//
// v4.4 Step 6: Migrated from internal apiFetch to ApiClient
// (dependency injection). No more hardcoded URL or manual
// sessionStorage token extraction — uses centralized api-client.
//
// Hooks (useKeywordPopup, useKeywordChat) pass ApiClient via useApi().
// ══════════════════════════════════════════════════════════════

import type {
  KeywordPopupData,
  AIChatHistory,
  AIChatMessage,
  Keyword,
} from './types';

import type { ApiClient } from '../lib/api-client';

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

export async function getKeywordPopup(api: ApiClient, keywordId: string): Promise<KeywordPopupData> {
  try {
    return await api.get<KeywordPopupData>(`/keyword-popup/${keywordId}`);
  } catch (err: unknown) {
    console.warn(`[KeywordPopupApi] /keyword-popup/${keywordId} failed, using fallback:`, err);
    return { ...FALLBACK_POPUP, keyword: { ...FALLBACK_KEYWORD, id: keywordId } };
  }
}

export async function getChatHistory(api: ApiClient, keywordId: string): Promise<AIChatHistory | null> {
  try {
    const data = await api.get<KeywordPopupData>(`/keyword-popup/${keywordId}`);
    return data.chat_history || null;
  } catch {
    return null;
  }
}

export async function sendChatMessage(
  api: ApiClient,
  keywordId: string,
  content: string
): Promise<{ reply: AIChatMessage }> {
  try {
    const data = await api.post<{ keyword_id: string; message: string }, { reply?: string; content?: string }>(
      '/ai/chat',
      { keyword_id: keywordId, message: content },
    );

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
