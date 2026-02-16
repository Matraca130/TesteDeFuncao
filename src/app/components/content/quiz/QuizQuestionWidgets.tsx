// ══════════════════════════════════════════════════════════════
// AXON — Quiz Question Widgets (type badge, MC options, text fields)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import clsx from 'clsx';
import {
  CheckCircle2, XCircle, PenLine, TextCursorInput, ListChecks,
} from 'lucide-react';
import type { QuizQuestion } from '@/app/data/courses';
import { LETTERS } from './quiz-helpers';

// ── Question Type Badge ──
export function QuestionTypeBadge({ qType, isReviewing }: { qType: string; isReviewing: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-2 flex-wrap">
      {qType === 'write-in' && (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <PenLine size={10} /> Escrever por extenso
        </span>
      )}
      {qType === 'fill-blank' && (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
          <TextCursorInput size={10} /> Completar a palavra
        </span>
      )}
      {qType === 'multiple-choice' && (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          <ListChecks size={10} /> Multipla escolha
        </span>
      )}
      {isReviewing && (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Respondida</span>
      )}
    </div>
  );
}

// ── Multiple Choice Options ──
export function MultipleChoiceOptions({ question, selectedAnswer, showResult, isReviewing, onSelect }: {
  question: QuizQuestion; selectedAnswer: number | null; showResult: boolean; isReviewing: boolean;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="space-y-3 mb-6">
      {question.options!.map((option, idx) => {
        const isSelected = selectedAnswer === idx;
        const isCorrectOption = idx === question.correctAnswer;
        const wasSelectedWrong = showResult && isSelected && !isCorrectOption;
        const wasCorrect = showResult && isCorrectOption;

        return (
          <button key={idx} onClick={() => !isReviewing && onSelect(idx)} disabled={isReviewing}
            className={clsx("w-full text-left rounded-xl border-2 transition-all overflow-hidden",
              !showResult && !isSelected && "border-gray-200 hover:border-gray-300 bg-white",
              !showResult && isSelected && "border-teal-500 bg-teal-50/30",
              wasCorrect && "border-emerald-400 bg-emerald-50",
              wasSelectedWrong && "border-rose-300 bg-rose-50",
              showResult && !isCorrectOption && !isSelected && "border-gray-200 bg-white opacity-50"
            )}>
            <div className="px-5 py-4 flex items-start gap-3">
              <span className={clsx("text-sm font-semibold shrink-0 mt-0.5",
                wasCorrect ? "text-emerald-600" : wasSelectedWrong ? "text-rose-500" : isSelected ? "text-teal-600" : "text-gray-400"
              )}>{LETTERS[idx]}.</span>
              <span className={clsx("text-sm",
                wasCorrect ? "text-gray-800" : wasSelectedWrong ? "text-gray-700" : isSelected ? "text-gray-800" : "text-gray-600"
              )}>{option}</span>
            </div>
            {wasSelectedWrong && (
              <div className="px-5 pb-4 pt-0">
                <div className="flex items-start gap-2">
                  <XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-rose-600 mb-1">Nao exatamente</p>
                    {question.explanation && <p className="text-xs text-gray-500 leading-relaxed">{question.explanation}</p>}
                  </div>
                </div>
              </div>
            )}
            {wasCorrect && showResult && (
              <div className="px-5 pb-4 pt-0">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-1">Resposta correta</p>
                    {question.explanation && <p className="text-xs text-gray-500 leading-relaxed">{question.explanation}</p>}
                  </div>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Write-In Field ──
export function WriteInField({ question, textAnswer, showResult, isCorrectResult, isReviewing, onChangeText, onSubmit }: {
  question: QuizQuestion; textAnswer: string; showResult: boolean; isCorrectResult: boolean; isReviewing: boolean;
  onChangeText: (v: string) => void; onSubmit: () => void;
}) {
  return (
    <div className="mb-6">
      <div className={clsx("rounded-xl border-2 overflow-hidden transition-all",
        showResult && isCorrectResult && "border-emerald-400 bg-emerald-50",
        showResult && !isCorrectResult && "border-rose-300 bg-rose-50",
        !showResult && "border-gray-200 bg-white"
      )}>
        <textarea value={textAnswer} onChange={(e) => onChangeText(e.target.value)} disabled={isReviewing}
          placeholder="Escreva sua resposta aqui..."
          className="w-full px-5 py-4 text-sm text-gray-800 bg-transparent resize-none outline-none placeholder:text-gray-400 min-h-[100px]"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isReviewing) { e.preventDefault(); onSubmit(); } }}
        />
        {showResult && (
          <div className="px-5 pb-4">
            <div className="flex items-start gap-2">
              {isCorrectResult ? (
                <><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" /><div><p className="text-xs font-semibold text-emerald-600 mb-1">Resposta correta</p>{question.explanation && <p className="text-xs text-gray-500 leading-relaxed">{question.explanation}</p>}</div></>
              ) : (
                <><XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" /><div><p className="text-xs font-semibold text-rose-600 mb-1">Nao exatamente</p><p className="text-xs text-gray-600 mb-1">Resposta esperada: <span className="font-semibold text-gray-800">{question.correctText}</span></p>{question.explanation && <p className="text-xs text-gray-500 leading-relaxed">{question.explanation}</p>}</div></>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fill-Blank Field ──
export function FillBlankField({ question, textAnswer, showResult, isCorrectResult, isReviewing, onChangeText, onSubmit }: {
  question: QuizQuestion; textAnswer: string; showResult: boolean; isCorrectResult: boolean; isReviewing: boolean;
  onChangeText: (v: string) => void; onSubmit: () => void;
}) {
  return (
    <div className="mb-6">
      <div className={clsx("rounded-xl border-2 px-5 py-5 transition-all",
        showResult && isCorrectResult && "border-emerald-400 bg-emerald-50",
        showResult && !isCorrectResult && "border-rose-300 bg-rose-50",
        !showResult && "border-gray-200 bg-gray-50/50"
      )}>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          {question.blankSentence!.split('___').map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block align-bottom mx-1">
                  <input type="text" value={textAnswer} onChange={(e) => onChangeText(e.target.value)} disabled={isReviewing}
                    placeholder="________"
                    className={clsx("border-b-2 bg-transparent outline-none text-center px-2 py-0.5 min-w-[120px] text-sm font-semibold",
                      showResult && isCorrectResult && "border-emerald-500 text-emerald-700",
                      showResult && !isCorrectResult && "border-rose-400 text-rose-600",
                      !showResult && "border-teal-400 text-gray-800 placeholder:text-gray-300"
                    )}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isReviewing) { e.preventDefault(); onSubmit(); } }}
                  />
                </span>
              )}
            </React.Fragment>
          ))}
        </p>
        {showResult && (
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200/50">
            {isCorrectResult ? (
              <><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" /><div><p className="text-xs font-semibold text-emerald-600 mb-1">Resposta correta</p>{question.explanation && <p className="text-xs text-gray-500 leading-relaxed">{question.explanation}</p>}</div></>
            ) : (
              <><XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" /><div><p className="text-xs font-semibold text-rose-600 mb-1">Nao exatamente</p><p className="text-xs text-gray-600 mb-1">Palavra correta: <span className="font-semibold text-gray-800">{question.blankAnswer}</span></p>{question.explanation && <p className="text-xs text-gray-500 leading-relaxed">{question.explanation}</p>}</div></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
