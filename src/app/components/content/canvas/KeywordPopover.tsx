// ══════════════════════════════════════════════════════════════
// KEYWORD POPOVER — Popup rico al hacer click en una keyword marcada
// Muestra definicion, nivel de dominio, AI questions, fuente
// Usa event delegation: se monta como wrapper que escucha clicks
// en cualquier .keyword-mark dentro de su children.
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { findKeyword, masteryConfig } from '@/app/data/keywords';
import type { KeywordData, MasteryLevel } from '@/app/data/keywords';
import { X, HelpCircle, BookOpen, Box, ChevronDown, ChevronUp, MessageSquarePlus, Send } from 'lucide-react';

interface PopoverState {
  keyword: KeywordData;
  x: number;
  y: number;
  anchorRect: DOMRect;
}

/** Fallback keyword for terms not found in the database */
interface FallbackPopoverState {
  term: string;
  x: number;
  y: number;
  anchorRect: DOMRect;
}

interface KeywordPopoverProviderProps {
  children: React.ReactNode;
  /** Summary context for persisting mastery/notes changes */
  summaryContext?: {
    courseId: string;
    topicId: string;
    keywordMastery?: Record<string, string>;
    keywordNotes?: Record<string, string[]>;
    onUpdateMastery?: (keyword: string, mastery: string) => void;
    onAddNote?: (keyword: string, note: string) => void;
  };
}

/**
 * Wrap any content that may contain .keyword-mark spans.
 * Clicking a keyword-mark will show a floating popover with its details.
 */
export function KeywordPopoverProvider({ children, summaryContext }: KeywordPopoverProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [fallbackPopover, setFallbackPopover] = useState<FallbackPopoverState | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Active popover is either the rich one or the fallback
  const isOpen = popover !== null || fallbackPopover !== null;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPopover(null); setFallbackPopover(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
        setFallbackPopover(null);
      }
    };
    // Delay to avoid closing on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen]);

  // Event delegation: detect clicks on .keyword-mark
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const kwEl = target.closest('.keyword-mark') as HTMLElement | null;
    if (!kwEl) return;

    // Get keyword term from data attribute or text content
    const term = kwEl.getAttribute('data-keyword') || kwEl.textContent || '';
    const kwData = findKeyword(term);

    e.stopPropagation();
    const rect = kwEl.getBoundingClientRect();

    if (!kwData) {
      // Not in the database — show a minimal fallback popup
      setPopover(null);
      setFallbackPopover({
        term: term || 'Palavra-chave',
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
        anchorRect: rect,
      });
      return;
    }

    setFallbackPopover(null);
    setPopover({
      keyword: kwData,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
      anchorRect: rect,
    });
    setShowQuestions(false);
  }, []);

  const mastery = popover ? masteryConfig[popover.keyword.masteryLevel] : null;

  // Compute position for the popover (uses viewport coords — works with Portal)
  const getPopoverStyle = useCallback((state: { x: number; y: number; anchorRect: DOMRect }): React.CSSProperties => {
    const popW = 360;
    const margin = 12;
    let left = state.x - popW / 2;
    // Keep within viewport
    if (left < margin) left = margin;
    if (left + popW > window.innerWidth - margin) left = window.innerWidth - margin - popW;
    let top = state.y;
    // If near bottom, show above
    if (top + 300 > window.innerHeight) {
      top = state.anchorRect.top - 8;
      return {
        position: 'fixed' as const,
        left: `${left}px`,
        bottom: `${window.innerHeight - top}px`,
        width: `${popW}px`,
        zIndex: 9999,
      };
    }
    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${popW}px`,
      zIndex: 9999,
    };
  }, []);

  // Render the popover content via Portal into document.body
  // This avoids position:fixed being trapped by ancestor transforms (motion.div)
  const popoverPortal = createPortal(
    <AnimatePresence>
      {popover && mastery && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={getPopoverStyle(popover)}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with mastery color */}
          <div className={`px-4 py-3 ${mastery.headerBg} border-b ${mastery.borderColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${mastery.bgDot}`} />
                <h3 className="text-sm font-bold text-gray-900 capitalize">
                  {popover.keyword.term}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${mastery.textColor} px-2 py-0.5 rounded-full ${mastery.bgLight}`}>
                  {mastery.label}
                </span>
                <button
                  onClick={() => setPopover(null)}
                  className="p-0.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3 max-h-[320px] overflow-y-auto">
            {/* Definition */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {popover.keyword.definition}
            </p>

            {/* Source */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <BookOpen size={11} className="text-gray-400 shrink-0" />
              <span className="text-[10px] text-gray-400 italic leading-tight">
                {popover.keyword.source}
              </span>
            </div>

            {/* 3D model indicator */}
            {popover.keyword.has3DModel && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Box size={11} className="text-teal-500 shrink-0" />
                <span className="text-[10px] text-teal-600 font-semibold">
                  Modelo 3D disponivel
                </span>
              </div>
            )}

            {/* AI Questions */}
            {popover.keyword.aiQuestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors w-full"
                >
                  <HelpCircle size={12} />
                  <span>Perguntas de estudo ({popover.keyword.aiQuestions.length})</span>
                  <span className="flex-1" />
                  {showQuestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <AnimatePresence>
                  {showQuestions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2">
                        {popover.keyword.aiQuestions.map((q, i) => (
                          <QuestionCard key={i} question={q.question} answer={q.answer} index={i} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mastery toggle — only if summaryContext provided */}
            {summaryContext?.onUpdateMastery && (
              <MasteryToggle
                keyword={popover.keyword.term.toLowerCase()}
                currentMastery={summaryContext.keywordMastery?.[popover.keyword.term.toLowerCase()] || popover.keyword.masteryLevel}
                onUpdate={(m) => summaryContext.onUpdateMastery!(popover.keyword.term.toLowerCase(), m)}
              />
            )}

            {/* Keyword notes — only if summaryContext provided */}
            {summaryContext?.onAddNote && (
              <KeywordNotes
                keyword={popover.keyword.term.toLowerCase()}
                notes={summaryContext.keywordNotes?.[popover.keyword.term.toLowerCase()] || []}
                onAdd={(note) => summaryContext.onAddNote!(popover.keyword.term.toLowerCase(), note)}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Fallback popup for keywords not in the database */}
      {fallbackPopover && !popover && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={getPopoverStyle(fallbackPopover)}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 capitalize">
                  {fallbackPopover.term}
                </h3>
              </div>
              <button
                onClick={() => setFallbackPopover(null)}
                className="p-0.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-500 italic">
              Palavra-chave marcada no resumo. Definicao detalhada ainda nao disponivel no banco de dados.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <div ref={containerRef} onClick={handleClick} className="relative">
      {children}
      {popoverPortal}
    </div>
  );
}

// ── Question card with reveal answer ──
function QuestionCard({ question, answer, index }: { question: string; answer?: string; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-xs text-gray-700 font-medium leading-relaxed">
        <span className="text-teal-600 font-bold mr-1">Q{index + 1}.</span>
        {question}
      </p>
      {answer && (
        <>
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-1.5 text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Ver resposta
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1.5 pt-1.5 border-t border-gray-200"
            >
              <p className="text-[11px] text-gray-600 leading-relaxed">
                <span className="font-semibold text-emerald-600 mr-1">R:</span>
                {answer}
              </p>
            </motion.div>
          )}
        </>
      )}
      {!answer && (
        <p className="mt-1 text-[10px] text-gray-400 italic">Responda mentalmente antes de continuar.</p>
      )}
    </div>
  );
}

// ── Mastery toggle component ──
function MasteryToggle({ keyword, currentMastery, onUpdate }: { keyword: string; currentMastery: string; onUpdate: (m: string) => void }) {
  const levels: { key: string; label: string; dot: string; bg: string }[] = [
    { key: 'red', label: 'Nao domino', dot: 'bg-red-500', bg: 'hover:bg-red-50' },
    { key: 'yellow', label: 'Parcialmente', dot: 'bg-amber-400', bg: 'hover:bg-amber-50' },
    { key: 'green', label: 'Domino', dot: 'bg-emerald-500', bg: 'hover:bg-emerald-50' },
  ];

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Seu dominio</p>
      <div className="flex gap-1.5">
        {levels.map(l => (
          <button
            key={l.key}
            onClick={() => onUpdate(l.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
              currentMastery === l.key
                ? `${l.dot.replace('bg-', 'border-')} bg-opacity-10 ${l.bg.replace('hover:', '')}`
                : 'border-gray-200 text-gray-500 ' + l.bg
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${l.dot}`} />
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Keyword notes component ──
function KeywordNotes({ keyword, notes, onAdd }: { keyword: string; notes: string[]; onAdd: (note: string) => void }) {
  const [newNote, setNewNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (!newNote.trim()) return;
    onAdd(newNote.trim());
    setNewNote('');
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors w-full"
      >
        <MessageSquarePlus size={12} />
        <span>Suas notas {notes.length > 0 && `(${notes.length})`}</span>
        <span className="flex-1" />
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
            <div className="mt-2 space-y-2">
              {notes.map((note, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <p className="text-[11px] text-gray-700 leading-relaxed">{note}</p>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-300/50"
                  placeholder="Adicionar nota..."
                />
                <button
                  onClick={handleSubmit}
                  disabled={!newNote.trim()}
                  className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 disabled:opacity-40 transition-colors"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
