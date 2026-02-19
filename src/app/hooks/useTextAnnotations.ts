// ============================================================
// useTextAnnotations — SACRED text annotations on summaries
// Agent 4 — BRIDGE | Phase P2 (rewired from local-only → api-client)
//
// SACRED ENTITY: TextAnnotation
// - deleteAnnotation = soft-delete (sets deleted_at, never hard deletes)
// - restoreAnnotation = restores from soft-delete (clears deleted_at)
//
// REPLACES: old useTextAnnotations.ts which used local state + hard delete
// NOW: 3-layer rule compliant (UI → hook → api-client.ts)
//
// Keeps UI-specific state (pendingAnnotation, color picker, tabs)
// that the old hook had, but CRUD now goes through api-client.ts.
// ============================================================

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import type { TextAnnotation } from '../lib/types';
import {
  getTextAnnotations,
  createTextAnnotation as apiCreateAnnotation,
  updateTextAnnotation as apiUpdateAnnotation,
  deleteTextAnnotation as apiDeleteAnnotation,
  restoreTextAnnotation as apiRestoreAnnotation,
} from '../lib/api-client';

// ── Types re-exported for UI convenience ────────────────────

export type AnnotationColor = 'yellow' | 'blue' | 'green' | 'pink';
export type AnnotationType = 'highlight' | 'note' | 'question';

export interface PendingAnnotation {
  text: string;
  rect: DOMRect;
}

// ── Highlighter visual styles (unchanged from old hook) ─────

export const HIGHLIGHTER_STYLES: Record<AnnotationColor, CSSProperties> = {
  yellow: { background: 'linear-gradient(to bottom, transparent 40%, #fde047 40%, #fde047 85%, transparent 85%)' },
  blue:   { background: 'linear-gradient(to bottom, transparent 40%, #93c5fd 40%, #93c5fd 85%, transparent 85%)' },
  green:  { background: 'linear-gradient(to bottom, transparent 40%, #6ee7b7 40%, #6ee7b7 85%, transparent 85%)' },
  pink:   { background: 'linear-gradient(to bottom, transparent 40%, #f9a8d4 40%, #f9a8d4 85%, transparent 85%)' },
};

// ── Return type ─────────────────────────────────────────────

export interface UseTextAnnotationsReturn {
  annotations: TextAnnotation[];
  deletedAnnotations: TextAnnotation[];
  loading: boolean;
  error: string | null;
  addAnnotation: (text: string, type: AnnotationType, note?: string, color?: AnnotationColor) => Promise<void>;
  updateAnnotation: (annotationId: string, data: Partial<TextAnnotation>) => Promise<void>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
  restoreAnnotation: (annotationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  pendingAnnotation: PendingAnnotation | null;
  setPendingAnnotation: (p: PendingAnnotation | null) => void;
  annotationNoteInput: string;
  setAnnotationNoteInput: (s: string) => void;
  annotationQuestionInput: string;
  setAnnotationQuestionInput: (s: string) => void;
  annotationBotLoading: boolean;
  annotationActiveTab: AnnotationType;
  setAnnotationActiveTab: (t: AnnotationType) => void;
  annotationColor: AnnotationColor;
  setAnnotationColor: (c: AnnotationColor) => void;
  highlighterStyles: Record<AnnotationColor, CSSProperties>;
}

// ── Hook ────────────────────────────────────────────────────

export function useTextAnnotations(summaryId: string): UseTextAnnotationsReturn {
  const [allAnnotations, setAllAnnotations] = useState<TextAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const annotations = useMemo(() => allAnnotations.filter(a => a.deleted_at === null), [allAnnotations]);
  const deletedAnnotations = useMemo(() => allAnnotations.filter(a => a.deleted_at !== null), [allAnnotations]);

  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [annotationNoteInput, setAnnotationNoteInput] = useState('');
  const [annotationQuestionInput, setAnnotationQuestionInput] = useState('');
  const [annotationBotLoading, setAnnotationBotLoading] = useState(false);
  const [annotationActiveTab, setAnnotationActiveTab] = useState<AnnotationType>('highlight');
  const [annotationColor, setAnnotationColor] = useState<AnnotationColor>('yellow');

  const fetchAnnotations = useCallback(async () => {
    if (!summaryId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTextAnnotations(summaryId);
      setAllAnnotations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar anotacoes');
    } finally {
      setLoading(false);
    }
  }, [summaryId]);

  useEffect(() => { fetchAnnotations(); }, [fetchAnnotations]);

  const addAnnotation = useCallback(async (text: string, type: AnnotationType, note = '', color: AnnotationColor = 'yellow') => {
    setError(null);
    try {
      const created = await apiCreateAnnotation(summaryId, {
        original_text: text,
        display_text: text.length > 200 ? text.slice(0, 200) + '\u2026' : text,
        color, note, type,
      });
      if (type === 'question') {
        setAnnotationBotLoading(true);
        setTimeout(async () => {
          try {
            await apiUpdateAnnotation(summaryId, created.id, {
              bot_reply: `Com base no trecho selecionado, posso explicar que: "${text.slice(0, 60)}..." Este conceito e fundamental na medicina.`,
            });
            await fetchAnnotations();
          } catch (e) { console.error('[useTextAnnotations] bot reply error:', e); }
          finally { setAnnotationBotLoading(false); }
        }, 1500);
      }
      setPendingAnnotation(null);
      setAnnotationNoteInput('');
      setAnnotationQuestionInput('');
      await fetchAnnotations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar anotacao');
    }
  }, [summaryId, fetchAnnotations]);

  const updateAnnotation = useCallback(async (annotationId: string, data: Partial<TextAnnotation>) => {
    setError(null);
    try { await apiUpdateAnnotation(summaryId, annotationId, data); await fetchAnnotations(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao atualizar'); }
  }, [summaryId, fetchAnnotations]);

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    setError(null);
    try { await apiDeleteAnnotation(summaryId, annotationId); await fetchAnnotations(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao deletar'); }
  }, [summaryId, fetchAnnotations]);

  const restoreAnnotation = useCallback(async (annotationId: string) => {
    setError(null);
    try { await apiRestoreAnnotation(summaryId, annotationId); await fetchAnnotations(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao restaurar'); }
  }, [summaryId, fetchAnnotations]);

  useEffect(() => {
    if (!pendingAnnotation) return;
    const handler = (e: MouseEvent) => {
      const popup = document.getElementById('text-annotation-popup');
      if (popup && !popup.contains(e.target as Node)) setPendingAnnotation(null);
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [pendingAnnotation]);

  return {
    annotations, deletedAnnotations, loading, error,
    addAnnotation, updateAnnotation, deleteAnnotation, restoreAnnotation,
    refresh: fetchAnnotations,
    pendingAnnotation, setPendingAnnotation,
    annotationNoteInput, setAnnotationNoteInput,
    annotationQuestionInput, setAnnotationQuestionInput,
    annotationBotLoading, annotationActiveTab, setAnnotationActiveTab,
    annotationColor, setAnnotationColor,
    highlighterStyles: HIGHLIGHTER_STYLES,
  };
}
