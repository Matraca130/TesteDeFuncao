// ============================================================
// Axon v4.4 — DraftItemCards
// Individual card renderers for each content type in the
// AI-generated draft approval workflow.
// Extracted from AIGeneratePanel.tsx for modularity.
// ============================================================

import React from 'react';
import { Check } from 'lucide-react';
import type {
  GeneratedKeyword,
  GeneratedFlashcard,
  GeneratedQuizQuestion,
  GeneratedConnection,
} from './ai-generate-types';

// ── Shared checkbox indicator ───────────────────────────────

function SelectionCheckbox({ selected }: { selected: boolean }) {
  return (
    <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
      selected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
    }`}>
      {selected && <Check className="w-3 h-3" />}
    </div>
  );
}

// ── Keyword Card ────────────────────────────────────────────

interface KeywordCardProps {
  keyword: GeneratedKeyword;
  selected: boolean;
  onToggle: () => void;
}

export function KeywordCard({ keyword, selected, onToggle }: KeywordCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-lg border cursor-pointer transition ${
        selected
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-start gap-2">
        <SelectionCheckbox selected={selected} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900">{keyword.term}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              keyword.priority === 0 ? 'bg-red-100 text-red-700' :
              keyword.priority === 1 ? 'bg-orange-100 text-orange-700' :
              keyword.priority === 2 ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              P{keyword.priority}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{keyword.definition}</p>
          {keyword.subtopics?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {keyword.subtopics.map((st) => (
                <span key={st.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                  {st.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Flashcard Card ──────────────────────────────────────────

interface FlashcardCardProps {
  flashcard: GeneratedFlashcard;
  selected: boolean;
  onToggle: () => void;
}

export function FlashcardCard({ flashcard, selected, onToggle }: FlashcardCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-lg border cursor-pointer transition ${
        selected
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-start gap-2">
        <SelectionCheckbox selected={selected} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{flashcard.front}</p>
          <p className="text-xs text-gray-500 mt-1">{flashcard.back}</p>
          {flashcard.keyword_term && (
            <span className="inline-block text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded mt-1">
              {flashcard.keyword_term}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quiz Question Card ──────────────────────────────────────

interface QuizCardProps {
  question: GeneratedQuizQuestion;
  selected: boolean;
  onToggle: () => void;
}

export function QuizCard({ question, selected, onToggle }: QuizCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-lg border cursor-pointer transition ${
        selected
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-start gap-2">
        <SelectionCheckbox selected={selected} />
        <div className="flex-1 min-w-0">
          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{question.quiz_type}</span>
          <p className="text-sm text-gray-900 mt-1">{question.question}</p>
          {question.options && (
            <div className="mt-1 space-y-0.5">
              {question.options.map((opt, i) => (
                <p key={i} className={`text-xs ${i === question.correct_answer ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {opt}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Connection Card ─────────────────────────────────────────

interface ConnectionCardProps {
  connection: GeneratedConnection;
  selected: boolean;
  onToggle: () => void;
}

export function ConnectionCard({ connection, selected, onToggle }: ConnectionCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-lg border cursor-pointer transition ${
        selected
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2">
        <SelectionCheckbox selected={selected} />
        <span className="text-sm font-medium text-gray-900">{connection.keyword_a_term}</span>
        <span className="text-xs text-gray-400">—{connection.label}—</span>
        <span className="text-sm font-medium text-gray-900">{connection.keyword_b_term}</span>
      </div>
    </div>
  );
}
