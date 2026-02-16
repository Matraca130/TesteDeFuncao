// ══════════════════════════════════════════════════════════════
// AXON — MasteryDots (reusable mastery level indicator)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import clsx from 'clsx';

export function MasteryDots({ mastery, onChange, size = 'sm' }: {
  mastery: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(level => {
        const dotClass = clsx(
          'rounded-full transition-all',
          size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
          level <= mastery ? 'bg-teal-500' : 'bg-gray-200',
          onChange && 'hover:scale-125 cursor-pointer',
          !onChange && 'cursor-default'
        );
        return onChange ? (
          <button key={level} onClick={() => onChange(level)} className={dotClass} title={`Nivel ${level}`} />
        ) : (
          <span key={level} className={dotClass} />
        );
      })}
    </div>
  );
}
