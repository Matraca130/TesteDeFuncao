// ══════════════════════════════════════════════════════════════
// FORMATTING TOOLBAR — text formatting, highlights, keywords, zoom
// ══════════════════════════════════════════════════════════════
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bold, Italic, Underline, Strikethrough, Highlighter,
  AlignLeft, AlignCenter, AlignRight,
  Plus, X,
  ZoomIn, ZoomOut,
  Undo2, Redo2,
  Tag, Search,
} from 'lucide-react';
import clsx from 'clsx';
import type { KeywordData } from '@/app/data/keywords';
import type { BlockType } from './types';
import { HIGHLIGHT_COLORS } from './types';
import { ToolBtn, AddBlockMenu } from './ToolbarComponents';
import { KeywordPicker } from './KeywordPicker';
import { AnnotationPanel } from './AnnotationPanel';
import type { SummaryAnnotation } from '@/app/types/student';

export interface FormattingToolbarProps {
  // Undo / Redo
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  // Formatting
  onApplyFormat: (command: string, value?: string) => void;
  onApplyHighlight: (color: string) => void;
  onRemoveHighlight: () => void;
  // Keywords
  onToggleKeyword: () => void;
  onInsertKeyword: (kw: KeywordData) => void;
  savedSelectionRef: React.MutableRefObject<Range | null>;
  // Add block
  showAddMenu: boolean;
  onToggleAddMenu: () => void;
  onAddBlockType: (type: BlockType) => void;
  onCloseAddMenu: () => void;
  // Annotations
  annotations: SummaryAnnotation[];
  onAddAnnotation: (ann: SummaryAnnotation) => void;
  onRemoveAnnotation: (id: string) => void;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  selectedText: string;
  // Zoom
  zoom: number;
  onZoomChange: (z: number) => void;
}

/** Imperative handle so parent can dismiss internal popups */
export interface FormattingToolbarHandle {
  dismissPopups: () => void;
}

export const FormattingToolbar = forwardRef<FormattingToolbarHandle, FormattingToolbarProps>(
  function FormattingToolbar(props, ref) {
  const {
    undoCount, redoCount, onUndo, onRedo,
    onApplyFormat, onApplyHighlight, onRemoveHighlight,
    onToggleKeyword, onInsertKeyword, savedSelectionRef,
    showAddMenu, onToggleAddMenu, onAddBlockType, onCloseAddMenu,
    annotations, onAddAnnotation, onRemoveAnnotation,
    showAnnotations, onToggleAnnotations, selectedText,
    zoom, onZoomChange,
  } = props;

  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showKeywordPicker, setShowKeywordPicker] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');

  // Expose dismissPopups so the parent can close internal popups on canvas click
  useImperativeHandle(ref, () => ({
    dismissPopups: () => {
      setShowHighlightPicker(false);
      setShowKeywordPicker(false);
      setKeywordSearch('');
    },
  }));

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1 flex-wrap sticky top-[52px] z-20">
      {/* Undo/Redo */}
      <ToolBtn icon={<Undo2 size={15} />} label="Desfazer" onClick={onUndo} disabled={undoCount === 0} />
      <ToolBtn icon={<Redo2 size={15} />} label="Refazer" onClick={onRedo} disabled={redoCount === 0} />
      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Text formatting */}
      <ToolBtn icon={<Bold size={15} />} label="Negrito" onClick={() => onApplyFormat('bold')} />
      <ToolBtn icon={<Italic size={15} />} label="Italico" onClick={() => onApplyFormat('italic')} />
      <ToolBtn icon={<Underline size={15} />} label="Sublinhado" onClick={() => onApplyFormat('underline')} />
      <ToolBtn icon={<Strikethrough size={15} />} label="Riscado" onClick={() => onApplyFormat('strikeThrough')} />
      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Highlight */}
      <div className="relative">
        <ToolBtn
          icon={<Highlighter size={15} />}
          label="Subrayar"
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          active={showHighlightPicker}
        />
        <AnimatePresence>
          {showHighlightPicker && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex items-center gap-1.5 z-50"
            >
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onApplyHighlight(c.css); setShowHighlightPicker(false); }}
                  className={clsx('w-7 h-7 rounded-lg transition-all hover:scale-110', c.bg, 'border border-gray-200/60 hover:ring-2', c.ring)}
                  title={c.label}
                />
              ))}
              <button
                onClick={() => { onRemoveHighlight(); setShowHighlightPicker(false); }}
                className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                title="Remover destaque"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyword — mark selected text OR open picker */}
      <ToolBtn icon={<Tag size={15} />} label="Marcar palavra-chave (Ctrl+K)" onClick={onToggleKeyword} />
      <div className="relative">
        <button
          onClick={() => {
            if (!showKeywordPicker) {
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
              }
            }
            setShowKeywordPicker(!showKeywordPicker);
            setKeywordSearch('');
          }}
          className={clsx(
            'p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1',
            showKeywordPicker ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
          title="Inserir palavra-chave do banco de dados"
        >
          <Search size={13} />
          <span className="hidden sm:inline text-[11px]">Buscar</span>
        </button>
        <AnimatePresence>
          {showKeywordPicker && (
            <KeywordPicker
              search={keywordSearch}
              onSearchChange={setKeywordSearch}
              onSelect={(kw) => {
                onInsertKeyword(kw);
                setShowKeywordPicker(false);
                setKeywordSearch('');
              }}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Alignment */}
      <ToolBtn icon={<AlignLeft size={15} />} label="Esquerda" onClick={() => onApplyFormat('justifyLeft')} />
      <ToolBtn icon={<AlignCenter size={15} />} label="Centro" onClick={() => onApplyFormat('justifyCenter')} />
      <ToolBtn icon={<AlignRight size={15} />} label="Direita" onClick={() => onApplyFormat('justifyRight')} />
      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Add block */}
      <div className="relative">
        <button
          onClick={onToggleAddMenu}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
        >
          <Plus size={14} /> Bloco
        </button>
        <AnimatePresence>
          {showAddMenu && (
            <AddBlockMenu
              onAdd={onAddBlockType}
              onClose={onCloseAddMenu}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Annotations */}
      <AnnotationPanel
        annotations={annotations}
        onAdd={onAddAnnotation}
        onRemove={onRemoveAnnotation}
        isOpen={showAnnotations}
        onToggle={onToggleAnnotations}
        selectedText={selectedText}
      />

      {/* Spacer + Zoom */}
      <div className="flex-1" />
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <button onClick={() => onZoomChange(Math.max(70, zoom - 10))} className="p-1 rounded hover:bg-gray-100 transition-colors"><ZoomOut size={14} /></button>
        <span className="w-8 text-center font-mono">{zoom}%</span>
        <button onClick={() => onZoomChange(Math.min(150, zoom + 10))} className="p-1 rounded hover:bg-gray-100 transition-colors"><ZoomIn size={14} /></button>
      </div>
    </div>
  );
});
