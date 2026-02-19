// ============================================================
// ChatView — Chat mode: messages, quick prompts, input bar
// ============================================================

import React from 'react';
import clsx from 'clsx';
import {
  Sparkles,
  Send,
  ChevronRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { MarkdownContent } from './MarkdownRenderer';
import { QUICK_PROMPTS } from './types';
import type { DisplayMessage } from './types';

interface ChatViewProps {
  messages: DisplayMessage[];
  input: string;
  setInput: (v: string) => void;
  sendChat: (text?: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  copiedId: string | null;
  copyText: (text: string, id: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  chatEndRef: React.RefObject<HTMLDivElement>;
  currentCourse: { name: string } | null;
  currentTopic: { title: string } | null;
}

export function ChatView({
  messages,
  input,
  setInput,
  sendChat,
  handleKeyDown,
  isLoading,
  copiedId,
  copyText,
  inputRef,
  chatEndRef,
  currentCourse,
  currentTopic,
}: ChatViewProps) {
  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-light px-4 py-4 space-y-4">
        {/* Empty state */}
        {messages.length === 0 && <ChatEmptyState sendChat={sendChat} />}

        {/* Message bubbles */}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            copiedId={copiedId}
            copyText={copyText}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 p-3 bg-white border-t border-gray-200/60">
        {/* Context badge */}
        {(currentCourse || currentTopic) && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              Contexto:
            </span>
            <span className="text-[11px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-200/60">
              {currentTopic?.title || currentCourse?.name}
            </span>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre medicina..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 resize-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendChat()}
            disabled={!input.trim() || isLoading}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
              input.trim() && !isLoading
                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                : 'bg-gray-100 text-gray-300'
            )}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Sub-components (internal) ─────────────────────────────

function ChatEmptyState({ sendChat }: { sendChat: (text: string) => void }) {
  return (
    <div className="text-center py-8 space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center border border-violet-200/60">
        <Sparkles size={28} className="text-violet-500" />
      </div>
      <div>
        <h3
          className="font-bold text-gray-800 text-lg"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Como posso ajudar?
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Pergunte sobre qualquer topico de medicina
        </p>
      </div>

      <div className="space-y-2 max-w-sm mx-auto">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendChat(prompt.label)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200/60 hover:border-violet-300 hover:shadow-sm transition-all text-left group"
          >
            <prompt.icon size={16} className={prompt.color} />
            <span className="text-sm text-gray-600 group-hover:text-gray-800 flex-1">
              {prompt.label}
            </span>
            <ChevronRight
              size={14}
              className="text-gray-300 group-hover:text-violet-400 transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message: msg,
  copiedId,
  copyText,
}: {
  message: DisplayMessage;
  copiedId: string | null;
  copyText: (text: string, id: string) => void;
}) {
  return (
    <div
      className={clsx(
        'flex gap-3',
        msg.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {msg.role !== 'user' && (
        <div
          className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
            msg.isError
              ? 'bg-red-100'
              : 'bg-gradient-to-br from-violet-500 to-purple-600'
          )}
        >
          {msg.isError ? (
            <AlertCircle size={14} className="text-red-500" />
          ) : (
            <Sparkles size={12} className="text-white" />
          )}
        </div>
      )}
      <div
        className={clsx(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative group',
          msg.role === 'user'
            ? 'bg-violet-600 text-white rounded-br-md'
            : msg.isError
              ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-md'
              : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md'
        )}
      >
        <MarkdownContent text={msg.content} />

        {msg.role === 'model' && (
          <button
            onClick={() => copyText(msg.content, msg.id)}
            className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md border border-gray-200 rounded-lg p-1.5 text-gray-400 hover:text-violet-500"
          >
            {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
        <Sparkles size={12} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex gap-1.5">
          <span
            className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
