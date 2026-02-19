// ============================================================
// AXON v4.4 — CourseCard (Shared Component — BLOQUEADO)
// ============================================================
// Card de disciplina/curso con icono, progreso, y aulas.
//
// Uso:
//   <CourseCard
//     name="Microbiologia"
//     module="Modulo IV"
//     iconEmoji="🦠"
//     progressPercent={0}
//     completedLessons={0}
//     totalLessons={0}
//     onClick={() => navigate('/study/learn/micro')}
//   />
// ============================================================

import React from 'react';

interface CourseCardProps {
  name: string;
  module: string;
  iconEmoji?: string;
  iconColor?: string;         // bg color for icon: "bg-teal-100"
  progressPercent: number;    // 0-100
  completedLessons: number;
  totalLessons: number;
  onClick?: () => void;
}

export default function CourseCard({
  name, module, iconEmoji = '📚', iconColor = 'bg-teal-100',
  progressPercent, completedLessons, totalLessons, onClick,
}: CourseCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-[--axon-card-bg] border border-[--axon-card-border] rounded-2xl p-5 text-left hover:shadow-md hover:border-gray-300 transition-all group w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center text-lg`}>
          {iconEmoji}
        </div>
        <span className="text-xs font-bold text-[--axon-teal] bg-[--axon-teal-bg] px-2 py-0.5 rounded-full">
          {progressPercent}%
        </span>
      </div>
      <p className="text-base font-bold text-[--axon-text-primary]">{name}</p>
      <p className="text-[11px] uppercase tracking-wider text-[--axon-text-muted] font-medium mt-0.5">
        {module}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] text-[--axon-text-muted] mb-1">
            <span>Progresso</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[--axon-teal] rounded-full transition-all"
              style={{ width: `${Math.max(progressPercent, 2)}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-[--axon-text-secondary] whitespace-nowrap">
          {completedLessons}/{totalLessons} Aulas
        </span>
      </div>
    </button>
  );
}
