// ============================================================
// Axon v4.4 — ReviewFeedbackDisplay
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 2.3: Panel de feedback post-review con deltas de color
// ============================================================

import { motion } from 'motion/react';
import {
  ArrowRight, Clock, TrendingUp, Brain,
  AlertTriangle, ChevronRight,
} from 'lucide-react';

import type { Grade } from '../../../types/enums';
import type { SubmitReviewRes } from '../../../types/api-contract';
import { getColorMeta } from './utils';

interface ReviewFeedbackDisplayProps {
  feedback: SubmitReviewRes['feedback'];
  grade: Grade;
  onContinue: () => void;
}

export function ReviewFeedbackDisplay({ feedback, grade, onContinue }: ReviewFeedbackDisplayProps) {
  const cBefore = getColorMeta(feedback.color_before);
  const cAfter = getColorMeta(feedback.color_after);
  const improved = feedback.delta_after > feedback.delta_before;
  const daysUntil = feedback.stability != null ? Math.round(feedback.stability * 10) / 10 : null;
  const isLapse = grade === 0.00;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-4 px-6"
    >
      {/* Lapse warning */}
      {isLapse && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full"
        >
          <AlertTriangle size={12} /> Lapse — card volta para reaprendizagem
        </motion.div>
      )}

      {/* Color delta before → after */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full ${cBefore.bg} shadow-lg`} />
          <span className="text-[10px] text-gray-500">{cBefore.label}</span>
        </div>
        <ArrowRight size={18} className={improved ? 'text-emerald-500' : 'text-red-400'} />
        <div className="flex flex-col items-center gap-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={`w-10 h-10 rounded-full ${cAfter.bg} shadow-lg ring-2 ring-white`}
          />
          <span className="text-[10px] text-gray-500">{cAfter.label}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={13} className={improved ? 'text-emerald-500' : 'text-red-400'} />
          <span>{improved ? '+' : ''}{((feedback.delta_after - feedback.delta_before) * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Brain size={13} className="text-violet-500" />
          <span>{(feedback.mastery * 100).toFixed(0)}% mastery</span>
        </div>
        {daysUntil != null && (
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-blue-500" />
            <span>{daysUntil < 1 ? `${Math.round(daysUntil * 24)}h` : `${daysUntil}d`}</span>
          </div>
        )}
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="mt-1 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-full transition-colors flex items-center gap-2 shadow-sm"
      >
        Continuar <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}
