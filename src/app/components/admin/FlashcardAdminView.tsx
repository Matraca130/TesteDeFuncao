import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  Copy, Lightbulb, Layers,
  X, ChevronUp, Loader2, ImageIcon, AlertTriangle,
} from 'lucide-react';
import { Flashcard, Course, Topic, findStaticTopic } from '@/app/data/courses';
import {
  kvFetch, kvSave,
  StatusDot, FieldLabel, FloatingSaveBar, AdminEditorTopBar,
  AdminTopicSelector, FLASHCARD_THEME,
} from './shared';
import type { ValidationStatus, ValidationResult, SaveStatus, SelectedTopicInfo } from './shared';

// ── Empty flashcard template ──
function newFlashcard(id: number): Flashcard {
  return { id, question: '', answer: '', mastery: 1 };
}

// ══════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════
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
    if (!cleaned.image?.trim()) {
      delete cleaned.image;
      delete cleaned.imagePosition;
    }
    cleaned.question = cleaned.question?.trim() || '';
    cleaned.answer = cleaned.answer?.trim() || '';
    return cleaned;
  });
}

// ══════════════════════════════════════════
// MASTERY INDICATOR
// ══════════════════════════════════════════
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
          <button key={level} onClick={() => onChange(level)} className={dotClass} title={`Nivel ${level}`} />
        ) : (
          <span key={level} className={dotClass} />
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN ADMIN VIEW
// ══════════════════════════════════════════
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
                        <FlashcardPreview card={card} index={idx} validation={val} />
                      ) : editingIdx === idx ? (
                        <FlashcardEditor
                          card={card} index={idx} total={cards.length} validation={val}
                          onUpdate={(updates) => updateCard(idx, updates)}
                          onDelete={() => deleteCard(idx)}
                          onDuplicate={() => duplicateCard(idx)}
                          onMove={(dir) => moveCard(idx, dir)}
                          onClose={() => setEditingIdx(null)}
                        />
                      ) : (
                        <FlashcardCard
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

// ══════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════
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

// ══════════════════════════════════════════
// FLASHCARD CARD (collapsed)
// ══════════════════════════════════════════
function FlashcardCard({ card, index, validation, onClick, onDelete, onDuplicate }: {
  card: Flashcard; index: number; validation: ValidationResult;
  onClick: () => void; onDelete: () => void; onDuplicate: () => void;
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

// ══════════════════════════════════════════
// FLASHCARD EDITOR (expanded)
// ══════════════════════════════════════════
function FlashcardEditor({ card, index, total, validation, onUpdate, onDelete, onDuplicate, onMove, onClose }: {
  card: Flashcard; index: number; total: number; validation: ValidationResult;
  onUpdate: (updates: Partial<Flashcard>) => void;
  onDelete: () => void; onDuplicate: () => void;
  onMove: (dir: 'up' | 'down') => void; onClose: () => void;
}) {
  const [showOptional, setShowOptional] = useState(!!(card.image));

  return (
    <div className={clsx(
      "bg-white rounded-2xl border-2 shadow-lg overflow-hidden",
      validation.status === 'complete' ? 'border-emerald-300' :
      validation.status === 'partial' ? 'border-amber-300' :
      'border-teal-300'
    )}>
      {/* Header */}
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

      {/* Validation warnings */}
      {validation.requiredMissing.length > 0 && (
        <div className="mx-5 mt-3 flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-amber-700 font-semibold">Campos obrigatorios faltando:</p>
            <p className="text-[10px] text-amber-600">{validation.requiredMissing.join(' \u00b7 ')}</p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Question */}
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

        {/* Answer */}
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

        {/* Mastery level */}
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

        {/* Optional Fields */}
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

// ══════════════════════════════════════════
// FLASHCARD PREVIEW
// ══════════════════════════════════════════
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
