// ══════════════════════════════════════════════════════════════
// CANVAS SMART PASTE — multi-paragraph paste handling
// ══════════════════════════════════════════════════════════════
import { useCallback } from 'react';
import type { CanvasBlock } from './types';
import { contentToBlocks } from './helpers';

export interface UseSmartPasteParams {
  blocks: CanvasBlock[];
  pushUndo: () => void;
  setBlocks: React.Dispatch<React.SetStateAction<CanvasBlock[]>>;
  setActiveBlockId: (id: string | null) => void;
}

export function useSmartPaste(params: UseSmartPasteParams) {
  const { blocks, pushUndo, setBlocks, setActiveBlockId } = params;

  const handleSmartPaste = useCallback((blockId: string, e: React.ClipboardEvent<HTMLDivElement>) => {
    const plain = e.clipboardData.getData('text/plain');
    const paragraphs = plain.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length < 2) return;
    const newBlocks = contentToBlocks(plain);
    if (newBlocks.length < 2) return;
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;
    e.preventDefault();
    const currentHtml = e.currentTarget?.innerHTML || '';
    pushUndo();
    const currentBlock = blocks[idx];
    const textContent = currentHtml.replace(/<[^>]*>/g, '').trim();
    const isEmpty = !textContent;
    setBlocks(prev => {
      const next = [...prev];
      if (isEmpty) {
        const metaOverrides = currentBlock.meta?.columnGroup
          ? { columnGroup: currentBlock.meta.columnGroup, columnWidth: currentBlock.meta.columnWidth, columnSlot: currentBlock.meta.columnSlot }
          : {};
        const parsed = newBlocks.map(nb => ({ ...nb, meta: { ...nb.meta, ...metaOverrides } }));
        next.splice(idx, 1, ...parsed);
      } else {
        next[idx] = { ...next[idx], content: currentHtml };
        next.splice(idx + 1, 0, ...newBlocks);
      }
      return next;
    });
    setActiveBlockId(newBlocks[newBlocks.length - 1]?.id || blockId);
  }, [blocks, pushUndo, setBlocks, setActiveBlockId]);

  return { handleSmartPaste };
}
