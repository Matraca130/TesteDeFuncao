// ══════════════════════════════════════════════════════════════
// AXON — Quiz Type-specific Fields (MC, Write-In, Fill-Blank)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import clsx from 'clsx';
import { Plus, X, AlertCircle } from 'lucide-react';
import type { QuizQuestion } from '@/app/data/courses';
import { FieldLabel } from '../shared';

// ── Multiple Choice Fields ──
export function MultipleChoiceFields({ question, onUpdate }: { question: QuizQuestion; onUpdate: (u: Partial<QuizQuestion>) => void }) {
  const options = question.options || ['', '', '', ''];

  const updateOption = (idx: number, value: string) => {
    const newOpts = [...options];
    newOpts[idx] = value;
    onUpdate({ options: newOpts });
  };

  const addOption = () => onUpdate({ options: [...options, ''] });

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, i) => i !== idx);
    const newCorrect = question.correctAnswer === idx ? 0 :
      (question.correctAnswer || 0) > idx ? (question.correctAnswer || 0) - 1 : question.correctAnswer;
    onUpdate({ options: newOpts, correctAnswer: newCorrect });
  };

  return (
    <div>
      <FieldLabel label="Opcoes (clique no circulo = resposta correta)" required />
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <button onClick={() => onUpdate({ correctAnswer: idx })}
              className={clsx("w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all text-xs font-bold",
                idx === question.correctAnswer
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-gray-300 text-gray-400 hover:border-emerald-300"
              )}>
              {String.fromCharCode(65 + idx)}
            </button>
            <input type="text" value={opt} onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`Opcao ${String.fromCharCode(65 + idx)}...`}
              className={clsx("flex-1 px-3 py-2 border rounded-lg text-sm outline-none transition-all placeholder:text-gray-300",
                idx === question.correctAnswer ? "border-emerald-200 bg-emerald-50/30 focus:border-emerald-400" : "border-gray-200 focus:border-violet-400"
              )}
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(idx)} className="p-1 rounded-lg text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < 8 && (
        <button onClick={addOption} className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 mt-2 transition-colors font-medium">
          <Plus size={12} /> Adicionar opcao
        </button>
      )}
    </div>
  );
}

// ── Write-In Fields ──
export function WriteInFields({ question, onUpdate }: { question: QuizQuestion; onUpdate: (u: Partial<QuizQuestion>) => void }) {
  const variations = question.acceptedVariations || [];

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Resposta correta" required />
        <input type="text" value={question.correctText || ''} onChange={(e) => onUpdate({ correctText: e.target.value })}
          placeholder="A resposta principal esperada..."
          className={clsx(
            "w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300",
            !question.correctText?.trim()
              ? 'border border-amber-300 bg-amber-50/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
              : 'border border-emerald-200 bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50'
          )}
        />
      </div>
      <div>
        <FieldLabel label="Variacoes aceitas" />
        <div className="space-y-2">
          {variations.map((v, idx) => (
            <div key={idx} className="flex items-center gap-2 group">
              <input type="text" value={v} onChange={(e) => {
                const newVars = [...variations];
                newVars[idx] = e.target.value;
                onUpdate({ acceptedVariations: newVars });
              }}
                placeholder={`Variacao ${idx + 1}...`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-violet-400 transition-all placeholder:text-gray-300"
              />
              <button onClick={() => onUpdate({ acceptedVariations: variations.filter((_, i) => i !== idx) })}
                className="p-1 rounded-lg text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => onUpdate({ acceptedVariations: [...variations, ''] })}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 mt-2 transition-colors font-medium">
          <Plus size={12} /> Adicionar variacao
        </button>
      </div>
    </div>
  );
}

// ── Fill-Blank Fields ──
export function FillBlankFields({ question, onUpdate }: { question: QuizQuestion; onUpdate: (u: Partial<QuizQuestion>) => void }) {
  const hasPlaceholder = question.blankSentence?.includes('___');

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Frase com lacuna (use ___ para o espaco em branco)" required />
        <textarea value={question.blankSentence || ''} onChange={(e) => onUpdate({ blankSentence: e.target.value })}
          placeholder="O nervo ___ pode ser lesado em fraturas do colo cirurgico..."
          className={clsx(
            "w-full px-3 py-2.5 border rounded-xl text-sm text-gray-800 outline-none resize-none min-h-[70px] transition-all placeholder:text-gray-300",
            !question.blankSentence?.trim() ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100' :
            !hasPlaceholder ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100' :
            'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-50'
          )}
        />
        {question.blankSentence?.trim() && !hasPlaceholder && (
          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
            <AlertCircle size={10} /> A frase precisa conter ___ (tres underlines) para indicar a lacuna
          </p>
        )}
      </div>
      <div>
        <FieldLabel label="Resposta que preenche a lacuna" required />
        <input type="text" value={question.blankAnswer || ''} onChange={(e) => onUpdate({ blankAnswer: e.target.value })}
          placeholder="axilar"
          className={clsx(
            "w-full px-3 py-2.5 border rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300",
            !question.blankAnswer?.trim()
              ? 'border-amber-300 bg-amber-50/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
              : 'border-violet-200 bg-violet-50/30 focus:border-violet-400 focus:ring-2 focus:ring-violet-50'
          )}
        />
      </div>
    </div>
  );
}
