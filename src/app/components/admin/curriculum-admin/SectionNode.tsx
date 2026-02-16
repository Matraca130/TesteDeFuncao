// ══════════════════════════════════════════════════════════════
// AXON — SectionNode (curriculum section with subcategory grouping)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { Plus, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import type { Section, Topic, TopicSubcategory } from '@/app/data/courses';
import { getTopicSubcategory, groupTopicsBySubcategory, SUBCATEGORY_CONFIG } from '@/app/data/courses';
import type { EditableTopic, EditableSection } from './curriculum-admin-types';
import { InlineEdit, DeleteButton } from './CurriculumWidgets';
import { TopicNode } from './TopicNode';

export function SectionNode({ section, semTitle, expanded, onToggle, onUpdate, onDelete, onAddTopic, onUpdateTopic, onDeleteTopic, onAddSubtopic, onUpdateSubtopic, onDeleteSubtopic, quizIndex, flashcardIndex, staticSection, setActiveView, expandedNodes, toggleExpand }: {
  section: EditableSection;
  semTitle: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (field: keyof EditableSection, value: any) => void;
  onDelete: () => void;
  onAddTopic: (subcategory?: TopicSubcategory) => void;
  onUpdateTopic: (topicIdx: number, field: keyof EditableTopic, value: string) => void;
  onDeleteTopic: (topicIdx: number) => void;
  onAddSubtopic: (topicIdx: number) => void;
  onUpdateSubtopic: (topicIdx: number, subIdx: number, field: keyof EditableTopic, value: string) => void;
  onDeleteSubtopic: (topicIdx: number, subIdx: number) => void;
  quizIndex: Record<string, any>;
  flashcardIndex: Record<string, any>;
  staticSection?: Section;
  setActiveView: (view: any) => void;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const renderTopicNode = (topic: EditableTopic, tIdx: number) => (
    <TopicNode
      key={topic.id}
      topic={topic}
      semTitle={semTitle}
      secTitle={section.title}
      onUpdate={(field, val) => onUpdateTopic(tIdx, field, val)}
      onDelete={() => onDeleteTopic(tIdx)}
      onAddSubtopic={() => onAddSubtopic(tIdx)}
      onUpdateSubtopic={(subIdx, field, val) => onUpdateSubtopic(tIdx, subIdx, field, val)}
      onDeleteSubtopic={(subIdx) => onDeleteSubtopic(tIdx, subIdx)}
      quizIndex={quizIndex}
      flashcardIndex={flashcardIndex}
      staticTopic={staticSection?.topics?.find(t => t.id === topic.id)}
      setActiveView={setActiveView}
      expanded={expandedNodes.has(topic.id)}
      onToggle={() => toggleExpand(topic.id)}
    />
  );

  return (
    <div className="group/section">
      <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-blue-50/50 transition-colors cursor-pointer"
        onClick={onToggle}>
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <BookOpen size={12} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <InlineEdit
            value={section.title}
            onChange={v => onUpdate('title', v)}
            placeholder="Nome da secao..."
            className="text-sm font-semibold text-gray-800"
          />
        </div>
        <span className="text-[10px] text-gray-400 font-medium shrink-0">
          {section.topics.length} {section.topics.length === 1 ? 'topico' : 'topicos'}
        </span>
        <div className="shrink-0" onClick={e => e.stopPropagation()}>
          <DeleteButton label={section.title} onConfirm={onDelete} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-8 pl-4 border-l-2 border-blue-100 pb-2">
              {(() => {
                const subGroups = groupTopicsBySubcategory(section.topics as any);
                const allSubcats: TopicSubcategory[] = ['Visao Geral', 'Aparelho Locomotor', 'Neurovascular'];
                const presentSubcats = new Set(subGroups.map(g => g.subcategory));
                const showSubcatHeaders = presentSubcats.size >= 2 || section.topics.length >= 3;

                if (!showSubcatHeaders) {
                  return (
                    <div className="space-y-0.5">
                      {section.topics.map((topic, tIdx) => renderTopicNode(topic, tIdx))}
                      <button
                        onClick={() => onAddTopic()}
                        className="flex items-center gap-2 py-2 px-3 text-[11px] font-medium text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors w-full"
                      >
                        <Plus size={14} /> Adicionar Topico
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 pt-1">
                    {allSubcats.map(subcat => {
                      const cfg = SUBCATEGORY_CONFIG[subcat];
                      const topicsInGroup = section.topics.filter(
                        t => getTopicSubcategory(t as any) === subcat
                      );

                      return (
                        <div key={subcat}>
                          <div className="flex items-center gap-2 px-2 mb-1">
                            <div className={clsx("w-2 h-2 rounded-full", cfg.dot)} />
                            <span className={clsx("text-[10px] font-bold uppercase tracking-wider", cfg.color)}>
                              {cfg.label}
                            </span>
                            <span className="text-[9px] text-gray-300 font-medium">
                              ({topicsInGroup.length})
                            </span>
                            <div className="flex-1 border-b border-dashed border-gray-100" />
                          </div>

                          <div className="space-y-0.5">
                            {topicsInGroup.map(topic => {
                              const originalIdx = section.topics.indexOf(topic);
                              return renderTopicNode(topic, originalIdx);
                            })}
                          </div>

                          <button
                            onClick={() => onAddTopic(subcat)}
                            className={clsx(
                              "flex items-center gap-1.5 py-1.5 px-3 text-[10px] font-medium rounded-lg transition-colors w-full mt-0.5",
                              subcat === 'Visao Geral' && "text-sky-500 hover:text-sky-700 hover:bg-sky-50",
                              subcat === 'Aparelho Locomotor' && "text-amber-500 hover:text-amber-700 hover:bg-amber-50",
                              subcat === 'Neurovascular' && "text-violet-500 hover:text-violet-700 hover:bg-violet-50",
                            )}
                          >
                            <Plus size={12} /> Adicionar em {cfg.label}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
