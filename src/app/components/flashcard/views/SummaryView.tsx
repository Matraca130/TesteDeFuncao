// ============================================================
// Axon v4.4 — SummaryView
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 4.3: Vista de resumen post-sesion con estadisticas
// ============================================================

import { motion } from 'motion/react';
import {
  Trophy, RotateCcw, Plus, Target,
  TrendingUp, Clock, Brain, Zap,
} from 'lucide-react';

import type { Grade } from '../../../../types/enums';
import type { SessionReviewResult } from '../types';
import { getColorMeta, gradeToInt } from '../utils';
import { GRADE_BUTTONS } from '../constants';

interface SummaryViewProps {
  results: SessionReviewResult[];
  sessionGrades: Grade[];
  totalCards: number;
  onRestart: () => void;
  onCreateCard?: () => void;
}

export function SummaryView({
  results,
  sessionGrades,
  totalCards,
  onRestart,
  onCreateCard,
}: SummaryViewProps) {
  // ── Computed stats ──
  const avgGrade =
    sessionGrades.length > 0
      ? sessionGrades.reduce((a, b) => a + b, 0) / sessionGrades.length
      : 0;

  const perfectCount = sessionGrades.filter((g) => g >= 0.90).length;
  const lapseCount = sessionGrades.filter((g) => g === 0.00).length;

  const avgResponseTime =
    results.length > 0
      ? results.reduce((a, r) => a + r.response_time_ms, 0) / results.length
      : 0;

  const gradeDistribution = GRADE_BUTTONS.map((btn) => ({
    ...btn,
    count: sessionGrades.filter((g) => gradeToInt(g) === gradeToInt(btn.value)).length,
  }));

  const overallColor =
    avgGrade >= 0.75 ? 'text-emerald-600' : avgGrade >= 0.50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-lg"
      >
        <Trophy size={28} className="text-amber-600" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-1"
      >
        <h2 className="text-gray-800">Sessão Completa!</h2>
        <p className="text-xs text-gray-400">{totalCards} cards revisados</p>
      </motion.div>

      {/* Score ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <svg width={100} height={100}>
          <circle
            cx={50} cy={50} r={40}
            fill="none" stroke="#e5e7eb" strokeWidth={6}
          />
          <motion.circle
            cx={50} cy={50} r={40}
            fill="none"
            stroke={avgGrade >= 0.75 ? '#10b981' : avgGrade >= 0.50 ? '#f59e0b' : '#f43f5e'}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={251}
            initial={{ strokeDashoffset: 251 }}
            animate={{ strokeDashoffset: 251 - avgGrade * 251 }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-black tabular-nums ${overallColor}`}>
            {Math.round(avgGrade * 100)}%
          </span>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3 w-full"
      >
        <StatCard
          icon={<Target size={14} className="text-emerald-500" />}
          label="Perfeitos"
          value={`${perfectCount}/${totalCards}`}
        />
        <StatCard
          icon={<Zap size={14} className="text-red-400" />}
          label="Lapsos"
          value={String(lapseCount)}
        />
        <StatCard
          icon={<Clock size={14} className="text-blue-500" />}
          label="Tempo m\u00e9dio"
          value={`${(avgResponseTime / 1000).toFixed(1)}s`}
        />
        <StatCard
          icon={<Brain size={14} className="text-violet-500" />}
          label="Mastery m\u00e9dio"
          value={results.length > 0
            ? `${Math.round(
                (results.reduce((a, r) => a + r.feedback.mastery, 0) / results.length) * 100
              )}%`
            : '\u2014'}
        />
      </motion.div>

      {/* Grade distribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full bg-white rounded-xl border border-gray-100 p-4"
      >
        <h4 className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">
          Distribui\u00e7\u00e3o de Notas
        </h4>
        <div className="flex items-end gap-2 h-20">
          {gradeDistribution.map((g) => {
            const maxCount = Math.max(...gradeDistribution.map((d) => d.count), 1);
            const heightPct = (g.count / maxCount) * 100;
            return (
              <div key={g.value} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500 tabular-nums">{g.count}</span>
                <motion.div
                  className={`w-full rounded-t-md ${g.color}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, 4)}%` }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                />
                <span className="text-[8px] text-gray-400">{g.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Per-card results */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="w-full bg-white rounded-xl border border-gray-100 p-4"
      >
        <h4 className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">
          Resultado por Card
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {results.map((r, i) => {
            const cAfter = getColorMeta(r.feedback.color_after);
            return (
              <div
                key={i}
                className={`w-7 h-7 rounded-lg ${cAfter.bg} flex items-center justify-center shadow-sm`}
                title={`Card ${i + 1}: grade=${r.grade}, mastery=${(r.feedback.mastery * 100).toFixed(0)}%`}
              >
                <span className="text-[8px] text-white font-bold">{i + 1}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="flex items-center gap-3 pt-2"
      >
        <button
          onClick={onRestart}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <RotateCcw size={14} /> Repetir Sess\u00e3o
        </button>
        {onCreateCard && (
          <button
            onClick={onCreateCard}
            className="px-4 py-2.5 border border-violet-200 text-violet-600 hover:bg-violet-50 text-sm rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> Criar Card
          </button>
        )}
      </motion.div>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 tabular-nums">{value}</p>
      </div>
    </div>
  );
}
