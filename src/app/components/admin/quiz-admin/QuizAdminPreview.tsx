// ══════════════════════════════════════════════════════════════
// AXON — QuizAdminPreview (preview mode question card)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import clsx from 'clsx';
import { CheckCircle2, Lightbulb, FileText } from 'lucide-react';
import type { QuizQuestion } from '@/app/data/courses';
import type { ValidationResult } from '../shared';
import { StatusDot } from '../shared';
import { TYPE_CONFIG } from './quiz-admin-helpers';

export function QuizAdminPreview({ question, index, validation }: {
  question: QuizQuestion; index: number; validation: ValidationResult;
}) {
  const type = question.type || 'multiple-choice';
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div className={clsx("bg-white rounded-xl border shadow-sm p-5",
      validation.status === 'complete' ? 'border-gray-200' : 'border-amber-200'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <StatusDot status={validation.status} />
        <span className={clsx("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color)}>
          <Icon size={10} /> {cfg.label}
        </span>
        {validation.status !== 'complete' && (
          <span className="text-[9px] text-amber-500">Incompleta</span>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <span className="text-gray-400 font-semibold text-base shrink-0">{index + 1}.</span>
        <p className="text-base text-gray-800 leading-relaxed">{question.question || <span className="text-gray-300 italic">Sem pergunta</span>}</p>
      </div>

      {type === 'multiple-choice' && question.options && (
        <div className="space-y-2 ml-7">
          {question.options.map((opt, idx) => (
            <div key={idx} className={clsx("flex items-start gap-2 px-4 py-2.5 rounded-xl border-2 text-sm",
              idx === question.correctAnswer ? "border-emerald-400 bg-emerald-50 text-gray-800" : "border-gray-200 text-gray-600"
            )}>
              <span className={clsx("font-semibold shrink-0", idx === question.correctAnswer ? "text-emerald-600" : "text-gray-400")}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <span>{opt || <span className="text-gray-300 italic">vazio</span>}</span>
              {idx === question.correctAnswer && <CheckCircle2 size={14} className="text-emerald-500 ml-auto shrink-0 mt-0.5" />}
            </div>
          ))}
        </div>
      )}

      {type === 'write-in' && (
        <div className="ml-7 px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50">
          <p className="text-[11px] text-emerald-600 font-semibold mb-1">Resposta esperada:</p>
          <p className="text-sm text-gray-800 font-medium">{question.correctText || <span className="text-gray-300 italic">nao definida</span>}</p>
          {question.acceptedVariations && question.acceptedVariations.filter(v => v.trim()).length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1">+ {question.acceptedVariations.filter(v => v.trim()).length} variacoes aceitas</p>
          )}
        </div>
      )}

      {type === 'fill-blank' && (
        <div className="ml-7 px-4 py-3 rounded-xl border-2 border-violet-200 bg-violet-50/50">
          {question.blankSentence ? (
            <p className="text-sm text-gray-700 leading-relaxed">
              {question.blankSentence.split('___').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block mx-1 px-3 py-0.5 bg-violet-200 text-violet-700 rounded font-semibold text-xs">
                      {question.blankAnswer || '___'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          ) : (
            <p className="text-sm text-gray-300 italic">Frase nao definida</p>
          )}
        </div>
      )}

      {question.hint && (
        <div className="ml-7 mt-3 flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <Lightbulb size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-800">{question.hint}</p>
        </div>
      )}

      {question.explanation && (
        <div className="ml-7 mt-2 flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
          <FileText size={12} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-800">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
