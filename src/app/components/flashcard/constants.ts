// ============================================================
// Axon v4.4 — Flashcard Constants
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 1.1: Constantes de configuracion de grades y colores
// ============================================================

import type { Grade } from '../../../types/enums';

// ─── Grade Button Configuration ─────────────────────────────

export interface GradeButtonConfig {
  value: Grade;
  label: string;
  color: string;
  hover: string;
  text: string;
  desc: string;
  kbd: string;
}

export const GRADE_BUTTONS: GradeButtonConfig[] = [
  {
    value: 0.00 as Grade,
    label: 'De novo',
    color: 'bg-rose-500',
    hover: 'hover:bg-rose-600',
    text: 'text-rose-500',
    desc: 'Esqueci',
    kbd: '1',
  },
  {
    value: 0.35 as Grade,
    label: 'Dificil',
    color: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
    text: 'text-orange-500',
    desc: 'Com dificuldade',
    kbd: '2',
  },
  {
    value: 0.65 as Grade,
    label: 'Bom',
    color: 'bg-emerald-500',
    hover: 'hover:bg-emerald-600',
    text: 'text-emerald-500',
    desc: 'Lembrei bem',
    kbd: '3',
  },
  {
    value: 0.90 as Grade,
    label: 'Facil',
    color: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    text: 'text-blue-500',
    desc: 'Muito facil',
    kbd: '4',
  },
];

// ─── Delta Color Metadata ────────────────────────────────────

export interface DeltaColorMeta {
  hex: string;
  label: string;
  bg: string;
}

export const DELTA_COLOR_META: Record<string, DeltaColorMeta> = {
  red:    { hex: '#EF4444', label: 'Critico',       bg: 'bg-red-500' },
  orange: { hex: '#F97316', label: 'Insuficiente',  bg: 'bg-orange-500' },
  yellow: { hex: '#EAB308', label: 'Proximo',       bg: 'bg-yellow-500' },
  green:  { hex: '#22C55E', label: 'Dominado',      bg: 'bg-emerald-500' },
  blue:   { hex: '#3B82F6', label: 'Superado',      bg: 'bg-blue-500' },
};

// ─── Color Order (for summary charts) ────────────────────────

export const COLOR_ORDER = ['blue', 'green', 'yellow', 'orange', 'red'] as const;
