// ══════════════════════════════════════════════════════════════
// AXON — Quiz Admin Helpers (templates, config, validation)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { ListChecks, PenLine, TextCursorInput } from 'lucide-react';
import type { QuizQuestion, QuizQuestionType } from '@/app/data/courses';
import type { ValidationStatus, ValidationResult } from '../shared';

// ── Type config ──
export const TYPE_CONFIG: Record<QuizQuestionType, { label: string; icon: React.ElementType; color: string }> = {
  'multiple-choice': { label: 'Multipla Escolha', icon: ListChecks, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  'write-in': { label: 'Escrita Livre', icon: PenLine, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  'fill-blank': { label: 'Completar', icon: TextCursorInput, color: 'text-violet-700 bg-violet-50 border-violet-200' },
};

// ── Empty question templates ──
export function newMultipleChoice(id: number): QuizQuestion {
  return { id, type: 'multiple-choice', question: '', options: ['', '', '', ''], correctAnswer: 0 };
}
export function newWriteIn(id: number): QuizQuestion {
  return { id, type: 'write-in', question: '', correctText: '' };
}
export function newFillBlank(id: number): QuizQuestion {
  return { id, type: 'fill-blank', question: '', blankSentence: '', blankAnswer: '' };
}

// ── Validation ──
export function validateQuestion(q: QuizQuestion): ValidationResult {
  const type = q.type || 'multiple-choice';
  const requiredMissing: string[] = [];
  const optionalEmpty: string[] = [];

  if (!q.question?.trim()) requiredMissing.push('Pergunta');

  switch (type) {
    case 'multiple-choice': {
      const opts = q.options || [];
      const filledOpts = opts.filter(o => o.trim());
      if (filledOpts.length < 2) requiredMissing.push('Minimo 2 opcoes preenchidas');
      if (q.correctAnswer == null || q.correctAnswer < 0 || q.correctAnswer >= opts.length) {
        requiredMissing.push('Resposta correta');
      } else if (!opts[q.correctAnswer]?.trim()) {
        requiredMissing.push('Opcao correta esta vazia');
      }
      break;
    }
    case 'write-in': {
      if (!q.correctText?.trim()) requiredMissing.push('Resposta correta');
      if (!q.acceptedVariations || q.acceptedVariations.length === 0) optionalEmpty.push('Variacoes');
      break;
    }
    case 'fill-blank': {
      if (!q.blankSentence?.trim()) requiredMissing.push('Frase com lacuna');
      else if (!q.blankSentence.includes('___')) requiredMissing.push('Frase precisa de ___');
      if (!q.blankAnswer?.trim()) requiredMissing.push('Resposta da lacuna');
      break;
    }
  }

  if (!q.hint?.trim()) optionalEmpty.push('Dica');
  if (!q.explanation?.trim()) optionalEmpty.push('Explicacao');

  const status: ValidationStatus = requiredMissing.length > 0
    ? (q.question?.trim() ? 'partial' : 'empty')
    : 'complete';

  return { status, requiredMissing, optionalEmpty };
}

// ── Clean before save ──
export function cleanQuestionsForSave(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map(q => {
    const cleaned = { ...q };
    if (!cleaned.hint?.trim()) delete cleaned.hint;
    if (!cleaned.explanation?.trim()) delete cleaned.explanation;
    if (cleaned.acceptedVariations) {
      cleaned.acceptedVariations = cleaned.acceptedVariations.filter(v => v.trim());
      if (cleaned.acceptedVariations.length === 0) delete cleaned.acceptedVariations;
    }
    if (cleaned.options) {
      cleaned.options = cleaned.options.map(o => o.trim());
    }
    return cleaned;
  });
}
