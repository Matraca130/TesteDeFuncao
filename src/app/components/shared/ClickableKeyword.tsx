import React from 'react';
import { useApp } from '@/app/context/AppContext';
import { Zap } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// Axon v4.2 — ClickableKeyword (Dev 6: AI & Auth)
//
// Reusable component for other devs to make keywords clickable.
// Clicking opens the global KeywordPopup (AppContext).
//
// Usage:
//   import { ClickableKeyword } from '@/app/components/shared/ClickableKeyword';
//   <ClickableKeyword keywordId="kw-plexo-braquial" term="Plexo Braquial" />
//   <ClickableKeyword keywordId="kw-nervo-mediano" term="Nervo Mediano" variant="inline" />
// ══════════════════════════════════════════════════════════════

interface ClickableKeywordProps {
  /** ID da keyword no backend (ex: 'kw-plexo-braquial') */
  keywordId: string;
  /** Texto visivel (ex: 'Plexo Braquial') */
  term: string;
  /**
   * Variante visual:
   *   'chip'   — pill com icone (para cards do dashboard)
   *   'inline' — texto sublinhado (dentro de paragrafos/resumos)
   *   'subtle' — hover minimo (para listas densas de keywords)
   */
  variant?: 'chip' | 'inline' | 'subtle';
  /** Classes adicionais do Tailwind */
  className?: string;
}

const VARIANT_CLASSES = {
  chip: 'px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 hover:shadow-sm',
  inline: 'text-indigo-600 font-medium underline decoration-indigo-200 underline-offset-2 hover:decoration-indigo-400 hover:text-indigo-700',
  subtle: 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded-md -mx-1.5',
} as const;

export function ClickableKeyword({
  keywordId,
  term,
  variant = 'chip',
  className = '',
}: ClickableKeywordProps) {
  const { openKeywordPopup } = useApp();

  return (
    <button
      type="button"
      onClick={() => openKeywordPopup(keywordId)}
      className={`cursor-pointer transition-all inline-flex items-center gap-1 ${VARIANT_CLASSES[variant]} ${className}`}
      title={`Ver detalhes: ${term}`}
    >
      {variant === 'chip' && <Zap className="w-3 h-3" />}
      <span>{term}</span>
    </button>
  );
}
