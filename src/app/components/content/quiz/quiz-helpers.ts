// ══════════════════════════════════════════════════════════════
// AXON — Quiz Helper Functions & Types (pure — no React)
// ══════════════════════════════════════════════════════════════

import type { QuizQuestion } from '@/app/data/courses';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function getQuestionType(q: QuizQuestion) {
  return q.type || 'multiple-choice';
}

export function normalizeText(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function checkWriteInAnswer(q: QuizQuestion, userAnswer: string): boolean {
  const norm = normalizeText(userAnswer);
  if (!norm) return false;
  if (q.correctText && normalizeText(q.correctText) === norm) return true;
  if (q.acceptedVariations) {
    return q.acceptedVariations.some(v => normalizeText(v) === norm);
  }
  if (q.correctText && norm.includes(normalizeText(q.correctText))) return true;
  return false;
}

export function checkFillBlankAnswer(q: QuizQuestion, userAnswer: string): boolean {
  if (!q.blankAnswer) return false;
  return normalizeText(userAnswer) === normalizeText(q.blankAnswer);
}

export interface SavedAnswer {
  selectedOption: number | null;
  textInput: string;
  correct: boolean;
  answered: boolean;
}

export function emptyAnswer(): SavedAnswer {
  return { selectedOption: null, textInput: '', correct: false, answered: false };
}
