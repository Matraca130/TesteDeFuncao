// ══════════════════════════════════════════════════════════════
// AXON — Curriculum Admin Reusable Widgets
// InlineEdit, DeleteButton, ContentBadges
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Trash2, Pencil, Check, X, ClipboardCheck, Layers } from 'lucide-react';
import type { Topic } from '@/app/data/courses';

// ── Inline Editable Field ──
export function InlineEdit({ value, onChange, placeholder, className, inputClassName }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft.trim() || value); setIsEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onChange(draft.trim() || value); setIsEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setIsEditing(false); }
        }}
        placeholder={placeholder}
        className={clsx(
          "bg-white border border-teal-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-teal-400/40",
          inputClassName
        )}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={clsx("group/edit flex items-center gap-1.5 text-left", className)}
      title="Clique para editar"
    >
      <span className="truncate">{value || placeholder}</span>
      <Pencil size={12} className="text-gray-300 opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

// ── Delete Confirm Button ──
export function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-rose-600 font-medium">Apagar?</span>
        <button onClick={() => { onConfirm(); setConfirming(false); }}
          className="p-1 rounded bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors">
          <Check size={12} />
        </button>
        <button onClick={() => setConfirming(false)}
          className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
      title={`Apagar ${label}`}
    >
      <Trash2 size={14} />
    </button>
  );
}

// ── Content Badges (quiz/flashcard counts) ──
export function ContentBadges({ topicId, quizIndex, flashcardIndex, staticTopic }: {
  topicId: string;
  quizIndex: Record<string, any>;
  flashcardIndex: Record<string, any>;
  staticTopic?: Topic;
}) {
  const staticQuizzes = staticTopic?.quizzes?.length || 0;
  const adminQuizzes = quizIndex[topicId]?.questionCount || 0;
  const staticFlashcards = staticTopic?.flashcards?.length || 0;
  const adminFlashcards = flashcardIndex[topicId]?.flashcardCount || 0;
  const totalQ = staticQuizzes + adminQuizzes;
  const totalF = staticFlashcards + adminFlashcards;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {totalQ > 0 && (
        <span className={clsx(
          "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
          adminQuizzes > 0 ? "text-violet-700 bg-violet-50" : "text-gray-500 bg-gray-100"
        )}>
          <ClipboardCheck size={10} /> {totalQ}
        </span>
      )}
      {totalF > 0 && (
        <span className={clsx(
          "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
          adminFlashcards > 0 ? "text-teal-700 bg-teal-50" : "text-gray-500 bg-gray-100"
        )}>
          <Layers size={10} /> {totalF}
        </span>
      )}
      {totalQ === 0 && totalF === 0 && (
        <span className="text-[10px] text-gray-300 italic">Sem conteudo</span>
      )}
    </div>
  );
}
