// ============================================================
// Axon v4.4 — KeywordPopup Utilities
// Priority labels and BKT delta color mappings.
// Extracted from KeywordPopup.tsx for modularity.
// ============================================================

import type { DeltaColor } from '../../../types/enums';

// ── Priority label + color mapping ──────────────────────────

export function getPriorityLabel(p: number): { text: string; cls: string } {
  switch (p) {
    case 0: return { text: 'Normal', cls: 'bg-gray-100 text-gray-600' };
    case 1: return { text: 'Alto', cls: 'bg-orange-100 text-orange-700' };
    case 2: return { text: 'Muito Alto', cls: 'bg-red-100 text-red-700' };
    case 3: return { text: 'Critico', cls: 'bg-red-200 text-red-800 font-bold' };
    default: return { text: 'Normal', cls: 'bg-gray-100 text-gray-600' };
  }
}

// ── BKT delta -> color mapping (matches fsrs-engine.ts) ─────

export const DELTA_COLORS: Record<DeltaColor, { bg: string; bar: string; text: string }> = {
  red:    { bg: 'bg-red-50',    bar: 'bg-red-500',    text: 'text-red-700' },
  orange: { bg: 'bg-orange-50', bar: 'bg-orange-500', text: 'text-orange-700' },
  yellow: { bg: 'bg-yellow-50', bar: 'bg-yellow-500', text: 'text-yellow-700' },
  green:  { bg: 'bg-green-50',  bar: 'bg-green-500',  text: 'text-green-700' },
  blue:   { bg: 'bg-blue-50',   bar: 'bg-blue-500',   text: 'text-blue-700' },
};
