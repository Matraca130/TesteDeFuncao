// ============================================================
// useSummaryPersistence — Auto-save/load from Supabase
// Depends on: textAnnotations, keywordMastery, personalNotes, sessionElapsed
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import * as studentApi from '@/app/services/studentApi';
import type { SummaryAnnotation } from '@/app/types/student';
import type { MasteryLevel } from '@/app/data/keywords';
import type { TextAnnotation } from './useTextAnnotations';

// ── Types ──

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SummaryPersistenceParams {
  courseId: string | undefined;
  topicId: string | undefined;
  courseName: string;
  topicTitle: string;
  textAnnotations: TextAnnotation[];
  keywordMastery: Record<string, MasteryLevel>;
  personalNotes: Record<string, string[]>;
  sessionElapsed: number;
  setTextAnnotations: (v: TextAnnotation[]) => void;
  setKeywordMastery: (v: Record<string, MasteryLevel>) => void;
  setPersonalNotes: (v: Record<string, string[]>) => void;
  setSessionElapsed: (v: number) => void;
}

// ── Hook ──

export function useSummaryPersistence({
  courseId,
  topicId,
  courseName,
  topicTitle,
  textAnnotations,
  keywordMastery,
  personalNotes,
  sessionElapsed,
  setTextAnnotations,
  setKeywordMastery,
  setPersonalNotes,
  setSessionElapsed,
}: SummaryPersistenceParams) {
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!courseId || !topicId) return;
    let cancelled = false;

    studentApi.getSummary(courseId, topicId).then((saved) => {
      if (cancelled) return;
      if (saved) {
        if (saved.annotations && Array.isArray(saved.annotations) && saved.annotations.length > 0) {
          const restored = saved.annotations.map((a: any) => ({
            id: a.id || `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            originalText: a.selectedText || a.originalText || '',
            displayText: a.selectedText || a.displayText || '',
            color: a.color || 'yellow',
            note: a.note || '',
            type: a.type || 'highlight',
            botReply: a.botReply,
            timestamp: a.timestamp || Date.now(),
          }));
          setTextAnnotations(restored);
        }
        if (saved.keywordMastery) {
          setKeywordMastery(saved.keywordMastery as Record<string, MasteryLevel>);
        }
        if (saved.keywordNotes) {
          setPersonalNotes(saved.keywordNotes);
        }
        if (saved.editTimeMinutes) {
          setSessionElapsed(saved.editTimeMinutes * 60);
        }
      }
      setSummaryLoaded(true);
    }).catch(() => {
      if (!cancelled) setSummaryLoaded(true);
    });

    return () => { cancelled = true; };
  }, [courseId, topicId]);

  const buildPayload = useCallback(() => {
    const summaryAnnotations: SummaryAnnotation[] = textAnnotations.map(a => ({
      id: a.id,
      title: a.type,
      selectedText: a.originalText,
      note: a.note,
      timestamp: new Date(a.timestamp).toLocaleString('pt-BR'),
      color: a.color,
      type: a.type,
      botReply: a.botReply,
    } as any));

    return {
      courseName,
      topicTitle,
      content: '',
      annotations: summaryAnnotations,
      keywordMastery: keywordMastery as Record<string, string>,
      keywordNotes: personalNotes,
      editTimeMinutes: Math.round(sessionElapsed / 60),
      tags: [],
      bookmarked: false,
    };
  }, [textAnnotations, keywordMastery, personalNotes, sessionElapsed, courseName, topicTitle]);

  useEffect(() => {
    if (!summaryLoaded || !courseId || !topicId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      studentApi.saveSummary(courseId, topicId, buildPayload())
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch((err) => {
          console.error('[SummaryPersistence] Auto-save error:', err);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        });
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [textAnnotations, keywordMastery, personalNotes, summaryLoaded, courseId, topicId, buildPayload]);

  useEffect(() => {
    return () => {
      if (!courseId || !topicId) return;
      studentApi.saveSummary(courseId, topicId, {
        courseName,
        topicTitle,
        content: '',
        annotations: textAnnotations.map(a => ({
          id: a.id,
          title: a.type,
          selectedText: a.originalText,
          note: a.note,
          timestamp: new Date(a.timestamp).toLocaleString('pt-BR'),
          color: a.color,
          type: a.type,
          botReply: a.botReply,
        } as any)),
        keywordMastery: keywordMastery as Record<string, string>,
        keywordNotes: personalNotes,
        editTimeMinutes: Math.round(sessionElapsed / 60),
        tags: [],
        bookmarked: false,
      }).catch(() => {});
    };
  }, []);

  return {
    summaryLoaded,
    saveStatus,
  };
}
