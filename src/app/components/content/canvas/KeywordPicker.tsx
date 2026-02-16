// ══════════════════════════════════════════════════════════════
// KEYWORD PICKER — Popup para inserir palavras-chave do banco
// ══════════════════════════════════════════════════════════════
import React from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { keywordsDatabase, masteryConfig } from '@/app/data/keywords';
import type { KeywordData } from '@/app/data/keywords';

interface KeywordPickerProps {
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (kw: KeywordData) => void;
}

export function KeywordPicker({ search, onSearchChange, onSelect }: KeywordPickerProps) {
  const filtered = keywordsDatabase.filter(kw => {
    if (!search) return true;
    const q = search.toLowerCase();
    return kw.term.toLowerCase().includes(q) || kw.definition.toLowerCase().includes(q);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 w-[340px] max-h-[420px] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search field */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded-lg border border-gray-200/60">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar palavra-chave..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            autoFocus
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 px-1">
          {keywordsDatabase.length} termos disponíveis &middot; Clique para inserir
        </p>
      </div>

      {/* Keywords list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map(kw => {
          const mc = masteryConfig[kw.masteryLevel];
          return (
            <button
              key={kw.id}
              onClick={() => onSelect(kw)}
              className={clsx(
                'w-full text-left rounded-lg p-2.5 transition-all hover:shadow-sm border',
                mc.bgLight, mc.borderColor, 'hover:brightness-95'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', mc.bgDot)} />
                <span className={clsx('text-sm font-semibold', mc.textColor)}>
                  {kw.term}
                </span>
                <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ml-auto', mc.bgLight, mc.textColor)}>
                  {mc.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug line-clamp-2 pl-4">
                {kw.definition}
              </p>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            Nenhuma palavra-chave encontrada
          </div>
        )}
      </div>
    </motion.div>
  );
}
