// ══════════════════════════════════════════════════════════════
// AXON — FlashcardAdminEditor (expanded card editor)
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import {
  Trash2, ChevronDown, ChevronRight, Copy,
  Layers, X, ChevronUp, ImageIcon, AlertTriangle,
} from 'lucide-react';
import type { Flashcard } from '@/app/data/courses';
import type { ValidationResult } from '../shared';
import { StatusDot, FieldLabel } from '../shared';

export function FlashcardAdminEditor({ card, index, total, validation, onUpdate, onDelete, onDuplicate, onMove, onClose }: {
  card: Flashcard; index: number; total: number; validation: ValidationResult;
  onUpdate: (updates: Partial<Flashcard>) => void;
  onDelete: () => void; onDuplicate: () => void;
  onMove: (dir: 'up' | 'down') => void; onClose: () => void;
}) {
  const [showOptional, setShowOptional] = useState(!!(card.image));

  return (
    <div className={clsx(
      "bg-white rounded-2xl border-2 shadow-lg overflow-hidden",
      validation.status === 'complete' ? 'border-emerald-300' :
      validation.status === 'partial' ? 'border-amber-300' :
      'border-teal-300'
    )}>
      {/* Header */}
      <div className={clsx(
        "flex items-center justify-between px-5 py-3 border-b",
        validation.status === 'complete' ? 'bg-emerald-50/50 border-emerald-200/50' :
        validation.status === 'partial' ? 'bg-amber-50/50 border-amber-200/50' :
        'bg-teal-50/50 border-teal-200/50'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StatusDot status={validation.status} />
            <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-teal-700 bg-teal-50 border-teal-200">
            <Layers size={10} /> Flashcard
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove('up')} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors" title="Mover acima">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors" title="Mover abaixo">
            <ChevronDown size={14} />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-600 transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors" title="Excluir">
            <Trash2 size={14} />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 transition-colors" title="Fechar editor">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Validation warnings */}
      {validation.requiredMissing.length > 0 && (
        <div className="mx-5 mt-3 flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-amber-700 font-semibold">Campos obrigatorios faltando:</p>
            <p className="text-[10px] text-amber-600">{validation.requiredMissing.join(' \u00b7 ')}</p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Question */}
        <div>
          <FieldLabel label="Pergunta (frente do card)" required />
          <textarea value={card.question} onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder="Digite a pergunta aqui..."
            className={clsx(
              "w-full px-4 py-3 border rounded-xl text-sm text-gray-800 outline-none resize-none min-h-[80px] transition-all placeholder:text-gray-300",
              !card.question?.trim() ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100' : 'border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
            )}
          />
        </div>

        {/* Answer */}
        <div>
          <FieldLabel label="Resposta (verso do card)" required />
          <textarea value={card.answer} onChange={(e) => onUpdate({ answer: e.target.value })}
            placeholder="Digite a resposta aqui..."
            className={clsx(
              "w-full px-4 py-3 border rounded-xl text-sm text-gray-800 outline-none resize-none min-h-[80px] transition-all placeholder:text-gray-300",
              !card.answer?.trim() ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100' : 'border-emerald-200 bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50'
            )}
          />
        </div>

        {/* Mastery level */}
        <div>
          <FieldLabel label="Nivel de dominio inicial" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(level => (
                <button key={level} onClick={() => onUpdate({ mastery: level })}
                  className={clsx(
                    "w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all",
                    level === card.mastery
                      ? "border-teal-500 bg-teal-500 text-white shadow-sm"
                      : level <= card.mastery
                        ? "border-teal-300 bg-teal-50 text-teal-600"
                        : "border-gray-200 text-gray-400 hover:border-teal-300"
                  )}>
                  {level}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {card.mastery <= 2 ? 'Novo / A revisar' : card.mastery === 3 ? 'Aprendendo' : 'Dominado'}
            </span>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="border-t border-gray-100 pt-3">
          <button onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors w-full text-left">
            <ChevronRight size={12} className={clsx("transition-transform", showOptional && "rotate-90")} />
            Campos opcionais
            {card.image && (
              <span className="text-[9px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-semibold border border-blue-100">preenchidos</span>
            )}
            <span className="flex-1 border-b border-dashed border-gray-100" />
          </button>

          {showOptional && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ImageIcon size={10} /> URL da Imagem
                  <span className="text-[9px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded normal-case tracking-normal">opcional</span>
                </label>
                <input type="text" value={card.image || ''} onChange={(e) => onUpdate({ image: e.target.value })}
                  placeholder="https://exemplo.com/imagem.png"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-gray-300"
                />
                {card.image && (
                  <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 max-h-40">
                    <img src={card.image} alt="Preview" className="w-full h-full object-contain max-h-40"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-1">
                  A imagem sera exibida no card durante a sessao de estudo. Futuramente podera ser posicionada livremente.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
