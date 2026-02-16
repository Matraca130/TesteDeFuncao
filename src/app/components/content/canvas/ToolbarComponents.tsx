// ════════════════════════════════════════════════════════════════
// TOOLBAR COMPONENTS — ToolBtn, AddBlockMenu, BlockTypeSelector
// ════════════════════════════════════════════════════════════════
import React from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import {
  Type, Heading1, Heading2, ImageIcon, Quote, Minus, List,
  BookOpen,
} from 'lucide-react';
import type { BlockType } from './types';

// ── Generic toolbar button ──
export function ToolBtn({ icon, label, onClick, active, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'p-1.5 rounded-lg transition-all',
        active ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
      title={label}
    >
      {icon}
    </button>
  );
}

// ── Add Block Menu ──
const addBlockItems: { type: BlockType; icon: React.ReactNode; label: string; desc: string }[] = [
  { type: 'heading', icon: <Heading1 size={18} />, label: 'Titulo', desc: 'Secao principal' },
  { type: 'subheading', icon: <Heading2 size={18} />, label: 'Subtitulo', desc: 'Subsecao' },
  { type: 'text', icon: <Type size={18} />, label: 'Texto', desc: 'Paragrafo livre' },
  { type: 'list', icon: <List size={18} />, label: 'Lista', desc: 'Bullet points' },
  { type: 'callout', icon: <Quote size={18} />, label: 'Destaque', desc: 'Nota colorida' },
  { type: 'quote', icon: <BookOpen size={18} />, label: 'Citacao', desc: 'Referencia' },
  { type: 'image', icon: <ImageIcon size={18} />, label: 'Imagem', desc: 'Foto ou diagrama' },
  { type: 'divider', icon: <Minus size={18} />, label: 'Divisor', desc: 'Linha separadora' },
];

export function AddBlockMenu({ onAdd, onClose }: { onAdd: (type: BlockType) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50 w-56"
    >
      {addBlockItems.map(item => (
        <button
          key={item.type}
          onClick={() => { onAdd(item.type); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors group"
        >
          <span className="p-1.5 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
            {item.icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
            <p className="text-[10px] text-gray-400">{item.desc}</p>
          </div>
        </button>
      ))}
    </motion.div>
  );
}

// ── Block Type Selector (inline) ──
const TYPE_OPTIONS: { type: BlockType; icon: React.ReactNode; label: string }[] = [
  { type: 'heading', icon: <Heading1 size={14} />, label: 'Titulo' },
  { type: 'subheading', icon: <Heading2 size={14} />, label: 'Subtitulo' },
  { type: 'text', icon: <Type size={14} />, label: 'Texto' },
  { type: 'list', icon: <List size={14} />, label: 'Lista' },
  { type: 'callout', icon: <Quote size={14} />, label: 'Destaque' },
  { type: 'quote', icon: <BookOpen size={14} />, label: 'Citacao' },
];

export function BlockTypeSelector({ currentType, onChange, onClose }: {
  currentType: BlockType; onChange: (t: BlockType) => void; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      className="absolute left-0 bottom-full mb-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 flex items-center gap-0.5"
      onClick={e => e.stopPropagation()}
    >
      {TYPE_OPTIONS.map(opt => (
        <button
          key={opt.type}
          onClick={() => { onChange(opt.type); onClose(); }}
          className={clsx(
            'p-1.5 rounded-lg transition-all text-xs flex items-center gap-1',
            currentType === opt.type
              ? 'bg-teal-100 text-teal-700 font-semibold'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          )}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </motion.div>
  );
}
