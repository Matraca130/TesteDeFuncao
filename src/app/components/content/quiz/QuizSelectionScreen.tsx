// ══════════════════════════════════════════════════════════════
// AXON — Quiz Topic Selection Screen (student-facing)
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  ChevronRight, ChevronDown, BookOpen, GraduationCap,
  PenLine, TextCursorInput, ListChecks, FolderOpen,
} from 'lucide-react';
import type { Topic, Semester, Section } from '@/app/data/courses';
import { groupSectionsByRegion, groupTopicsBySubcategory, SUBCATEGORY_CONFIG } from '@/app/data/courses';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { headingStyle, iconBadgeClasses } from '@/app/design-system';
import { getQuestionType } from './quiz-helpers';

export function QuizSelectionScreen({ onSelect }: { onSelect: (topic: Topic) => void }) {
  const { currentCourse } = useApp();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const totalQuizzes = currentCourse.semesters.reduce((acc, s: Semester) =>
    acc + s.sections.reduce((a, sec: Section) =>
      a + sec.topics.reduce((count, t: Topic) => {
        const own = (t.quizzes && t.quizzes.length > 0) ? 1 : 0;
        const subs = (t.subtopics || []).filter(st => st.quizzes && st.quizzes.length > 0).length;
        return count + own + subs;
      }, 0), 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="h-full overflow-y-auto bg-surface-dashboard">
      <AxonPageHeader
        title="Quizzes"
        subtitle={currentCourse.name}
        statsLeft={<p className="text-gray-500 text-sm">{totalQuizzes} quizzes disponiveis</p>}
        actionButton={
          <div className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 rounded-full shrink-0 shadow-sm">
            <GraduationCap size={15} className="text-white" />
            <span className="text-sm font-semibold text-white">Teste seus conhecimentos</span>
          </div>
        }
      />
      <div className="px-6 py-6 bg-surface-dashboard">
        <div className="max-w-5xl mx-auto space-y-10 pb-12">
          {currentCourse.semesters.map((semester: Semester) => {
            const regionGroups = groupSectionsByRegion(semester.sections);
            return (
              <div key={semester.id}>
                <h2 className="text-lg font-bold text-gray-900 mb-5 pl-4 border-l-4 border-teal-500 flex items-center gap-2" style={headingStyle}>
                  {semester.title}
                  {semester.year && <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">{semester.year}o Ano</span>}
                </h2>
                <div className="space-y-8">
                  {regionGroups.map((group) => (
                    <div key={group.region}>
                      {group.region !== 'Geral' && (
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          {group.region}
                        </h3>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {group.sections.map((section: Section) => (
                          <SectionCard
                            key={section.id}
                            section={section}
                            isExpanded={expandedSections.has(section.id)}
                            expandedTopics={expandedTopics}
                            onToggleSection={() => toggleSection(section.id)}
                            onToggleTopic={toggleTopic}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Section Card ──
function SectionCard({ section, isExpanded, expandedTopics, onToggleSection, onToggleTopic, onSelect }: {
  section: Section;
  isExpanded: boolean;
  expandedTopics: Set<string>;
  onToggleSection: () => void;
  onToggleTopic: (id: string) => void;
  onSelect: (topic: Topic) => void;
}) {
  const quizCount = section.topics.reduce((count, t: Topic) => {
    const own = (t.quizzes && t.quizzes.length > 0) ? 1 : 0;
    const subs = (t.subtopics || []).filter(st => st.quizzes && st.quizzes.length > 0).length;
    return count + own + subs;
  }, 0);
  const totalQuestionsInSection = section.topics.reduce((sum, t: Topic) => {
    const own = t.quizzes?.length || 0;
    const subs = (t.subtopics || []).reduce((s, st) => s + (st.quizzes?.length || 0), 0);
    return sum + own + subs;
  }, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-teal-200 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-lg flex flex-col h-fit">
      <button
        type="button"
        onClick={onToggleSection}
        className="w-full flex items-center gap-3 p-5 pb-4 text-left cursor-pointer group"
      >
        <div className={clsx(iconBadgeClasses(), "transition-colors group-hover:bg-teal-500 group-hover:text-white")}>
          <BookOpen size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 leading-tight">{section.title}</h3>
          {section.region && <p className="text-[10px] text-gray-400 font-medium">{section.region}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {quizCount > 0 && (
            <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              {totalQuestionsInSection}q
            </span>
          )}
          <ChevronDown size={16} className={clsx("text-gray-400 transition-transform duration-200", isExpanded && "rotate-180")} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-gray-50">
              <div className="space-y-3">
                {groupTopicsBySubcategory(section.topics).map((subGroup) => {
                  const cfg = SUBCATEGORY_CONFIG[subGroup.subcategory];
                  return (
                    <div key={subGroup.subcategory}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <div className={clsx("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        <span className={clsx("text-[10px] font-bold uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
                      </div>
                      <div className="space-y-0.5">
                        {subGroup.topics.map((topic: Topic) => (
                          <TopicRow
                            key={topic.id}
                            topic={topic}
                            expandedTopics={expandedTopics}
                            onToggleTopic={onToggleTopic}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Topic Row (handles folder topics + leaf topics) ──
function TopicRow({ topic, expandedTopics, onToggleTopic, onSelect }: {
  topic: Topic;
  expandedTopics: Set<string>;
  onToggleTopic: (id: string) => void;
  onSelect: (topic: Topic) => void;
}) {
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const hasQuiz = topic.quizzes && topic.quizzes.length > 0;
  const qCount = topic.quizzes?.length || 0;
  const types = new Set((topic.quizzes || []).map(q => getQuestionType(q)));
  const isTopicExpanded = expandedTopics.has(topic.id);

  // ── Folder topic ──
  if (hasSubtopics) {
    const totalSubQuizzes = topic.subtopics!.reduce((sum, st) => sum + (st.quizzes?.length || 0), 0);
    return (
      <div>
        <button
          onClick={() => onToggleTopic(topic.id)}
          className="w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all text-left hover:bg-teal-50/50 text-gray-600 hover:text-teal-600 cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <FolderOpen size={14} className={clsx("shrink-0", isTopicExpanded ? "text-teal-500" : "text-gray-400")} />
            <span className="truncate">{topic.title}</span>
            <span className="text-[9px] text-teal-500 font-semibold bg-teal-50 px-1.5 py-0.5 rounded-full shrink-0">
              {topic.subtopics!.length} sub
            </span>
            {totalSubQuizzes > 0 && <span className="text-[9px] text-gray-400 font-normal shrink-0">{totalSubQuizzes}q</span>}
          </div>
          <ChevronDown size={14} className={clsx("text-gray-300 transition-transform duration-200 shrink-0", isTopicExpanded && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {isTopicExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="ml-5 pl-3 border-l-2 border-teal-100 space-y-0.5 mb-1">
                {topic.subtopics!.map((sub: Topic) => {
                  const subHasQuiz = sub.quizzes && sub.quizzes.length > 0;
                  const subQCount = sub.quizzes?.length || 0;
                  const subTypes = new Set((sub.quizzes || []).map(q => getQuestionType(q)));
                  return (
                    <button key={sub.id} disabled={!subHasQuiz} onClick={() => subHasQuiz && onSelect(sub)}
                      className={clsx("w-full flex items-center justify-between p-2 rounded-lg text-[13px] font-medium transition-all text-left",
                        subHasQuiz ? "hover:bg-teal-50/50 text-gray-600 hover:text-teal-600 cursor-pointer" : "opacity-40 cursor-not-allowed text-gray-400"
                      )}>
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div className="w-1 h-1 rounded-full bg-teal-300 shrink-0" />
                        <span className="truncate">{sub.title}</span>
                        {subHasQuiz && <span className="text-[9px] text-gray-400 font-normal shrink-0">{subQCount}q</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {subTypes.has('write-in') && <PenLine size={10} className="text-amber-400" />}
                        {subTypes.has('fill-blank') && <TextCursorInput size={10} className="text-violet-400" />}
                        {subTypes.has('multiple-choice') && <ListChecks size={10} className="text-teal-400" />}
                        {subHasQuiz ? <ChevronRight size={13} className="text-gray-300 ml-1" /> : <span className="text-[9px] uppercase font-bold tracking-wider">N/A</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Leaf topic ──
  return (
    <button disabled={!hasQuiz} onClick={() => hasQuiz && onSelect(topic)}
      className={clsx("w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all text-left",
        hasQuiz ? "hover:bg-teal-50/50 text-gray-600 hover:text-teal-600 cursor-pointer" : "opacity-40 cursor-not-allowed text-gray-400"
      )}>
      <div className="flex items-center gap-2 truncate pr-2">
        <span className="truncate">{topic.title}</span>
        {hasQuiz && <span className="text-[9px] text-gray-400 font-normal shrink-0">{qCount}q</span>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {types.has('write-in') && <PenLine size={11} className="text-amber-400" />}
        {types.has('fill-blank') && <TextCursorInput size={11} className="text-violet-400" />}
        {types.has('multiple-choice') && <ListChecks size={11} className="text-teal-400" />}
        {hasQuiz ? <ChevronRight size={14} className="text-gray-300 ml-1" /> : <span className="text-[10px] uppercase font-bold tracking-wider">N/A</span>}
      </div>
    </button>
  );
}
