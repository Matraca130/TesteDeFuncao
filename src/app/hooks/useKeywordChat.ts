// ══════════════════════════════════════════════════════════════
// Axon v4.2 — useKeywordChat hook (Capa 2)
// Manages chat messages for a keyword.
// Loads history on mount, exposes sendMessage with loading state.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../services/keywordPopupApi';
import type { AIChatMessage } from '../services/types';

export function useKeywordChat(keywordId: string) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Ref tracks the CURRENT keywordId to detect stale async responses.
  // When keywordId changes mid-flight, sendMessage can compare against
  // this ref and discard responses from the old keyword.
  const keywordIdRef = useRef(keywordId);

  useEffect(() => {
    keywordIdRef.current = keywordId;

    // Reset state for the new keyword
    let cancelled = false;
    setMessages([]);
    setSending(false);
    setLoadingHistory(true);

    api
      .getChatHistory(keywordId)
      .then((history) => {
        if (!cancelled && history) {
          setMessages(history.messages);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error('[useKeywordChat] History load error:', err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [keywordId]);

  const sendMessage = useCallback(
    async (content: string) => {
      // Capture at call time — if keywordId changes mid-flight,
      // we compare against keywordIdRef to detect staleness.
      const capturedId = keywordId;

      const userMsg: AIChatMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);

      try {
        const result = await api.sendChatMessage(capturedId, content);
        // Only apply reply if we're still on the same keyword
        if (keywordIdRef.current === capturedId) {
          setMessages((prev) => [...prev, result.reply]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[useKeywordChat] Send error:', err);
        // Only show error in chat if still on the same keyword
        if (keywordIdRef.current === capturedId) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `Erro ao enviar mensagem: ${message}`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setSending(false);
      }
    },
    [keywordId]
  );

  return { messages, sendMessage, sending, loadingHistory };
}
