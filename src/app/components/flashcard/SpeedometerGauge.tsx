// ============================================================
// Axon v4.4 — SpeedometerGauge
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 2.1: Gauge SVG de progreso de sesion
// ============================================================

import { motion } from 'motion/react';
import type { Grade } from '../../../types/enums';

interface SpeedometerGaugeProps {
  total: number;
  currentIndex: number;
  sessionGrades: Grade[];
}

export function SpeedometerGauge({ total, currentIndex, sessionGrades }: SpeedometerGaugeProps) {
  const size = 120;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = (size - strokeWidth * 2) / 2;
  const startAngle = 135;
  const sweepAngle = 270;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const segmentAngle = sweepAngle / Math.max(total, 1);
  const segmentGap = Math.min(1.5, segmentAngle * 0.1);
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Background segments */}
        {Array.from({ length: total }).map((_, i) => {
          const segStart = startAngle + i * segmentAngle + segmentGap;
          const segEnd = startAngle + (i + 1) * segmentAngle - segmentGap;
          return (
            <path
              key={`bg-${i}`}
              d={describeArc(segStart, segEnd)}
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        })}

        {/* Active segments */}
        {Array.from({ length: total }).map((_, i) => {
          const isCompleted = i < sessionGrades.length;
          const isCurrent = i === currentIndex;
          if (!isCompleted && !isCurrent) return null;

          let color = '#14b8a6';
          if (isCompleted) {
            const g = sessionGrades[i];
            color = g >= 0.90 ? '#10b981' : g >= 0.65 ? '#22c55e' : g >= 0.35 ? '#f59e0b' : '#f43f5e';
          }

          const segStart = startAngle + i * segmentAngle + segmentGap;
          const segEnd = startAngle + (i + 1) * segmentAngle - segmentGap;

          return (
            <motion.path
              key={`seg-${i}`}
              d={describeArc(segStart, segEnd)}
              fill="none"
              stroke={color}
              strokeWidth={isCurrent ? strokeWidth + 2 : strokeWidth}
              strokeLinecap="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{
                opacity: isCurrent ? [0.6, 1, 0.6] : 1,
                pathLength: 1,
              }}
              transition={
                isCurrent
                  ? { opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }, pathLength: { duration: 0.4 } }
                  : { duration: 0.4 }
              }
            />
          );
        })}

        {/* Needle */}
        {(() => {
          const needleAngle = startAngle + (currentIndex / Math.max(total, 1)) * sweepAngle + segmentAngle / 2;
          const rad = (needleAngle * Math.PI) / 180;
          const tip = polarToCartesian(needleAngle);
          const inner = {
            x: center + (radius - 18) * Math.cos(rad),
            y: center + (radius - 18) * Math.sin(rad),
          };
          return (
            <motion.line
              x1={inner.x} y1={inner.y}
              x2={tip.x} y2={tip.y}
              stroke="#374151" strokeWidth={2} strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
            />
          );
        })()}

        <circle cx={center} cy={center} r={3} fill="#6b7280" opacity={0.5} />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 8 }}>
        <span className="text-2xl font-black text-gray-800 tabular-nums leading-none">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{currentIndex + 1}</span>
        <span className="text-[10px] text-gray-400">/</span>
        <span className="text-[11px] font-semibold text-gray-400 tabular-nums">{total}</span>
      </div>
    </div>
  );
}
