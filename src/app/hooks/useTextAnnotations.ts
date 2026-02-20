// ============================================================
// useTextAnnotations — SACRED text annotations on summaries
// Agent 4 — BRIDGE | Phase P2 (rewired from local-only → api-sacred)
//
// SACRED ENTITY: TextAnnotation
// - deleteAnnotation = soft-delete (sets deleted_at, never hard deletes)
// - restoreAnnotation = restores from soft-delete (clears deleted_at)
//
// Phase 4: imports directly from api-sacred.ts (no barrel)
// Wrappers eliminated — calls api-sacred with correct signatures.
// ============================================================

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import type { TextAnnotation } from '../lib/types';
import {
  getTextAnnotationsBySummary,
  createTextAnnotation as sacredCreate,
  updateTextAnnotation as sacredUpdate,
  softDeleteTextAnnotation,
  restoreTextAnnotation as sacredRestore,
} from '../lib/api-sacred';

const DEFAULT_STUDENT_ID = 'demo-student-001';

// ── Types re-exported for UI convenience ────────────────────

export type AnnotationColor = 'yellow' | 'blue' | 'green' | 'pink';
export type AnnotationType = 'highlight' | 'note' | 'question';

export interface PendingAnnotation {
  text: string;
  rect: DOMRect;
}

// ── Highlighter visual styles ───────────────────────────

export const HIGHLIGHTER_STYLES: Record<AnnotationColor, CSSProperties> = {
  yellow: { background: 'linear-gradient(to bottom, transparent 40%, #fde047 40%, #fde047 85%, transparent 85%)' },
  blue:   { background: 'linear-gradient(to bottom, transparent 40%, #93c5fd 40%, #93c5fd 85%, transparent 85%)' },
  green:  { background: 'linear-gradient(to bottom, transparent 40%, #6ee7b7 40%, #6ee7b7 85%, transparent 85%)' },
  pink:   { background: 'linear-gradient(to bottom, transparent 40%, #f9a8d4 40%, #f9a8d4 85%, transparent 85%)' },
};

// ── Return type ─────────────────────────────────────────

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

// ── Hook ────────────────────────────────────────────────

export function useTextAnnotations(summaryId: string): UseTextAnnotationsReturn {
  const [allAnnotations, setAllAnnotations] = useState<TextAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const annotations = useMemo(
    () => allAnnotations.filter(a => a.deleted_at === null),
    [allAnnotations]
  );
  const deletedAnnotations = useMemo(
    () => allAnnotations.filter(a => a.deleted_at !== null),
    [allAnnotations]
  );

  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [annotationNoteInput, setAnnotationNoteInput] = useState('');
  const [annotationQuestionInput, setAnnotationQuestionInput] = useState('');
  const [annotationBotLoading, setAnnotationBotLoading] = useState(false);
  const [annotationActiveTab, setAnnotationActiveTab] = useState<AnnotationType>('highlight');
  const [annotationColor, setAnnotationColor] = useState<AnnotationColor>('yellow');

  // ── Fetch (api-sacred: getTextAnnotationsBySummary) ─────

  const fetchAnnotations = useCallback(async () => {
    if (!summaryId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTextAnnotationsBySummary(summaryId, DEFAULT_STUDENT_ID);
      setAllAnnotations(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar anotacoes';
      setError(msg);
      console.error('[useTextAnnotations] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [summaryId]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  // ── Create (api-sacred: createTextAnnotation) ──────────

  const addAnnotation = useCallback(async (
    text: string,
    type: AnnotationType,
    note: string = '',
    color: AnnotationColor = 'yellow'
  ) => {
    setError(null);
    try {
      const created = await sacredCreate(summaryId, DEFAULT_STUDENT_ID, {
        original_text: text,
        display_text: text.length > 200 ? text.slice(0, 200) + '\u2026' : text,
        color,
        note,
        type,
      });

      if (type === 'question') {
        setAnnotationBotLoading(true);
        setTimeout(async () => {
          try {
            await sacredUpdate(created.id, {
              bot_reply: `Com base no trecho selecionado, posso explicar que: "${text.slice(0, 60)}..." Este conceito e fundamental na medicina porque se relaciona com os mecanismos fisiologicos e anatomicos da regiao estudada. Deseja que eu aprofunde algum aspecto especifico?`,
            });
            await fetchAnnotations();
          } catch (e) {
            console.error('[useTextAnnotations] bot reply error:', e);
          } finally {
            setAnnotationBotLoading(false);
          }
        }, 1500);
      }

      setPendingAnnotation(null);
      setAnnotationNoteInput('');
      setAnnotationQuestionInput('');

      await fetchAnnotations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar anotacao';
      setError(msg);
      console.error('[useTextAnnotations] create error:', err);
    }
  }, [summaryId, fetchAnnotations]);

  // ── Update (api-sacred: updateTextAnnotation) ──────────

  const updateAnnotation = useCallback(async (annotationId: string, data: Partial<TextAnnotation>) => {
    setError(null);
    try {
      await sacredUpdate(annotationId, data);
      await fetchAnnotations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar anotacao';
      setError(msg);
      console.error('[useTextAnnotations] update error:', err);
    }
  }, [fetchAnnotations]);

  // ── SACRED: Soft-delete (api-sacred: softDeleteTextAnnotation) ──

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    setError(null);
    try {
      await softDeleteTextAnnotation(annotationId);
      await fetchAnnotations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao deletar anotacao';
      setError(msg);
      console.error('[useTextAnnotations] delete error:', err);
    }
  }, [fetchAnnotations]);

  // ── SACRED: Restore (api-sacred: restoreTextAnnotation) ─────

  const restoreAnnotation = useCallback(async (annotationId: string) => {
    setError(null);
    try {
      await sacredRestore(annotationId);
      await fetchAnnotations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao restaurar anotacao';
      setError(msg);
      console.error('[useTextAnnotations] restore error:', err);
    }
  }, [fetchAnnotations]);

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
    annotations,
    deletedAnnotations,
    loading,
    error,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    restoreAnnotation,
    refresh: fetchAnnotations,
    pendingAnnotation,
    setPendingAnnotation,
    annotationNoteInput,
    setAnnotationNoteInput,
    annotationQuestionInput,
    setAnnotationQuestionInput,
    annotationBotLoading,
    annotationActiveTab,
    setAnnotationActiveTab,
    annotationColor,
    setAnnotationColor,
    highlighterStyles: HIGHLIGHTER_STYLES,
  };
}
