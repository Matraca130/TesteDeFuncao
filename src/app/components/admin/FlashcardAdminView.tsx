// ══════════════════════════════════════════════════════════════
// AXON — FlashcardAdminView Orchestrator
// Sub-components in ./flashcard-admin/
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Layers, Loader2 } from 'lucide-react';
import { Flashcard, Course, Topic, findStaticTopic } from '@/app/data/courses';
import {
  kvFetch, kvSave,
  FloatingSaveBar, AdminEditorTopBar,
  AdminTopicSelector, FLASHCARD_THEME,
} from './shared';
import type { SaveStatus, SelectedTopicInfo } from './shared';
import {
  newFlashcard, validateFlashcard, cleanFlashcardsForSave,
  FlashcardAdminCard, FlashcardAdminEditor, FlashcardAdminPreview,
} from './flashcard-admin';

// ════════════════════════════════════════
// MAIN ADMIN VIEW
// ════════════════════════════════════════
export function FlashcardAdminView() {
  const { currentCourse } = useApp();

  const [selectedTopic, setSelectedTopic] = useState<SelectedTopicInfo | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [previewMode, setPreviewMode] = useState(false);
  const [savedIndex, setSavedIndex] = useState<Record<string, any>>({});
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  useEffect(() => { loadFlashcardIndex(currentCourse.id); }, [currentCourse.id]);

  const loadFlashcardIndex = async (courseId: string) => {
    setLoadingIndex(true);
    try {
      const data = await kvFetch(`flashcards-index/${courseId}`);
      setSavedIndex(data.index || {});
    } catch (err) {
      console.error('[FlashcardAdmin] Error loading index:', err);
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
      const data = await kvFetch(`flashcards/${course.id}/${topic.id}`);
      if (data.flashcards && data.flashcards.length > 0) {
        setCards(data.flashcards);
        setLoadingCards(false);
        return;
      }
    } catch (err) {
      console.error('[FlashcardAdmin] Error loading saved flashcards:', err);
    }

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
      const res = await kvSave(`flashcards/${selectedTopic.course.id}/${selectedTopic.topic.id}`, {
        flashcards: cleaned,
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
      loadFlashcardIndex(selectedTopic.course.id);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      console.error('[FlashcardAdmin] Error saving:', err);
      setSaveStatus('error');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setSaving(false);
    }
  };

  const markChanged = () => { setHasUnsavedChanges(true); setSaveStatus('idle'); };

  const addCard = () => {
    const maxId = cards.reduce((max, c) => Math.max(max, c.id), 0);
    setCards(prev => [...prev, newFlashcard(maxId + 1)]);
    setEditingIdx(cards.length);
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

  // Validation summary
  const validations = cards.map(validateFlashcard);
  const completeCount = validations.filter(v => v.status === 'complete').length;
  const partialCount = validations.filter(v => v.status === 'partial').length;
  const emptyCount = validations.filter(v => v.status === 'empty').length;

  // ── Topic not selected: show selector ──
  if (!selectedTopic) {
    return (
      <AdminTopicSelector
        currentCourse={currentCourse}
        savedIndex={savedIndex}
        loadingIndex={loadingIndex}
        onSelect={handleSelectTopic}
        theme={FLASHCARD_THEME}
      />
    );
  }

  // ── Loading ──
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

  // ── Topic selected: show editor ──
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <AdminEditorTopBar
        selectedTopic={selectedTopic}
        hasUnsavedChanges={hasUnsavedChanges}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        onBack={() => setSelectedTopic(null)}
        icon={Layers}
        iconBgClass="bg-teal-50"
        iconColorClass="text-teal-600"
        previewActiveClass="bg-teal-50 text-teal-700 border-teal-200"
        completeCount={completeCount}
        partialCount={partialCount}
        emptyCount={emptyCount}
        totalItems={cards.length}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Add Button */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Adicionar:</span>
            <button onClick={addCard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:shadow-md hover:-translate-y-0.5 text-teal-700 bg-teal-50 border-teal-200">
              <Plus size={13} /> <Layers size={13} /> Novo Flashcard
            </button>
          </div>

          {/* Cards List */}
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
                        <FlashcardAdminPreview card={card} index={idx} validation={val} />
                      ) : editingIdx === idx ? (
                        <FlashcardAdminEditor
                          card={card} index={idx} total={cards.length} validation={val}
                          onUpdate={(updates) => updateCard(idx, updates)}
                          onDelete={() => deleteCard(idx)}
                          onDuplicate={() => duplicateCard(idx)}
                          onMove={(dir) => moveCard(idx, dir)}
                          onClose={() => setEditingIdx(null)}
                        />
                      ) : (
                        <FlashcardAdminCard
                          card={card} index={idx} validation={val}
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

      <FloatingSaveBar
        itemCount={cards.length}
        itemLabel="flashcard"
        itemLabelPlural="flashcards"
        saveLabel="Salvar Flashcards"
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
        <Plus size={20} /> <Layers size={20} /> <span className="text-sm">Criar Flashcard</span>
      </button>
    </div>
  );
}
