// ══════════════════════════════════════════════════════════════
// USE BLOCK OPERATIONS — Hook for block CRUD + undo/redo
// Extraido de ResumoCanvas para modularizacao
// ══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import type { BlockType, CanvasBlock } from './types';
import { uid, makeBlock } from './helpers';

export function useBlockOperations(initialBlocks: CanvasBlock[]) {
  const [blocks, setBlocks] = useState<CanvasBlock[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<CanvasBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasBlock[][]>([]);
  const [showTypeSelector, setShowTypeSelector] = useState<string | null>(null);

  // ── Undo / Redo ──
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-20), blocks.map(b => ({ ...b, meta: { ...b.meta } }))]);
    setRedoStack([]);
  }, [blocks]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    setRedoStack(r => [...r, blocks.map(b => ({ ...b, meta: { ...b.meta } }))]);
    setUndoStack(u => u.slice(0, -1));
    setBlocks(undoStack[undoStack.length - 1]);
  }, [undoStack, blocks]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    setUndoStack(u => [...u, blocks.map(b => ({ ...b, meta: { ...b.meta } }))]);
    setRedoStack(r => r.slice(0, -1));
    setBlocks(redoStack[redoStack.length - 1]);
  }, [redoStack, blocks]);

  // ── Block CRUD ──
  const updateBlock = useCallback((id: string, updates: Partial<CanvasBlock>) => {
    pushUndo();
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates, meta: { ...b.meta, ...updates.meta } } : b));
  }, [pushUndo]);

  const deleteBlock = useCallback((id: string) => {
    pushUndo();
    setBlocks(prev => {
      const deletedBlock = prev.find(b => b.id === id);
      let filtered = prev.filter(b => b.id !== id);
      if (filtered.length === 0) return [makeBlock('text')];
      if (deletedBlock?.meta?.columnGroup) {
        const groupId = deletedBlock.meta.columnGroup;
        const remaining = filtered.filter(b => b.meta?.columnGroup === groupId);
        const remainingSlots = new Set(remaining.map(b => b.meta?.columnSlot ?? 0));
        if (remainingSlots.size <= 1) {
          filtered = filtered.map(b => {
            if (b.meta?.columnGroup === groupId) {
              const { columnGroup, columnWidth, columnSlot, ...rest } = b.meta;
              return { ...b, meta: rest };
            }
            return b;
          });
        }
      }
      return filtered;
    });
    if (activeBlockId === id) setActiveBlockId(null);
  }, [pushUndo, activeBlockId]);

  const duplicateBlock = useCallback((id: string) => {
    pushUndo();
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const clone = { ...prev[idx], id: uid(), meta: { ...prev[idx].meta } };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, [pushUndo]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    pushUndo();
    setBlocks(prev => {
      const block = prev.find(b => b.id === id);
      if (!block) return prev;
      if (block.meta?.columnGroup) {
        const gid = block.meta.columnGroup;
        const slot = block.meta.columnSlot ?? 0;
        const slotIndices = prev.reduce<number[]>((acc, b, i) => {
          if (b.meta?.columnGroup === gid && (b.meta?.columnSlot ?? 0) === slot) acc.push(i);
          return acc;
        }, []);
        const posInSlot = slotIndices.indexOf(prev.indexOf(block));
        const targetPosInSlot = posInSlot + dir;
        if (posInSlot < 0 || targetPosInSlot < 0 || targetPosInSlot >= slotIndices.length) return prev;
        const next = [...prev];
        [next[slotIndices[posInSlot]], next[slotIndices[targetPosInSlot]]] = [next[slotIndices[targetPosInSlot]], next[slotIndices[posInSlot]]];
        return next;
      }
      const idx = prev.indexOf(block);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, [pushUndo]);

  /** Creates a block and inserts it. Returns the new block so the caller can trigger side-effects (e.g. image picker). */
  const addBlockAt = useCallback((type: BlockType, afterIndex: number, columnMeta?: { columnGroup: string; columnSlot: number; columnWidth: number }): CanvasBlock => {
    pushUndo();
    const newBlock = makeBlock(type, '', columnMeta);
    setBlocks(prev => { const next = [...prev]; next.splice(afterIndex + 1, 0, newBlock); return next; });
    setActiveBlockId(newBlock.id);
    return newBlock;
  }, [pushUndo]);

  const addBlockBeside = useCallback((blockId: string, hintWidth?: number) => {
    pushUndo();
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      if (idx < 0) return prev;
      const block = prev[idx];
      const groupId = block.meta?.columnGroup || uid();
      const existingGroupBlocks = prev.filter(b => b.meta?.columnGroup === groupId);
      const isNewGroup = existingGroupBlocks.length === 0;
      const existingSlots = new Set(existingGroupBlocks.map(b => b.meta?.columnSlot ?? 0));
      if (isNewGroup) existingSlots.add(block.meta?.columnSlot ?? 0);
      const slotCount = existingSlots.size + 1;
      if (slotCount > 3) return prev;
      const newSlot = Math.max(...existingSlots, 0) + 1;
      const currentSlot = block.meta?.columnSlot ?? 0;
      const sourceWidth = isNewGroup && hintWidth && slotCount === 2 ? Math.max(15, Math.min(85, hintWidth)) : Math.floor(100 / slotCount);
      const newWidth = isNewGroup && hintWidth && slotCount === 2 ? 100 - sourceWidth : Math.floor(100 / slotCount);
      const newBlock = makeBlock('text', '', { columnGroup: groupId, columnWidth: newWidth, columnSlot: newSlot });
      const next = prev.map(b => {
        if (b.id === blockId) return { ...b, meta: { ...b.meta, columnGroup: groupId, columnSlot: currentSlot, columnWidth: sourceWidth } };
        if (b.meta?.columnGroup === groupId) return { ...b, meta: { ...b.meta, columnWidth: Math.floor(100 / slotCount) } };
        return b;
      });
      const lastIdx = next.reduce((last, b, i) => b.meta?.columnGroup === groupId ? i : last, idx);
      next.splice(lastIdx + 1, 0, newBlock);
      setActiveBlockId(newBlock.id);
      return next;
    });
  }, [pushUndo]);

  const ungroupBlock = useCallback((blockId: string) => {
    pushUndo();
    setBlocks(prev => {
      const block = prev.find(b => b.id === blockId);
      if (!block?.meta?.columnGroup) return prev;
      const groupId = block.meta.columnGroup;
      return prev.map(b => {
        if (b.meta?.columnGroup === groupId) {
          const { columnGroup, columnWidth, columnSlot, ...restMeta } = b.meta;
          return { ...b, meta: restMeta };
        }
        return b;
      });
    });
  }, [pushUndo]);

  const changeBlockType = useCallback((blockId: string, newType: BlockType) => {
    pushUndo();
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const newMeta = { ...b.meta };
      if (newType === 'callout' && !newMeta.calloutColor) newMeta.calloutColor = 'teal';
      if (newType === 'list' && !newMeta.listStyle) newMeta.listStyle = 'bullet';
      if (newType === 'image') { newMeta.imageWidth = 100; newMeta.imageFit = 'cover'; }
      return { ...b, type: newType, meta: newMeta };
    }));
    setShowTypeSelector(null);
  }, [pushUndo]);

  const resizeColumn = useCallback((blockId: string, newWidth: number) => {
    setBlocks(prev => {
      const block = prev.find(b => b.id === blockId);
      if (!block?.meta?.columnGroup) return prev;
      const groupId = block.meta.columnGroup;
      const mySlot = block.meta?.columnSlot ?? 0;
      const allInGroup = prev.filter(b => b.meta?.columnGroup === groupId);
      const slots = new Set(allInGroup.map(b => b.meta?.columnSlot ?? 0));
      const otherSlotCount = slots.size - 1;
      if (otherSlotCount <= 0) return prev;
      const perOther = Math.floor((100 - newWidth) / otherSlotCount);
      return prev.map(b => {
        if (b.meta?.columnGroup !== groupId) return b;
        const bSlot = b.meta?.columnSlot ?? 0;
        if (bSlot === mySlot) return { ...b, meta: { ...b.meta, columnWidth: newWidth } };
        return { ...b, meta: { ...b.meta, columnWidth: perOther } };
      });
    });
  }, []);

  return {
    blocks, setBlocks,
    activeBlockId, setActiveBlockId,
    undoStack, redoStack,
    showTypeSelector, setShowTypeSelector,
    pushUndo, undo, redo,
    updateBlock, deleteBlock, duplicateBlock, moveBlock,
    addBlockAt, addBlockBeside, ungroupBlock, changeBlockType, resizeColumn,
  };
}
