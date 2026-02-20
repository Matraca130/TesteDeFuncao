// ============================================================
// DiagnosticoTab.tsx | Added by Agent 6 — PRISM — P4 Extraction
//
// BKT diagnostic panel for KeywordPopover showing:
// - P(Know) progress bar with dynamic color coding
// - Flashcard / Quiz / Accuracy stat counters
// - AI diagnostic placeholder
//
// Extracted from KeywordPopover.tsx (was inline DiagnosticoSection)
// ============================================================
import { BarChart3, Brain, Layers, HelpCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../../ui/badge';
import { getBktColor } from '../../../design-system/colors';

// ── Exported interface ────────────────────────────────────────
/** Props for the DiagnosticoTab sub-component. */
export interface DiagnosticoTabProps {
  /** BKT probability of knowledge, 0..1 */
  pKnow: number;
  /** Total flashcards associated to this keyword */
  flashcardCount: number;
  /** Total quiz questions associated to this keyword */
  quizCount: number;
  /** Quiz accuracy percentage, 0..100 */
  quizAccuracy: number;
}

// ── Stat card sub-component ───────────────────────────────────
interface StatCellProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  delay: number;
}

function StatCell({ value, label, icon, delay }: StatCellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="text-center p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-teal-200 transition-colors"
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <p
          className="text-gray-900"
          style={{ fontFamily: "'Georgia', serif", fontWeight: 600 }}
        >
          {value}
        </p>
      </div>
      <p className="text-gray-400" style={{ fontSize: '0.625rem' }}>
        {label}
      </p>
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────
/**
 * BKT-based diagnostic panel for a single keyword.
 *
 * Features:
 * - Animated P(Know) progress bar with semantic color coding
 *   (red < 0.25, orange < 0.5, yellow < 0.75, green >= 0.75)
 * - Three stat counters: flashcards, quiz questions, accuracy
 * - AI diagnostic placeholder (future integration)
 * - Staggered Motion entrance animations
 */
export function DiagnosticoTab({
  pKnow,
  flashcardCount,
  quizCount,
  quizAccuracy,
}: DiagnosticoTabProps) {
  const bkt = getBktColor(pKnow);
  const pKnowPercent = Math.round(pKnow * 100);

  return (
    <div className="space-y-4">
      {/* ── BKT Progress Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-700" style={{ fontSize: '0.875rem' }}>
              Nivel de dominio
            </span>
          </div>
          <Badge
            style={{
              backgroundColor: bkt.bg,
              color: bkt.color,
              borderColor: bkt.color,
              borderWidth: '1px',
            }}
          >
            {bkt.label}
          </Badge>
        </div>

        {/* Track */}
        <div
          className="h-3 bg-gray-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={pKnowPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Nivel de dominio: ${pKnowPercent}%`}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: bkt.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pKnowPercent}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>

        {/* Scale labels */}
        <div className="flex justify-between mt-1">
          <span className="text-gray-400" style={{ fontSize: '0.625rem' }}>
            0%
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              color: bkt.color,
              fontWeight: 600,
            }}
          >
            {pKnowPercent}%
          </span>
          <span className="text-gray-400" style={{ fontSize: '0.625rem' }}>
            100%
          </span>
        </div>
      </motion.div>

      {/* ── Stat counters ── */}
      <div className="grid grid-cols-3 gap-2">
        <StatCell
          value={flashcardCount}
          label="Flashcards"
          icon={<Layers className="w-3 h-3 text-teal-400" />}
          delay={0.1}
        />
        <StatCell
          value={quizCount}
          label="Quiz"
          icon={<HelpCircle className="w-3 h-3 text-blue-400" />}
          delay={0.15}
        />
        <StatCell
          value={`${quizAccuracy}%`}
          label="Acerto"
          icon={<TrendingUp className="w-3 h-3 text-green-400" />}
          delay={0.2}
        />
      </div>

      {/* ── AI Diagnostic placeholder ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 text-center"
      >
        <BarChart3 className="w-6 h-6 text-gray-300 mx-auto mb-1" />
        <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>
          Diagnostico AI disponivel em breve
        </p>
        <p className="text-gray-300 mt-0.5" style={{ fontSize: '0.625rem' }}>
          Analise detalhada de pontos fortes e fracos
        </p>
      </motion.div>
    </div>
  );
}
