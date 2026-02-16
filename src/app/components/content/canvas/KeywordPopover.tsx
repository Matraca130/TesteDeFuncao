// ══════════════════════════════════════════════════════════════
// KEYWORD POPOVER — Popup rico al hacer click en una keyword marcada
// Muestra definicion, nivel de dominio, AI questions, fuente
// Usa event delegation: se monta como wrapper que escucha clicks
// en cualquier .keyword-mark dentro de su children.
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { findKeyword, masteryConfig } from '@/app/data/keywords';
import type { KeywordData, MasteryLevel } from '@/app/data/keywords';
import { X, HelpCircle, BookOpen, Box, ChevronDown, ChevronUp } from 'lucide-react';

interface PopoverState {
  keyword: KeywordData;
  x: number;
  y: number;
  anchorRect: DOMRect;
}

/**
 * Wrap any content that may contain .keyword-mark spans.
 * Clicking a keyword-mark will show a floating popover with its details.
 */
export function KeywordPopoverProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!popover) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopover(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [popover]);

  // Close when clicking outside
  useEffect(() => {
    if (!popover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
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
  }, [popover]);

  // Event delegation: detect clicks on .keyword-mark
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const kwEl = target.closest('.keyword-mark') as HTMLElement | null;
    if (!kwEl) return;

    // Get keyword term from data attribute or text content
    const term = kwEl.getAttribute('data-keyword') || kwEl.textContent || '';
    const kwData = findKeyword(term);
    if (!kwData) {
      // Not in the database - still show a minimal popup
      setPopover(null);
      return;
    }

    e.stopPropagation();
    const rect = kwEl.getBoundingClientRect();
    setPopover({
      keyword: kwData,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
      anchorRect: rect,
    });
    setShowQuestions(false);
  }, []);

  const mastery = popover ? masteryConfig[popover.keyword.masteryLevel] : null;

  // Compute position for the popover
  const getPopoverStyle = useCallback((): React.CSSProperties => {
    if (!popover) return {};
    const popW = 360;
    const margin = 12;
    let left = popover.x - popW / 2;
    // Keep within viewport
    if (left < margin) left = margin;
    if (left + popW > window.innerWidth - margin) left = window.innerWidth - margin - popW;
    let top = popover.y;
    // If near bottom, show above
    if (top + 300 > window.innerHeight) {
      top = popover.anchorRect.top - 8;
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
  }, [popover]);

  return (
    <div ref={containerRef} onClick={handleClick} className="relative">
      {children}

      <AnimatePresence>
        {popover && mastery && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={getPopoverStyle()}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
