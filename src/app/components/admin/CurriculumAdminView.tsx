import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  Plus, Trash2, Save, ChevronDown, ChevronRight,
  BookOpen, Layers, ClipboardCheck, FolderTree, GraduationCap,
  Pencil, Check, X, AlertTriangle, Loader2, RotateCw,
  ArrowRight, FileText, Database, Sparkles, FolderOpen,
} from 'lucide-react';
import { courses, Course, Semester, Section, Topic, findStaticTopic, getTopicSubcategory, groupTopicsBySubcategory, SUBCATEGORY_CONFIG, TopicSubcategory } from '@/app/data/courses';
import { headingStyle } from '@/app/design-system';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { API_BASE, publicAnonKey, kvFetch } from './shared/admin-api';

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface EditableTopic {
  id: string;
  title: string;
  summary: string;
  subtopics?: EditableTopic[];
}

interface EditableSection {
  id: string;
  title: string;
  topics: EditableTopic[];
}

interface EditableSemester {
  id: string;
  title: string;
  sections: EditableSection[];
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
const genId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function staticToEditable(course: Course): EditableSemester[] {
  return course.semesters.map(sem => ({
    id: sem.id,
    title: sem.title,
    sections: sem.sections.map(sec => ({
      id: sec.id,
      title: sec.title,
      topics: sec.topics.map(t => ({
        id: t.id,
        title: t.title,
        summary: t.summary || '',
        subtopics: t.subtopics?.map(st => ({
          id: st.id,
          title: st.title,
          summary: st.summary || '',
        })),
      })),
    })),
  }));
}

function countItems(semesters: EditableSemester[]) {
  let sections = 0, topics = 0, subtopics = 0;
  semesters.forEach(s => {
    sections += s.sections.length;
    s.sections.forEach(sec => {
      topics += sec.topics.length;
      sec.topics.forEach(t => { subtopics += t.subtopics?.length || 0; });
    });
  });
  return { semesters: semesters.length, sections, topics, subtopics };
}

// ═══════════════════════════════════════
// INLINE EDITABLE FIELD
// ════════════════════════════════════════
function InlineEdit({ value, onChange, placeholder, className, inputClassName }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft.trim() || value); setIsEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onChange(draft.trim() || value); setIsEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setIsEditing(false); }
        }}
        placeholder={placeholder}
        className={clsx(
          "bg-white border border-teal-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-teal-400/40",
          inputClassName
        )}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={clsx("group/edit flex items-center gap-1.5 text-left", className)}
      title="Clique para editar"
    >
      <span className="truncate">{value || placeholder}</span>
      <Pencil size={12} className="text-gray-300 opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

// ════════════════════════════════════════
// DELETE CONFIRM
// ════════════════════════════════════════
function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-rose-600 font-medium">Apagar?</span>
        <button onClick={() => { onConfirm(); setConfirming(false); }}
          className="p-1 rounded bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors">
          <Check size={12} />
        </button>
        <button onClick={() => setConfirming(false)}
          className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
      title={`Apagar ${label}`}
    >
      <Trash2 size={14} />
    </button>
  );
}

// ═══════════════════════════════════════
// CONTENT BADGES
// ════════════════════════════════════════
function ContentBadges({ topicId, quizIndex, flashcardIndex, staticTopic }: {
  topicId: string;
  quizIndex: Record<string, any>;
  flashcardIndex: Record<string, any>;
  staticTopic?: Topic;
}) {
  const staticQuizzes = staticTopic?.quizzes?.length || 0;
  const adminQuizzes = quizIndex[topicId]?.questionCount || 0;
  const staticFlashcards = staticTopic?.flashcards?.length || 0;
  const adminFlashcards = flashcardIndex[topicId]?.flashcardCount || 0;
  const totalQ = staticQuizzes + adminQuizzes;
  const totalF = staticFlashcards + adminFlashcards;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {totalQ > 0 && (
        <span className={clsx(
          "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
          adminQuizzes > 0 ? "text-violet-700 bg-violet-50" : "text-gray-500 bg-gray-100"
        )}>
          <ClipboardCheck size={10} /> {totalQ}
        </span>
      )}
      {totalF > 0 && (
        <span className={clsx(
          "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
          adminFlashcards > 0 ? "text-teal-700 bg-teal-50" : "text-gray-500 bg-gray-100"
        )}>
          <Layers size={10} /> {totalF}
        </span>
      )}
      {totalQ === 0 && totalF === 0 && (
        <span className="text-[10px] text-gray-300 italic">Sem conteudo</span>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// TOPIC NODE (expandable with subtopics)
// ════════════════════════════════════════
function TopicNode({ topic, semTitle, secTitle, onUpdate, onDelete, onAddSubtopic, onUpdateSubtopic, onDeleteSubtopic, quizIndex, flashcardIndex, staticTopic, setActiveView, expanded, onToggle }: {
  topic: EditableTopic; semTitle: string; secTitle: string;
  onUpdate: (field: keyof EditableTopic, value: string) => void;
  onDelete: () => void; onAddSubtopic: () => void;
  onUpdateSubtopic: (subIdx: number, field: keyof EditableTopic, value: string) => void;
  onDeleteSubtopic: (subIdx: number) => void;
  quizIndex: Record<string, any>; flashcardIndex: Record<string, any>;
  staticTopic?: Topic; setActiveView: (view: any) => void;
  expanded: boolean; onToggle: () => void;
}) {
  const subcategory = getTopicSubcategory(topic as any);
  const subCfg = SUBCATEGORY_CONFIG[subcategory];
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

  return (
    <div>
      <div className="group flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50/80 transition-colors">
        <button onClick={onToggle} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          title={hasSubtopics ? (expanded ? 'Recolher' : 'Expandir') : 'Adicionar subtopicos'}>
          {hasSubtopics ? (
            expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
          ) : (
            <div className={clsx("w-1.5 h-1.5 rounded-full", subCfg.dot)} />
          )}
        </button>
        {hasSubtopics && <FolderOpen size={13} className="text-teal-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <InlineEdit value={topic.title} onChange={v => onUpdate('title', v)} placeholder="Nome do topico..." className="text-sm font-medium text-gray-800" />
        </div>
        {hasSubtopics && (
          <span className="text-[9px] text-teal-500 font-semibold bg-teal-50 px-1.5 py-0.5 rounded-full shrink-0">{topic.subtopics!.length} sub</span>
        )}
        {!hasSubtopics && <ContentBadges topicId={topic.id} quizIndex={quizIndex} flashcardIndex={flashcardIndex} staticTopic={staticTopic} />}
        <button onClick={onAddSubtopic} className="p-1 rounded-lg text-gray-200 hover:text-teal-500 hover:bg-teal-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Adicionar subtopico">
          <Plus size={13} />
        </button>
        <DeleteButton label={topic.title} onConfirm={onDelete} />
      </div>
      <AnimatePresence>
        {expanded && hasSubtopics && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="ml-6 pl-3 border-l-2 border-teal-100 mb-1">
              {topic.subtopics!.map((sub, subIdx) => (
                <div key={sub.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-teal-50/50 transition-colors">
                  <div className="w-1 h-1 rounded-full bg-teal-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <InlineEdit value={sub.title} onChange={v => onUpdateSubtopic(subIdx, 'title', v)} placeholder="Nome do subtopico..." className="text-[13px] font-medium text-gray-600" />
                  </div>
                  <ContentBadges topicId={sub.id} quizIndex={quizIndex} flashcardIndex={flashcardIndex} staticTopic={staticTopic?.subtopics?.find(st => st.id === sub.id)} />
                  <DeleteButton label={sub.title} onConfirm={() => onDeleteSubtopic(subIdx)} />
                </div>
              ))}
              <button onClick={onAddSubtopic} className="flex items-center gap-1.5 py-1.5 px-2 text-[10px] font-medium text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors w-full">
                <Plus size={11} /> Adicionar Subtopico
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════
// SECTION NODE
// ════════════════════════════════════════
function SectionNode({ section, semTitle, expanded, onToggle, onUpdate, onDelete, onAddTopic, onUpdateTopic, onDeleteTopic, onAddSubtopic, onUpdateSubtopic, onDeleteSubtopic, quizIndex, flashcardIndex, staticSection, setActiveView, expandedNodes, toggleExpand }: {
  section: EditableSection; semTitle: string; expanded: boolean; onToggle: () => void;
  onUpdate: (field: keyof EditableSection, value: any) => void; onDelete: () => void;
  onAddTopic: (subcategory?: TopicSubcategory) => void;
  onUpdateTopic: (topicIdx: number, field: keyof EditableTopic, value: string) => void;
  onDeleteTopic: (topicIdx: number) => void; onAddSubtopic: (topicIdx: number) => void;
  onUpdateSubtopic: (topicIdx: number, subIdx: number, field: keyof EditableTopic, value: string) => void;
  onDeleteSubtopic: (topicIdx: number, subIdx: number) => void;
  quizIndex: Record<string, any>; flashcardIndex: Record<string, any>;
  staticSection?: Section; setActiveView: (view: any) => void;
  expandedNodes: Set<string>; toggleExpand: (id: string) => void;
}) {
  return (
    <div className="group/section">
      <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={onToggle}>
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <BookOpen size={12} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <InlineEdit value={section.title} onChange={v => onUpdate('title', v)} placeholder="Nome da secao..." className="text-sm font-semibold text-gray-800" />
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="ml-8 pl-4 border-l-2 border-blue-100 pb-2">
              {(() => {
                const subGroups = groupTopicsBySubcategory(section.topics as any);
                const allSubcats: TopicSubcategory[] = ['Visao Geral', 'Aparelho Locomotor', 'Neurovascular'];
                const presentSubcats = new Set(subGroups.map(g => g.subcategory));
                const showSubcatHeaders = presentSubcats.size >= 2 || section.topics.length >= 3;
                if (!showSubcatHeaders) {
                  return (
                    <div className="space-y-0.5">
                      {section.topics.map((topic, tIdx) => (
                        <TopicNode key={topic.id} topic={topic} semTitle={semTitle} secTitle={section.title}
                          onUpdate={(field, val) => onUpdateTopic(tIdx, field, val)} onDelete={() => onDeleteTopic(tIdx)}
                          onAddSubtopic={() => onAddSubtopic(tIdx)} onUpdateSubtopic={(subIdx, field, val) => onUpdateSubtopic(tIdx, subIdx, field, val)}
                          onDeleteSubtopic={(subIdx) => onDeleteSubtopic(tIdx, subIdx)} quizIndex={quizIndex} flashcardIndex={flashcardIndex}
                          staticTopic={staticSection?.topics?.find(t => t.id === topic.id)} setActiveView={setActiveView}
                          expanded={expandedNodes.has(topic.id)} onToggle={() => toggleExpand(topic.id)} />
                      ))}
                      <button onClick={() => onAddTopic()} className="flex items-center gap-2 py-2 px-3 text-[11px] font-medium text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors w-full">
                        <Plus size={14} /> Adicionar Topico
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3 pt-1">
                    {allSubcats.map(subcat => {
                      const cfg = SUBCATEGORY_CONFIG[subcat];
                      const topicsInGroup = section.topics.filter(t => getTopicSubcategory(t as any) === subcat);
                      return (
                        <div key={subcat}>
                          <div className="flex items-center gap-2 px-2 mb-1">
                            <div className={clsx("w-2 h-2 rounded-full", cfg.dot)} />
                            <span className={clsx("text-[10px] font-bold uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
                            <span className="text-[9px] text-gray-300 font-medium">({topicsInGroup.length})</span>
                            <div className="flex-1 border-b border-dashed border-gray-100" />
                          </div>
                          <div className="space-y-0.5">
                            {topicsInGroup.map(topic => {
                              const originalIdx = section.topics.indexOf(topic);
                              return (
                                <TopicNode key={topic.id} topic={topic} semTitle={semTitle} secTitle={section.title}
                                  onUpdate={(field, val) => onUpdateTopic(originalIdx, field, val)} onDelete={() => onDeleteTopic(originalIdx)}
                                  onAddSubtopic={() => onAddSubtopic(originalIdx)} onUpdateSubtopic={(subIdx, field, val) => onUpdateSubtopic(originalIdx, subIdx, field, val)}
                                  onDeleteSubtopic={(subIdx) => onDeleteSubtopic(originalIdx, subIdx)} quizIndex={quizIndex} flashcardIndex={flashcardIndex}
                                  staticTopic={staticSection?.topics?.find(t => t.id === topic.id)} setActiveView={setActiveView}
                                  expanded={expandedNodes.has(topic.id)} onToggle={() => toggleExpand(topic.id)} />
                              );
                            })}
                          </div>
                          <button onClick={() => onAddTopic(subcat)} className={clsx(
                            "flex items-center gap-1.5 py-1.5 px-3 text-[10px] font-medium rounded-lg transition-colors w-full mt-0.5",
                            subcat === 'Visao Geral' && "text-sky-500 hover:text-sky-700 hover:bg-sky-50",
                            subcat === 'Aparelho Locomotor' && "text-amber-500 hover:text-amber-700 hover:bg-amber-50",
                            subcat === 'Neurovascular' && "text-violet-500 hover:text-violet-700 hover:bg-violet-50",
                          )}>
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

// ════════════════════════════════════════
// SEMESTER NODE
// ════════════════════════════════════════
function SemesterNode({ semester, semIdx, expanded, onToggle, onUpdate, onDelete, onAddSection, children }: {
  semester: EditableSemester; semIdx: number; expanded: boolean; onToggle: () => void;
  onUpdate: (field: keyof EditableSemester, value: any) => void; onDelete: () => void;
  onAddSection: () => void; children: React.ReactNode;
}) {
  const totalTopics = semester.sections.reduce((sum, s) => sum + s.topics.length, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50/60 to-white cursor-pointer hover:from-amber-50 transition-colors" onClick={onToggle}>
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <InlineEdit value={semester.title} onChange={v => onUpdate('title', v)} placeholder="Nome do semestre..." className="text-base font-bold text-gray-900" />
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
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 pb-4 space-y-1">
              {children}
              <button onClick={onAddSection} className="flex items-center gap-2 py-2.5 px-3 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors w-full mt-2">
                <Plus size={14} /> Adicionar Secao
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════
// MAIN: CURRICULUM ADMIN VIEW
// ════════════════════════════════════════
export function CurriculumAdminView() {
  const { currentCourse, setActiveView } = useApp();
  const [semesters, setSemesters] = useState<EditableSemester[]>([]);
  const [originalHash, setOriginalHash] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isFromKV, setIsFromKV] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [quizIndex, setQuizIndex] = useState<Record<string, any>>({});
  const [flashcardIndex, setFlashcardIndex] = useState<Record<string, any>>({});

  const currentHash = useMemo(() => JSON.stringify(semesters), [semesters]);
  const hasChanges = currentHash !== originalHash && !isLoading;
  const counts = useMemo(() => countItems(semesters), [semesters]);

  useEffect(() => { loadData(currentCourse); }, [currentCourse.id]);

  const loadData = async (course: Course) => {
    setIsLoading(true);
    setSaveStatus('idle');
    try {
      const data = await kvFetch(`curriculum/${course.id}`);
      if (data.exists && data.semesters?.length > 0) {
        setSemesters(data.semesters); setIsFromKV(true);
        setExpandedNodes(new Set(data.semesters.map((s: any) => s.id)));
      } else {
        const staticData = staticToEditable(course); setSemesters(staticData); setIsFromKV(false);
        setExpandedNodes(new Set(staticData.map(s => s.id)));
      }
    } catch (err) {
      console.error('[Curriculum] Error loading:', err);
      const staticData = staticToEditable(course); setSemesters(staticData); setIsFromKV(false);
      setExpandedNodes(new Set(staticData.map(s => s.id)));
    }
    try {
      const [qData, fData] = await Promise.all([
        kvFetch(`quizzes-index/${course.id}`), kvFetch(`flashcards-index/${course.id}`),
      ]);
      setQuizIndex(qData.index || {}); setFlashcardIndex(fData.index || {});
    } catch (err) { console.error('[Curriculum] Error loading indexes:', err); }
    setIsLoading(false);
  };

  useEffect(() => { if (!isLoading) setOriginalHash(JSON.stringify(semesters)); }, [isLoading]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const addSemester = () => {
    const newSem: EditableSemester = { id: genId('sem'), title: `${semesters.length + 1}o Semestre`, sections: [] };
    setSemesters(prev => [...prev, newSem]); setExpandedNodes(prev => new Set([...prev, newSem.id]));
  };
  const updateSemester = (semIdx: number, field: keyof EditableSemester, value: any) => {
    setSemesters(prev => prev.map((s, i) => i === semIdx ? { ...s, [field]: value } : s));
  };
  const deleteSemester = (semIdx: number) => { setSemesters(prev => prev.filter((_, i) => i !== semIdx)); };

  const addSection = (semIdx: number) => {
    const newSec: EditableSection = { id: genId('sec'), title: 'Nova Secao', topics: [] };
    setSemesters(prev => prev.map((s, i) => i !== semIdx ? s : { ...s, sections: [...s.sections, newSec] }));
    const semId = semesters[semIdx]?.id;
    if (semId) setExpandedNodes(prev => new Set([...prev, semId, newSec.id]));
  };
  const updateSection = (semIdx: number, secIdx: number, field: keyof EditableSection, value: any) => {
    setSemesters(prev => prev.map((s, sI) => sI !== semIdx ? s : { ...s, sections: s.sections.map((sec, secI) => secI === secIdx ? { ...sec, [field]: value } : sec) }));
  };
  const deleteSection = (semIdx: number, secIdx: number) => {
    setSemesters(prev => prev.map((s, sI) => sI !== semIdx ? s : { ...s, sections: s.sections.filter((_, i) => i !== secIdx) }));
  };

  const addTopic = (semIdx: number, secIdx: number, subcategory?: TopicSubcategory) => {
    const idSuffix = subcategory === 'Aparelho Locomotor' ? 'artrologia' : subcategory === 'Neurovascular' ? 'vasc' : 'topic';
    const titleSuffix = subcategory === 'Aparelho Locomotor' ? ' (Locomotor)' : subcategory === 'Neurovascular' ? ' (Neurovascular)' : '';
    const newTopic: EditableTopic = { id: genId(idSuffix), title: `Novo Topico${titleSuffix}`, summary: '' };
    setSemesters(prev => prev.map((s, sI) => {
      if (sI !== semIdx) return s;
      return { ...s, sections: s.sections.map((sec, secI) => {
        if (secI !== secIdx) return sec;
        if (!subcategory) return { ...sec, topics: [...sec.topics, newTopic] };
        const topics = [...sec.topics]; let insertIdx = topics.length;
        for (let i = topics.length - 1; i >= 0; i--) { if (getTopicSubcategory(topics[i] as any) === subcategory) { insertIdx = i + 1; break; } }
        topics.splice(insertIdx, 0, newTopic); return { ...sec, topics };
      }) };
    }));
    const secId = semesters[semIdx]?.sections[secIdx]?.id;
    if (secId) setExpandedNodes(prev => new Set([...prev, secId]));
  };
  const updateTopic = (semIdx: number, secIdx: number, topicIdx: number, field: keyof EditableTopic, value: string) => {
    setSemesters(prev => prev.map((s, sI) => sI !== semIdx ? s : { ...s, sections: s.sections.map((sec, secI) => secI !== secIdx ? sec : { ...sec, topics: sec.topics.map((t, tI) => tI === topicIdx ? { ...t, [field]: value } : t) }) }));
  };
  const deleteTopic = (semIdx: number, secIdx: number, topicIdx: number) => {
    setSemesters(prev => prev.map((s, sI) => sI !== semIdx ? s : { ...s, sections: s.sections.map((sec, secI) => secI !== secIdx ? sec : { ...sec, topics: sec.topics.filter((_, i) => i !== topicIdx) }) }));
  };

  const addSubtopic = (semIdx: number, secIdx: number, topicIdx: number) => {
    const newSub: EditableTopic = { id: genId('sub'), title: 'Novo Subtopico', summary: '' };
    setSemesters(prev => prev.map((s, sI) => sI !== semIdx ? s : { ...s, sections: s.sections.map((sec, secI) => secI !== secIdx ? sec : { ...sec, topics: sec.topics.map((t, tI) => tI !== topicIdx ? t : { ...t, subtopics: [...(t.subtopics || []), newSub] }) }) }));
    const topicId = semesters[semIdx]?.sections[secIdx]?.topics[topicIdx]?.id;
    if (topicId) setExpandedNodes(prev => new Set([...prev, topicId]));
  };
  const updateSubtopic = (semIdx: number, secIdx: number, topicIdx: number, subIdx: number, field: keyof EditableTopic, value: string) => {
    setSemesters(prev => prev.map((s, sI) => sI !== semIdx ? s : { ...s, sections: s.sections.map((sec, secI) => secI !== secIdx ? sec : { ...sec, topics: sec.topics.map((t, tI) => tI !== topicIdx ? t : { ...t, subtopics: (t.subtopics || []).map((st, stI) => stI === subIdx ? { ...st, [field]: value } : st) }) }) }));
  };
  const deleteSubtopic = (semIdx: number, secIdx: number, topicIdx: number, subIdx: number) => {
    setSemesters(prev => prev.map((s, sI) => sI !== semIdx ? s : { ...s, sections: s.sections.map((sec, secI) => secI !== secIdx ? sec : { ...sec, topics: sec.topics.map((t, tI) => { if (tI !== topicIdx) return t; const newSubs = (t.subtopics || []).filter((_, i) => i !== subIdx); return { ...t, subtopics: newSubs.length > 0 ? newSubs : undefined }; }) }) }));
  };

  const resetToStatic = () => { const staticData = staticToEditable(currentCourse); setSemesters(staticData); setIsFromKV(false); setExpandedNodes(new Set(staticData.map(s => s.id))); };

  const handleSave = async () => {
    setIsSaving(true); setSaveStatus('idle');
    try {
      const res = await fetch(`${API_BASE}/curriculum/${currentCourse.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ semesters, courseName: currentCourse.name }),
      });
      const data = await res.json();
      if (data.success) { setSaveStatus('success'); setOriginalHash(JSON.stringify(semesters)); setIsFromKV(true); setTimeout(() => setSaveStatus('idle'), 3000); }
      else throw new Error(data.error || 'Unknown error');
    } catch (err: any) { console.error('[Curriculum] Save error:', err); setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 5000); }
    finally { setIsSaving(false); }
  };

  const handleDiscard = () => { loadData(currentCourse); };

  const findStaticSectionById = (secId: string): Section | undefined => {
    for (const sem of currentCourse.semesters) { const found = sem.sections.find(s => s.id === secId); if (found) return found; }
    return undefined;
  };

  if (isLoading) {
    return (<div className="flex flex-col h-full items-center justify-center"><Loader2 size={32} className="text-teal-500 animate-spin mb-4" /><p className="text-sm text-gray-500">Carregando estrutura curricular...</p></div>);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <AxonPageHeader title="Estrutura Curricular" subtitle={currentCourse.name}
        statsLeft={<div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><GraduationCap size={14} className="text-amber-500" /><strong>{counts.semesters}</strong> {counts.semesters === 1 ? 'semestre' : 'semestres'}</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><BookOpen size={14} className="text-blue-500" /><strong>{counts.sections}</strong> {counts.sections === 1 ? 'secao' : 'secoes'}</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><FileText size={14} className="text-teal-500" /><strong>{counts.topics}</strong> {counts.topics === 1 ? 'topico' : 'topicos'}</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Layers size={14} className="text-gray-500" /><strong>{counts.subtopics}</strong> {counts.subtopics === 1 ? 'subtopico' : 'subtopicos'}</span>
        </div>}
        statsRight={<div className="flex items-center gap-2">
          {isFromKV ? (<span className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200"><Database size={10} /> Personalizada</span>
          ) : (<span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200"><Sparkles size={10} /> Estatica (padrao)</span>)}
          {isFromKV && (<button onClick={resetToStatic} className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"><RotateCw size={10} /> Resetar</button>)}
        </div>}
      />

      <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-32">
        <div className="max-w-4xl mx-auto space-y-4 pt-2">
          {semesters.map((sem, semIdx) => (
            <SemesterNode key={sem.id} semester={sem} semIdx={semIdx} expanded={expandedNodes.has(sem.id)}
              onToggle={() => toggleExpand(sem.id)} onUpdate={(field, val) => updateSemester(semIdx, field, val)}
              onDelete={() => deleteSemester(semIdx)} onAddSection={() => addSection(semIdx)}>
              {sem.sections.map((sec, secIdx) => (
                <SectionNode key={sec.id} section={sec} semTitle={sem.title} expanded={expandedNodes.has(sec.id)}
                  onToggle={() => toggleExpand(sec.id)} onUpdate={(field, val) => updateSection(semIdx, secIdx, field, val)}
                  onDelete={() => deleteSection(semIdx, secIdx)} onAddTopic={(subcategory) => addTopic(semIdx, secIdx, subcategory)}
                  onUpdateTopic={(tIdx, field, val) => updateTopic(semIdx, secIdx, tIdx, field, val)}
                  onDeleteTopic={(tIdx) => deleteTopic(semIdx, secIdx, tIdx)}
                  onAddSubtopic={(tIdx) => addSubtopic(semIdx, secIdx, tIdx)}
                  onUpdateSubtopic={(tIdx, subIdx, field, val) => updateSubtopic(semIdx, secIdx, tIdx, subIdx, field, val)}
                  onDeleteSubtopic={(tIdx, subIdx) => deleteSubtopic(semIdx, secIdx, tIdx, subIdx)}
                  quizIndex={quizIndex} flashcardIndex={flashcardIndex} staticSection={findStaticSectionById(sec.id)}
                  setActiveView={setActiveView} expandedNodes={expandedNodes} toggleExpand={toggleExpand} />
              ))}
            </SemesterNode>
          ))}
          <button onClick={addSemester} className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/30 transition-all">
            <Plus size={18} /> Adicionar Semestre
          </button>
        </div>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-4 bg-gray-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10">
              <div className="flex items-center gap-2"><AlertTriangle size={16} className="text-amber-400" /><span className="text-sm font-medium">Alteracoes nao salvas</span></div>
              <div className="w-px h-5 bg-white/20" />
              <button onClick={handleDiscard} className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Descartar</button>
              <button onClick={handleSave} disabled={isSaving} className={clsx("flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-bold transition-all", isSaving ? "bg-teal-700 text-teal-200 cursor-wait" : "bg-teal-500 hover:bg-teal-400 text-white shadow-lg")}>
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? 'Salvando...' : 'Salvar Estrutura'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveStatus === 'success' && !hasChanges && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl"><Check size={16} /><span className="text-sm font-semibold">Estrutura salva com sucesso!</span></div>
          </motion.div>
        )}
        {saveStatus === 'error' && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl"><AlertTriangle size={16} /><span className="text-sm font-semibold">Erro ao salvar. Tente novamente.</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
