// ══════════════════════════════════════════════════════════════
// META PANEL — collapsible course/topic/tags selector
// ══════════════════════════════════════════════════════════════
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { courses } from '@/app/data/courses';
import type { TopicOption } from './types';

export interface MetaPanelProps {
  isNew: boolean;
  courseId: string;
  onCourseChange: (id: string) => void;
  topicId: string;
  onTopicChange: (id: string) => void;
  tags: string;
  onTagsChange: (tags: string) => void;
  availableTopics: TopicOption[];
  showMetaPanel: boolean;
  onToggleMetaPanel: () => void;
}

export function MetaPanel({
  isNew, courseId, onCourseChange, topicId, onTopicChange,
  tags, onTagsChange, availableTopics, showMetaPanel, onToggleMetaPanel,
}: MetaPanelProps) {
  return (
    <>
      <AnimatePresence>
        {showMetaPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white border-b border-gray-200"
          >
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Materia</label>
                  <select value={courseId} onChange={e => onCourseChange(e.target.value)} disabled={!isNew}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60">
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Topico</label>
                  <select value={topicId} onChange={e => onTopicChange(e.target.value)} disabled={!isNew}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60">
                    <option value="">Selecionar...</option>
                    {availableTopics.map(t => <option key={t.topicId} value={t.topicId}>{t.topicTitle}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Tags</label>
                  <input type="text" value={tags} onChange={e => onTagsChange(e.target.value)} placeholder="musculos, nervos..."
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onToggleMetaPanel}
        className="w-full py-1 bg-gray-50 border-b border-gray-200 text-[10px] text-gray-400 font-semibold uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
      >
        {showMetaPanel ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {showMetaPanel ? 'Recolher detalhes' : 'Expandir detalhes'}
      </button>
    </>
  );
}
