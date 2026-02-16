import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  Plus, Trash2, Save, Eye, ChevronDown, ChevronRight,
  ListChecks, PenLine, TextCursorInput,
  Copy, AlertCircle, CheckCircle2, Lightbulb, BookOpen,
  Settings2, FileText, X, ChevronLeft, AlertTriangle,
  ChevronUp, Loader2, FolderOpen,
} from 'lucide-react';
import { QuizQuestion, QuizQuestionType, Course, Topic, Semester, courses, findStaticTopic, groupTopicsBySubcategory, SUBCATEGORY_CONFIG } from '@/app/data/courses';
import { headingStyle } from '@/app/design-system';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0c4f6a3c`;

// ── Empty question templates ──
function newMultipleChoice(id: number): QuizQuestion {
  return { id, type: 'multiple-choice', question: '', options: ['', '', '', ''], correctAnswer: 0 };
}
function newWriteIn(id: number): QuizQuestion {
  return { id, type: 'write-in', question: '', correctText: '' };
}
function newFillBlank(id: number): QuizQuestion {
  return { id, type: 'fill-blank', question: '', blankSentence: '', blankAnswer: '' };
}

// ── Type config ──
const TYPE_CONFIG: Record<QuizQuestionType, { label: string; icon: React.ElementType; color: string }> = {
  'multiple-choice': { label: 'Multipla Escolha', icon: ListChecks, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  'write-in': { label: 'Escrita Livre', icon: PenLine, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  'fill-blank': { label: 'Completar', icon: TextCursorInput, color: 'text-violet-700 bg-violet-50 border-violet-200' },
};

// ════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════
type ValidationStatus = 'complete' | 'partial' | 'empty';

interface ValidationResult {
  status: ValidationStatus;
  requiredMissing: string[];
  optionalEmpty: string[];
}

function validateQuestion(q: QuizQuestion): ValidationResult {
  const type = q.type || 'multiple-choice';
  const requiredMissing: string[] = [];
  const optionalEmpty: string[] = [];

  // Question text is always required
  if (!q.question?.trim()) requiredMissing.push('Pergunta');

  switch (type) {
    case 'multiple-choice': {
      const opts = q.options || [];
      const filledOpts = opts.filter(o => o.trim());
      if (filledOpts.length < 2) requiredMissing.push('Minimo 2 opcoes preenchidas');
      if (q.correctAnswer == null || q.correctAnswer < 0 || q.correctAnswer >= opts.length) {
        requiredMissing.push('Resposta correta');
      } else if (!opts[q.correctAnswer]?.trim()) {
        requiredMissing.push('Opcao correta esta vazia');
      }
      break;
    }
    case 'write-in': {
      if (!q.correctText?.trim()) requiredMissing.push('Resposta correta');
      if (!q.acceptedVariations || q.acceptedVariations.length === 0) optionalEmpty.push('Variacoes');
      break;
    }
    case 'fill-blank': {
      if (!q.blankSentence?.trim()) requiredMissing.push('Frase com lacuna');
      else if (!q.blankSentence.includes('___')) requiredMissing.push('Frase precisa de ___');
      if (!q.blankAnswer?.trim()) requiredMissing.push('Resposta da lacuna');
      break;
    }
  }

  if (!q.hint?.trim()) optionalEmpty.push('Dica');
  if (!q.explanation?.trim()) optionalEmpty.push('Explicacao');

  const status: ValidationStatus = requiredMissing.length > 0
    ? (q.question?.trim() ? 'partial' : 'empty')
    : 'complete';

  return { status, requiredMissing, optionalEmpty };
}

function cleanQuestionsForSave(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map(q => {
    const cleaned = { ...q };
    // Strip empty optional fields
    if (!cleaned.hint?.trim()) delete cleaned.hint;
    if (!cleaned.explanation?.trim()) delete cleaned.explanation;
    if (cleaned.acceptedVariations) {
      cleaned.acceptedVariations = cleaned.acceptedVariations.filter(v => v.trim());
      if (cleaned.acceptedVariations.length === 0) delete cleaned.acceptedVariations;
    }
    // Strip empty options
    if (cleaned.options) {
      cleaned.options = cleaned.options.map(o => o.trim());
    }
    return cleaned;
  });
}

// ════════════════════════════════════════
// STATUS BADGE
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
// MAIN ADMIN VIEW
// ════════════════════════════════════════
export function QuizAdminView() {
  const { currentCourse } = useApp();

  const [selectedTopic, setSelectedTopic] = useState<{ course: Course; semesterTitle: string; sectionTitle: string; topic: Topic } | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewMode, setPreviewMode] = useState(false);
  const [savedQuizIndex, setSavedQuizIndex] = useState<Record<string, any>>({});
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    loadQuizIndex(currentCourse.id);
  }, [currentCourse.id]);

  const loadQuizIndex = async (courseId: string) => {
    setLoadingIndex(true);
    try {
      const res = await fetch(`${API_BASE}/quizzes-index/${courseId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const data = await res.json();
      setSavedQuizIndex(data.index || {});
    } catch (err) {
      console.error('[Admin] Error loading quiz index:', err);
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
    setLoadingQuestions(true);

    try {
      const res = await fetch(`${API_BASE}/quizzes/${course.id}/${topic.id}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setLoadingQuestions(false);
        return;
      }
    } catch (err) {
      console.error('[Admin] Error loading saved quizzes:', err);
    }

    setQuestions(topic.quizzes ? [...topic.quizzes] : []);
    setLoadingQuestions(false);
  };

  const handleSave = async () => {
    if (!selectedTopic) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const cleaned = cleanQuestionsForSave(questions);
      const res = await fetch(`${API_BASE}/quizzes/${selectedTopic.course.id}/${selectedTopic.topic.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          questions: cleaned,
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
      loadQuizIndex(selectedTopic.course.id);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error('[Admin] Error saving quiz:', err);
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

  const addQuestion = (type: QuizQuestionType) => {
    const maxId = questions.reduce((max, q) => Math.max(max, q.id), 0);
    let newQ: QuizQuestion;
    switch (type) {
      case 'write-in': newQ = newWriteIn(maxId + 1); break;
      case 'fill-blank': newQ = newFillBlank(maxId + 1); break;
      default: newQ = newMultipleChoice(maxId + 1);
    }
    const newLen = questions.length;
    setQuestions(prev => [...prev, newQ]);
    setEditingIdx(newLen);
    markChanged();
  };

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q));
    markChanged();
  };

  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
    else if (editingIdx !== null && editingIdx > idx) setEditingIdx(editingIdx - 1);
    markChanged();
  };

  const duplicateQuestion = (idx: number) => {
    const maxId = questions.reduce((max, q) => Math.max(max, q.id), 0);
    const clone = { ...questions[idx], id: maxId + 1 };
    if (clone.options) clone.options = [...clone.options];
    if (clone.acceptedVariations) clone.acceptedVariations = [...clone.acceptedVariations];
    const newArr = [...questions];
    newArr.splice(idx + 1, 0, clone);
    setQuestions(newArr);
    setEditingIdx(idx + 1);
    markChanged();
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const newArr = [...questions];
    [newArr[idx], newArr[newIdx]] = [newArr[newIdx], newArr[idx]];
    setQuestions(newArr);
    if (editingIdx === idx) setEditingIdx(newIdx);
    else if (editingIdx === newIdx) setEditingIdx(idx);
    markChanged();
  };

  // Validation summary
  const validations = questions.map(validateQuestion);
  const completeCount = validations.filter(v => v.status === 'complete').length;
  const partialCount = validations.filter(v => v.status === 'partial').length;
  const emptyCount = validations.filter(v => v.status === 'empty').length;

  // ── Topic not selected: show selector ──
  if (!selectedTopic) {
    return <TopicSelector currentCourse={currentCourse} savedIndex={savedQuizIndex} loadingIndex={loadingIndex} onSelect={handleSelectTopic} />;
  }

  // ── Loading ──
  if (loadingQuestions) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-violet-500 animate-spin" />
          <p className="text-sm text-gray-500">Carregando questoes...</p>
        </div>
      </div>
    );
  }

  // ── Topic selected: show editor ──
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top Bar */}
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
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Settings2 size={14} className="text-violet-600" />
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
            {questions.length > 0 && (
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
                previewMode ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              )}>
              <Eye size={13} /> {previewMode ? 'Editar' : 'Preview'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto px-6 py-6">

          {/* Add Question Buttons */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Adicionar:</span>
            {(['multiple-choice', 'write-in', 'fill-blank'] as QuizQuestionType[]).map((type) => {
              const cfg = TYPE_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <button key={type} onClick={() => addQuestion(type)}
                  className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:shadow-md hover:-translate-y-0.5", cfg.color)}>
                  <Plus size={13} /> <Icon size={13} /> {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <EmptyState onAdd={addQuestion} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {questions.map((q, idx) => {
                  const val = validations[idx];
                  return (
                    <motion.div key={q.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}>
                      {previewMode ? (
                        <QuestionPreview question={q} index={idx} validation={val} />
                      ) : editingIdx === idx ? (
                        <QuestionEditor
                          question={q}
                          index={idx}
                          total={questions.length}
                          validation={val}
                          onUpdate={(updates) => updateQuestion(idx, updates)}
                          onDelete={() => deleteQuestion(idx)}
                          onDuplicate={() => duplicateQuestion(idx)}
                          onMove={(dir) => moveQuestion(idx, dir)}
                          onClose={() => setEditingIdx(null)}
                        />
                      ) : (
                        <QuestionCard
                          question={q}
                          index={idx}
                          validation={val}
                          onClick={() => setEditingIdx(idx)}
                          onDelete={() => deleteQuestion(idx)}
                          onDuplicate={() => duplicateQuestion(idx)}
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

      {/* ═══ FLOATING SAVE BAR ═══ */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{questions.length} {questions.length === 1 ? 'questao' : 'questoes'}</span>
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Alteracoes nao salvas
                </span>
              )}
              {partialCount > 0 && (
                <span className="text-[10px] text-amber-500">
                  ({partialCount} incompleta{partialCount > 1 ? 's' : ''} — sera{partialCount > 1 ? 'o' : ''} salva{partialCount > 1 ? 's' : ''} assim mesmo)
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
                <><Save size={15} /> Salvar Quiz</>
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
function TopicSelector({ currentCourse, savedIndex, loadingIndex, onSelect }: {
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
        console.error('[TopicSelector] Error loading curriculum:', err);
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
        title="Admin Quizzes"
        subtitle={currentCourse.name}
        statsLeft={<p className="text-gray-500 text-sm">Selecione um topico para criar ou editar quizzes</p>}
        actionButton={
          <div className="flex items-center gap-3">
            {isUsingDynamic && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-200">
                Estrutura Personalizada
              </span>
            )}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full shadow-sm">
              <Settings2 size={15} className="text-white" />
              <span className="text-sm font-semibold text-white">Modo Administrador</span>
            </div>
          </div>
        }
      />
      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          {loadingStructure ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-violet-400 animate-spin" />
            </div>
          ) : semesters.map((semester) => (
            <div key={semester.id}>
              <h2 className="text-lg font-bold text-gray-900 mb-5 pl-4 border-l-4 border-violet-500 flex items-center gap-2" style={headingStyle}>
                {semester.title}
              </h2>
              <div className="space-y-3">
                {semester.sections.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  const topicsWithSavedQuiz = section.topics.filter(t => savedIndex[t.id]);
                  const topicsWithStaticQuiz = section.topics.filter(t => (t.quizzes?.length || 0) > 0 && !savedIndex[t.id]);

                  return (
                    <div key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <button onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                          <BookOpen size={18} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900">{section.title}</h3>
                          <p className="text-xs text-gray-400">{section.topics.length} topicos &middot; {topicsWithSavedQuiz.length + topicsWithStaticQuiz.length} com quiz</p>
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
                                  const staticCount = topic.quizzes?.length || 0;
                                  const hasSaved = !!savedInfo;
                                  const count = hasSaved ? savedInfo.questionCount : staticCount;
                                  const isTopicExpanded = expandedTopics.has(topic.id);

                                  if (hasSubtopics) {
                                    return (
                                      <div key={topic.id}>
                                        <button
                                          onClick={() => toggleTopic(topic.id)}
                                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-50/50 transition-colors text-left group">
                                          <FolderOpen size={14} className={clsx("shrink-0", isTopicExpanded ? "text-violet-500" : "text-gray-400")} />
                                          <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-violet-700 transition-colors">{topic.title}</span>
                                          </div>
                                          <span className="text-[9px] text-violet-500 font-semibold bg-violet-50 px-1.5 py-0.5 rounded-full shrink-0">{topic.subtopics!.length} sub</span>
                                          <ChevronDown size={14} className={clsx("text-gray-300 transition-transform", isTopicExpanded && "rotate-180")} />
                                        </button>
                                        {isTopicExpanded && (
                                          <div className="ml-6 pl-3 border-l-2 border-violet-100 mb-1">
                                            {topic.subtopics!.map((sub) => {
                                              const subSaved = savedIndex[sub.id];
                                              const subStatic = sub.quizzes?.length || 0;
                                              const subHasSaved = !!subSaved;
                                              const subCount = subHasSaved ? subSaved.questionCount : subStatic;
                                              return (
                                                <button key={sub.id}
                                                  onClick={() => onSelect(currentCourse, semester.title, section.title, sub)}
                                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-violet-50/50 transition-colors text-left group">
                                                  <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0",
                                                    subHasSaved ? "bg-emerald-500" : subCount > 0 ? "bg-amber-400" : "bg-gray-200"
                                                  )} />
                                                  <div className="flex-1 min-w-0">
                                                    <span className="text-[13px] font-medium text-gray-600 group-hover:text-violet-700 transition-colors">{sub.title}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    {subHasSaved && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold border border-emerald-200">{subCount}q</span>}
                                                    {!subHasSaved && subCount > 0 && <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full font-medium border border-gray-200">{subCount}q</span>}
                                                    {subCount === 0 && <span className="text-[9px] text-gray-300 font-medium">Vazio</span>}
                                                    <ChevronRight size={13} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
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
                                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-50/50 transition-colors text-left group">
                                      <div className={clsx("w-2 h-2 rounded-full shrink-0",
                                        hasSaved ? "bg-emerald-500" : count > 0 ? "bg-amber-400" : "bg-gray-200"
                                      )} />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-violet-700 transition-colors">{topic.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {hasSaved && (
                                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                                            {count}q salvas
                                          </span>
                                        )}
                                        {!hasSaved && count > 0 && (
                                          <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium border border-gray-200">
                                            {count}q estaticas
                                          </span>
                                        )}
                                        {count === 0 && (
                                          <span className="text-[10px] text-gray-300 font-medium">Vazio</span>
                                        )}
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
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

// ════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════
function EmptyState({ onAdd }: { onAdd: (type: QuizQuestionType) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <FileText size={36} className="text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma questao ainda</h3>
      <p className="text-sm text-gray-500 mb-2 max-w-md">
        Crie sua primeira questao escolhendo um dos tipos abaixo.
      </p>
      <p className="text-xs text-gray-400 mb-8 max-w-md">
        Apenas a <strong>pergunta</strong> e a <strong>resposta correta</strong> sao obrigatorias. Dica, explicacao e variacoes sao opcionais.
      </p>
      <div className="flex gap-3">
        {(['multiple-choice', 'write-in', 'fill-blank'] as QuizQuestionType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          return (
            <button key={type} onClick={() => onAdd(type)}
              className={clsx("flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 border-dashed transition-all hover:shadow-lg hover:-translate-y-1", cfg.color)}>
              <Icon size={24} />
              <span className="text-xs font-bold">{cfg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// QUESTION CARD (collapsed)
// ════════════════════════════════════════
function QuestionCard({ question, index, validation, onClick, onDelete, onDuplicate }: {
  question: QuizQuestion;
  index: number;
  validation: ValidationResult;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const type = question.type || 'multiple-choice';
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

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
            <span className={clsx("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color)}>
              <Icon size={10} /> {cfg.label}
            </span>
            {question.hint && <Lightbulb size={11} className="text-amber-400" title="Tem dica" />}
            {question.explanation && <FileText size={11} className="text-blue-400" title="Tem explicacao" />}
            {validation.status === 'partial' && validation.requiredMissing.length > 0 && (
              <span className="text-[9px] text-amber-500 font-medium">
                Falta: {validation.requiredMissing.join(', ')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-800 line-clamp-2 font-medium">
            {question.question || <span className="text-gray-300 italic">Clique para editar...</span>}
          </p>
          {type === 'multiple-choice' && question.options && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {question.options.map((opt, i) => (
                <span key={i} className={clsx("text-[10px] px-1.5 py-0.5 rounded",
                  i === question.correctAnswer ? "bg-emerald-50 text-emerald-600 font-semibold" : "bg-gray-50 text-gray-400"
                )}>
                  {String.fromCharCode(65 + i)}. {opt ? (opt.length > 20 ? opt.slice(0, 20) + '...' : opt) : '...'}
                </span>
              ))}
            </div>
          )}
          {type === 'write-in' && (
            <p className="text-[11px] mt-1">
              {question.correctText
                ? <span className="text-emerald-600">Resp: {question.correctText}</span>
                : <span className="text-amber-500 italic">Sem resposta definida</span>}
            </p>
          )}
          {type === 'fill-blank' && (
            <p className="text-[11px] mt-1">
              {question.blankAnswer
                ? <span className="text-violet-600">Resp: {question.blankAnswer}</span>
                : <span className="text-amber-500 italic">Sem resposta definida</span>}
            </p>
          )}
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

// ════════════════════════════════════════
// QUESTION EDITOR (expanded)
// ════════════════════════════════════════
function QuestionEditor({ question, index, total, validation, onUpdate, onDelete, onDuplicate, onMove, onClose }: {
  question: QuizQuestion;
  index: number;
  total: number;
  validation: ValidationResult;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onClose: () => void;
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
            <p className="text-[10px] text-amber-600">{validation.requiredMissing.join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Question text */}
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

        {/* Type-specific fields */}
        {type === 'multiple-choice' && <MultipleChoiceFields question={question} onUpdate={onUpdate} />}
        {type === 'write-in' && <WriteInFields question={question} onUpdate={onUpdate} />}
        {type === 'fill-blank' && <FillBlankFields question={question} onUpdate={onUpdate} />}

        {/* ── Optional Fields (collapsible) ── */}
        <OptionalFieldsSection question={question} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// ── Field label helper ──
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

// ── Optional Fields Section ──
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

// ── Multiple Choice Fields ──
function MultipleChoiceFields({ question, onUpdate }: { question: QuizQuestion; onUpdate: (u: Partial<QuizQuestion>) => void }) {
  const options = question.options || ['', '', '', ''];

  const updateOption = (idx: number, value: string) => {
    const newOpts = [...options];
    newOpts[idx] = value;
    onUpdate({ options: newOpts });
  };

  const addOption = () => onUpdate({ options: [...options, ''] });

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, i) => i !== idx);
    const newCorrect = question.correctAnswer === idx ? 0 :
      (question.correctAnswer || 0) > idx ? (question.correctAnswer || 0) - 1 : question.correctAnswer;
    onUpdate({ options: newOpts, correctAnswer: newCorrect });
  };

  return (
    <div>
      <FieldLabel label="Opcoes (clique no circulo = resposta correta)" required />
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <button onClick={() => onUpdate({ correctAnswer: idx })}
              className={clsx("w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all text-xs font-bold",
                idx === question.correctAnswer
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-gray-300 text-gray-400 hover:border-emerald-300"
              )}>
              {String.fromCharCode(65 + idx)}
            </button>
            <input type="text" value={opt} onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`Opcao ${String.fromCharCode(65 + idx)}...`}
              className={clsx("flex-1 px-3 py-2 border rounded-lg text-sm outline-none transition-all placeholder:text-gray-300",
                idx === question.correctAnswer ? "border-emerald-200 bg-emerald-50/30 focus:border-emerald-400" : "border-gray-200 focus:border-violet-400"
              )}
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(idx)} className="p-1 rounded-lg text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < 8 && (
        <button onClick={addOption} className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 mt-2 transition-colors font-medium">
          <Plus size={12} /> Adicionar opcao
        </button>
      )}
    </div>
  );
}

// ── Write-In Fields ──
function WriteInFields({ question, onUpdate }: { question: QuizQuestion; onUpdate: (u: Partial<QuizQuestion>) => void }) {
  const variations = question.acceptedVariations || [];

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Resposta correta" required />
        <input type="text" value={question.correctText || ''} onChange={(e) => onUpdate({ correctText: e.target.value })}
          placeholder="A resposta principal esperada..."
          className={clsx(
            "w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300",
            !question.correctText?.trim()
              ? 'border border-amber-300 bg-amber-50/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
              : 'border border-emerald-200 bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50'
          )}
        />
      </div>
      <div>
        <FieldLabel label="Variacoes aceitas" />
        <div className="space-y-2">
          {variations.map((v, idx) => (
            <div key={idx} className="flex items-center gap-2 group">
              <input type="text" value={v} onChange={(e) => {
                const newVars = [...variations];
                newVars[idx] = e.target.value;
                onUpdate({ acceptedVariations: newVars });
              }}
                placeholder={`Variacao ${idx + 1}...`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-violet-400 transition-all placeholder:text-gray-300"
              />
              <button onClick={() => onUpdate({ acceptedVariations: variations.filter((_, i) => i !== idx) })}
                className="p-1 rounded-lg text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => onUpdate({ acceptedVariations: [...variations, ''] })}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 mt-2 transition-colors font-medium">
          <Plus size={12} /> Adicionar variacao
        </button>
      </div>
    </div>
  );
}

// ── Fill-Blank Fields ──
function FillBlankFields({ question, onUpdate }: { question: QuizQuestion; onUpdate: (u: Partial<QuizQuestion>) => void }) {
  const hasPlaceholder = question.blankSentence?.includes('___');

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Frase com lacuna (use ___ para o espaco em branco)" required />
        <textarea value={question.blankSentence || ''} onChange={(e) => onUpdate({ blankSentence: e.target.value })}
          placeholder="O nervo ___ pode ser lesado em fraturas do colo cirurgico..."
          className={clsx(
            "w-full px-3 py-2.5 border rounded-xl text-sm text-gray-800 outline-none resize-none min-h-[70px] transition-all placeholder:text-gray-300",
            !question.blankSentence?.trim() ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100' :
            !hasPlaceholder ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100' :
            'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-50'
          )}
        />
        {question.blankSentence?.trim() && !hasPlaceholder && (
          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
            <AlertCircle size={10} /> A frase precisa conter ___ (tres underlines) para indicar a lacuna
          </p>
        )}
      </div>
      <div>
        <FieldLabel label="Resposta que preenche a lacuna" required />
        <input type="text" value={question.blankAnswer || ''} onChange={(e) => onUpdate({ blankAnswer: e.target.value })}
          placeholder="axilar"
          className={clsx(
            "w-full px-3 py-2.5 border rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-300",
            !question.blankAnswer?.trim()
              ? 'border-amber-300 bg-amber-50/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
              : 'border-violet-200 bg-violet-50/30 focus:border-violet-400 focus:ring-2 focus:ring-violet-50'
          )}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// QUESTION PREVIEW
// ════════════════════════════════════════
function QuestionPreview({ question, index, validation }: { question: QuizQuestion; index: number; validation: ValidationResult }) {
  const type = question.type || 'multiple-choice';
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div className={clsx("bg-white rounded-xl border shadow-sm p-5",
      validation.status === 'complete' ? 'border-gray-200' : 'border-amber-200'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <StatusDot status={validation.status} />
        <span className={clsx("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color)}>
          <Icon size={10} /> {cfg.label}
        </span>
        {validation.status !== 'complete' && (
          <span className="text-[9px] text-amber-500">Incompleta</span>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <span className="text-gray-400 font-semibold text-base shrink-0">{index + 1}.</span>
        <p className="text-base text-gray-800 leading-relaxed">{question.question || <span className="text-gray-300 italic">Sem pergunta</span>}</p>
      </div>

      {type === 'multiple-choice' && question.options && (
        <div className="space-y-2 ml-7">
          {question.options.map((opt, idx) => (
            <div key={idx} className={clsx("flex items-start gap-2 px-4 py-2.5 rounded-xl border-2 text-sm",
              idx === question.correctAnswer ? "border-emerald-400 bg-emerald-50 text-gray-800" : "border-gray-200 text-gray-600"
            )}>
              <span className={clsx("font-semibold shrink-0", idx === question.correctAnswer ? "text-emerald-600" : "text-gray-400")}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <span>{opt || <span className="text-gray-300 italic">vazio</span>}</span>
              {idx === question.correctAnswer && <CheckCircle2 size={14} className="text-emerald-500 ml-auto shrink-0 mt-0.5" />}
            </div>
          ))}
        </div>
      )}

      {type === 'write-in' && (
        <div className="ml-7 px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50">
          <p className="text-[11px] text-emerald-600 font-semibold mb-1">Resposta esperada:</p>
          <p className="text-sm text-gray-800 font-medium">{question.correctText || <span className="text-gray-300 italic">nao definida</span>}</p>
          {question.acceptedVariations && question.acceptedVariations.filter(v => v.trim()).length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1">+ {question.acceptedVariations.filter(v => v.trim()).length} variacoes aceitas</p>
          )}
        </div>
      )}

      {type === 'fill-blank' && (
        <div className="ml-7 px-4 py-3 rounded-xl border-2 border-violet-200 bg-violet-50/50">
          {question.blankSentence ? (
            <p className="text-sm text-gray-700 leading-relaxed">
              {question.blankSentence.split('___').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block mx-1 px-3 py-0.5 bg-violet-200 text-violet-700 rounded font-semibold text-xs">
                      {question.blankAnswer || '___'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          ) : (
            <p className="text-sm text-gray-300 italic">Frase nao definida</p>
          )}
        </div>
      )}

      {question.hint && (
        <div className="ml-7 mt-3 flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <Lightbulb size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-800">{question.hint}</p>
        </div>
      )}

      {question.explanation && (
        <div className="ml-7 mt-2 flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
          <FileText size={12} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-800">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}