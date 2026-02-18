// ============================================================
// Axon v4.4 — SubTopicCard
// Displays a subtopic with BKT delta progress bar.
// Extracted from KeywordPopup.tsx for modularity.
// ============================================================

import React from 'react';
import type { SubTopicBktState } from '../../services/types';
import { DELTA_COLORS } from './keyword-popup-utils';

interface SubTopicCardProps {
  title: string;
  description: string | null;
  state: SubTopicBktState | null;
}

export function SubTopicCard({ title, description, state }: SubTopicCardProps) {
  if (!state) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">{title}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <span className="text-xs italic text-gray-400 flex-shrink-0">Nao avaliado</span>
      </div>
    );
  }

  const colors = DELTA_COLORS[state.color];
  const pct = Math.round(state.delta * 100);

  return (
    <div className={`p-3 rounded-xl border ${colors.bg} border-gray-200`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${colors.text}`}>{title}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <span className={`text-xs font-bold ${colors.text} flex-shrink-0 ml-2`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
        <span>{state.exposures} exposicoes</span>
        <span>Sequencia: {state.correct_streak}</span>
        {state.last_review_at && (
          <span>Ultima: {new Date(state.last_review_at).toLocaleDateString('pt-BR')}</span>
        )}
      </div>
    </div>
  );
}
