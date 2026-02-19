import { useState, useEffect, useRef, useCallback } from 'react';
import * as studentApi from '@/app/services/studentApi';
import type { SummaryAnnotation } from '@/app/types/student';
import type { TextAnnotation, SaveStatus } from './types';
import type { MasteryLevel } from '@/app/data/keywords';

interface PersistenceConfig {
  courseId: string | undefined;
  courseName: string;
  topicId: string | undefined;
  topicTitle: string;
}

interface PersistenceState {
  textAnnotations: TextAnnotation[];
  keywordMastery: Record<string, MasteryLevel>;
  personalNotes: Record<string, string[]>;
  sessionElapsed: number;
}

interface PersistenceCallbacks {
  setTextAnnotations: (anns: TextAnnotation[]) => void;
  setKeywordMastery: (m: Record<string, MasteryLevel>) => void;
  setPersonalNotes: (n: Record<string, string[]>) => void;
  setSessionElapsed: (s: number) => void;
}

/**
 * Hook for loading and auto-saving summary data to Supabase.
 */
export function useSummaryPersistence(
  config: PersistenceConfig,
  state: PersistenceState,
  callbacks: PersistenceCallbacks,
) {
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { courseId, courseName, topicId, topicTitle } = config;
  const { textAnnotations, keywordMastery, personalNotes, sessionElapsed } = state;

  // ── Build payload ──
  const buildPayload = useCallback(() => ({
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
    } as any)) as SummaryAnnotation[],
    keywordMastery: keywordMastery as Record<string, string>,
    keywordNotes: personalNotes,
    editTimeMinutes: Math.round(sessionElapsed / 60),
    tags: [],
    bookmarked: false,
  }), [textAnnotations, keywordMastery, personalNotes, sessionElapsed, courseName, topicTitle]);

  // ── Load on mount ──
  useEffect(() => {
    if (!courseId || !topicId) return;
    let cancelled = false;

    studentApi.getSummary(courseId, topicId).then((saved) => {
      if (cancelled) return;
      if (saved) {
        if (saved.annotations?.length) {
          callbacks.setTextAnnotations(
            saved.annotations.map((a: any) => ({
              id: a.id || `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              originalText: a.selectedText || a.originalText || '',
              displayText: a.selectedText || a.displayText || '',
              color: a.color || 'yellow',
              note: a.note || '',
              type: a.type || 'highlight',
              botReply: a.botReply,
              timestamp: a.timestamp || Date.now(),
            })),
          );
        }
        if (saved.keywordMastery) {
          callbacks.setKeywordMastery(saved.keywordMastery as Record<string, MasteryLevel>);
        }
        if (saved.keywordNotes) {
          callbacks.setPersonalNotes(saved.keywordNotes);
        }
        if (saved.editTimeMinutes) {
          callbacks.setSessionElapsed(saved.editTimeMinutes * 60);
        }
      }
      setSummaryLoaded(true);
    }).catch(() => {
      if (!cancelled) setSummaryLoaded(true);
    });

    return () => { cancelled = true; };
  }, [courseId, topicId]);

  // ── Auto-save with 2s debounce ──
  useEffect(() => {
    if (!summaryLoaded || !courseId || !topicId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      studentApi.saveSummary(courseId, topicId, buildPayload())
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch((err) => {
          console.error('[SummarySession] Auto-save error:', err);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        });
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [textAnnotations, keywordMastery, personalNotes, summaryLoaded, courseId, topicId]);

  // ── Save on unmount ──
  useEffect(() => {
    return () => {
      if (!courseId || !topicId) return;
      studentApi.saveSummary(courseId, topicId, buildPayload()).catch(() => {});
    };
  }, []);

  return { summaryLoaded, saveStatus };
}
