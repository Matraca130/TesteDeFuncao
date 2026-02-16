import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  Plus, Trash2, Save, Eye, ChevronDown, ChevronRight,
  Copy, AlertCircle, CheckCircle2, Lightbulb, BookOpen,
  X, ChevronLeft, AlertTriangle,
  ChevronUp, Loader2, ImageIcon, Layers, FolderOpen,
} from 'lucide-react';
import { Flashcard, Course, Topic, Semester, courses, findStaticTopic, groupTopicsBySubcategory, SUBCATEGORY_CONFIG } from '@/app/data/courses';
import { headingStyle } from '@/app/design-system';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0c4f6a3c`;

// ── Empty flashcard template ──
function newFlashcard(id: number): Flashcard {
  return { id, question: '', answer: '', mastery: 1 };
}

// ════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════
type ValidationStatus = 'complete' | 'partial' | 'empty';

interface ValidationResult {
  status: ValidationStatus;
  requiredMissing: string[];
  optionalEmpty: string[];
}

function validateFlashcard(card: Flashcard): ValidationResult {
  const requiredMissing: string[] = [];
  const optionalEmpty: string[] = [];

  if (!card.question?.trim()) requiredMissing.push('Pergunta');
  if (!card.answer?.trim()) requiredMissing.push('Resposta');

  if (!card.image?.trim()) optionalEmpty.push('Imagem');

  const status: ValidationStatus = requiredMissing.length > 0
    ? (card.question?.trim() || card.answer?.trim() ? 'partial' : 'empty')
    : 'complete';

  return { status, requiredMissing, optionalEmpty };
}

function cleanFlashcardsForSave(cards: Flashcard[]): Flashcard[] {
  return cards.map(c => {
    const cleaned = { ...c };
    if (!cleaned.image?.trim()) delete cleaned.image;
    cleaned.question = cleaned.question?.trim() || '';
    cleaned.answer = cleaned.answer?.trim() || '';
    return cleaned;
  });
}

// ════════════════════════════════════════
// STATUS DOT
// ════════════════════════════════════════
function StatusDot({ status }: { status: ValidationStatus }) {
  return (
    <div className={clsx('w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white',
      status === 'complete' && 'bg-emerald-500',
      status === 'partial' && 'bg-amber-400',
      status === 'empty' && 'bg-gray-300',
    )} />
  );
}

// ════════════════════════════════════════
// MASTERY INDICATOR
// ════════════════════════════════════════
function MasteryDots({ mastery, onChange, size = 'sm' }: { mastery: number; onChange?: (v: number) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(level => {
        const dotClass = clsx(
          'rounded-full transition-all',
          size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
          level <= mastery ? 'bg-teal-500' : 'bg-gray-200',
          onChange && 'hover:scale-125 cursor-pointer',
          !onChange && 'cursor-default'
        );
        return onChange ? (
          <button key={level}
            onClick={() => onChange(level)}
            className={dotClass}
            title={`Nivel ${level}`}
          />
        ) : (
          <span key={level} className={dotClass} />
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════
// MAIN ADMIN VIEW
// ════════════════════════════════════════
export function FlashcardAdminView() {
  const { currentCourse } = useApp();

  const [selectedTopic, setSelectedTopic] = useState<{ course: Course; semesterTitle: string; sectionTitle: string; topic: Topic } | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewMode, setPreviewMode] = useState(false);
  const [savedIndex, setSavedIndex] = useState<Record<string, any>>({});
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    loadFlashcardIndex(currentCourse.id);
  }, [currentCourse.id]);

  const loadFlashcardIndex = async (courseId: string) => {
    setLoadingIndex(true);
    try {
      const res = await fetch(`${API_BASE}/flashcards-index/${courseId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const data = await res.json();
      setSavedIndex(data.index || {});
    } catch (err) {
      console.error('[FlashcardAdmin] Error loading flashcard index:', err);
    } finally {
      setLoadingIndex(false);
    }
  };

  const handleSelectTopic = async (course: Course, semesterTitle: string, sectionTitle: string, topic: Topic) => {
    setSelectedTopic({ course, semesterTitle, sectionTitle, topic });
    setEditingIdx(null);
    setPreviewMode(false);
    setSaveStatus('idle');
    setHasUnsavedChanges(false);
    setLoadingCards(true);

    try {
      const res = await fetch(`${API_BASE}/flashcards/${course.id}/${topic.id}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        setCards(data.flashcards);
        setLoadingCards(false);
        return;
      }
    } catch (err) {
      console.error('[FlashcardAdmin] Error loading saved flashcards:', err);
    }

    // Fallback to static data
    const staticTopic = findStaticTopic(course.id, topic.id);
    setCards(staticTopic?.flashcards ? staticTopic.flashcards.map(f => ({ ...f })) : []);
    setLoadingCards(false);
  };

  const handleSave = async () => {
    if (!selectedTopic) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const cleaned = cleanFlashcardsForSave(cards);
      const res = await fetch(`${API_BASE}/flashcards/${selectedTopic.course.id}/${selectedTopic.topic.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          flashcards: cleaned,
          topicTitle: selectedTopic.topic.title,
          sectionTitle: selectedTopic.sectionTitle,
          semesterTitle: selectedTopic.semesterTitle,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setSaveStatus('success');
      setHasUnsavedChanges(false);
      loadFlashcardIndex(selectedTopic.course.id);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      console.error('[FlashcardAdmin] Error saving flashcards:', err);
      setSaveStatus('error');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setSaving(false);
    }
  };

  const markChanged = () => {
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const addCard = () => {
    const maxId = cards.reduce((max, c) => Math.max(max, c.id), 0);
    const newCard = newFlashcard(maxId + 1);
    const newLen = cards.length;
    setCards(prev => [...prev, newCard]);
    setEditingIdx(newLen);
    markChanged();
  };

  const updateCard = (idx: number, updates: Partial<Flashcard>) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c));
    markChanged();
  };

  const deleteCard = (idx: number) => {
    setCards(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
    else if (editingIdx !== null && editingIdx > idx) setEditingIdx(editingIdx - 1);
    markChanged();
  };

  const duplicateCard = (idx: number) => {
    const maxId = cards.reduce((max, c) => Math.max(max, c.id), 0);
    const clone = { ...cards[idx], id: maxId + 1 };
    const newArr = [...cards];
    newArr.splice(idx + 1, 0, clone);
    setCards(newArr);
    setEditingIdx(idx + 1);
    markChanged();
  };

  const moveCard = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cards.length) return;
    const newArr = [...cards];
    [newArr[idx], newArr[newIdx]] = [newArr[newIdx], newArr[idx]];
    setCards(newArr);
    if (editingIdx === idx) setEditingIdx(newIdx);
    else if (editingIdx === newIdx) setEditingIdx(idx);
    markChanged();
  };

  const validations = cards.map(validateFlashcard);
  const completeCount = validations.filter(v => v.status === 'complete').length;
  const partialCount = validations.filter(v => v.status === 'partial').length;
  const emptyCount = validations.filter(v => v.status === 'empty').length;

  if (!selectedTopic) {
    return <FlashcardTopicSelector currentCourse={currentCourse} savedIndex={savedIndex} loadingIndex={loadingIndex} onSelect={handleSelectTopic} />;
  }

  if (loadingCards) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-teal-500 animate-spin" />
          <p className="text-sm text-gray-500">Carregando flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              if (hasUnsavedChanges && !confirm('Voce tem alteracoes nao salvas. Deseja sair?')) return;
              setSelectedTopic(null);
            }} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ChevronLeft size={16} /> Voltar
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <Layers size={14} className="text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedTopic.topic.title}</p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="font-semibold text-gray-500">{selectedTopic.course.name}</span>
                  <ChevronRight size={8} />
                  <span>{selectedTopic.semesterTitle}</span>
                  <ChevronRight size={8} />
                  <span>{selectedTopic.sectionTitle}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cards.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                {completeCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200">
                    <CheckCircle2 size={10} />{completeCount}
                  </span>
                )}
                {partialCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-200">
                    <AlertTriangle size={10} />{partialCount}
                  </span>
                )}
                {emptyCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold border border-gray-200">
                    <AlertCircle size={10} />{emptyCount}
                  </span>
                )}
              </div>
            )}
            <button onClick={() => setPreviewMode(!previewMode)}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                previewMode ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              )}>
              <Eye size={13} /> {previewMode ? 'Editar' : 'Preview'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Adicionar:</span>
            <button onClick={addCard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:shadow-md hover:-translate-y-0.5 text-teal-700 bg-teal-50 border-teal-200">
              <Plus size={13} /> <Layers size={13} /> Novo Flashcard
            </button>
          </div>

          {cards.length === 0 ? (
            <FlashcardEmptyState onAdd={addCard} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {cards.map((card, idx) => {
                  const val = validations[idx];
                  return (
                    <motion.div key={card.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}>
                      {previewMode ? (
                        <FlashcardPreview card={card} index={idx} validation={val} />
                      ) : editingIdx === idx ? (
                        <FlashcardEditor
                          card={card}
                          index={idx}
                          total={cards.length}
                          validation={val}
                          onUpdate={(updates) => updateCard(idx, updates)}
                          onDelete={() => deleteCard(idx)}
                          onDuplicate={() => duplicateCard(idx)}
                          onMove={(dir) => moveCard(idx, dir)}
                          onClose={() => setEditingIdx(null)}
                        />
                      ) : (
                        <FlashcardCard
                          card={card}
                          index={idx}
                          validation={val}
                          onClick={() => setEditingIdx(idx)}
                          onDelete={() => deleteCard(idx)}
                          onDuplicate={() => duplicateCard(idx)}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{cards.length} {cards.length === 1 ? 'flashcard' : 'flashcards'}</span>
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Alteracoes nao salvas
                </span>
              )}
              {partialCount > 0 && (
                <span className="text-[10px] text-amber-500">
                  ({partialCount} incompleto{partialCount > 1 ? 's' : ''} — ser{partialCount > 1 ? 'ao' : 'a'} salvo{partialCount > 1 ? 's' : ''} assim mesmo)
                </span>
              )}
            </div>
            <button onClick={handleSave} disabled={saving}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                saving && "bg-gray-200 text-gray-500 cursor-wait",
                !saving && saveStatus === 'idle' && "bg-teal-600 hover:bg-teal-700 text-white hover:shadow-md active:scale-[0.98]",
                !saving && saveStatus === 'success' && "bg-emerald-500 text-white",
                !saving && saveStatus === 'error' && "bg-rose-500 text-white",
              )}>
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Salvando...</>
              ) : saveStatus === 'success' ? (
                <><CheckCircle2 size={15} /> Salvo com sucesso!</>
              ) : saveStatus === 'error' ? (
                <><AlertCircle size={15} /> Erro ao salvar</>
              ) : (
                <><Save size={15} /> Salvar Flashcards</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// TOPIC SELECTOR
// ════════════════════════════════════════
function FlashcardTopicSelector({ currentCourse, savedIndex, loadingIndex, onSelect }: {
  currentCourse: Course;
  savedIndex: Record<string, any>;
  loadingIndex: boolean;
  onSelect: (course: Course, semesterTitle: string, sectionTitle: string, topic: Topic) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [dynamicSemesters, setDynamicSemesters] = useState<Semester[] | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingStructure(true);
      try {
        const res = await fetch(`${API_BASE}/curriculum/${currentCourse.id}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        });
        const data = await res.json();
        if (data.exists && data.semesters?.length > 0) {
          const sems: Semester[] = data.semesters.map((sem: any) => ({
            id: sem.id,
            title: sem.title,
            sections: (sem.sections || []).map((sec: any) => ({
              id: sec.id,
              title: sec.title,
              topics: (sec.topics || []).map((t: any) => {
                const st = findStaticTopic(currentCourse.id, t.id);
                const base = st ? { ...st, title: t.title, summary: t.summary || st.summary } : { id: t.id, title: t.title, summary: t.summary || '' } as Topic;
                return {
                  ...base,
                  subtopics: t.subtopics?.map((sub: any) => {
                    const sSt = findStaticTopic(currentCourse.id, sub.id);
                    return sSt ? { ...sSt, title: sub.title, summary: sub.summary || sSt.summary } : { id: sub.id, title: sub.title, summary: sub.summary || '' } as Topic;
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
        console.error('[FlashcardTopicSelector] Error loading curriculum:', err);
        setDynamicSemesters(null);
      }
      setLoadingStructure(false);
    })();
  }, [currentCourse.id]);

  const semesters = dynamicSemesters || currentCourse.semesters;
  const isUsingDynamic = dynamicSemesters !== null;

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

  return (
    <div className="h-full overflow-y-auto bg-surface-dashboard">
      <AxonPageHeader
        title="Admin Flashcards"
        subtitle={currentCourse.name}
        statsLeft={<p className="text-gray-500 text-sm">Selecione um topico para criar ou editar flashcards</p>}
        actionButton={
          <div className="flex items-center gap-3">
            {isUsingDynamic && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-200">
                Estrutura Personalizada
              </span>
            )}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full shadow-sm">
              <Layers size={15} className="text-white" />
              <span className="text-sm font-semibold text-white">Modo Administrador</span>
            </div>
          </div>
        }
      />
      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          {loadingStructure ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-teal-400 animate-spin" />
            </div>
          ) : semesters.map((semester) => (
            <div key={semester.id}>
              <h2 className="text-lg font-bold text-gray-900 mb-5 pl-4 border-l-4 border-teal-500 flex items-center gap-2" style={headingStyle}>
                {semester.title}
              </h2>
              <div className="space-y-3">
                {semester.sections.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  const topicsWithSaved = section.topics.filter(t => savedIndex[t.id]);
                  const topicsWithStatic = section.topics.filter(t => (t.flashcards?.length || 0) > 0 && !savedIndex[t.id]);

                  return (
                    <div key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <button onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                          <BookOpen size={18} className="text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900">{section.title}</h3>
                          <p className="text-xs text-gray-400">{section.topics.length} topicos &middot; {topicsWithSaved.length + topicsWithStatic.length} com flashcards</p>
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
                                {subGroup.topics.map((topic) => {
                                  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
                                  const savedInfo = savedIndex[topic.id];
                                  const staticCount = topic.flashcards?.length || 0;
                                  const hasSaved = !!savedInfo;
                                  const count = hasSaved ? savedInfo.flashcardCount : staticCount;
                                  const isTopicExpanded = expandedTopics.has(topic.id);

                                  if (hasSubtopics) {
                                    return (
                                      <div key={topic.id}>
                                        <button
                                          onClick={() => toggleTopic(topic.id)}
                                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-teal-50/50 transition-colors text-left group">
                                          <FolderOpen size={14} className={clsx("shrink-0", isTopicExpanded ? "text-teal-500" : "text-gray-400")} />
                                          <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition-colors">{topic.title}</span>
                                          </div>
                                          <span className="text-[9px] text-teal-500 font-semibold bg-teal-50 px-1.5 py-0.5 rounded-full shrink-0">{topic.subtopics!.length} sub</span>
                                          <ChevronDown size={14} className={clsx("text-gray-300 transition-transform", isTopicExpanded && "rotate-180")} />
                                        </button>
                                        {isTopicExpanded && (
                                          <div className="ml-6 pl-3 border-l-2 border-teal-100 mb-1">
                                            {topic.subtopics!.map((sub) => {
                                              const subSaved = savedIndex[sub.id];
                                              const subStatic = sub.flashcards?.length || 0;
                                              const subHasSaved = !!subSaved;
                                              const subCount = subHasSaved ? subSaved.flashcardCount : subStatic;
                                              return (
                                                <button key={sub.id}
                                                  onClick={() => onSelect(currentCourse, semester.title, section.title, sub)}
                                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-teal-50/50 transition-colors text-left group">
                                                  <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0",
                                                    subHasSaved ? "bg-emerald-500" : subCount > 0 ? "bg-amber-400" : "bg-gray-200"
                                                  )} />
                                                  <div className="flex-1 min-w-0">
                                                    <span className="text-[13px] font-medium text-gray-600 group-hover:text-teal-700 transition-colors">{sub.title}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    {subHasSaved && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold border border-emerald-200">{subCount}</span>}
                                                    {!subHasSaved && subCount > 0 && <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full font-medium border border-gray-200">{subCount}</span>}
                                                    {subCount === 0 && <span className="text-[9px] text-gray-300 font-medium">Vazio</span>}
                                                    <ChevronRight size={13} className="text-gray-300 group-hover:text-teal-400 transition-colors" />
                                                  </div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }

                                  return (
                                    <button key={topic.id}
                                      onClick={() => onSelect(currentCourse, semester.title, section.title, topic)}
                                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-teal-50/50 transition-colors text-left group">
                                      <div className={clsx("w-2 h-2 rounded-full shrink-0",
                                        hasSaved ? "bg-emerald-500" : count > 0 ? "bg-amber-400" : "bg-gray-200"
                                      )} />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition-colors">{topic.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {hasSaved && (
                                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                                            {count} salvos
                                          </span>
                                        )}
                                        {!hasSaved && count > 0 && (
                                          <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium border border-gray-200">
                                            {count} estaticos
                                          </span>
                                        )}
                                        {count === 0 && (
                                          <span className="text-[10px] text-gray-300 font-medium">Vazio</span>
                                        )}
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-teal-400 transition-colors" />
                                      </div>
                                    </button>
                                  );
                                })}
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

function FlashcardEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <Layers size={36} className="text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum flashcard ainda</h3>
      <p className="text-sm text-gray-500 mb-2 max-w-md">
        Crie seu primeiro flashcard para este topico.
      </p>
      <p className="text-xs text-gray-400 mb-8 max-w-md">
        Apenas a <strong>pergunta</strong> e a <strong>resposta</strong> sao obrigatorias. Imagem e nivel de dominio sao opcionais.
      </p>
      <button onClick={onAdd}
        className="flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50 text-teal-700 font-bold transition-all hover:shadow-lg hover:-translate-y-1">
        <Plus size={20} />
        <Layers size={20} />
        <span className="text-sm">Criar Flashcard</span>
      </button>
    </div>
  );
}

function FlashcardCard({ card, index, validation, onClick, onDelete, onDuplicate }: {
  card: Flashcard;
  index: number;
  validation: ValidationResult;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className={clsx(
      "bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group",
      validation.status === 'complete' ? 'border-gray-200 hover:border-emerald-300' :
      validation.status === 'partial' ? 'border-amber-200 hover:border-amber-300' :
      'border-gray-200 hover:border-gray-300'
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <StatusDot status={validation.status} />
          <span className="text-xs font-bold text-gray-300 w-4 text-right">{index + 1}</span>
        </div>
        <button onClick={onClick} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-teal-700 bg-teal-50 border-teal-200">
              <Layers size={10} /> Flashcard
            </span>
            {card.image && <ImageIcon size={11} className="text-blue-400" title="Tem imagem" />}
            <MasteryDots mastery={card.mastery} size="sm" />
            {validation.status === 'partial' && validation.requiredMissing.length > 0 && (
              <span className="text-[9px] text-amber-500 font-medium">
                Falta: {validation.requiredMissing.join(', ')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-800 line-clamp-2 font-medium">
            {card.question || <span className="text-gray-300 italic">Clique para editar...</span>}
          </p>
          <p className="text-[11px] mt-1">
            {card.answer
              ? <span className="text-emerald-600">Resp: {card.answer.length > 80 ? card.answer.slice(0, 80) + '...' : card.answer}</span>
              : <span className="text-amber-500 italic">Sem resposta definida</span>}
          </p>
        </button>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors" title="Excluir">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FlashcardEditor({ card, index, total, validation, onUpdate, onDelete, onDuplicate, onMove, onClose }: {
  card: Flashcard;
  index: number;
  total: number;
  validation: ValidationResult;
  onUpdate: (updates: Partial<Flashcard>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onClose: () => void;
}) {
  const [showOptional, setShowOptional] = useState(!!(card.image));

  return (
    <div className={clsx(
      "bg-white rounded-2xl border-2 shadow-lg overflow-hidden",
      validation.status === 'complete' ? 'border-emerald-300' :
      validation.status === 'partial' ? 'border-amber-300' :
      'border-teal-300'
    )}>
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

      {validation.requiredMissing.length > 0 && (
        <div className="mx-5 mt-3 flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-amber-700 font-semibold">Campos obrigatorios faltando:</p>
            <p className="text-[10px] text-amber-600">{validation.requiredMissing.join(' · ')}</p>
          </div>
        </div>
      )}

      <div className="px-5 py-4 space-y-4">
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

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
      {label}
      {required ? (
        <span className="text-[9px] font-bold text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded normal-case tracking-normal">obrigatorio</span>
      ) : (
        <span className="text-[9px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded normal-case tracking-normal">opcional</span>
      )}
    </label>
  );
}

function FlashcardPreview({ card, index, validation }: { card: Flashcard; index: number; validation: ValidationResult }) {
  return (
    <div className={clsx("bg-white rounded-xl border shadow-sm overflow-hidden",
      validation.status === 'complete' ? 'border-gray-200' : 'border-amber-200'
    )}>
      <div className="flex">
        <div className="flex-1 p-5">
          <div className="flex items-center gap-2 mb-3">
            <StatusDot status={validation.status} />
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-teal-700 bg-teal-50 border-teal-200">
              <Layers size={10} /> Flashcard
            </span>
            <MasteryDots mastery={card.mastery} size="sm" />
            {validation.status !== 'complete' && (
              <span className="text-[9px] text-amber-500">Incompleto</span>
            )}
          </div>

          <div className="flex gap-3 mb-4">
            <span className="text-gray-400 font-semibold text-base shrink-0">{index + 1}.</span>
            <div className="flex-1">
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">
                  <Lightbulb size={10} /> Pergunta
                </div>
                <p className="text-base text-gray-800 leading-relaxed">{card.question || <span className="text-gray-300 italic">Sem pergunta</span>}</p>
              </div>
              <div className="px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50">
                <p className="text-[11px] text-emerald-600 font-semibold mb-1">Resposta:</p>
                <p className="text-sm text-gray-800 font-medium">{card.answer || <span className="text-gray-300 italic">nao definida</span>}</p>
              </div>
            </div>
          </div>
        </div>

        {card.image && (
          <div className="w-40 shrink-0 border-l border-gray-100 bg-gray-50">
            <img src={card.image} alt="" className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
          </div>
        )}
      </div>
    </div>
  );
}