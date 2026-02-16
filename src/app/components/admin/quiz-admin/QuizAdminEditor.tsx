// ══════════════════════════════════════════════════════════════
// AXON — QuizAdminEditor (expanded question editor)
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import {
  Trash2, ChevronDown, ChevronRight, Copy,
  X, ChevronUp, Lightbulb, FileText, AlertTriangle,
} from 'lucide-react';
import type { QuizQuestion, QuizQuestionType } from '@/app/data/courses';
import type { ValidationResult } from '../shared';
import { StatusDot, FieldLabel } from '../shared';
import { TYPE_CONFIG } from './quiz-admin-helpers';
import { MultipleChoiceFields, WriteInFields, FillBlankFields } from './QuizTypeFields';

export function QuizAdminEditor({ question, index, total, validation, onUpdate, onDelete, onDuplicate, onMove, onClose }: {
  question: QuizQuestion; index: number; total: number; validation: ValidationResult;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  onDelete: () => void; onDuplicate: () => void;
  onMove: (dir: 'up' | 'down') => void; onClose: () => void;
}) {
  const type = question.type || 'multiple-choice';
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div className={clsx(
      "bg-white rounded-2xl border-2 shadow-lg overflow-hidden",
      validation.status === 'complete' ? 'border-emerald-300' :
      validation.status === 'partial' ? 'border-amber-300' :
      'border-violet-300'
    )}>
      {/* Header */}
      <div className={clsx(
        "flex items-center justify-between px-5 py-3 border-b",
        validation.status === 'complete' ? 'bg-emerald-50/50 border-emerald-200/50' :
        validation.status === 'partial' ? 'bg-amber-50/50 border-amber-200/50' :
        'bg-violet-50/50 border-violet-200/50'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StatusDot status={validation.status} />
            <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
          </div>
          <span className={clsx("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color)}>
            <Icon size={10} /> {cfg.label}
          </span>
          <select value={type} onChange={(e) => {
            const newType = e.target.value as QuizQuestionType;
            if (newType === 'multiple-choice') {
              onUpdate({ type: newType, options: question.options || ['', '', '', ''], correctAnswer: question.correctAnswer ?? 0 });
            } else if (newType === 'write-in') {
              onUpdate({ type: newType, correctText: question.correctText || '' });
            } else {
              onUpdate({ type: newType, blankSentence: question.blankSentence || '', blankAnswer: question.blankAnswer || '' });
            }
          }} className="text-[11px] bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-600 outline-none cursor-pointer">
            <option value="multiple-choice">Multipla Escolha</option>
            <option value="write-in">Escrita Livre</option>
            <option value="fill-blank">Completar</option>
          </select>
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
        <div>
          <FieldLabel label="Pergunta" required />
          <textarea value={question.question} onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder="Digite a pergunta aqui..."
            className={clsx(
              "w-full px-4 py-3 border rounded-xl text-sm text-gray-800 outline-none resize-none min-h-[80px] transition-all placeholder:text-gray-300",
              !question.question?.trim() ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100' : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
            )}
          />
        </div>

        {type === 'multiple-choice' && <MultipleChoiceFields question={question} onUpdate={onUpdate} />}
        {type === 'write-in' && <WriteInFields question={question} onUpdate={onUpdate} />}
        {type === 'fill-blank' && <FillBlankFields question={question} onUpdate={onUpdate} />}

        <OptionalFieldsSection question={question} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// ── Optional Fields Section (small, stays inline) ──
function OptionalFieldsSection({ question, onUpdate }: { question: QuizQuestion; onUpdate: (u: Partial<QuizQuestion>) => void }) {
  const [isOpen, setIsOpen] = useState(!!(question.hint || question.explanation));
  const hasContent = !!(question.hint?.trim() || question.explanation?.trim());

  return (
    <div className="border-t border-gray-100 pt-3">
      <button onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors w-full text-left">
        <ChevronRight size={12} className={clsx("transition-transform", isOpen && "rotate-90")} />
        Campos opcionais
        {hasContent && (
          <span className="text-[9px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-semibold border border-blue-100">preenchidos</span>
        )}
        <span className="flex-1 border-b border-dashed border-gray-100" />
      </button>

      {isOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Lightbulb size={10} /> Dica
              <span className="text-[9px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded normal-case tracking-normal">opcional</span>
            </label>
            <textarea value={question.hint || ''} onChange={(e) => onUpdate({ hint: e.target.value })}
              placeholder="Uma pista para ajudar o aluno..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-50 resize-none min-h-[60px] transition-all placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText size={10} /> Explicacao
              <span className="text-[9px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded normal-case tracking-normal">opcional</span>
            </label>
            <textarea value={question.explanation || ''} onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="Explicacao mostrada apos responder..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 resize-none min-h-[60px] transition-all placeholder:text-gray-300"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
