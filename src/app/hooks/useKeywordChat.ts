// ══════════════════════════════════════════════════════════════
// Axon v4.4 — useKeywordChat hook (Capa 2)
// Manages chat messages for a keyword.
// Loads history on mount, exposes sendMessage with loading state.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/keywordPopupApi';
import type { AIChatMessage } from '../services/types';

export function useKeywordChat(keywordId: string) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getChatHistory(keywordId).then((history) => {
      if (!cancelled && history) {
        setMessages(history.messages);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [keywordId]);

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
        const result = await api.sendChatMessage(keywordId, content);
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
    [keywordId]
  );

  return { messages, sendMessage, sending };
}