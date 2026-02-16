// ══════════════════════════════════════════════════════════════
// AXON — QuizAdminView Orchestrator
// Sub-components in ./quiz-admin/
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { Plus, FileText, Settings2, Loader2 } from 'lucide-react';
import { QuizQuestion, QuizQuestionType, Course, Topic } from '@/app/data/courses';
import {
  kvFetch, kvSave,
  FloatingSaveBar, AdminEditorTopBar,
  AdminTopicSelector, QUIZ_THEME,
} from './shared';
import type { SaveStatus, SelectedTopicInfo } from './shared';
import {
  TYPE_CONFIG, newMultipleChoice, newWriteIn, newFillBlank,
  validateQuestion, cleanQuestionsForSave,
  QuizAdminCard, QuizAdminEditor, QuizAdminPreview,
} from './quiz-admin';

// ════════════════════════════════════════
// MAIN ADMIN VIEW
// ════════════════════════════════════════
export function QuizAdminView() {
  const { currentCourse } = useApp();

  const [selectedTopic, setSelectedTopic] = useState<SelectedTopicInfo | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [previewMode, setPreviewMode] = useState(false);
  const [savedQuizIndex, setSavedQuizIndex] = useState<Record<string, any>>({});
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  useEffect(() => { loadQuizIndex(currentCourse.id); }, [currentCourse.id]);

  const loadQuizIndex = async (courseId: string) => {
    setLoadingIndex(true);
    try {
      const data = await kvFetch(`quizzes-index/${courseId}`);
      setSavedQuizIndex(data.index || {});
    } catch (err) {
      console.error('[QuizAdmin] Error loading index:', err);
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
      const data = await kvFetch(`quizzes/${course.id}/${topic.id}`);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setLoadingQuestions(false);
        return;
      }
    } catch (err) {
      console.error('[QuizAdmin] Error loading saved quizzes:', err);
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
      const res = await kvSave(`quizzes/${selectedTopic.course.id}/${selectedTopic.topic.id}`, {
        questions: cleaned,
        topicTitle: selectedTopic.topic.title,
        sectionTitle: selectedTopic.sectionTitle,
        semesterTitle: selectedTopic.semesterTitle,
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
      console.error('[QuizAdmin] Error saving:', err);
      setSaveStatus('error');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setSaving(false);
    }
  };

  const markChanged = () => { setHasUnsavedChanges(true); setSaveStatus('idle'); };

  const addQuestion = (type: QuizQuestionType) => {
    const maxId = questions.reduce((max, q) => Math.max(max, q.id), 0);
    let newQ: QuizQuestion;
    switch (type) {
      case 'write-in': newQ = newWriteIn(maxId + 1); break;
      case 'fill-blank': newQ = newFillBlank(maxId + 1); break;
      default: newQ = newMultipleChoice(maxId + 1);
    }
    setQuestions(prev => [...prev, newQ]);
    setEditingIdx(questions.length);
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
    return (
      <AdminTopicSelector
        currentCourse={currentCourse}
        savedIndex={savedQuizIndex}
        loadingIndex={loadingIndex}
        onSelect={handleSelectTopic}
        theme={QUIZ_THEME}
      />
    );
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
      <AdminEditorTopBar
        selectedTopic={selectedTopic}
        hasUnsavedChanges={hasUnsavedChanges}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        onBack={() => setSelectedTopic(null)}
        icon={Settings2}
        iconBgClass="bg-violet-50"
        iconColorClass="text-violet-600"
        previewActiveClass="bg-violet-50 text-violet-700 border-violet-200"
        completeCount={completeCount}
        partialCount={partialCount}
        emptyCount={emptyCount}
        totalItems={questions.length}
      />

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
            <QuizEmptyState onAdd={addQuestion} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {questions.map((q, idx) => {
                  const val = validations[idx];
                  return (
                    <motion.div key={q.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}>
                      {previewMode ? (
                        <QuizAdminPreview question={q} index={idx} validation={val} />
                      ) : editingIdx === idx ? (
                        <QuizAdminEditor
                          question={q} index={idx} total={questions.length} validation={val}
                          onUpdate={(updates) => updateQuestion(idx, updates)}
                          onDelete={() => deleteQuestion(idx)}
                          onDuplicate={() => duplicateQuestion(idx)}
                          onMove={(dir) => moveQuestion(idx, dir)}
                          onClose={() => setEditingIdx(null)}
                        />
                      ) : (
                        <QuizAdminCard
                          question={q} index={idx} validation={val}
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

      <FloatingSaveBar
        itemCount={questions.length}
        itemLabel="questao"
        itemLabelPlural="questoes"
        saveLabel="Salvar Quiz"
        hasUnsavedChanges={hasUnsavedChanges}
        partialCount={partialCount}
        saving={saving}
        saveStatus={saveStatus}
        onSave={handleSave}
      />
    </div>
  );
}

// ── Empty State (small, stays inline) ──
function QuizEmptyState({ onAdd }: { onAdd: (type: QuizQuestionType) => void }) {
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
