// ============================================================
// Axon v4.4 — GradeButtons
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 2.2: Botones de calificacion con atajos de teclado
// ============================================================

import { useEffect } from 'react';
import type { Grade } from '../../../types/enums';
import { GRADE_BUTTONS } from './constants';

interface GradeButtonsProps {
  onGrade: (g: Grade) => void;
  disabled: boolean;
}

export function GradeButtons({ onGrade, disabled }: GradeButtonsProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx >= 0) onGrade(GRADE_BUTTONS[idx].value);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onGrade, disabled]);

  return (
    <div className="w-full max-w-xl mx-auto grid grid-cols-4 gap-2">
      {GRADE_BUTTONS.map((g) => (
        <button
          key={g.value}
          onClick={() => !disabled && onGrade(g.value)}
          disabled={disabled}
          className="group flex flex-col items-center gap-1.5 transition-transform active:scale-95 outline-none disabled:opacity-40"
        >
          <div
            className={`w-full h-12 rounded-xl flex flex-col items-center justify-center text-white shadow-md transition-all group-hover:-translate-y-1 group-hover:shadow-lg ${g.color} ${g.hover}`}
          >
            <span className="text-[10px] opacity-70">{g.kbd}</span>
            <span className="text-sm font-bold">{g.label}</span>
          </div>
          <span className={`text-[9px] font-medium ${g.text} hidden sm:block`}>
            {g.desc}
          </span>
        </button>
      ))}
    </div>
  );
}
