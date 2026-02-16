import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, BookOpen, Loader2, FolderOpen, Settings2, Layers } from 'lucide-react';
import { Course, Topic, Semester, findStaticTopic, groupTopicsBySubcategory, SUBCATEGORY_CONFIG } from '@/app/data/courses';
import { headingStyle } from '@/app/design-system';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { kvFetch } from './admin-api';

// ══════════════════════════════════════════
// THEME CONFIG
// ══════════════════════════════════════════
export interface TopicSelectorTheme {
  /** Page header title, e.g. "Admin Quizzes" */
  title: string;
  /** Page header subtitle text */
  subtitle: string;
  /** Gradient classes for the action button, e.g. "from-violet-600 to-purple-600" */
  gradientClasses: string;
  /** Icon component for the action button */
  icon: React.ElementType;
  /** Color class for loading spinner, e.g. "text-violet-400" */
  spinnerColor: string;
  /** Tailwind border color for semester headings, e.g. "border-violet-500" */
  semesterBorderColor: string;
  /** Color for section icon badge bg, e.g. "bg-violet-50" */
  sectionIconBg: string;
  /** Color for section icon, e.g. "text-violet-600" */
  sectionIconColor: string;
  /** Hover class for topic rows, e.g. "hover:bg-violet-50/50" */
  topicHoverBg: string;
  /** Hover text color for topics, e.g. "group-hover:text-violet-700" */
  topicHoverText: string;
  /** Color for folder icon when expanded, e.g. "text-violet-500" */
  folderExpandedColor: string;
  /** Folder badge classes, e.g. "text-violet-500 bg-violet-50" */
  folderBadge: string;
  /** Subtopics border-l color, e.g. "border-violet-100" */
  subtopicBorderColor: string;
  /** Subtopic hover bg, e.g. "hover:bg-violet-50/50" */
  subtopicHoverBg: string;
  /** Subtopic hover text, e.g. "group-hover:text-violet-400" */
  subtopicChevronHover: string;
  /** Label for content section summary, e.g. "com quiz" */
  contentSummaryLabel: string;
  /** Key in savedIndex for item count, e.g. "questionCount" or "flashcardCount" */
  countKey: string;
  /** Static data key to check, e.g. "quizzes" or "flashcards" */
  staticKey: 'quizzes' | 'flashcards';
  /** Label suffix for saved counts, e.g. "q salvas" or "salvos" */
  savedLabel: string;
  /** Label suffix for static counts, e.g. "q estaticas" or "estaticos" */
  staticLabel: string;
}

// Pre-built themes
export const QUIZ_THEME: TopicSelectorTheme = {
  title: 'Admin Quizzes',
  subtitle: 'Selecione um topico para criar ou editar quizzes',
  gradientClasses: 'from-violet-600 to-purple-600',
  icon: Settings2,
  spinnerColor: 'text-violet-400',
  semesterBorderColor: 'border-violet-500',
  sectionIconBg: 'bg-violet-50',
  sectionIconColor: 'text-violet-600',
  topicHoverBg: 'hover:bg-violet-50/50',
  topicHoverText: 'group-hover:text-violet-700',
  folderExpandedColor: 'text-violet-500',
  folderBadge: 'text-violet-500 bg-violet-50',
  subtopicBorderColor: 'border-violet-100',
  subtopicHoverBg: 'hover:bg-violet-50/50',
  subtopicChevronHover: 'group-hover:text-violet-400',
  contentSummaryLabel: 'com quiz',
  countKey: 'questionCount',
  staticKey: 'quizzes',
  savedLabel: 'q salvas',
  staticLabel: 'q estaticas',
};

export const FLASHCARD_THEME: TopicSelectorTheme = {
  title: 'Admin Flashcards',
  subtitle: 'Selecione um topico para criar ou editar flashcards',
  gradientClasses: 'from-teal-600 to-cyan-600',
  icon: Layers,
  spinnerColor: 'text-teal-400',
  semesterBorderColor: 'border-teal-500',
  sectionIconBg: 'bg-teal-50',
  sectionIconColor: 'text-teal-600',
  topicHoverBg: 'hover:bg-teal-50/50',
  topicHoverText: 'group-hover:text-teal-700',
  folderExpandedColor: 'text-teal-500',
  folderBadge: 'text-teal-500 bg-teal-50',
  subtopicBorderColor: 'border-teal-100',
  subtopicHoverBg: 'hover:bg-teal-50/50',
  subtopicChevronHover: 'group-hover:text-teal-400',
  contentSummaryLabel: 'com flashcards',
  countKey: 'flashcardCount',
  staticKey: 'flashcards',
  savedLabel: 'salvos',
  staticLabel: 'estaticos',
};

// ══════════════════════════════════════════
// HOOK: useDynamicCurriculum
// ══════════════════════════════════════════
function useDynamicCurriculum(courseId: string, course: Course) {
  const [dynamicSemesters, setDynamicSemesters] = useState<Semester[] | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingStructure(true);
      try {
        const data = await kvFetch(`curriculum/${courseId}`);
        if (data.exists && data.semesters?.length > 0) {
          const sems: Semester[] = data.semesters.map((sem: any) => ({
            id: sem.id,
            title: sem.title,
            sections: (sem.sections || []).map((sec: any) => ({
              id: sec.id,
              title: sec.title,
              topics: (sec.topics || []).map((t: any) => {
                const st = findStaticTopic(courseId, t.id);
                const base = st
                  ? { ...st, title: t.title, summary: t.summary || st.summary }
                  : { id: t.id, title: t.title, summary: t.summary || '' } as Topic;
                return {
                  ...base,
                  subtopics: t.subtopics?.map((sub: any) => {
                    const sSt = findStaticTopic(courseId, sub.id);
                    return sSt
                      ? { ...sSt, title: sub.title, summary: sub.summary || sSt.summary }
                      : { id: sub.id, title: sub.title, summary: sub.summary || '' } as Topic;
                  }),
                };
              }),
            })),
          }));
          setDynamicSemesters(sems);
        } else {
          setDynamicSemesters(null);
        }
      } catch (err) {
        console.error('[AdminTopicSelector] Error loading curriculum:', err);
        setDynamicSemesters(null);
      }
      setLoadingStructure(false);
    })();
  }, [courseId]);

  return {
    semesters: dynamicSemesters || course.semesters,
    isUsingDynamic: dynamicSemesters !== null,
    loadingStructure,
  };
}

// ══════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════
interface AdminTopicSelectorProps {
  currentCourse: Course;
  savedIndex: Record<string, any>;
  loadingIndex: boolean;
  onSelect: (course: Course, semesterTitle: string, sectionTitle: string, topic: Topic) => void;
  theme: TopicSelectorTheme;
}

export function AdminTopicSelector({
  currentCourse, savedIndex, loadingIndex, onSelect, theme,
}: AdminTopicSelectorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { semesters, isUsingDynamic, loadingStructure } = useDynamicCurriculum(currentCourse.id, currentCourse);

  const ActionIcon = theme.icon;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getStaticCount = (topic: Topic): number => {
    const arr = topic[theme.staticKey as keyof Topic];
    return Array.isArray(arr) ? arr.length : 0;
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-dashboard">
      <AxonPageHeader
        title={theme.title}
        subtitle={currentCourse.name}
        statsLeft={<p className="text-gray-500 text-sm">{theme.subtitle}</p>}
        actionButton={
          <div className="flex items-center gap-3">
            {isUsingDynamic && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-200">
                Estrutura Personalizada
              </span>
            )}
            <div className={clsx("flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r rounded-full shadow-sm", theme.gradientClasses)}>
              <ActionIcon size={15} className="text-white" />
              <span className="text-sm font-semibold text-white">Modo Administrador</span>
            </div>
          </div>
        }
      />
      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          {loadingStructure ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className={clsx("animate-spin", theme.spinnerColor)} />
            </div>
          ) : semesters.map((semester) => (
            <div key={semester.id}>
              <h2 className={clsx("text-lg font-bold text-gray-900 mb-5 pl-4 border-l-4 flex items-center gap-2", theme.semesterBorderColor)} style={headingStyle}>
                {semester.title}
              </h2>
              <div className="space-y-3">
                {semester.sections.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  const topicsWithSaved = section.topics.filter(t => savedIndex[t.id]);
                  const topicsWithStatic = section.topics.filter(t => getStaticCount(t) > 0 && !savedIndex[t.id]);

                  return (
                    <div key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <button onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", theme.sectionIconBg)}>
                          <BookOpen size={18} className={theme.sectionIconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900">{section.title}</h3>
                          <p className="text-xs text-gray-400">
                            {section.topics.length} topicos &middot; {topicsWithSaved.length + topicsWithStatic.length} {theme.contentSummaryLabel}
                          </p>
                        </div>
                        <ChevronDown size={16} className={clsx("text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                          {groupTopicsBySubcategory(section.topics).map((subGroup) => {
                            const cfg = SUBCATEGORY_CONFIG[subGroup.subcategory];
                            return (
                              <div key={subGroup.subcategory} className="mb-2 last:mb-0">
                                <div className="flex items-center gap-2 mb-1 px-2 pt-1">
                                  <div className={clsx("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                  <span className={clsx("text-[10px] font-bold uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
                                </div>
                                {subGroup.topics.map((topic) => (
                                  <TopicRow
                                    key={topic.id}
                                    topic={topic}
                                    semester={semester}
                                    section={section}
                                    currentCourse={currentCourse}
                                    savedIndex={savedIndex}
                                    expandedTopics={expandedTopics}
                                    toggleTopic={toggleTopic}
                                    onSelect={onSelect}
                                    theme={theme}
                                    getStaticCount={getStaticCount}
                                  />
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Topic Row (handles both folder topics & leaf topics) ──
function TopicRow({ topic, semester, section, currentCourse, savedIndex, expandedTopics, toggleTopic, onSelect, theme, getStaticCount }: {
  topic: Topic;
  semester: any;
  section: any;
  currentCourse: Course;
  savedIndex: Record<string, any>;
  expandedTopics: Set<string>;
  toggleTopic: (id: string) => void;
  onSelect: (course: Course, semesterTitle: string, sectionTitle: string, topic: Topic) => void;
  theme: TopicSelectorTheme;
  getStaticCount: (t: Topic) => number;
}) {
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const savedInfo = savedIndex[topic.id];
  const staticCount = getStaticCount(topic);
  const hasSaved = !!savedInfo;
  const count = hasSaved ? savedInfo[theme.countKey] : staticCount;
  const isTopicExpanded = expandedTopics.has(topic.id);

  if (hasSubtopics) {
    return (
      <div>
        <button
          onClick={() => toggleTopic(topic.id)}
          className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left group", theme.topicHoverBg)}>
          <FolderOpen size={14} className={clsx("shrink-0", isTopicExpanded ? theme.folderExpandedColor : "text-gray-400")} />
          <div className="flex-1 min-w-0">
            <span className={clsx("text-sm font-medium text-gray-700 transition-colors", theme.topicHoverText)}>{topic.title}</span>
          </div>
          <span className={clsx("text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", theme.folderBadge)}>
            {topic.subtopics!.length} sub
          </span>
          <ChevronDown size={14} className={clsx("text-gray-300 transition-transform", isTopicExpanded && "rotate-180")} />
        </button>
        {isTopicExpanded && (
          <div className={clsx("ml-6 pl-3 border-l-2 mb-1", theme.subtopicBorderColor)}>
            {topic.subtopics!.map((sub) => {
              const subSaved = savedIndex[sub.id];
              const subStatic = getStaticCount(sub);
              const subHasSaved = !!subSaved;
              const subCount = subHasSaved ? subSaved[theme.countKey] : subStatic;
              return (
                <button key={sub.id}
                  onClick={() => onSelect(currentCourse, semester.title, section.title, sub)}
                  className={clsx("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group", theme.subtopicHoverBg)}>
                  <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0",
                    subHasSaved ? "bg-emerald-500" : subCount > 0 ? "bg-amber-400" : "bg-gray-200"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className={clsx("text-[13px] font-medium text-gray-600 transition-colors", theme.topicHoverText)}>{sub.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {subHasSaved && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold border border-emerald-200">{subCount}</span>}
                    {!subHasSaved && subCount > 0 && <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full font-medium border border-gray-200">{subCount}</span>}
                    {subCount === 0 && <span className="text-[9px] text-gray-300 font-medium">Vazio</span>}
                    <ChevronRight size={13} className={clsx("text-gray-300 transition-colors", theme.subtopicChevronHover)} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Leaf topic (no subtopics)
  return (
    <button
      onClick={() => onSelect(currentCourse, semester.title, section.title, topic)}
      className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left group", theme.topicHoverBg)}>
      <div className={clsx("w-2 h-2 rounded-full shrink-0",
        hasSaved ? "bg-emerald-500" : count > 0 ? "bg-amber-400" : "bg-gray-200"
      )} />
      <div className="flex-1 min-w-0">
        <span className={clsx("text-sm font-medium text-gray-700 transition-colors", theme.topicHoverText)}>{topic.title}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasSaved && (
          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
            {count} {theme.savedLabel}
          </span>
        )}
        {!hasSaved && count > 0 && (
          <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium border border-gray-200">
            {count} {theme.staticLabel}
          </span>
        )}
        {count === 0 && (
          <span className="text-[10px] text-gray-300 font-medium">Vazio</span>
        )}
        <ChevronRight size={14} className={clsx("text-gray-300 transition-colors", theme.subtopicChevronHover)} />
      </div>
    </button>
  );
}