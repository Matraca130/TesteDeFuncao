// ════════════════════════════════════════════════════════════════
// IMAGE COMPONENTS — ImagePickerModal, ImageResizeHandle, ColumnResizeHandle
// ════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { headingStyle, components } from '@/app/design-system';
import { CARD, SAMPLE_IMAGES } from './types';

// ── Image Picker Modal ──
export function ImagePickerModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [customUrl, setCustomUrl] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={clsx(CARD, 'w-full max-w-lg p-6')}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900" style={headingStyle}>Adicionar Imagem</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* URL input */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">URL da Imagem</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <button
              onClick={() => { if (customUrl) { onSelect(customUrl); } }}
              disabled={!customUrl}
              className={`${components.buttonPrimary.base} px-4 py-2 text-xs ${!customUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Usar
            </button>
          </div>
        </div>

        {/* Sample images */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Imagens de Medicina</label>
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_IMAGES.map(img => (
              <button
                key={img.label}
                onClick={() => onSelect(img.url)}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] border-2 border-transparent hover:border-teal-400 transition-all"
              >
                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] text-white font-semibold">{img.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Image Resize Handle (drag edges) ──
export function ImageResizeHandle({ side, block, onUpdate }: {
  side: 'left' | 'right';
  block: { meta?: { imageWidth?: number; [k: string]: any } };
  onUpdate: (u: { meta: any }) => void;
}) {
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = block.meta?.imageWidth || 100;
    const imgContainer = handleRef.current?.closest('[class*="relative"]');
    const canvasCard = imgContainer?.closest('[class*="min-h-"]');
    const parentWidth = canvasCard?.clientWidth || 800;

    const onMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const direction = side === 'right' ? 1 : -1;
      const deltaPercent = (deltaX * direction / parentWidth) * 200;
      const newWidth = Math.max(15, Math.min(100, startWidth + deltaPercent));
      onUpdate({ meta: { ...block.meta, imageWidth: Math.round(newWidth) } });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [block.meta, onUpdate, side]);

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={clsx(
        'absolute top-1/2 -translate-y-1/2 w-4 h-16 cursor-col-resize flex items-center justify-center group/resize z-10',
        side === 'left' ? '-left-2' : '-right-2'
      )}
    >
      <div className="w-1 h-10 rounded-full bg-gray-300/60 group-hover/resize:bg-teal-400 transition-colors" />
    </div>
  );
}

// ── Column Resize Handle ──
export function ColumnResizeHandle({ blockId, currentWidth, onResize }: {
  blockId: string; currentWidth: number; onResize: (w: number) => void;
}) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const startX = e.clientX;
    const startWidth = currentWidth;
    const parentEl = handleRef.current?.parentElement?.parentElement;
    const parentWidth = parentEl?.offsetWidth || 800;

    const onMouseMove = (ev: MouseEvent) => {
      const deltaPercent = ((ev.clientX - startX) / parentWidth) * 100;
      const newWidth = Math.max(20, Math.min(80, startWidth + deltaPercent));
      onResize(Math.round(newWidth));
    };
    const onMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [currentWidth, onResize]);

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={clsx(
        'absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center group/handle translate-x-1/2',
        dragging ? 'bg-teal-100/30' : 'hover:bg-teal-50/50'
      )}
    >
      <div className={clsx(
        'w-1 h-10 rounded-full transition-colors',
        dragging ? 'bg-teal-500' : 'bg-gray-200 group-hover/handle:bg-teal-400'
      )} />
    </div>
  );
}
