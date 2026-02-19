// ============================================================
// Axon v4.4 — Flashcard Utility Functions
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 1.2: Funciones utilitarias puras (sin dependencia de React)
// ============================================================

import type { Grade } from '../../../types/enums';
import { DELTA_COLOR_META, type DeltaColorMeta } from './constants';

// ─── Grade Mapping ───────────────────────────────────────────
// Converts frontend decimal grades to backend integer grades.
// Frontend uses: 0.00, 0.35, 0.65, 0.90
// Backend expects: 1, 2, 3, 4

export function gradeToInt(grade: Grade): number {
  if (grade <= 0.00) return 1;
  if (grade <= 0.35) return 2;
  if (grade <= 0.65) return 3;
  return 4;
}

// ─── FSRS State Normalization ────────────────────────────────
// The backend may return numeric state values (0-3) instead of
// string labels. This normalizes them to consistent strings.

const FSRS_STATE_MAP: Record<number, string> = {
  0: 'new',
  1: 'learning',
  2: 'review',
  3: 'relearning',
};

export function normalizeFsrsState(state: any): string {
  if (typeof state === 'string') return state;
  return FSRS_STATE_MAP[state] ?? 'new';
}

// ─── Delta Color Helpers ─────────────────────────────────────
// Resolves a color string to its display metadata (hex, label, bg class).
// Falls back to 'red' (critical) if the color is unknown.

export function getColorMeta(color: string): DeltaColorMeta {
  return DELTA_COLOR_META[color] ?? DELTA_COLOR_META.red;
}
