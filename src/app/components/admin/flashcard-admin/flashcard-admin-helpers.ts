// ══════════════════════════════════════════════════════════════
// AXON — Flashcard Admin Helpers (validation, templates, cleaning)
// ══════════════════════════════════════════════════════════════

import type { Flashcard } from '@/app/data/courses';
import type { ValidationStatus, ValidationResult } from '../shared';

/** Empty flashcard template */
export function newFlashcard(id: number): Flashcard {
  return { id, question: '', answer: '', mastery: 1 };
}

/** Validate a single flashcard */
export function validateFlashcard(card: Flashcard): ValidationResult {
  const requiredMissing: string[] = [];
  const optionalEmpty: string[] = [];

  if (!card.question?.trim()) requiredMissing.push('Pergunta');
  if (!card.answer?.trim()) requiredMissing.push('Resposta');
  if (!card.image?.trim()) optionalEmpty.push('Imagem');

  const status: ValidationStatus = requiredMissing.length > 0
    ? (card.question?.trim() || card.answer?.trim() ? 'partial' : 'empty')
    : 'complete';

  return { status, requiredMissing, optionalEmpty };
}

/** Clean flashcards before saving to KV store */
export function cleanFlashcardsForSave(cards: Flashcard[]): Flashcard[] {
  return cards.map(c => {
    const cleaned = { ...c };
    if (!cleaned.image?.trim()) {
      delete cleaned.image;
      delete cleaned.imagePosition;
    }
    cleaned.question = cleaned.question?.trim() || '';
    cleaned.answer = cleaned.answer?.trim() || '';
    return cleaned;
  });
}
