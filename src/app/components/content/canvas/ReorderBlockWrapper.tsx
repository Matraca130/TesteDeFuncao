// ══════════════════════════════════════════════════════════════
// REORDER BLOCK WRAPPER — Editable block with controls
// ══════════════════════════════════════════════════════════════
import React, { useRef, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  ImageIcon, Plus,
  ReplaceAll, Crop, MoveHorizontal, MoveVertical, Maximize2,
} from 'lucide-react';
import { headingStyle } from '@/app/design-system';
import type { BlockType, CanvasBlock } from './types';
import { CALLOUT_STYLES, IMAGE_PRESETS, ASPECT_RATIO_PRESETS } from './types';
import { QuickDeleteButton, DragHandle, BlockActions } from './BlockActions';
import { BlockTypeSelector } from './ToolbarComponents';
import { ImageResizeHandle } from './ImageComponents';

interface ReorderBlockWrapperProps {
  block: CanvasBlock;
  isActive: boolean;
  onFocus: () => void;
  onUpdate: (u: Partial<CanvasBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddBelow: () => void;
  onAddBeside: (hintWidth?: number) => void;
  onUngroup: () => void;
  onPickImage: () => void;
  onChangeType: (t: BlockType) => void;
  showTypeSelector: boolean;
  onToggleTypeSelector: () => void;
  onResizeColumn: (w: number) => void;
  isFirst: boolean;
  isLast: boolean;
  isInColumn: boolean;
  columnCount: number;
  onSmartPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
}

export function ReorderBlockWrapper({
  block, isActive, onFocus, onUpdate, onDelete, onDuplicate,
  onMoveUp, onMoveDown, onAddBelow, onAddBeside, onUngroup,
  onPickImage, onChangeType, showTypeSelector, onToggleTypeSelector,
  onResizeColumn, isFirst, isLast, isInColumn, columnCount, onSmartPaste,
}: ReorderBlockWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback(() => {
    if (contentRef.current) {
      const textOnly = contentRef.current.innerHTML.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').replace(/<[^>]*>/g, '').trim();
      if (!textOnly) contentRef.current.innerHTML = '';
      onUpdate({ content: contentRef.current.innerHTML });
    }
  }, [onUpdate]);

  // Shared actions bar
  const actionsBar = isActive ? (
    <span className="relative">
      <AnimatePresence>{showTypeSelector && <BlockTypeSelector currentType={block.type} onChange={onChangeType} onClose={onToggleTypeSelector} />}</AnimatePresence>
      <BlockActions onDelete={onDelete} onDuplicate={onDuplicate} onMoveUp={onMoveUp} onMoveDown={onMoveDown} onAddBelow={onAddBelow} onAddBeside={onAddBeside} onUngroup={onUngroup} isFirst={isFirst} isLast={isLast} isInColumn={isInColumn} onToggleTypeSelector={onToggleTypeSelector} />
    </span>
  ) : null;

  const dragHandle = !isInColumn ? <DragHandle /> : null;

  // ── DIVIDER ──
  if (block.type === 'divider') {
    return (
      <div
        className={clsx('group relative py-5', isActive && 'ring-1 ring-teal-300/30 rounded-lg bg-teal-50/5')}
        onClick={(e) => { e.stopPropagation(); onFocus(); }}
      >
        <QuickDeleteButton onDelete={onDelete} />
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
        {actionsBar}
        {dragHandle}
      </div>
    );
  }

  // ── IMAGE (enhanced) ──
  if (block.type === 'image') {
    const imgWidth = block.meta?.imageWidth || 100;
    const showAddZone = !isInColumn && !!block.content && imgWidth < 100;
    const aspectRatio = block.meta?.imageAspectRatio || 'auto';
    const maxHeight = block.meta?.imageMaxHeight || 0;
    const hasRatio = aspectRatio !== 'auto';
    const imgFrameStyle: React.CSSProperties = {};
    if (hasRatio) imgFrameStyle.aspectRatio = aspectRatio;
    if (maxHeight > 0) imgFrameStyle.maxHeight = `${maxHeight}px`;

    return (
      <div
        className={clsx('group relative py-2.5 rounded-lg transition-all', isActive && 'ring-1 ring-teal-300/30 bg-teal-50/5')}
        onClick={(e) => { e.stopPropagation(); onFocus(); }}
      >
        <QuickDeleteButton onDelete={onDelete} />
        {block.content ? (
          <div className={clsx(showAddZone && 'flex gap-3 items-stretch')}>
            <div className="relative min-w-0 flex-shrink-0" style={{ width: `${imgWidth}%`, margin: showAddZone ? undefined : (imgWidth < 100 ? '0 auto' : undefined) }}>
              <div className="overflow-hidden rounded-xl" style={imgFrameStyle}>
                <img
                  src={block.content}
                  alt={block.meta?.imageCaption || 'Imagem do resumo'}
                  className={clsx('w-full rounded-xl', hasRatio && 'h-full', block.meta?.imageFit === 'contain' ? 'object-contain bg-gray-50' : 'object-cover')}
                  style={!hasRatio && maxHeight <= 0 ? { maxHeight: '480px' } : undefined}
                  draggable={false}
                />
              </div>
              {isActive ? (
                <input
                  type="text"
                  value={block.meta?.imageCaption || ''}
                  onChange={e => onUpdate({ meta: { ...block.meta, imageCaption: e.target.value } })}
                  placeholder="Adicionar legenda da imagem..."
                  className="w-full text-center text-[13px] text-gray-500 italic mt-2.5 px-2 py-1 bg-transparent border-b border-dashed border-gray-200 focus:border-teal-400 focus:outline-none focus:text-gray-700 placeholder:text-gray-300 transition-colors"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                block.meta?.imageCaption ? <p className="text-center text-[13px] text-gray-400 italic mt-2.5 select-none">{block.meta.imageCaption}</p> : null
              )}
              {isActive && (
                <div className="mt-3 space-y-2.5">
                  {/* Size presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1">Largura:</span>
                    {IMAGE_PRESETS.map(p => (
                      <button key={p.value} onClick={(e) => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, imageWidth: p.value } }); }}
                        className={clsx('px-2 py-1 text-[10px] font-semibold rounded-md transition-all', (block.meta?.imageWidth || 100) === p.value ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200')}
                      >{p.label}</button>
                    ))}
                    <div className="ml-auto">
                      <button onClick={(e) => { e.stopPropagation(); onPickImage(); }} className="px-2 py-1 text-[10px] font-semibold rounded-md bg-gray-100 text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all flex items-center gap-1" title="Trocar imagem">
                        <ReplaceAll size={10} /> Trocar
                      </button>
                    </div>
                  </div>
                  {/* Width slider */}
                  <div className="flex items-center gap-2">
                    <MoveHorizontal size={12} className="text-gray-300" />
                    <input type="range" min={15} max={100} value={block.meta?.imageWidth || 100}
                      onChange={e => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, imageWidth: Number(e.target.value) } }); }}
                      className="flex-1 h-1.5 accent-teal-500 cursor-pointer" onClick={e => e.stopPropagation()} />
                    <span className="text-[10px] text-gray-400 font-mono w-7 text-right">{block.meta?.imageWidth || 100}%</span>
                  </div>
                  {/* Aspect ratio */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1">Proporcao:</span>
                    {ASPECT_RATIO_PRESETS.map(p => (
                      <button key={p.value} onClick={(e) => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, imageAspectRatio: p.value } }); }}
                        className={clsx('px-2 py-1 text-[10px] font-semibold rounded-md transition-all', (block.meta?.imageAspectRatio || 'auto') === p.value ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200')}
                      >{p.label}</button>
                    ))}
                  </div>
                  {/* Height slider */}
                  <div className="flex items-center gap-2">
                    <MoveVertical size={12} className="text-gray-300" />
                    <input type="range" min={80} max={600} value={maxHeight > 0 ? maxHeight : 600}
                      onChange={e => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, imageMaxHeight: Number(e.target.value) } }); }}
                      className="flex-1 h-1.5 accent-teal-500 cursor-pointer" onClick={e => e.stopPropagation()} />
                    <button onClick={(e) => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, imageMaxHeight: 0 } }); }}
                      className={clsx('px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all', maxHeight <= 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200')}>Auto</button>
                    {maxHeight > 0 && <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{maxHeight}px</span>}
                  </div>
                  {/* Fit mode */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1">Ajuste:</span>
                    <button onClick={(e) => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, imageFit: 'cover' } }); }}
                      className={clsx('px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1', block.meta?.imageFit !== 'contain' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600')}>
                      <Crop size={10} /> Cobrir
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, imageFit: 'contain' } }); }}
                      className={clsx('px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1', block.meta?.imageFit === 'contain' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600')}>
                      <Maximize2 size={10} /> Conter
                    </button>
                  </div>
                </div>
              )}
              {isActive && (
                <>
                  <ImageResizeHandle side="left" block={block} onUpdate={onUpdate} />
                  <ImageResizeHandle side="right" block={block} onUpdate={onUpdate} />
                </>
              )}
            </div>
            {showAddZone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentWidth = imgWidth;
                  onUpdate({ meta: { ...block.meta, imageWidth: 100 } });
                  onAddBeside(currentWidth);
                }}
                className="flex-1 min-h-[100px] border-2 border-dashed border-gray-200/70 rounded-xl text-gray-300 hover:text-teal-500 hover:border-teal-400 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={22} className="opacity-60" />
                <span className="text-xs font-medium opacity-80">Adicionar bloco</span>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onPickImage}
            className="w-full py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-teal-500 hover:border-teal-300 transition-all flex flex-col items-center gap-2"
          >
            <ImageIcon size={28} />
            <span className="text-sm font-medium">Clique para adicionar imagem</span>
          </button>
        )}
        {block.meta?.imageCaption && !isActive && (
          <p className={clsx('text-xs text-gray-400 italic mt-2', showAddZone ? 'text-left' : 'text-center')}>{block.meta.imageCaption}</p>
        )}
        {actionsBar}
        {dragHandle}
      </div>
    );
  }

  // ── CALLOUT ──
  if (block.type === 'callout') {
    const style = CALLOUT_STYLES[block.meta?.calloutColor || 'teal'];
    return (
      <div className={clsx('group relative py-1.5 rounded-lg transition-all', isActive && 'ring-1 ring-teal-300/30 bg-teal-50/5')}
        onClick={(e) => { e.stopPropagation(); onFocus(); }}>
        <QuickDeleteButton onDelete={onDelete} />
        <div className={clsx('border-l-4 rounded-r-xl p-5', style.border, style.bg)}>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5 shrink-0">{style.icon}</span>
            <div ref={contentRef} data-block-id={block.id} contentEditable suppressContentEditableWarning
              onBlur={handleBlur} onPaste={onSmartPaste}
              dangerouslySetInnerHTML={{ __html: block.content }}
              className="flex-1 text-[15px] text-gray-700 leading-[1.75] focus:outline-none min-h-[24px]"
              data-placeholder="Nota importante..." />
          </div>
          {isActive && (
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200/40">
              <span className="text-[10px] text-gray-400 mr-1">Cor:</span>
              {Object.keys(CALLOUT_STYLES).map(color => (
                <button key={color} onClick={(e) => { e.stopPropagation(); onUpdate({ meta: { ...block.meta, calloutColor: color as any } }); }}
                  className={clsx('w-5 h-5 rounded-md border transition-all', CALLOUT_STYLES[color].bg,
                    block.meta?.calloutColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'border-gray-200/60 hover:scale-110')} />
              ))}
            </div>
          )}
        </div>
        {actionsBar}
        {dragHandle}
      </div>
    );
  }

  // ── QUOTE ──
  if (block.type === 'quote') {
    return (
      <div className={clsx('group relative py-1.5 rounded-lg transition-all', isActive && 'ring-1 ring-teal-300/30 bg-teal-50/5')}
        onClick={(e) => { e.stopPropagation(); onFocus(); }}>
        <QuickDeleteButton onDelete={onDelete} />
        <div className="border-l-4 border-gray-300 pl-5 py-2">
          <div ref={contentRef} data-block-id={block.id} contentEditable suppressContentEditableWarning
            onBlur={handleBlur} onPaste={onSmartPaste}
            dangerouslySetInnerHTML={{ __html: block.content }}
            className="text-[15px] text-gray-500 italic leading-[1.75] focus:outline-none min-h-[24px]"
            data-placeholder="Citacao ou referencia..." />
        </div>
        {actionsBar}
        {dragHandle}
      </div>
    );
  }

  // ── LIST ──
  if (block.type === 'list') {
    return (
      <div className={clsx('group relative py-1.5 rounded-lg transition-all', isActive && 'ring-1 ring-teal-300/30 bg-teal-50/5')}
        onClick={(e) => { e.stopPropagation(); onFocus(); }}>
        <QuickDeleteButton onDelete={onDelete} />
        <div ref={contentRef} data-block-id={block.id} contentEditable suppressContentEditableWarning
          onBlur={handleBlur} onPaste={onSmartPaste}
          dangerouslySetInnerHTML={{
            __html: !block.content ? '' :
              block.content.includes('<li>') ? block.content :
              block.meta?.listStyle === 'numbered'
                ? `<ol class="list-decimal ml-5 space-y-1.5">${block.content.split('\n').filter(l => l.trim()).map(l => `<li class="text-[15px] text-gray-700 leading-[1.75]">${l.trim()}</li>`).join('')}</ol>`
                : `<ul class="list-disc ml-5 space-y-1.5">${block.content.split('\n').filter(l => l.trim()).map(l => `<li class="text-[15px] text-gray-700 leading-[1.75]">${l.trim()}</li>`).join('')}</ul>`
          }}
          className="text-[15px] text-gray-700 leading-[1.75] focus:outline-none min-h-[24px] [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:space-y-1.5"
          data-placeholder="Digite os itens da lista..." />
        {actionsBar}
        {dragHandle}
      </div>
    );
  }

  // ── HEADING ──
  if (block.type === 'heading') {
    return (
      <div className={clsx('group relative py-2 rounded-lg transition-all', isActive && 'ring-1 ring-teal-300/30 bg-teal-50/5')}
        onClick={(e) => { e.stopPropagation(); onFocus(); }}>
        <QuickDeleteButton onDelete={onDelete} />
        <div ref={contentRef} data-block-id={block.id} contentEditable suppressContentEditableWarning
          onBlur={handleBlur} onFocus={onFocus} onPaste={onSmartPaste}
          dangerouslySetInnerHTML={{ __html: block.content }}
          className="text-[26px] font-bold text-gray-900 leading-tight focus:outline-none min-h-[32px] px-1"
          style={headingStyle} data-placeholder="Titulo..." />
        <div className="mt-1.5 ml-1 h-[2px] w-14 rounded-full bg-teal-400/50" />
        {actionsBar}
        {dragHandle}
      </div>
    );
  }

  // ── SUBHEADING ──
  if (block.type === 'subheading') {
    return (
      <div className={clsx('group relative py-1.5 rounded-lg transition-all', isActive && 'ring-1 ring-teal-300/30 bg-teal-50/5')}
        onClick={(e) => { e.stopPropagation(); onFocus(); }}>
        <QuickDeleteButton onDelete={onDelete} />
        <div ref={contentRef} data-block-id={block.id} contentEditable suppressContentEditableWarning
          onBlur={handleBlur} onFocus={onFocus} onPaste={onSmartPaste}
          dangerouslySetInnerHTML={{ __html: block.content }}
          className="text-[19px] font-semibold text-gray-800 leading-snug focus:outline-none min-h-[28px] px-1"
          style={headingStyle} data-placeholder="Subtitulo..." />
        {actionsBar}
        {dragHandle}
      </div>
    );
  }

  // ── TEXT (body paragraph) ──
  return (
    <div className={clsx('group relative py-1 rounded-lg transition-all', isActive && 'ring-1 ring-teal-300/30 bg-teal-50/5')}
      onClick={(e) => { e.stopPropagation(); onFocus(); }}>
      <QuickDeleteButton onDelete={onDelete} />
      <div ref={contentRef} data-block-id={block.id} contentEditable suppressContentEditableWarning
        onBlur={handleBlur} onFocus={onFocus} onPaste={onSmartPaste}
        dangerouslySetInnerHTML={{ __html: block.content }}
        className="text-[15px] text-gray-700 leading-[1.75] focus:outline-none min-h-[24px] px-1"
        data-placeholder="Escreva aqui..." />
      {actionsBar}
      {dragHandle}
    </div>
  );
}
