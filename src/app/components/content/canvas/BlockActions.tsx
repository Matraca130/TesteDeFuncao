// ════════════════════════════════════════════════════════════════
// BLOCK ACTIONS — QuickDeleteButton, DragHandle, BlockActions
// ════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import {
  Type, ChevronUp, ChevronDown, Copy, Plus, Trash2,
  GripVertical, Columns2, Maximize2, X,
} from 'lucide-react';

// ── Quick Delete Button (hover, two-click confirmation) ──
export function QuickDeleteButton({ onDelete }: { onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (armed) {
      onDelete();
    } else {
      setArmed(true);
      timerRef.current = setTimeout(() => setArmed(false), 2000);
    }
  }, [armed, onDelete]);

  return (
    <button
      onClick={handleClick}
      onMouseLeave={() => { setArmed(false); if (timerRef.current) clearTimeout(timerRef.current); }}
      className={clsx(
        'absolute -top-2 -right-2 z-10 rounded-full border shadow-sm transition-all',
        'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100',
        armed
          ? 'p-0.5 px-2 bg-red-500 border-red-400 text-white hover:bg-red-600'
          : 'p-1 bg-white border-gray-200 text-gray-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50',
      )}
      title={armed ? 'Clique de novo para confirmar' : 'Deletar bloco'}
    >
      {armed ? <span className="text-[10px] font-semibold leading-none">Deletar?</span> : <X size={12} />}
    </button>
  );
}

// ── Drag Handle ──
export function DragHandle() {
  return (
    <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-300">
      <GripVertical size={16} />
    </div>
  );
}

// ── Block Actions (floating sidebar) ──
export function BlockActions({ onDelete, onDuplicate, onMoveUp, onMoveDown, onAddBelow, onAddBeside, onUngroup, isFirst, isLast, isInColumn, onToggleTypeSelector }: {
  onDelete: () => void; onDuplicate: () => void; onMoveUp: () => void; onMoveDown: () => void;
  onAddBelow: () => void; onAddBeside: (hintWidth?: number) => void; onUngroup: () => void;
  isFirst: boolean; isLast: boolean; isInColumn: boolean; onToggleTypeSelector: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      className={clsx('absolute top-0 flex flex-col items-center gap-0.5', isInColumn ? '-right-8' : '-right-11')}
    >
      <SmallBtn icon={<Type size={12} />} onClick={onToggleTypeSelector} title="Tipo do bloco" />
      <SmallBtn icon={<ChevronUp size={12} />} onClick={onMoveUp} disabled={isFirst} title="Mover acima" />
      <SmallBtn icon={<ChevronDown size={12} />} onClick={onMoveDown} disabled={isLast} title="Mover abaixo" />
      <SmallBtn icon={<Copy size={12} />} onClick={onDuplicate} title="Duplicar" />
      <SmallBtn icon={<Plus size={12} />} onClick={onAddBelow} title="Adicionar abaixo" />
      <SmallBtn icon={<Columns2 size={12} />} onClick={onAddBeside} title="Adicionar ao lado" />
      {isInColumn && (
        <SmallBtn icon={<Maximize2 size={12} />} onClick={onUngroup} title="Desagrupar colunas" />
      )}
      <SmallBtn icon={<Trash2 size={12} />} onClick={onDelete} title="Deletar" danger />
    </motion.div>
  );
}

function SmallBtn({ icon, onClick, disabled, title, danger }: {
  icon: React.ReactNode; onClick: () => void; disabled?: boolean; title: string; danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className={clsx(
        'p-1 rounded-md transition-all',
        disabled && 'opacity-20 cursor-not-allowed',
        danger ? 'text-gray-300 hover:text-red-500 hover:bg-red-50' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
      )}
      title={title}
    >
      {icon}
    </button>
  );
}
