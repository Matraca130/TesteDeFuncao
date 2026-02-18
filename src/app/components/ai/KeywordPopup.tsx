// ══════════════════════════════════════════════════════════════
// Axon v4.4 — KeywordPopup (Dev 6: AI & Auth)
//
// Global overlay — mounted ONCE in AppShell.
// Uses hooks (Capa 2) — NEVER calls fetch() directly.
//
// Sections:
//   A) Header — term + priority badge + X close
//   B) Definition — keyword.definition
//   C) Sub-topics — delta bar with BKT colors (red/orange/yellow/green/blue)
//   D) Related Keywords — click refreshes popup (same component)
//   E) Counters — flashcard_count + quiz_count
//   F) "Ver en 3D" button — only if model_3d_url !== null
//   G) Chat AI — inline chat with useKeywordChat
// ══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { useKeywordPopup } from '../../hooks/useKeywordPopup';
import { useKeywordChat } from '../../hooks/useKeywordChat';
import type { DeltaColor, SubTopicBktState, AIChatMessage } from '../../services/types';
import {
  X, Loader2, BookOpen, HelpCircle, Link2, MessageCircle,
  Layers, ChevronRight, Box, Send, Bot, User, Sparkles, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Props ───────────────────────────────────────────────────

interface KeywordPopupProps {
  keywordId: string;
  onClose: () => void;
  onNavigateToKeyword: (keywordId: string) => void;
  onNavigateTo3D?: (modelId: string) => void;
}

// ── Priority label + color mapping ──────────────────────────

function getPriorityLabel(p: number) {
  switch (p) {
    case 0: return { text: 'Normal', cls: 'bg-gray-100 text-gray-600' };
    case 1: return { text: 'Alto', cls: 'bg-orange-100 text-orange-700' };
    case 2: return { text: 'Muito Alto', cls: 'bg-red-100 text-red-700' };
    case 3: return { text: 'Critico', cls: 'bg-red-200 text-red-800 font-bold' };
    default: return { text: 'Normal', cls: 'bg-gray-100 text-gray-600' };
  }
}

// ── BKT delta → color mapping (matches fsrs-engine.ts) ──────

const DELTA_COLORS: Record<DeltaColor, { bg: string; bar: string; text: string }> = {
  red:    { bg: 'bg-red-50',    bar: 'bg-red-500',    text: 'text-red-700' },
  orange: { bg: 'bg-orange-50', bar: 'bg-orange-500', text: 'text-orange-700' },
  yellow: { bg: 'bg-yellow-50', bar: 'bg-yellow-500', text: 'text-yellow-700' },
  green:  { bg: 'bg-green-50',  bar: 'bg-green-500',  text: 'text-green-700' },
  blue:   { bg: 'bg-blue-50',   bar: 'bg-blue-500',   text: 'text-blue-700' },
};

// ── Chat Sub-Component ──────────────────────────────────────

function ChatSection({ keywordId, keywordTerm }: { keywordId: string; keywordTerm: string }) {
  const { messages, sendMessage, sending } = useKeywordChat(keywordId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    if (!input.trim() || sending) return;
    sendMessage(input.trim());
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <Bot className="w-10 h-10 text-indigo-200 mb-2" />
            <p className="text-sm text-gray-500">Pergunte sobre "{keywordTerm}"</p>
            <p className="text-xs text-gray-400 mt-1">Pressione Enter para enviar</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Pergunte sobre ${keywordTerm}...`}
            disabled={sending}
            rows={1}
            className="flex-1 resize-none px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition"
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export function KeywordPopup({
  keywordId,
  onClose,
  onNavigateToKeyword,
  onNavigateTo3D,
}: KeywordPopupProps) {
  const { data, loading, error } = useKeywordPopup(keywordId);
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

  useEffect(() => {
    setActiveTab('info');
  }, [keywordId]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Panel — right drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Section A: Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            ) : data ? (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{data.keyword.term}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityLabel(data.keyword.priority).cls}`}>
                  {getPriorityLabel(data.keyword.priority).text}
                </span>
                {data.keyword.model_3d_url && (
                  <Box className="w-4 h-4 text-indigo-400" />
                )}
              </div>
            ) : (
              <h2 className="text-lg font-bold text-red-600">Erro ao carregar</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Informacoes
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat AI
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : data && activeTab === 'info' ? (
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Section B: Definition */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Definicao</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{data.keyword.definition}</p>
                {data.keyword.reference_source && (
                  <p className="text-xs text-gray-400 mt-1.5 italic">Fonte: {data.keyword.reference_source}</p>
                )}
              </div>

              {/* Section C: Sub-topics with BKT colors */}
              {data.subtopics.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Sub-topicos ({data.subtopics.length})
                  </h3>
                  <div className="space-y-2">
                    {data.subtopics.map((st, i) => {
                      const state = data.subtopic_states?.[i];
                      return (
                        <SubTopicCard key={st.id} title={st.title} description={st.description} state={state} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section D: Related Keywords */}
              {data.related_keywords.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" />
                    Keywords Relacionadas ({data.related_keywords.length})
                  </h3>
                  <div className="space-y-2">
                    {data.related_keywords.map((rel, i) => (
                      <button
                        key={rel.keyword.id + '-' + i}
                        onClick={() => onNavigateToKeyword(rel.keyword.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{rel.keyword.term}</span>
                            {rel.connection_label && (
                              <span className="text-xs text-gray-400">({rel.connection_label})</span>
                            )}
                            {rel.keyword.model_3d_url && (
                              <Box className="w-3 h-3 text-indigo-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rel.keyword.definition}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section E: Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-blue-700">{data.flashcard_count}</p>
                    <p className="text-xs text-blue-500">Flashcards</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <HelpCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-purple-700">{data.quiz_count}</p>
                    <p className="text-xs text-purple-500">Questoes Quiz</p>
                  </div>
                </div>
              </div>

              {/* Section F: "Ver en 3D" button */}
              {data.keyword.model_3d_url && onNavigateTo3D && (
                <button
                  onClick={() => onNavigateTo3D(data.keyword.model_3d_url!)}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  <Box className="w-5 h-5" />
                  Ver Modelo 3D
                </button>
              )}
            </div>
          ) : data && activeTab === 'chat' ? (
            /* Section G: Chat AI */
            <div className="flex-1 min-h-0">
              <ChatSection keywordId={keywordId} keywordTerm={data.keyword.term} />
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

// ── SubTopic Card with BKT delta bar ────────────────────────

function SubTopicCard({
  title,
  description,
  state,
}: {
  title: string;
  description: string | null;
  state: SubTopicBktState | null;
}) {
  if (!state) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">{title}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <span className="text-xs italic text-gray-400 flex-shrink-0">Nao avaliado</span>
      </div>
    );
  }

  const colors = DELTA_COLORS[state.color];
  const pct = Math.round(state.delta * 100);

  return (
    <div className={`p-3 rounded-xl border ${colors.bg} border-gray-200`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${colors.text}`}>{title}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <span className={`text-xs font-bold ${colors.text} flex-shrink-0 ml-2`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
        <span>{state.exposures} exposicoes</span>
        <span>Sequencia: {state.correct_streak}</span>
        {state.last_review_at && (
          <span>Ultima: {new Date(state.last_review_at).toLocaleDateString('pt-BR')}</span>
        )}
      </div>
    </div>
  );
}
