// ══════════════════════════════════════════════════════════════
// AXON — FlashcardAdminCard (collapsed card in admin list)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import clsx from 'clsx';
import { Copy, Trash2, Layers, ImageIcon } from 'lucide-react';
import type { Flashcard } from '@/app/data/courses';
import type { ValidationResult } from '../shared';
import { StatusDot } from '../shared';
import { MasteryDots } from './MasteryDots';

export function FlashcardAdminCard({ card, index, validation, onClick, onDelete, onDuplicate }: {
  card: Flashcard; index: number; validation: ValidationResult;
  onClick: () => void; onDelete: () => void; onDuplicate: () => void;
}) {
  return (
    <div className={clsx(
      "bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group",
      validation.status === 'complete' ? 'border-gray-200 hover:border-emerald-300' :
      validation.status === 'partial' ? 'border-amber-200 hover:border-amber-300' :
      'border-gray-200 hover:border-gray-300'
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <StatusDot status={validation.status} />
          <span className="text-xs font-bold text-gray-300 w-4 text-right">{index + 1}</span>
        </div>
        <button onClick={onClick} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-teal-700 bg-teal-50 border-teal-200">
              <Layers size={10} /> Flashcard
            </span>
            {card.image && <ImageIcon size={11} className="text-blue-400" title="Tem imagem" />}
            <MasteryDots mastery={card.mastery} size="sm" />
            {validation.status === 'partial' && validation.requiredMissing.length > 0 && (
              <span className="text-[9px] text-amber-500 font-medium">
                Falta: {validation.requiredMissing.join(', ')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-800 line-clamp-2 font-medium">
            {card.question || <span className="text-gray-300 italic">Clique para editar...</span>}
          </p>
          <p className="text-[11px] mt-1">
            {card.answer
              ? <span className="text-emerald-600">Resp: {card.answer.length > 80 ? card.answer.slice(0, 80) + '...' : card.answer}</span>
              : <span className="text-amber-500 italic">Sem resposta definida</span>}
          </p>
        </button>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors" title="Excluir">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
