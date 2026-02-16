// ══════════════════════════════════════════════════════════════
// AXON — FlashcardAdminPreview (preview mode card)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import clsx from 'clsx';
import { Lightbulb, Layers } from 'lucide-react';
import type { Flashcard } from '@/app/data/courses';
import type { ValidationResult } from '../shared';
import { StatusDot } from '../shared';
import { MasteryDots } from './MasteryDots';

export function FlashcardAdminPreview({ card, index, validation }: {
  card: Flashcard; index: number; validation: ValidationResult;
}) {
  return (
    <div className={clsx("bg-white rounded-xl border shadow-sm overflow-hidden",
      validation.status === 'complete' ? 'border-gray-200' : 'border-amber-200'
    )}>
      <div className="flex">
        <div className="flex-1 p-5">
          <div className="flex items-center gap-2 mb-3">
            <StatusDot status={validation.status} />
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-teal-700 bg-teal-50 border-teal-200">
              <Layers size={10} /> Flashcard
            </span>
            <MasteryDots mastery={card.mastery} size="sm" />
            {validation.status !== 'complete' && (
              <span className="text-[9px] text-amber-500">Incompleto</span>
            )}
          </div>

          <div className="flex gap-3 mb-4">
            <span className="text-gray-400 font-semibold text-base shrink-0">{index + 1}.</span>
            <div className="flex-1">
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
                  <Lightbulb size={10} /> Pergunta
                </div>
                <p className="text-base text-gray-800 leading-relaxed">{card.question || <span className="text-gray-300 italic">Sem pergunta</span>}</p>
              </div>
              <div className="px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50">
                <p className="text-[11px] text-emerald-600 font-semibold mb-1">Resposta:</p>
                <p className="text-sm text-gray-800 font-medium">{card.answer || <span className="text-gray-300 italic">nao definida</span>}</p>
              </div>
            </div>
          </div>
        </div>

        {card.image && (
          <div className="w-40 shrink-0 border-l border-gray-100 bg-gray-50">
            <img src={card.image} alt="" className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
          </div>
        )}
      </div>
    </div>
  );
}
