// ============================================================
// Axon v4.4 — Diagnostics: Animated progress bar
// ============================================================
import React from 'react';

interface Props {
  passCount: number;
  failCount: number;
  totalCount: number;
}

export function ProgressBar({ passCount, failCount, totalCount }: Props) {
  if (passCount + failCount === 0) return null;

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          failCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
        style={{ width: `${((passCount + failCount) / totalCount) * 100}%` }}
      />
    </div>
  );
}
