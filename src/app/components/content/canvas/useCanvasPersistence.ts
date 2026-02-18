// ══════════════════════════════════════════════════════════════
// CANVAS PERSISTENCE — save and DOM sync
// ══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import * as api from '@/app/services/studentApi';
import type { StudySummary, SummaryAnnotation } from '@/app/types/student';
import type { CanvasBlock, TopicOption } from './types';
import { extractKeywordsFromBlocks } from './helpers';

export interface UseCanvasPersistenceParams {
  courseId: string;
  topicId: string;
  tags: string;
  selectedTopic: TopicOption | undefined;
  existing: StudySummary | null;
  canvasOpenedAt: number;
  annotations: SummaryAnnotation[];
  keywordMastery: Record<string, string>;
  keywordNotes: Record<string, string[]>;
  blocks: CanvasBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<CanvasBlock[]>>;
  blocksRef: React.MutableRefObject<CanvasBlock[]>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSaved: (s: StudySummary) => void;
}

export function useCanvasPersistence(params: UseCanvasPersistenceParams) {
  const {
    courseId, topicId, tags, selectedTopic, existing, canvasOpenedAt,
    annotations, keywordMastery, keywordNotes,
    blocks, setBlocks, blocksRef, canvasRef, onSaved,
  } = params;

  const [saving, setSaving] = useState(false);

  const getSyncedBlocks = useCallback((): CanvasBlock[] => {
    const current = blocksRef.current.map(b => ({ ...b, meta: { ...b.meta } }));
    if (!canvasRef.current) return current;
    const editables = canvasRef.current.querySelectorAll<HTMLDivElement>('[data-block-id][contenteditable="true"]');
    if (editables.length === 0) return current;
    const updates: Record<string, string> = {};
    editables.forEach(el => {
      const blockId = el.getAttribute('data-block-id');
      if (blockId) updates[blockId] = el.innerHTML;
    });
    if (Object.keys(updates).length === 0) return current;
    return current.map(b => updates[b.id] !== undefined ? { ...b, content: updates[b.id] } : b);
  }, [blocksRef, canvasRef]);

  const handleSave = useCallback(async () => {
    if (!courseId || !topicId) return;
    const currentBlocks = getSyncedBlocks();
    setBlocks(currentBlocks);
    setSaving(true);
    try {
      const manualTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const extractedKw = extractKeywordsFromBlocks(currentBlocks);
      const tagsArray = Array.from(new Set([...manualTags, ...extractedKw]));
      const plainContent = currentBlocks
        .filter(b => b.type !== 'divider' && b.type !== 'image')
        .map(b => {
          const text = b.content.replace(/<[^>]*>/g, '').trim();
          if (b.type === 'heading') return `# ${text}`;
          if (b.type === 'subheading') return `## ${text}`;
          if (b.type === 'quote') return `> ${text}`;
          if (b.type === 'list') return text.split('\n').map(l => `- ${l.replace(/<[^>]*>/g, '').trim()}`).join('\n');
          return text;
        })
        .filter(Boolean)
        .join('\n\n');

      const sessionMinutes = Math.max(1, Math.round((Date.now() - canvasOpenedAt) / 60000));
      const prevEditTime = existing?.editTimeMinutes || 0;

      const saved = await api.saveSummary(courseId, topicId, {
        content: plainContent,
        canvasBlocks: JSON.stringify(currentBlocks),
        tags: tagsArray,
        courseName: selectedTopic?.courseName || courseId,
        topicTitle: selectedTopic?.topicTitle || topicId,
        editTimeMinutes: prevEditTime + sessionMinutes,
        annotations,
        keywordMastery,
        keywordNotes,
      });
      onSaved(saved);
    } catch (err: any) {
      console.error('[ResumoCanvas] save:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [courseId, topicId, tags, selectedTopic, onSaved, canvasOpenedAt, existing, getSyncedBlocks, setBlocks, annotations, keywordMastery, keywordNotes]);

  return { saving, handleSave, getSyncedBlocks };
}
