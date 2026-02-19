// ============================================================
// Axon v4.4 — StudyingView
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 4.4: Vista principal de estudio (card + flip + grade)
// Cubre phase === 'studying' y phase === 'feedback'
// ============================================================

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Sparkles, Image as ImageIcon } from 'lucide-react';

import type { Grade } from '../../../../types/enums';
import type { DueFlashcardItem, SubmitReviewRes } from '../../../../types/api-contract';
import type { SessionPhase } from '../types';

import { SpeedometerGauge } from '../SpeedometerGauge';
import { GradeButtons } from '../GradeButtons';
import { ReviewFeedbackDisplay } from '../ReviewFeedbackDisplay';

interface StudyingViewProps {
  // Phase
  phase: SessionPhase; // 'studying' | 'feedback'

  // Card data
  currentCard: DueFlashcardItem;
  currentIndex: number;
  totalCards: number;

  // Flip
  isFlipped: boolean;
  flipCard: () => void;

  // Grade
  sessionGrades: Grade[];
  isSubmitting: boolean;
  handleGrade: (grade: Grade) => void;

  // Feedback (when phase === 'feedback')
  lastFeedback: SubmitReviewRes['feedback'] | null;
  lastGrade: Grade | null;
  handleContinue: () => void;
}

export function StudyingView({
  phase,
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  flipCard,
  sessionGrades,
  isSubmitting,
  handleGrade,
  lastFeedback,
  lastGrade,
  handleContinue,
}: StudyingViewProps) {
  const card = currentCard.card;
  const showingFeedback = phase === 'feedback' && lastFeedback != null && lastGrade != null;

  // Keyboard: space/enter to flip
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showingFeedback) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleContinue();
        }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipCard();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipCard, showingFeedback, handleContinue]);

  return (
    <div className="flex flex-col items-center gap-5 py-4 px-4 max-w-xl mx-auto w-full">
      {/* Top bar: gauge + meta */}
      <div className="w-full flex items-center justify-between">
        <SpeedometerGauge
          total={totalCards}
          currentIndex={currentIndex}
          sessionGrades={sessionGrades}
        />

        {/* Card meta */}
        <div className="flex flex-col items-end gap-1">
          {currentCard.fsrs_state.state != null && (
            <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {currentCard.fsrs_state.state === 0
                ? 'Novo'
                : currentCard.fsrs_state.state === 1
                ? 'Aprendendo'
                : currentCard.fsrs_state.state === 2
                ? 'Revis\u00e3o'
                : 'Reaprendendo'}
            </span>
          )}
          {currentCard.overdue_days > 0 && (
            <span className="text-[9px] text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
              {currentCard.overdue_days}d atrasado
            </span>
          )}
          {currentCard.fsrs_state.reps > 0 && (
            <span className="text-[9px] text-gray-400">
              reps: {currentCard.fsrs_state.reps}
            </span>
          )}
        </div>
      </div>

      {/* Flashcard */}
      <motion.div
        layout
        className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        {/* Front */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles size={14} className="text-teal-400 mt-0.5 shrink-0" />
            <span className="text-[9px] text-gray-400 uppercase tracking-wider">
              Pergunta
            </span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{card.front}</p>
          {card.image_url && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400">
              <ImageIcon size={11} />
              <span>Imagem dispon\u00edvel</span>
            </div>
          )}
        </div>

        {/* Back (answer) */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-b from-teal-50/30 to-white">
                <div className="flex items-start gap-2 mb-2">
                  <Eye size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-[9px] text-emerald-500 uppercase tracking-wider">
                    Resposta
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{card.back}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Actions */}
      {showingFeedback ? (
        <ReviewFeedbackDisplay
          feedback={lastFeedback!}
          grade={lastGrade!}
          onContinue={handleContinue}
        />
      ) : !isFlipped ? (
        /* Flip button */
        <motion.button
          onClick={flipCard}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-xs py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <EyeOff size={15} /> Mostrar Resposta
          <span className="text-[9px] opacity-60 ml-1">[espa\u00e7o]</span>
        </motion.button>
      ) : (
        /* Grade buttons */
        <div className="w-full space-y-2">
          <p className="text-center text-[10px] text-gray-400">
            Como foi sua lembran\u00e7a?
          </p>
          <GradeButtons onGrade={handleGrade} disabled={isSubmitting} />
          {isSubmitting && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[10px] text-teal-500"
            >
              Enviando...
            </motion.p>
          )}
        </div>
      )}

      {/* Keyboard hints */}
      <div className="flex items-center gap-4 text-[9px] text-gray-300">
        <span>Espa\u00e7o = virar</span>
        <span>1-4 = nota</span>
        <span>Enter = continuar</span>
      </div>
    </div>
  );
}
