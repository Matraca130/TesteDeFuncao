import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { headingStyle, components, iconClasses } from '@/app/design-system';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Search,
  Bookmark,
  MessageSquare,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Menu,
  Highlighter,
  Pen,
  Eraser,
  FileText,
  Sparkles,
  Plus,
  X,
  Trash2,
  BookOpen,
  Box,
  Eye,
  EyeOff,
  CircleDot,
  Send,
  Loader2,
  StickyNote,
  Palette,
  Bot,
  Edit3,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { getStudyContent } from '@/app/data/studyContent';
import { useSmartPopupPosition } from '@/app/hooks/useSmartPopupPosition';
import { useApp } from '@/app/context/AppContext';
import {
  KeywordData,
  MasteryLevel,
  AIQuestion,
  masteryConfig,
  findKeyword,
  getAllKeywordTerms
} from '@/app/data/keywords';
import { getSectionImage } from '@/app/data/sectionImages';
import { courses, Model3D } from '@/app/data/courses';
import * as studentApi from '@/app/services/studentApi';
import type { SummaryAnnotation } from '@/app/types/student';

// ─── AI Question Item (FAQ Style) ───────────────────────────────────────────

function AIQuestionItem({ question }: { question: AIQuestion }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg border-gray-100 bg-gray-50/50 overflow-hidden transition-all hover:bg-gray-50 hover:border-blue-100 group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 flex items-start gap-3"
      >
        <div className={clsx(
          "mt-0.5 p-0.5 rounded transition-colors duration-200 shrink-0",
          isOpen ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"
        )}>
          <ChevronRight
            size={14}
            className={clsx(
              "transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
        </div>
        <span className={clsx(
          "text-sm font-medium transition-colors duration-200",
          isOpen ? "text-blue-700" : "text-gray-700 group-hover:text-gray-900"
        )}>
          {question.question}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pl-[38px] text-sm text-gray-600 leading-relaxed">
              <div className="pt-2 border-t border-gray-100/50">
                {question.answer || 'Baseado na literatura, esta e uma questao que requer analise aprofundada do contexto anatomico e clinico. Consulte o material de referencia para uma resposta completa.'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Editable Keyword (Pop-up de Palavra-chave) ─────────────────────────────

interface EditableKeywordProps {
  keywordData: KeywordData;
  mastery: MasteryLevel;
  onMasteryChange: (term: string, level: MasteryLevel) => void;
  personalNotes: string[];
  onUpdateNotes: (term: string, notes: string[]) => void;
  onView3D?: () => void;
}

function EditableKeyword({
  keywordData,
  mastery,
  onMasteryChange,
  personalNotes,
  onUpdateNotes,
  onView3D,
}: EditableKeywordProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [askingAI, setAskingAI] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    definition: true,
    faq: false,
    ask: false,
  });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const config = masteryConfig[mastery];

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Smart positioning
  const position = useSmartPopupPosition({
    isOpen,
    anchorRef,
    popupRef,
    gap: 12,
    margin: 8,
  });

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(event.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const updated = [...personalNotes, newNote.trim()];
      onUpdateNotes(keywordData.term, updated);
      setNewNote('');
    }
  };

  const handleDeleteNote = (index: number) => {
    const updated = personalNotes.filter((_, i) => i !== index);
    onUpdateNotes(keywordData.term, updated);
  };

  // Mock AI answer for user questions
  const handleAskQuestion = () => {
    if (!userQuestion.trim()) return;
    setAskingAI(true);
    setAiAnswer(null);
    // Simulate AI response delay
    setTimeout(() => {
      setAiAnswer(`Com base na literatura medica, "${keywordData.term}" e um conceito fundamental. ${keywordData.definition} Para uma compreensao mais aprofundada, recomenda-se consultar o material de referencia e correlacionar com casos clinicos relevantes.`);
      setAskingAI(false);
    }, 1500);
  };

  // Arrow styles
  const getArrowStyles = () => {
    if (!position.placement) return {};
    const p = position.placement;
    if (p.startsWith('top')) {
      return {
        bottom: '-6px',
        left: position.arrowLeft ? `${position.arrowLeft}px` : '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        borderBottom: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
      };
    }
    if (p.startsWith('bottom')) {
      return {
        top: '-6px',
        left: position.arrowLeft ? `${position.arrowLeft}px` : '50%',
        transform: 'translateX(-50%) rotate(-135deg)',
        borderTop: '1px solid #e5e7eb',
        borderLeft: '1px solid #e5e7eb',
      };
    }
    if (p.startsWith('left')) {
      return {
        right: '-6px',
        top: position.arrowTop ? `${position.arrowTop}px` : '50%',
        transform: 'translateY(-50%) rotate(-45deg)',
        borderTop: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
      };
    }
    if (p.startsWith('right')) {
      return {
        left: '-6px',
        top: position.arrowTop ? `${position.arrowTop}px` : '50%',
        transform: 'translateY(-50%) rotate(135deg)',
        borderBottom: '1px solid #e5e7eb',
        borderLeft: '1px solid #e5e7eb',
      };
    }
    return {};
  };

  return (
    <span className="relative inline" ref={anchorRef}>
      {/* Keyword in text — colored by mastery */}
      <span
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "cursor-pointer underline underline-offset-[3px] decoration-2 transition-all duration-200",
          config.textColor,
          config.underlineClass,
          isOpen && `${config.bgLight} rounded px-0.5 -mx-0.5`
        )}
      >
        {keywordData.term}
      </span>

      {/* Pop-up via Portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              ref={popupRef}
              className="fixed w-[420px] flex flex-col max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
              }}
            >
              {/* ── Header ── */}
              <div className={clsx("px-5 pt-4 pb-3 border-b", config.borderColor, config.headerBg)}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={clsx("w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm", config.bgDot)} />
                    <h3 className="font-bold text-gray-900 uppercase tracking-wide text-base">
                      {keywordData.term}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {keywordData.has3DModel && (
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onView3D?.();
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar em 3D"
                      >
                        <Box size={13} />
                        <span>Modelo 3D</span>
                      </button>
                    )}
                    <div className={clsx(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium",
                      config.bgLight, config.textColor, config.borderColor, "border"
                    )}>
                      <span className={clsx("w-1.5 h-1.5 rounded-full", config.bgDot)} />
                      {mastery === 'green' ? 'Dominado' : mastery === 'yellow' ? 'Parcial' : 'Nao dominado'}
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-black/5 rounded-lg transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Mastery Level Selector */}
                <div className="flex flex-col gap-2.5">

                  {/* Tab switcher: Axon vs Minhas Anotações + Mastery badge */}
                  <div className="flex items-center gap-1.5 pt-2.5 border-t border-black/5">
                    {/* Axon tab */}
                    <button
                      onClick={() => setShowNotes(false)}
                      className={clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                        !showNotes
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 border border-transparent"
                      )}
                    >
                      <Sparkles size={10} />
                      AXON
                    </button>

                    {/* Minhas Anotações tab */}
                    <button
                      onClick={() => setShowNotes(true)}
                      className={clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                        showNotes
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 border border-transparent"
                      )}
                    >
                      <Pen size={10} />
                      Minhas Anotacoes
                      {personalNotes.length > 0 && (
                        <span className={clsx(
                          "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                          showNotes
                            ? "bg-emerald-200 text-emerald-800"
                            : "bg-gray-200 text-gray-500"
                        )}>
                          {personalNotes.length}
                        </span>
                      )}
                    </button>

                    {/* Mastery status badge - moved to header */}
                  </div>
                </div>
              </div>

              {/* ── Body (scrollable) ── */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-2">
                {!showNotes ? (
                  <>
                    {/* ── Axon Tab Content — Accordion Sections ── */}

                    {/* ── 1. Definição ── */}
                    <div className="border rounded-lg border-gray-100 bg-gray-50/50 overflow-hidden transition-all hover:border-gray-200 group/sec">
                      <button
                        onClick={() => toggleSection('definition')}
                        className="w-full text-left px-3.5 py-3 flex items-center gap-3"
                      >
                        <div className={clsx(
                          "p-0.5 rounded transition-colors duration-200 shrink-0",
                          openSections.definition ? "bg-gray-200 text-gray-600" : "bg-gray-200 text-gray-400 group-hover/sec:bg-gray-300 group-hover/sec:text-gray-600"
                        )}>
                          <ChevronRight
                            size={14}
                            className={clsx(
                              "transition-transform duration-200",
                              openSections.definition && "rotate-90"
                            )}
                          />
                        </div>
                        <BookOpen size={13} className={clsx(
                          "shrink-0 transition-colors duration-200",
                          openSections.definition ? "text-gray-600" : "text-gray-400"
                        )} />
                        <span className={clsx(
                          "text-[11px] font-bold uppercase tracking-widest transition-colors duration-200",
                          openSections.definition ? "text-gray-700" : "text-gray-500 group-hover/sec:text-gray-700"
                        )}>
                          Definicao
                        </span>
                      </button>
                      <AnimatePresence>
                        {openSections.definition && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 pl-[42px]">
                              <div className="pt-2 border-t border-gray-100/50">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {keywordData.definition}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── 2. Perguntas Mais Feitas ── */}
                    <div className="border rounded-lg border-blue-100/60 bg-blue-50/20 overflow-hidden transition-all hover:border-blue-200/80 group/sec">
                      <button
                        onClick={() => toggleSection('faq')}
                        className="w-full text-left px-3.5 py-3 flex items-center gap-3"
                      >
                        <div className={clsx(
                          "p-0.5 rounded transition-colors duration-200 shrink-0",
                          openSections.faq ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-400 group-hover/sec:bg-blue-50 group-hover/sec:text-blue-500"
                        )}>
                          <ChevronRight
                            size={14}
                            className={clsx(
                              "transition-transform duration-200",
                              openSections.faq && "rotate-90"
                            )}
                          />
                        </div>
                        <MessageSquare size={13} className={clsx(
                          "shrink-0 transition-colors duration-200",
                          openSections.faq ? "text-blue-600" : "text-gray-400 group-hover/sec:text-blue-500"
                        )} />
                        <span className={clsx(
                          "text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 flex-1",
                          openSections.faq ? "text-blue-700" : "text-gray-500 group-hover/sec:text-blue-600"
                        )}>
                          Perguntas Mais Feitas
                        </span>
                        <span className="text-[9px] text-blue-400 bg-blue-100/60 px-1.5 py-0.5 rounded-full font-medium">
                          {keywordData.aiQuestions.length}
                        </span>
                      </button>
                      <AnimatePresence>
                        {openSections.faq && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 pl-[42px]">
                              <div className="pt-2 border-t border-blue-100/30 space-y-2">
                                {keywordData.aiQuestions.map((q, i) => (
                                  <AIQuestionItem key={i} question={q} />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── 3. Fazer Pergunta ── */}
                    <div className="border rounded-lg border-violet-100/60 bg-violet-50/20 overflow-hidden transition-all hover:border-violet-200/80 group/sec">
                      <button
                        onClick={() => toggleSection('ask')}
                        className="w-full text-left px-3.5 py-3 flex items-center gap-3"
                      >
                        <div className={clsx(
                          "p-0.5 rounded transition-colors duration-200 shrink-0",
                          openSections.ask ? "bg-violet-100 text-violet-600" : "bg-gray-200 text-gray-400 group-hover/sec:bg-violet-50 group-hover/sec:text-violet-500"
                        )}>
                          <ChevronRight
                            size={14}
                            className={clsx(
                              "transition-transform duration-200",
                              openSections.ask && "rotate-90"
                            )}
                          />
                        </div>
                        <Sparkles size={13} className={clsx(
                          "shrink-0 transition-colors duration-200",
                          openSections.ask ? "text-violet-600" : "text-gray-400 group-hover/sec:text-violet-500"
                        )} />
                        <span className={clsx(
                          "text-[11px] font-bold uppercase tracking-widest transition-colors duration-200",
                          openSections.ask ? "text-violet-700" : "text-gray-500 group-hover/sec:text-violet-600"
                        )}>
                          Fazer Pergunta
                        </span>
                      </button>
                      <AnimatePresence>
                        {openSections.ask && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 pl-[42px]">
                              <div className="pt-2 border-t border-violet-100/30 space-y-2.5">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={userQuestion}
                                    onChange={(e) => setUserQuestion(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAskQuestion();
                                    }}
                                    placeholder={`Pergunte sobre ${keywordData.term}...`}
                                    disabled={askingAI}
                                    className="flex-1 pl-3 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all placeholder:text-gray-400 disabled:opacity-50"
                                  />
                                  <button
                                    onClick={handleAskQuestion}
                                    disabled={!userQuestion.trim() || askingAI}
                                    className={clsx(
                                      "flex items-center justify-center px-3 py-2 rounded-lg transition-all",
                                      !userQuestion.trim() || askingAI
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-violet-500 text-white hover:bg-violet-600 active:scale-95 shadow-sm"
                                    )}
                                  >
                                    {askingAI ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                  </button>
                                </div>

                                {/* AI Response */}
                                <AnimatePresence>
                                  {(askingAI || aiAnswer) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg">
                                        {askingAI ? (
                                          <div className="flex items-center gap-2 text-sm text-violet-600">
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>MedBot esta pensando...</span>
                                          </div>
                                        ) : aiAnswer ? (
                                          <div>
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                              <Sparkles size={11} className="text-violet-500" />
                                              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">MedBot</span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">{aiAnswer}</p>
                                            <button
                                              onClick={() => { setAiAnswer(null); setUserQuestion(''); }}
                                              className="mt-2 text-[10px] text-violet-500 hover:text-violet-700 transition-colors"
                                            >
                                              Limpar resposta
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 3D Button */}
                    {/* (moved to header) */}
                  </>
                ) : (
                  <>
                    {/* ── Minhas Anotações Tab Content ── */}
                    {/* Notes list */}
                    {personalNotes.length > 0 ? (
                      <div className="space-y-1.5">
                        {personalNotes.map((note, i) => (
                          <div key={i} className="flex items-start gap-2.5 py-2 px-2.5 rounded-lg group hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <p className="text-sm text-gray-700 flex-1 leading-snug">{note}</p>
                            <button
                              onClick={() => handleDeleteNote(i)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5 shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Pen size={28} className="mb-2 opacity-40" />
                        <p className="text-sm">Nenhuma anotacao ainda.</p>
                        <p className="text-xs mt-1">Use o campo abaixo para adicionar.</p>
                      </div>
                    )}

                    {/* Add note input — always visible */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNote();
                        }}
                        placeholder="Escrever anotacao pessoal..."
                        className="flex-1 pl-3 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className={clsx(
                          "flex items-center justify-center px-3 py-2.5 rounded-lg transition-all text-xs font-medium",
                          !newNote.trim()
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-sm"
                        )}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Arrow pointer */}
              <span
                className="absolute w-3 h-3 bg-white border-gray-200"
                style={getArrowStyles()}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
}

// ─── Text Annotations Panel ──────────────────────────────────────────────────

function TextAnnotationsPanel({ annotations, onDelete, botLoading }: {
  annotations: Array<{
    id: string;
    originalText: string;
    displayText: string;
    color: 'yellow' | 'blue' | 'green' | 'pink';
    note: string;
    type: 'highlight' | 'note' | 'question';
    botReply?: string;
    timestamp: number;
  }>;
  onDelete: (id: string) => void;
  botLoading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const colorBg: Record<string, string> = {
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-emerald-50 border-emerald-200',
    pink: 'bg-pink-50 border-pink-200',
  };
  const colorAccent: Record<string, string> = {
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-400',
    green: 'bg-emerald-400',
    pink: 'bg-pink-400',
  };
  const typeIcons: Record<string, React.ReactNode> = {
    highlight: <Highlighter size={12} />,
    note: <Edit3 size={12} />,
    question: <Bot size={12} />,
  };
  const typeLabels: Record<string, string> = {
    highlight: 'Destaque',
    note: 'Anotacao',
    question: 'Pergunta ao MedBot',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-80"
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-t-xl border border-gray-200 shadow-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <StickyNote size={16} className="text-blue-500" />
          <span className="font-bold text-sm text-gray-800">Minhas Anotacoes</span>
          <span className="text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-full">{annotations.length}</span>
        </div>
        <ChevronRight size={14} className={clsx("text-gray-400 transition-transform", isExpanded && "rotate-90")} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-x border-b border-gray-200 rounded-b-xl shadow-lg max-h-80 overflow-y-auto custom-scrollbar">
              {[...annotations].reverse().map((ann) => (
                <div key={ann.id} className={clsx("p-3 border-b border-gray-100 last:border-0 relative group", colorBg[ann.color])}>
                  {/* Color indicator bar */}
                  <div className={clsx("absolute left-0 top-0 bottom-0 w-1 rounded-l", colorAccent[ann.color])} />

                  <div className="pl-2">
                    {/* Type badge + delete */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {typeIcons[ann.type]}
                        {typeLabels[ann.type]}
                      </span>
                      <button
                        onClick={() => onDelete(ann.id)}
                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Cited text */}
                    <p className="text-xs text-gray-600 italic line-clamp-2 mb-1.5 leading-relaxed">
                      "{ann.displayText}"
                    </p>

                    {/* Note content */}
                    {ann.type === 'note' && ann.note && (
                      <div className="bg-white/70 rounded-lg px-2.5 py-2 border border-gray-100 mt-1">
                        <p className="text-xs text-gray-700">{ann.note}</p>
                      </div>
                    )}

                    {/* Question + bot reply */}
                    {ann.type === 'question' && (
                      <div className="space-y-1.5 mt-1">
                        <div className="bg-white/70 rounded-lg px-2.5 py-2 border border-gray-100">
                          <p className="text-xs text-gray-700 font-medium">{ann.note}</p>
                        </div>
                        {ann.botReply ? (
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg px-2.5 py-2 border border-blue-100">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Bot size={8} className="text-white" />
                              </div>
                              <span className="text-[10px] font-bold text-blue-600">MedBot</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{ann.botReply}</p>
                          </div>
                        ) : botLoading ? (
                          <div className="flex items-center gap-2 text-xs text-blue-500 py-2">
                            <Loader2 size={12} className="animate-spin" />
                            <span>MedBot esta pensando...</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Summary Session (Sessao de Resumo) ──────────────────────────────────────

export function SummarySession({ onBack, onStartFlashcards, topic, courseColor, accentColor }: any) {
  const { setActiveView, currentCourse, setQuizAutoStart } = useApp();
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showOutline, setShowOutline] = useState(true);
  const [activeTool, setActiveTool] = useState<'cursor' | 'highlight' | 'pen'>('cursor');
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'green' | 'blue' | 'pink'>('yellow');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Session timer state
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSessionElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Collect all 3D models from the current course
  const related3DModels = useMemo(() => {
    const models: { topicTitle: string; model: Model3D; sectionTitle: string }[] = [];
    for (const semester of currentCourse.semesters) {
      for (const section of semester.sections) {
        for (const t of section.topics) {
          if (t.model3D) {
            models.push({
              topicTitle: t.title,
              model: t.model3D,
              sectionTitle: section.title,
            });
          }
        }
      }
    }
    return models;
  }, [currentCourse]);

  // Keyword state
  const [keywordMastery, setKeywordMastery] = useState<Record<string, MasteryLevel>>({});
  const [personalNotes, setPersonalNotes] = useState<Record<string, string[]>>({});

  // Text annotation state
  type TextAnnotation = {
    id: string;
    originalText: string;
    displayText: string;
    color: 'yellow' | 'blue' | 'green' | 'pink';
    note: string;
    type: 'highlight' | 'note' | 'question';
    botReply?: string;
    timestamp: number;
  };
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [annotationNoteInput, setAnnotationNoteInput] = useState('');
  const [annotationQuestionInput, setAnnotationQuestionInput] = useState('');
  const [annotationBotLoading, setAnnotationBotLoading] = useState(false);
  const [annotationActiveTab, setAnnotationActiveTab] = useState<'highlight' | 'note' | 'question'>('highlight');
  const [annotationColor, setAnnotationColor] = useState<'yellow' | 'blue' | 'green' | 'pink'>('yellow');

  // Highlighter styles — vivid marker-pen effect
  const highlighterStyles: Record<string, React.CSSProperties> = {
    yellow: { background: 'linear-gradient(to bottom, transparent 40%, #fde047 40%, #fde047 85%, transparent 85%)' },
    blue:   { background: 'linear-gradient(to bottom, transparent 40%, #93c5fd 40%, #93c5fd 85%, transparent 85%)' },
    green:  { background: 'linear-gradient(to bottom, transparent 40%, #6ee7b7 40%, #6ee7b7 85%, transparent 85%)' },
    pink:   { background: 'linear-gradient(to bottom, transparent 40%, #f9a8d4 40%, #f9a8d4 85%, transparent 85%)' },
  };

  const createTextAnnotation = useCallback((text: string, type: 'highlight' | 'note' | 'question', note: string = '', color: 'yellow' | 'blue' | 'green' | 'pink' = 'yellow') => {
    const newId = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newAnnotation: TextAnnotation = {
      id: newId,
      originalText: text,
      displayText: text.length > 200 ? text.slice(0, 200) + '…' : text,
      color,
      note,
      type,
      timestamp: Date.now(),
    };
    setTextAnnotations(prev => [...prev, newAnnotation]);
    if (type === 'question') {
      setAnnotationBotLoading(true);
      setTimeout(() => {
        setTextAnnotations(prev => prev.map(a =>
          a.id === newId
            ? { ...a, botReply: `Com base no trecho selecionado, posso explicar que: "${text.slice(0, 60)}..." Este conceito é fundamental na medicina porque se relaciona com os mecanismos fisiológicos e anatômicos da região estudada. Deseja que eu aprofunde algum aspecto específico?` }
            : a
        ));
        setAnnotationBotLoading(false);
      }, 1500);
    }
    setPendingAnnotation(null);
    setAnnotationNoteInput('');
    setAnnotationQuestionInput('');
  }, []);

  const deleteTextAnnotation = useCallback((id: string) => {
    setTextAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  // ── Summary Persistence (load & auto-save) ──────────────
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved summary on mount
  useEffect(() => {
    if (!currentCourse?.id || !topic?.id) return;
    let cancelled = false;
    studentApi.getSummary(currentCourse.id, topic.id).then((saved) => {
      if (cancelled) return;
      if (saved) {
        // Restore annotations
        if (saved.annotations && Array.isArray(saved.annotations) && saved.annotations.length > 0) {
          const restored = saved.annotations.map((a: any) => ({
            id: a.id || `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            originalText: a.selectedText || a.originalText || '',
            displayText: a.selectedText || a.displayText || '',
            color: a.color || 'yellow',
            note: a.note || '',
            type: a.type || 'highlight',
            botReply: a.botReply,
            timestamp: a.timestamp || Date.now(),
          }));
          setTextAnnotations(restored);
        }
        // Restore keyword mastery
        if (saved.keywordMastery) {
          setKeywordMastery(saved.keywordMastery as Record<string, MasteryLevel>);
        }
        // Restore personal notes
        if (saved.keywordNotes) {
          setPersonalNotes(saved.keywordNotes);
        }
        // Restore accumulated edit time
        if (saved.editTimeMinutes) {
          setSessionElapsed(saved.editTimeMinutes * 60);
        }
      }
      setSummaryLoaded(true);
    }).catch(() => {
      // 404 = no saved summary yet, that's fine
      if (!cancelled) setSummaryLoaded(true);
    });
    return () => { cancelled = true; };
  }, [currentCourse?.id, topic?.id]);

  // Auto-save with debounce whenever annotations, mastery, or notes change
  useEffect(() => {
    if (!summaryLoaded || !currentCourse?.id || !topic?.id) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      const summaryAnnotations: SummaryAnnotation[] = textAnnotations.map(a => ({
        id: a.id,
        title: a.type,
        selectedText: a.originalText,
        note: a.note,
        timestamp: new Date(a.timestamp).toLocaleString('pt-BR'),
        color: a.color,
        type: a.type,
        botReply: a.botReply,
      } as any));

      studentApi.saveSummary(currentCourse.id, topic.id, {
        courseName: currentCourse.name,
        topicTitle: topic.title,
        content: '',
        annotations: summaryAnnotations,
        keywordMastery: keywordMastery as Record<string, string>,
        keywordNotes: personalNotes,
        editTimeMinutes: Math.round(sessionElapsed / 60),
        tags: [],
        bookmarked: false,
      }).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }).catch((err) => {
        console.error('[SummarySession] Auto-save error:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      });
    }, 2000); // 2s debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [textAnnotations, keywordMastery, personalNotes, summaryLoaded, currentCourse?.id, topic?.id]);

  // Save on unmount (when leaving the session)
  useEffect(() => {
    return () => {
      if (!currentCourse?.id || !topic?.id) return;
      // Fire-and-forget save on unmount
      studentApi.saveSummary(currentCourse.id, topic.id, {
        courseName: currentCourse.name,
        topicTitle: topic.title,
        content: '',
        annotations: textAnnotations.map(a => ({
          id: a.id,
          title: a.type,
          selectedText: a.originalText,
          note: a.note,
          timestamp: new Date(a.timestamp).toLocaleString('pt-BR'),
          color: a.color,
          type: a.type,
          botReply: a.botReply,
        } as any)),
        keywordMastery: keywordMastery as Record<string, string>,
        keywordNotes: personalNotes,
        editTimeMinutes: Math.round(sessionElapsed / 60),
        tags: [],
        bookmarked: false,
      }).catch(() => {});
    };
  }, []);

  // Close annotation popup on outside click
  React.useEffect(() => {
    if (!pendingAnnotation) return;
    const handler = (e: MouseEvent) => {
      const popup = document.getElementById('text-annotation-popup');
      if (popup && !popup.contains(e.target as Node)) {
        setPendingAnnotation(null);
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [pendingAnnotation]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Study content (declared before effects that depend on sections)
  const studyContent = getStudyContent(topic.id);
  const sections = studyContent?.sections || [];

  // Scroll to a specific section by index
  const scrollToSection = (index: number) => {
    setCurrentSection(index);
    const el = document.getElementById(`section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fade-in on mount (replaces motion.div to avoid transform breaking sticky)
  React.useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Auto-update currentSection based on scroll position via IntersectionObserver
  React.useEffect(() => {
    if (!sections.length || !mounted) return;

    // Small delay to ensure sections are rendered in DOM
    const timeout = setTimeout(() => {
      const sectionEls = sections.map((_: any, idx: number) =>
        document.getElementById(`section-${idx}`)
      ).filter(Boolean) as HTMLElement[];

      if (!sectionEls.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

          if (visible.length > 0) {
            const id = visible[0].target.id;
            const idx = parseInt(id.replace('section-', ''), 10);
            if (!isNaN(idx)) {
              setCurrentSection(idx);
            }
          }
        },
        {
          rootMargin: '-80px 0px -60% 0px',
          threshold: 0,
        }
      );

      sectionEls.forEach(el => observer.observe(el));

      // Store cleanup ref
      (scrollContainerRef as any)._observer = observer;
    }, 300);

    return () => {
      clearTimeout(timeout);
      const obs = (scrollContainerRef as any)?._observer;
      if (obs) obs.disconnect();
    };
  }, [sections.length, mounted]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  const handleMasteryChange = (term: string, level: MasteryLevel) => {
    setKeywordMastery(prev => ({ ...prev, [term]: level }));
  };

  const handleUpdateNotes = (term: string, notes: string[]) => {
    setPersonalNotes(prev => ({ ...prev, [term]: notes }));
  };

  const handleView3D = () => {
    setActiveView('3d');
  };

  // Parse text to find keywords from the database
  const parseTextWithKeywords = (text: string) => {
    const allTerms = getAllKeywordTerms();

    const parts: Array<{ type: string; content: string; index: number }> = [];
    let currentIndex = 0;
    const lowerText = text.toLowerCase();

    allTerms.forEach(term => {
      const escapedTerm = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use Unicode-aware boundaries to handle accented characters (é, á, ú, ã, etc.)
      const termRegex = new RegExp(`(?<!\\p{L})${escapedTerm}(?!\\p{L})`, 'giu');
      let match;

      while ((match = termRegex.exec(lowerText)) !== null) {
        if (match.index > currentIndex) {
          parts.push({
            type: 'text',
            content: text.substring(currentIndex, match.index),
            index: currentIndex
          });
        }

        const actualTerm = text.substring(match.index, match.index + term.length);
        parts.push({
          type: 'keyword',
          content: actualTerm,
          index: match.index
        });

        currentIndex = match.index + term.length;
      }
    });

    if (currentIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex),
        index: currentIndex
      });
    }

    // Sort by index and remove overlaps
    const sortedParts = parts.sort((a, b) => a.index - b.index);
    const cleanParts: typeof parts = [];
    let lastEnd = 0;

    sortedParts.forEach(part => {
      if (part.index >= lastEnd) {
        cleanParts.push(part);
        lastEnd = part.index + part.content.length;
      }
    });

    if (cleanParts.length === 0) {
      return [{ type: 'text', content: text, index: 0 }];
    }

    return cleanParts;
  };

  const renderTextWithKeywords = (text: string) => {
    const parts = parseTextWithKeywords(text);

    return parts.map((part, index) => {
      if (part.type === 'keyword') {
        const kwData = findKeyword(part.content);
        if (kwData) {
          const currentMastery = keywordMastery[kwData.term] || kwData.masteryLevel;
          const notes = personalNotes[kwData.term] || [];
          return (
            <EditableKeyword
              key={`${part.content}-${part.index}-${index}`}
              keywordData={kwData}
              mastery={currentMastery}
              onMasteryChange={handleMasteryChange}
              personalNotes={notes}
              onUpdateNotes={handleUpdateNotes}
              onView3D={kwData.has3DModel ? handleView3D : undefined}
            />
          );
        }
      }
      const matchedAnn = textAnnotations.find(a => a.originalText === part.content);

      return (
        <span
          key={`text-${part.index}-${index}`}
          className={clsx(
            "cursor-pointer transition-all duration-150",
            !matchedAnn && "hover:bg-blue-50/50 rounded-sm"
          )}
          style={matchedAnn ? {
            ...highlighterStyles[matchedAnn.color],
            borderRadius: '2px',
            padding: '0 1px',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          } as React.CSSProperties : undefined}
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setPendingAnnotation({ text: part.content, rect });
            setAnnotationActiveTab('highlight');
          }}
          title={matchedAnn ? "Trecho anotado — clique para editar" : "Clique para anotar este trecho"}
        >
          {part.content}
        </span>
      );
    });
  };

  // Get annotation stats for sidebar
  const getAnnotationStats = () => {
    const allTerms = getAllKeywordTerms();
    let red = 0, yellow = 0, green = 0;
    allTerms.forEach(term => {
      const kw = findKeyword(term);
      if (!kw) return;
      const level = keywordMastery[kw.term] || kw.masteryLevel;
      if (level === 'red') red++;
      else if (level === 'yellow') yellow++;
      else green++;
    });
    return { red, yellow, green, total: allTerms.length };
  };

  // Get all annotated keywords for sidebar
  const getAnnotatedKeywords = () => {
    const allTerms = getAllKeywordTerms();
    return allTerms
      .map(term => {
        const kw = findKeyword(term)!;
        const level = keywordMastery[kw.term] || kw.masteryLevel;
        const notes = personalNotes[kw.term] || [];
        return { keyword: kw, mastery: level, notes };
      })
      .sort((a, b) => {
        const order: Record<MasteryLevel, number> = { red: 0, yellow: 1, green: 2 };
        return order[a.mastery] - order[b.mastery];
      });
  };

  // ─── Render Document Content ───

  // Global figure counter for auto-numbering
  let figureCounter = 0;

  // Quiz & flashcard counts for this topic
  const quizCount = topic?.quizzes?.length || 0;
  const flashcardCount = topic?.flashcards?.length || 0;
  const hasQuiz = quizCount > 0;
  const hasFlashcards = flashcardCount > 0;

  const handleGoToQuiz = () => {
    setQuizAutoStart(true);
    setActiveView('quiz');
  };

  const handleGoToFlashcards = () => {
    if (onStartFlashcards) onStartFlashcards();
  };

  // Reusable study action bar for page tops/bottoms
  const renderStudyActionBar = (pageNum: number, totalPages: number, position: 'top' | 'bottom') => (
    <div className={clsx(
      "flex items-center justify-between py-3 px-1",
      position === 'top' ? "mb-8 border-b border-gray-100" : "mt-10 pt-4 border-t border-gray-100",
    )}>
      <span className="text-[11px] text-gray-400 font-medium tracking-wide">
        Página {pageNum} de {totalPages}
      </span>
      
    </div>
  );

  const renderDocumentContent = () => {
    figureCounter = 0; // reset on each render
    const totalPages = sections.length || 1;
    return (
    <div
      className={clsx(
        "min-h-screen p-12 md:p-20 flex flex-col transition-all",
        activeTool === 'highlight' && "cursor-text selection:bg-yellow-200 selection:text-black",
        activeTool === 'pen' && "cursor-crosshair"
      )}
    >
      {/* ── Floating Study Actions (top-right corner, above header) ── */}
      <div className="flex items-center justify-between mb-3">
        {/* Back button — prominent */}
        

        <div className="sticky top-4 z-50 ml-auto flex flex-col items-end gap-2">
          {/* Timer pill */}
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md rounded-full px-1.5 py-1 shadow-lg border border-gray-200/60">
            {/* Timer display */}
            <div className="flex items-center gap-1.5 px-2 py-1">
              <Timer size={13} className={clsx("transition-colors", isTimerRunning ? "text-emerald-500" : "text-gray-400")} />
              <span className={clsx(
                "text-[12px] font-mono font-semibold tabular-nums tracking-wide",
                isTimerRunning ? "text-gray-800" : "text-gray-400"
              )}>
                {formatTime(sessionElapsed)}
              </span>
            </div>

            <div className="w-px h-4 bg-gray-200" />

            {/* Play / Pause */}
            <button
              onClick={() => setIsTimerRunning(prev => !prev)}
              className={clsx(
                "p-1.5 rounded-full transition-all active:scale-90",
                isTimerRunning
                  ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  : "text-emerald-500 hover:bg-emerald-50"
              )}
              title={isTimerRunning ? "Pausar" : "Retomar"}
            >
              {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>

            {/* Reset */}
            <button
              onClick={() => { setSessionElapsed(0); setIsTimerRunning(true); }}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-90"
              title="Reiniciar"
            >
              <RotateCcw size={11} />
            </button>

            {/* Save status indicator */}
            <div className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all",
              saveStatus === 'saving' && "text-blue-500 bg-blue-50",
              saveStatus === 'saved' && "text-emerald-500 bg-emerald-50",
              saveStatus === 'error' && "text-red-500 bg-red-50",
              saveStatus === 'idle' && "text-gray-400 bg-gray-50",
            )}>
              {saveStatus === 'saving' && <><Loader2 size={10} className="animate-spin" /> Salvando...</>}
              {saveStatus === 'saved' && <><CheckCircle2 size={10} /> Salvo</>}
              {saveStatus === 'error' && <><AlertCircle size={10} /> Erro</>}
              {saveStatus === 'idle' && summaryLoaded && textAnnotations.length > 0 && <><CheckCircle2 size={10} /> Sincronizado</>}
            </div>

            <div className="w-px h-4 bg-gray-200" />

            {/* Quiz — always visible, direct to topic quiz */}
            <button 
              onClick={handleGoToQuiz}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-blue-600 bg-blue-50/80 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
              title={`Quiz: ${topic?.title || 'Tópico atual'} (${quizCount} questões)`}
            >
              <FileText size={12} />
              <span>Quiz</span>
            </button>

            {/* Flashcard — always visible, contextual to current topic */}
            <button 
              onClick={handleGoToFlashcards}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-amber-600 bg-amber-50/80 hover:bg-amber-500 hover:text-white transition-all active:scale-95 group/fc"
              title={`Flashcards: ${topic?.title || 'Tópico atual'} (${flashcardCount} cards)`}
            >
              <Layers size={12} />
              <span className="max-w-[90px] truncate">Flashcard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Header */}
      <div className="mb-12 pb-8 border-b border-gray-100">
        <div className={clsx("inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-3", courseColor, "text-white")}>
          Resumo Completo
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" style={headingStyle}>{topic.title}</h1>
        <p className="mt-4 text-gray-500 text-sm">Material de estudo oficial AXON - Ultima atualizacao em 2025</p>

        {/* Keyword Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Palavras-chave:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Nao domino
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Parcialmente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Domino
          </span>
        </div>
      </div>

      {/* ── Paginated Sections ── */}
      <div className="flex-1">
        {sections.map((section: any, idx: number) => {
          const sectionImage = getSectionImage(topic.id, section.title);
          const imageOnLeft = idx % 2 === 1; // alternate image side

          // Auto-increment figure number
          let figNum: number | null = null;
          if (sectionImage) {
            figureCounter++;
            figNum = figureCounter;
          }

          const pageNum = idx + 1;

          return (
          <div key={idx}>
          <div id={`section-${idx}`} className="scroll-mt-24">
            {/* ── Study Action Bar (top of page) ── */}
            {renderStudyActionBar(pageNum, totalPages, 'top')}
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 text-sm font-bold">
                {idx + 1}
              </span>
              {section.title}
            </h2>

            {/* Section content with optional image */}
            {sectionImage && figNum !== null ? (
              <div className={clsx("flex gap-8", imageOnLeft && "flex-row-reverse")}>
                {/* Text content */}
                <div className="flex-1 min-w-0 prose prose-lg max-w-none text-gray-600 leading-relaxed">
                      {section.content.split('\n\n').map((paragraph: string, pIndex: number) => {
                        if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
                          const headingText = paragraph.trim().replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/:/g, '');
                          return (
                            <h3 key={pIndex} className="text-xl font-bold text-gray-800 mt-8 mb-4">
                              {headingText}
                            </h3>
                          );
                        }

                        if (paragraph.trim().startsWith('*') && paragraph.includes(':')) {
                          const parts = paragraph.split(':');
                          const heading = parts[0].replace(/^\*/, '').trim();
                          const contentText = parts.slice(1).join(':').trim();
                          return (
                            <div key={pIndex} className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <h4 className="font-bold text-gray-900 mb-1 text-base">{heading}</h4>
                              <div className="text-gray-600 leading-relaxed">{renderTextWithKeywords(contentText)}</div>
                            </div>
                          );
                        }

                        return (
                          <div key={pIndex} className="mb-4 text-justify leading-relaxed text-gray-600">
                            {renderTextWithKeywords(paragraph)}
                          </div>
                        );
                      })}
                    </div>

                {/* Image figure — sticky */}
                <div className="w-72 shrink-0 self-stretch">
                  <div className="sticky top-6">
                    <figure className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={sectionImage.url}
                          alt={sectionImage.alt}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        {/* Figure number badge */}
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                          Fig. {figNum}
                        </div>
                      </div>
                      <figcaption className="px-4 py-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 bg-gray-50/80">
                        <span className="font-semibold text-gray-700">Fig. {figNum}</span> — {sectionImage.caption.replace(/^Fig\.\s*\d+\s*[—–-]\s*/, '')}
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </div>
            ) : (
              /* Section without image — original layout */
              <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                {section.content.split('\n\n').map((paragraph: string, pIndex: number) => {
                  if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
                    const headingText = paragraph.trim().replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/:/g, '');
                    return (
                      <h3 key={pIndex} className="text-xl font-bold text-gray-800 mt-8 mb-4">
                        {headingText}
                      </h3>
                    );
                  }

                  if (paragraph.trim().startsWith('*') && paragraph.includes(':')) {
                    const parts = paragraph.split(':');
                    const heading = parts[0].replace(/^\*/, '').trim();
                    const contentText = parts.slice(1).join(':').trim();
                    return (
                      <div key={pIndex} className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-1 text-base">{heading}</h4>
                        <div className="text-gray-600 leading-relaxed">{renderTextWithKeywords(contentText)}</div>
                      </div>
                    );
                  }

                  return (
                    <div key={pIndex} className="mb-4 text-justify leading-relaxed text-gray-600">
                      {renderTextWithKeywords(paragraph)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Study Action Bar (bottom of page) ── */}
            {renderStudyActionBar(pageNum, totalPages, 'bottom')}
          </div>

          {/* ── Page Divider ── */}
          {idx < sections.length - 1 && (
            <div className="my-6 flex items-center justify-center gap-4 select-none">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Próxima seção</span>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>
          )}
          </div>
          );
        })}
      </div>

      {/* ── 3D Models Gallery ── */}
      {related3DModels.length > 0 && (
        <div className="mt-16 pt-12 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className={iconClasses('md')}>
              <Box size={20} className={components.icon.default.text} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={headingStyle}>Modelos 3D Relacionados</h2>
              <p className="text-sm text-gray-500">Explore as estruturas anatômicas em 3D interativo</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related3DModels.map((item, idx) => (
              <button
                key={item.model.id}
                onClick={() => setActiveView('3d')}
                className="group text-left p-5 rounded-2xl border border-gray-200 bg-white hover:border-teal-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    item.model.available 
                      ? "bg-teal-50" 
                      : "bg-gray-100"
                  )}>
                    <Box size={22} className={item.model.available ? "text-teal-500" : "text-gray-400"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-teal-700 transition-colors truncate" style={headingStyle}>{item.model.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.sectionTitle}</p>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{item.model.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    item.model.available ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {item.model.available ? 'Disponível' : 'Em breve'}
                  </span>
                  <span className="text-xs text-teal-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Explorar <ChevronRight size={12} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Compact Study Actions (bottom-right corner) ── */}
      <div className="mt-10 mb-4 flex justify-end">
        <div className="flex items-center gap-1.5">
          {hasQuiz && (
            <button 
              onClick={handleGoToQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white transition-all active:scale-95"
              title={`Quiz: ${topic.title}`}
            >
              <FileText size={13} />
              <span className="hidden sm:inline">Quiz ({quizCount})</span>
            </button>
          )}
          {hasFlashcards && (
            <button 
              onClick={handleGoToFlashcards}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-500 hover:text-white transition-all active:scale-95"
              title={`Flashcards: ${topic.title}`}
            >
              <Layers size={13} />
              <span className="hidden sm:inline">Flashcard ({flashcardCount})</span>
            </button>
          )}
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500 hover:text-white transition-all active:scale-95"
            title="Terminar Sessão"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Terminar</span>
          </button>
        </div>
      </div>

      {/* Document Footer */}
      <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
        <span>Fim do documento</span>
        <span>AXON © 2025</span>
      </div>
    </div>
    );
  };

  // ─── Main Content JSX ───

  const content = (
    <div
      className={clsx(
        "flex flex-col h-full bg-[#525659] z-20 transition-opacity duration-300",
        mounted ? "opacity-100" : "opacity-0",
        isFullscreen && "fixed inset-0 z-[100] w-screen h-screen"
      )}
    >
      {/* PDF-style Toolbar */}
      <div className="h-14 bg-[#323639] border-b border-black/20 flex items-center justify-between px-4 shrink-0 shadow-lg z-50">
        {/* Left: Nav & Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isFullscreen) toggleFullscreen();
              onBack();
            }}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 hover:bg-white/10 rounded-lg"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium hidden sm:inline">Voltar</span>
          </button>

          <div className="h-6 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setShowOutline(!showOutline)}
            className={clsx(
              "p-2 rounded-lg transition-colors text-sm",
              showOutline ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
            title="Sumario"
          >
            <Menu size={18} />
          </button>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTool('pen')}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                activeTool === 'pen' ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              title="Desenhar"
            >
              <Pen size={18} />
            </button>
            <button
              onClick={() => setActiveTool('highlight')}
              className={clsx(
                "p-2 rounded-lg transition-colors relative",
                activeTool === 'highlight' ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              title="Realcar"
            >
              <Highlighter size={18} />
              <div className={clsx("absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-[#323639]",
                highlightColor === 'yellow' ? "bg-yellow-400" :
                highlightColor === 'green' ? "bg-green-400" :
                highlightColor === 'blue' ? "bg-sky-400" : "bg-pink-400"
              )} />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Borracha"
            >
              <Eraser size={18} />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Adicionar Texto"
            >
              <FileText size={18} />
            </button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <button
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded-lg transition-colors"
              title="Perguntar ao MedBot"
            >
              <Sparkles size={18} />
            </button>
          </div>
        </div>

        {/* Center - Page Nav */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1">
            <button className="text-gray-400 hover:text-white disabled:opacity-30" disabled={currentSection === 0} onClick={() => scrollToSection(Math.max(0, currentSection - 1))}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-white text-sm font-medium min-w-[40px] text-center">
              {currentSection + 1} <span className="text-gray-500">/</span> {sections.length}
            </span>
            <button className="text-gray-400 hover:text-white disabled:opacity-30" disabled={currentSection === sections.length - 1} onClick={() => scrollToSection(Math.min(sections.length - 1, currentSection + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Zoom & Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Reduzir zoom">
            <ZoomOut size={18} />
          </button>
          <span className="text-white text-sm font-medium min-w-[50px] text-center">{zoom}%</span>
          <button onClick={handleZoomIn} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Aumentar zoom">
            <ZoomIn size={18} />
          </button>

          <div className="h-6 w-px bg-white/10 mx-2" />

          <button className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Buscar">
            <Search size={18} />
          </button>
          <button className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Salvar">
            <Bookmark size={18} />
          </button>
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              showAnnotations ? "bg-white/20 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
            )}
            title={showAnnotations ? "Ocultar palavras-chave" : "Mostrar palavras-chave"}
          >
            <CircleDot size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            className={clsx(
              "p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors",
              isFullscreen && "text-blue-400 bg-white/10"
            )}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Outline Sidebar */}
        <AnimatePresence>
          {showOutline && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#3e4246] border-r border-black/20 overflow-hidden flex-shrink-0"
            >
              <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 px-2">Sumario</h3>
                <nav className="space-y-1">
                  {sections.map((section: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => scrollToSection(index)}
                      className={clsx(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all",
                        currentSection === index
                          ? "bg-white/10 text-white font-medium"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          currentSection === index ? "bg-sky-400" : "bg-gray-500"
                        )} />
                        <span className="line-clamp-2">{section.title}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {showAnnotations ? (
          <PanelGroup direction="horizontal" autoSaveId="summary-keywords-split">
            <Panel defaultSize={70} minSize={40} className="flex flex-col bg-gray-100">
              <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={scrollContainerRef}>
                <div
                  className="max-w-5xl mx-auto w-full bg-white min-h-full shadow-sm"
                  style={{
                    zoom: `${zoom}%`,
                  }}
                >
                  {renderDocumentContent()}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1.5 bg-black hover:bg-blue-500 transition-colors cursor-col-resize flex items-center justify-center z-40 focus:outline-none focus:bg-blue-500">
              <div className="w-0.5 h-8 bg-gray-700 rounded-full" />
            </PanelResizeHandle>

            {/* ── Keywords Sidebar ── */}
            <Panel defaultSize={30} minSize={20} className="bg-white flex flex-col border-l border-gray-800">
              {/* Sidebar Header with Stats */}
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/80">
                <h3 className="font-bold text-sm text-gray-900 mb-3">Palavras-Chave</h3>
                {(() => {
                  const stats = getAnnotationStats();
                  return (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs font-medium text-red-700">{stats.red}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-xs font-medium text-amber-700">{stats.yellow}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700">{stats.green}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-auto">{stats.total} termos</span>
                    </div>
                  );
                })()}
              </div>

              {/* Keywords List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {getAnnotatedKeywords().map(({ keyword, mastery: level, notes }) => {
                  const mc = masteryConfig[level];
                  return (
                    <div
                      key={keyword.id}
                      className={clsx(
                        "px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-default"
                      )}
                    >
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className={clsx("w-2.5 h-2.5 rounded-full shrink-0", mc.bgDot)} />
                        <span className="font-medium text-sm text-gray-900 capitalize">{keyword.term}</span>
                        {keyword.has3DModel && (
                          <Box size={12} className="text-blue-400 ml-auto shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 ml-5 leading-relaxed">
                        {keyword.definition}
                      </p>
                      {notes.length > 0 && (
                        <div className="ml-5 mt-1.5 flex items-center gap-1">
                          <Pen size={10} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-600">{notes.length} anotacao(oes)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>
          </PanelGroup>
        ) : (
          /* Full-width Document */
          <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-100" ref={scrollContainerRef}>
            <div
              className="max-w-5xl mx-auto w-full bg-white min-h-full shadow-sm"
              style={{
                zoom: `${zoom}%`,
              }}
            >
              {renderDocumentContent()}
            </div>
          </div>
        )}
      </div>

      {/* ── Text Annotation Popup (Portal) ── */}
      {pendingAnnotation && createPortal(
        <div
          id="text-annotation-popup"
          className="fixed z-[9999]"
          style={{
            top: Math.min(pendingAnnotation.rect.bottom + 8, window.innerHeight - 420),
            left: Math.max(12, Math.min(pendingAnnotation.rect.left, window.innerWidth - 380)),
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <StickyNote size={16} className="text-blue-500" />
                <span className="font-bold text-sm text-gray-800">Anotar Trecho</span>
              </div>
              <button
                onClick={() => setPendingAnnotation(null)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>

            {/* Cited text */}
            <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/30">
              <p className="text-xs text-gray-500 mb-1 font-medium">Trecho selecionado:</p>
              <p className="text-sm text-gray-700 italic line-clamp-3 leading-relaxed">
                "{pendingAnnotation.text.length > 150 ? pendingAnnotation.text.slice(0, 150) + '…' : pendingAnnotation.text}"
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {([
                { key: 'highlight' as const, icon: <Highlighter size={14} />, label: 'Destacar' },
                { key: 'note' as const, icon: <Edit3 size={14} />, label: 'Anotar' },
                { key: 'question' as const, icon: <Bot size={14} />, label: 'Perguntar' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setAnnotationActiveTab(tab.key)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2",
                    annotationActiveTab === tab.key
                      ? "text-blue-600 border-blue-500 bg-blue-50/50"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {annotationActiveTab === 'highlight' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Escolha uma cor de marca-texto:</p>
                  <div className="flex items-center gap-3">
                    {(['yellow', 'blue', 'green', 'pink'] as const).map(color => {
                      const colorStyles: Record<string, string> = {
                        yellow: 'bg-yellow-300 ring-yellow-400',
                        blue: 'bg-blue-300 ring-blue-400',
                        green: 'bg-emerald-300 ring-emerald-400',
                        pink: 'bg-pink-300 ring-pink-400',
                      };
                      return (
                        <button
                          key={color}
                          onClick={() => setAnnotationColor(color)}
                          className={clsx(
                            "w-9 h-9 rounded-full transition-all border-2",
                            colorStyles[color],
                            annotationColor === color ? "ring-2 ring-offset-2 scale-110 border-gray-600" : "hover:scale-105 border-transparent"
                          )}
                        />
                      );
                    })}
                  </div>
                  {/* Preview do marca-texto */}
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Preview</p>
                    <span
                      className="text-sm text-gray-700"
                      style={{
                        ...({
                          yellow: { background: 'linear-gradient(to bottom, transparent 40%, #fde047 40%, #fde047 85%, transparent 85%)' },
                          blue:   { background: 'linear-gradient(to bottom, transparent 40%, #93c5fd 40%, #93c5fd 85%, transparent 85%)' },
                          green:  { background: 'linear-gradient(to bottom, transparent 40%, #6ee7b7 40%, #6ee7b7 85%, transparent 85%)' },
                          pink:   { background: 'linear-gradient(to bottom, transparent 40%, #f9a8d4 40%, #f9a8d4 85%, transparent 85%)' },
                        } as Record<string, React.CSSProperties>)[annotationColor],
                        padding: '0 2px',
                      }}
                    >
                      {pendingAnnotation.text.length > 60 ? pendingAnnotation.text.slice(0, 60) + '…' : pendingAnnotation.text}
                    </span>
                  </div>
                  <button
                    onClick={() => createTextAnnotation(pendingAnnotation.text, 'highlight', '', annotationColor)}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Highlighter size={14} />
                    Destacar Trecho
                  </button>
                </div>
              )}

              {annotationActiveTab === 'note' && (
                <div className="space-y-3">
                  <textarea
                    value={annotationNoteInput}
                    onChange={(e) => setAnnotationNoteInput(e.target.value)}
                    placeholder="Escreva sua anotacao sobre este trecho..."
                    className="w-full h-24 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-gray-50 placeholder:text-gray-400"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(['yellow', 'blue', 'green', 'pink'] as const).map(color => {
                        const colorStyles: Record<string, string> = {
                          yellow: 'bg-yellow-300',
                          blue: 'bg-blue-300',
                          green: 'bg-emerald-300',
                          pink: 'bg-pink-300',
                        };
                        return (
                          <button
                            key={color}
                            onClick={() => setAnnotationColor(color)}
                            className={clsx(
                              "w-5 h-5 rounded-full transition-all",
                              colorStyles[color],
                              annotationColor === color ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105"
                            )}
                          />
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        if (annotationNoteInput.trim()) {
                          createTextAnnotation(pendingAnnotation.text, 'note', annotationNoteInput.trim(), annotationColor);
                        }
                      }}
                      disabled={!annotationNoteInput.trim()}
                      className={clsx(
                        "ml-auto py-2 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2",
                        annotationNoteInput.trim()
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <Edit3 size={14} />
                      Salvar Nota
                    </button>
                  </div>
                </div>
              )}

              {annotationActiveTab === 'question' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">MedBot</span>
                    <span className="text-[10px] text-gray-400">IA Assistente</span>
                  </div>
                  <textarea
                    value={annotationQuestionInput}
                    onChange={(e) => setAnnotationQuestionInput(e.target.value)}
                    placeholder="Pergunte algo sobre este trecho ao MedBot..."
                    className="w-full h-20 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-gray-50 placeholder:text-gray-400"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const question = annotationQuestionInput.trim() || 'Explique este trecho em detalhes';
                      createTextAnnotation(pendingAnnotation.text, 'question', question, 'blue');
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    {annotationBotLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Pensando...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Perguntar ao MedBot
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ── Text Annotations Sidebar Drawer ── */}
      {textAnnotations.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9998]">
          <TextAnnotationsPanel
            annotations={textAnnotations}
            onDelete={deleteTextAnnotation}
            botLoading={annotationBotLoading}
          />
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return createPortal(content, document.body);
  }

  return content;
}