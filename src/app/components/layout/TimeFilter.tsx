// ============================================================
// AXON v4.4 — TimeFilter (Shared Component — BLOQUEADO)
// ============================================================
// Filtro "Hoje | Semana | Mes" con pill selection.
//
// Uso:
//   <TimeFilter
//     options={['Hoje', 'Semana', 'Mes']}
//     value="Hoje"
//     onChange={setTimeFilter}
//   />
// ============================================================

import React from 'react';

interface TimeFilterProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function TimeFilter({ options, value, onChange }: TimeFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            value === opt
              ? 'bg-[--axon-teal] text-white shadow-sm'
              : 'text-[--axon-text-secondary] hover:text-[--axon-text-primary]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
