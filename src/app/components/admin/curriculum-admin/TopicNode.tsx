// ══════════════════════════════════════════════════════════════
// AXON — TopicNode (expandable curriculum tree node with subtopics)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { Plus, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import type { Topic } from '@/app/data/courses';
import { getTopicSubcategory, SUBCATEGORY_CONFIG } from '@/app/data/courses';
import type { EditableTopic } from './curriculum-admin-types';
import { InlineEdit, DeleteButton, ContentBadges } from './CurriculumWidgets';

export function TopicNode({ topic, semTitle, secTitle, onUpdate, onDelete, onAddSubtopic, onUpdateSubtopic, onDeleteSubtopic, quizIndex, flashcardIndex, staticTopic, setActiveView, expanded, onToggle }: {
  topic: EditableTopic;
  semTitle: string;
  secTitle: string;
  onUpdate: (field: keyof EditableTopic, value: string) => void;
  onDelete: () => void;
  onAddSubtopic: () => void;
  onUpdateSubtopic: (subIdx: number, field: keyof EditableTopic, value: string) => void;
  onDeleteSubtopic: (subIdx: number) => void;
  quizIndex: Record<string, any>;
  flashcardIndex: Record<string, any>;
  staticTopic?: Topic;
  setActiveView: (view: any) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const subcategory = getTopicSubcategory(topic as any);
  const subCfg = SUBCATEGORY_CONFIG[subcategory];
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

  return (
    <div>
      {/* Topic header row */}
      <div className="group flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50/80 transition-colors">
        <button
          onClick={onToggle}
          className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          title={hasSubtopics ? (expanded ? 'Recolher' : 'Expandir') : 'Adicionar subtopicos'}
        >
          {hasSubtopics ? (
            expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
          ) : (
            <div className={clsx("w-1.5 h-1.5 rounded-full", subCfg.dot)} />
          )}
        </button>
        {hasSubtopics && (
          <FolderOpen size={13} className="text-teal-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={topic.title}
            onChange={v => onUpdate('title', v)}
            placeholder="Nome do topico..."
            className="text-sm font-medium text-gray-800"
          />
        </div>
        {hasSubtopics && (
          <span className="text-[9px] text-teal-500 font-semibold bg-teal-50 px-1.5 py-0.5 rounded-full shrink-0">
            {topic.subtopics!.length} sub
          </span>
        )}
        {!hasSubtopics && (
          <ContentBadges
            topicId={topic.id}
            quizIndex={quizIndex}
            flashcardIndex={flashcardIndex}
            staticTopic={staticTopic}
          />
        )}
        <button
          onClick={onAddSubtopic}
          className="p-1 rounded-lg text-gray-200 hover:text-teal-500 hover:bg-teal-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Adicionar subtopico"
        >
          <Plus size={13} />
        </button>
        <DeleteButton label={topic.title} onConfirm={onDelete} />
      </div>

      {/* Subtopics list */}
      <AnimatePresence>
        {expanded && hasSubtopics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-6 pl-3 border-l-2 border-teal-100 mb-1">
              {topic.subtopics!.map((sub, subIdx) => (
                <div key={sub.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-teal-50/50 transition-colors">
                  <div className="w-1 h-1 rounded-full bg-teal-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <InlineEdit
                      value={sub.title}
                      onChange={v => onUpdateSubtopic(subIdx, 'title', v)}
                      placeholder="Nome do subtopico..."
                      className="text-[13px] font-medium text-gray-600"
                    />
                  </div>
                  <ContentBadges
                    topicId={sub.id}
                    quizIndex={quizIndex}
                    flashcardIndex={flashcardIndex}
                    staticTopic={staticTopic?.subtopics?.find(st => st.id === sub.id)}
                  />
                  <DeleteButton label={sub.title} onConfirm={() => onDeleteSubtopic(subIdx)} />
                </div>
              ))}
              <button
                onClick={onAddSubtopic}
                className="flex items-center gap-1.5 py-1.5 px-2 text-[10px] font-medium text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors w-full"
              >
                <Plus size={11} /> Adicionar Subtopico
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
