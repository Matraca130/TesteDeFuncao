// ============================================================
// AXON v4.4 — PerformanceWidget (Shared Component — BLOQUEADO)
// ============================================================
// Widget de "Desempenho Diario" con % circular.
//
// Uso:
//   <PerformanceWidget percent={45} label="CONCLUIDO" />
// ============================================================

import React from 'react';

interface PerformanceWidgetProps {
  percent: number;           // 0-100
  label?: string;            // default: "CONCLUIDO"
  title?: string;            // default: "Desempenho Diario"
}

export default function PerformanceWidget({
  percent, label = 'CONCLUIDO', title = 'Desempenho Diario',
}: PerformanceWidgetProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white flex flex-col items-center justify-center min-h-[200px]">
      <p className="text-sm font-bold mb-4">{title}</p>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="70" cy="70" r={radius} fill="none"
            stroke="#2dd4bf" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black">{percent}%</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
