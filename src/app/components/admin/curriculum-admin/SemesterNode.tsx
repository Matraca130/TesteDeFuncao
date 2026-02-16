// ══════════════════════════════════════════════════════════════
// AXON — SemesterNode (collapsible semester container)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import type { EditableSemester } from './curriculum-admin-types';
import { InlineEdit, DeleteButton } from './CurriculumWidgets';

export function SemesterNode({ semester, semIdx, expanded, onToggle, onUpdate, onDelete, onAddSection, children }: {
  semester: EditableSemester;
  semIdx: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (field: keyof EditableSemester, value: any) => void;
  onDelete: () => void;
  onAddSection: () => void;
  children: React.ReactNode;
}) {
  const totalTopics = semester.sections.reduce((sum, s) => sum + s.topics.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Semester Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50/60 to-white cursor-pointer hover:from-amber-50 transition-colors"
        onClick={onToggle}
      >
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <InlineEdit
            value={semester.title}
            onChange={v => onUpdate('title', v)}
            placeholder="Nome do semestre..."
            className="text-base font-bold text-gray-900"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-gray-400 font-medium">
            {semester.sections.length} {semester.sections.length === 1 ? 'secao' : 'secoes'} \u00b7 {totalTopics} {totalTopics === 1 ? 'topico' : 'topicos'}
          </span>
          <div className="group" onClick={e => e.stopPropagation()}>
            <DeleteButton label={semester.title} onConfirm={onDelete} />
          </div>
        </div>
      </div>

      {/* Semester Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-1">
              {children}
              <button
                onClick={onAddSection}
                className="flex items-center gap-2 py-2.5 px-3 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors w-full mt-2"
              >
                <Plus size={14} /> Adicionar Secao
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
