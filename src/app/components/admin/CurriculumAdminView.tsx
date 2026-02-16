// ══════════════════════════════════════════════════════════════
// AXON — CurriculumAdminView Orchestrator
// Sub-components in ./curriculum-admin/
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  Plus, Save, BookOpen, Layers, GraduationCap,
  AlertTriangle, Loader2, RotateCw, FileText, Database, Sparkles, Check,
} from 'lucide-react';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { SemesterNode, SectionNode, useCurriculumCrud } from './curriculum-admin';

export function CurriculumAdminView() {
  const { currentCourse, setActiveView } = useApp();
  const crud = useCurriculumCrud(currentCourse);

  // ── Loading state ──
  if (crud.isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 size={32} className="text-teal-500 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Carregando estrutura curricular...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* ── HEADER ── */}
      <AxonPageHeader
        title="Estrutura Curricular"
        subtitle={currentCourse.name}
        statsLeft={
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <GraduationCap size={14} className="text-amber-500" />
              <strong>{crud.counts.semesters}</strong> {crud.counts.semesters === 1 ? 'semestre' : 'semestres'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <BookOpen size={14} className="text-blue-500" />
              <strong>{crud.counts.sections}</strong> {crud.counts.sections === 1 ? 'secao' : 'secoes'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <FileText size={14} className="text-teal-500" />
              <strong>{crud.counts.topics}</strong> {crud.counts.topics === 1 ? 'topico' : 'topicos'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Layers size={14} className="text-gray-500" />
              <strong>{crud.counts.subtopics}</strong> {crud.counts.subtopics === 1 ? 'subtopico' : 'subtopicos'}
            </span>
          </div>
        }
        statsRight={
          <div className="flex items-center gap-2">
            {crud.isFromKV ? (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
                <Database size={10} /> Personalizada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                <Sparkles size={10} /> Estatica (padrao)
              </span>
            )}
            {crud.isFromKV && (
              <button
                onClick={crud.resetToStatic}
                className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
              >
                <RotateCw size={10} /> Resetar
              </button>
            )}
          </div>
        }
      />

      {/* ── TREE ── */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-32">
        <div className="max-w-4xl mx-auto space-y-4 pt-2">
          {crud.semesters.map((sem, semIdx) => (
            <SemesterNode
              key={sem.id}
              semester={sem}
              semIdx={semIdx}
              expanded={crud.expandedNodes.has(sem.id)}
              onToggle={() => crud.toggleExpand(sem.id)}
              onUpdate={(field, val) => crud.updateSemester(semIdx, field, val)}
              onDelete={() => crud.deleteSemester(semIdx)}
              onAddSection={() => crud.addSection(semIdx)}
            >
              {sem.sections.map((sec, secIdx) => (
                <SectionNode
                  key={sec.id}
                  section={sec}
                  semTitle={sem.title}
                  expanded={crud.expandedNodes.has(sec.id)}
                  onToggle={() => crud.toggleExpand(sec.id)}
                  onUpdate={(field, val) => crud.updateSection(semIdx, secIdx, field, val)}
                  onDelete={() => crud.deleteSection(semIdx, secIdx)}
                  onAddTopic={(subcategory) => crud.addTopic(semIdx, secIdx, subcategory)}
                  onUpdateTopic={(tIdx, field, val) => crud.updateTopic(semIdx, secIdx, tIdx, field, val)}
                  onDeleteTopic={(tIdx) => crud.deleteTopic(semIdx, secIdx, tIdx)}
                  onAddSubtopic={(tIdx) => crud.addSubtopic(semIdx, secIdx, tIdx)}
                  onUpdateSubtopic={(tIdx, subIdx, field, val) => crud.updateSubtopic(semIdx, secIdx, tIdx, subIdx, field, val)}
                  onDeleteSubtopic={(tIdx, subIdx) => crud.deleteSubtopic(semIdx, secIdx, tIdx, subIdx)}
                  quizIndex={crud.quizIndex}
                  flashcardIndex={crud.flashcardIndex}
                  staticSection={crud.findStaticSection(sec.id)}
                  setActiveView={setActiveView}
                  expandedNodes={crud.expandedNodes}
                  toggleExpand={crud.toggleExpand}
                />
              ))}
            </SemesterNode>
          ))}

          {/* Add Semester */}
          <button
            onClick={crud.addSemester}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
          >
            <Plus size={18} /> Adicionar Semestre
          </button>
        </div>
      </div>

      {/* ── FLOATING SAVE BAR ── */}
      <AnimatePresence>
        {crud.hasChanges && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-4 bg-gray-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span className="text-sm font-medium">Alteracoes nao salvas</span>
              </div>
              <div className="w-px h-5 bg-white/20" />
              <button
                onClick={crud.handleDiscard}
                className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={crud.handleSave}
                disabled={crud.isSaving}
                className={clsx(
                  "flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-bold transition-all",
                  crud.isSaving
                    ? "bg-teal-700 text-teal-200 cursor-wait"
                    : "bg-teal-500 hover:bg-teal-400 text-white shadow-lg"
                )}
              >
                {crud.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {crud.isSaving ? 'Salvando...' : 'Salvar Estrutura'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save status toast */}
      <AnimatePresence>
        {crud.saveStatus === 'success' && !crud.hasChanges && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl">
              <Check size={16} />
              <span className="text-sm font-semibold">Estrutura salva com sucesso!</span>
            </div>
          </motion.div>
        )}
        {crud.saveStatus === 'error' && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">Erro ao salvar. Tente novamente.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
