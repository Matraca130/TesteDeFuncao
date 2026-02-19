// ============================================================
// AXON v4.4 — SectionHeader (Shared Component — BLOQUEADO)
// ============================================================
// Header de seccion con indicador de color y "Ver Todas" link.
//
// Uso:
//   <SectionHeader
//     title="DISCIPLINAS EM CURSO"
//     actionLabel="Ver Todas"
//     onAction={() => navigate('/study/courses')}
//   />
// ============================================================

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  dotColor?: string;         // tailwind bg color, e.g. "bg-teal-400"
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({
  title, dotColor = 'bg-[--axon-teal]', actionLabel, onAction,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <h2 className="text-sm font-bold uppercase tracking-wider text-[--axon-text-primary]">
          {title}
        </h2>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-semibold text-[--axon-teal] hover:text-[--axon-teal-dark] transition-colors"
        >
          {actionLabel}
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}
