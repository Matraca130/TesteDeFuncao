// ══════════════════════════════════════════════════════════════
// Axon v4.4 — useKeywordChat hook (Capa 2)
// Manages chat messages for a keyword.
// Loads history on mount, exposes sendMessage with loading state.
//
// Step 6: Now uses useApi() to inject ApiClient into service layer.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../lib/api-provider';
import * as popupApi from '../services/keywordPopupApi';
import type { AIChatMessage } from '../../types/keyword';

export function useKeywordChat(keywordId: string) {
  const { api } = useApi();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    popupApi.getChatHistory(api, keywordId).then((history) => {
      if (!cancelled && history) {
        setMessages(history.messages);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [api, keywordId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: AIChatMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      try {
        const result = await popupApi.sendChatMessage(api, keywordId, content);
        setMessages((prev) => [...prev, result.reply]);
      } catch (err: unknown) {
        console.error('[useKeywordChat] Send error:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Erro ao enviar mensagem: ${err instanceof Error ? err.message : String(err)}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [api, keywordId]
  );

  return { messages, sendMessage, sending };
}
