// ============================================================
// Axon v4.4 — useSummaryPersistence (REWIRED by Agent 4 P3)
// NOW: imports from api-client.ts (3-layer rule compliant)
// BEFORE: imported from services/studentApi.ts (direct fetch)
// FIX: TextAnnotation fields mapped camelCase→snake_case
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getStudySummaryByTopic,
  saveStudySummaryByTopic,
} from '../lib/api-client';
import type { TextAnnotation } from '../lib/types';
import type { StudySummaryAnnotation } from '../lib/types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEFAULT_STUDENT_ID = 'demo-student-001';

export interface SummaryPersistenceParams {
  courseId: string | undefined;
  topicId: string | undefined;
  courseName: string;
  topicTitle: string;
  textAnnotations: TextAnnotation[];
  keywordMastery: Record<string, string>;
  personalNotes: Record<string, string[]>;
  sessionElapsed: number;
  setTextAnnotations: (v: TextAnnotation[]) => void;
  setKeywordMastery: (v: Record<string, string>) => void;
  setPersonalNotes: (v: Record<string, string[]>) => void;
  setSessionElapsed: (v: number) => void;
}

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

    getStudySummaryByTopic(DEFAULT_STUDENT_ID, courseId, topicId)
      .then((saved) => {
        if (cancelled) return;
        if (saved) {
          if (saved.annotations && Array.isArray(saved.annotations) && saved.annotations.length > 0) {
            const restored: TextAnnotation[] = saved.annotations.map((a: StudySummaryAnnotation) => ({
              id: a.id || `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              summary_id: '',
              student_id: DEFAULT_STUDENT_ID,
              original_text: a.selected_text || '',
              display_text: a.selected_text || '',
              color: (a.color as TextAnnotation['color']) || 'yellow',
              note: a.note || '',
              type: (a.type as TextAnnotation['type']) || 'highlight',
              bot_reply: a.bot_reply,
              created_at: a.timestamp || new Date().toISOString(),
              updated_at: a.timestamp || new Date().toISOString(),
              deleted_at: null,
            }));
            setTextAnnotations(restored);
          }
          if (saved.keyword_mastery) {
            setKeywordMastery(saved.keyword_mastery);
          }
          if (saved.keyword_notes) {
            setPersonalNotes(saved.keyword_notes);
          }
          if (saved.edit_time_minutes) {
            setSessionElapsed(saved.edit_time_minutes * 60);
          }
        }
        setSummaryLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setSummaryLoaded(true);
      });

    return () => { cancelled = true; };
  }, [courseId, topicId]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPayload = useCallback(() => {
    const annotations: StudySummaryAnnotation[] = textAnnotations.map(a => ({
      id: a.id,
      type: a.type,
      selected_text: a.original_text,
      note: a.note,
      color: a.color,
      bot_reply: a.bot_reply,
      timestamp: a.created_at,
    }));

    return {
      course_name: courseName,
      topic_title: topicTitle,
      content: '',
      annotations,
      keyword_mastery: keywordMastery,
      keyword_notes: personalNotes,
      edit_time_minutes: Math.round(sessionElapsed / 60),
      tags: [] as string[],
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
      saveStudySummaryByTopic(DEFAULT_STUDENT_ID, courseId, topicId, buildPayload())
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
      const annotations: StudySummaryAnnotation[] = textAnnotations.map(a => ({
        id: a.id,
        type: a.type,
        selected_text: a.original_text,
        note: a.note,
        color: a.color,
        bot_reply: a.bot_reply,
        timestamp: a.created_at,
      }));
      saveStudySummaryByTopic(DEFAULT_STUDENT_ID, courseId, topicId, {
        course_name: courseName,
        topic_title: topicTitle,
        content: '',
        annotations,
        keyword_mastery: keywordMastery,
        keyword_notes: personalNotes,
        edit_time_minutes: Math.round(sessionElapsed / 60),
        tags: [],
        bookmarked: false,
      }).catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    summaryLoaded,
    saveStatus,
  };
}
