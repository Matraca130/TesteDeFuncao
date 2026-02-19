// ============================================================
// Axon v4.4 — useFlashcardSession (Custom Hook)
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 3: Toda la lógica de estado + side-effects
//
// El componente FlashcardSession queda puramente visual:
//   const session = useFlashcardSession(subtopicId);
//   return <StudyingView {...session} />;
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';

import type { Grade } from '../../../types/enums';
import type { DueFlashcardItem, SubmitReviewRes } from '../../../types/api-contract';
import type { SessionPhase, SessionReviewResult } from './types';
import { gradeToInt, normalizeFsrsState } from './utils';

// ─── Hook Return Type ────────────────────────────────────────

export interface UseFlashcardSessionReturn {
  // Phase & navigation
  phase: SessionPhase;
  currentIndex: number;
  totalCards: number;

  // Current card
  currentCard: DueFlashcardItem | null;
  isFlipped: boolean;
  flipCard: () => void;

  // Grading
  sessionGrades: Grade[];
  isSubmitting: boolean;
  handleGrade: (grade: Grade) => void;

  // Feedback
  lastFeedback: SubmitReviewRes['feedback'] | null;
  lastGrade: Grade | null;
  handleContinue: () => void;

  // Summary
  results: SessionReviewResult[];
  restartSession: () => void;

  // Student card creator
  showCreator: boolean;
  openCreator: () => void;
  closeCreator: () => void;
  handleCreateCard: (data: { front: string; back: string }) => void;

  // Timing (for response_time_ms)
  responseTimeMs: number;
}

// ─── API helpers (isolados para futuro refactor) ─────────────
// TODO: Mover a un servicio dedicado en src/services/flashcardApi.ts

async function fetchDueCards(subtopicId: string): Promise<DueFlashcardItem[]> {
  // Placeholder: en producción llama GET /flashcards/due?subtopic_id=...
  // El monolito original usa supabase.functions.invoke('get-due-flashcards')
  console.log(`[useFlashcardSession] fetchDueCards(${subtopicId})`);

  // Simula latencia de red
  await new Promise((r) => setTimeout(r, 600));

  // Mock data para desarrollo — reemplazar con llamada real
  const mockCards: DueFlashcardItem[] = Array.from({ length: 8 }, (_, i) => ({
    card: {
      id: `card-${i + 1}`,
      summary_id: `sum-${subtopicId}`,
      keyword_id: `kw-${i + 1}`,
      subtopic_id: subtopicId,
      institution_id: 'inst-001',
      front: `Pergunta ${i + 1}: Qual é o mecanismo de ação...?`,
      back: `Resposta ${i + 1}: O mecanismo envolve a inibição competitiva do receptor...`,
      image_url: null,
      status: 'published',
      source: 'ai_generated',
      created_by: 'system',
      created_at: new Date().toISOString(),
    },
    fsrs_state: {
      student_id: 'student-001',
      card_id: `card-${i + 1}`,
      stability: 1.5 + i * 0.3,
      state: normalizeFsrsState(i % 4),
      reps: i,
      lapses: Math.floor(i / 3),
      due_at: new Date().toISOString(),
      last_review_at: null,
      updated_at: new Date().toISOString(),
    },
    overdue_days: Math.floor(Math.random() * 5),
  }));

  return mockCards;
}

async function submitReview(
  sessionId: string,
  card: DueFlashcardItem,
  grade: Grade,
  responseTimeMs: number,
): Promise<SubmitReviewRes> {
  // Placeholder: en producción llama POST /reviews
  console.log(`[useFlashcardSession] submitReview(${card.card.id}, grade=${grade})`);

  await new Promise((r) => setTimeout(r, 400));

  // Mock response — simula mejora o deterioro basado en el grade
  const deltaBefore = 0.4 + Math.random() * 0.3;
  const deltaShift = grade >= 0.65 ? 0.08 + Math.random() * 0.12 : -(0.05 + Math.random() * 0.1);
  const deltaAfter = Math.max(0, Math.min(1, deltaBefore + deltaShift));

  const colorFromDelta = (d: number) =>
    d >= 0.8 ? 'blue' : d >= 0.6 ? 'green' : d >= 0.4 ? 'yellow' : d >= 0.2 ? 'orange' : 'red';

  return {
    review_id: `rev-${Date.now()}`,
    feedback: {
      delta_before: deltaBefore,
      delta_after: deltaAfter,
      color_before: colorFromDelta(deltaBefore) as any,
      color_after: colorFromDelta(deltaAfter) as any,
      mastery: deltaAfter,
      stability: (card.fsrs_state.stability ?? 1) + (grade >= 0.65 ? 1.2 : -0.3),
      message: grade >= 0.65 ? 'Muito bem! Progresso consolidado.' : 'Revise novamente em breve.',
    },
  };
}

async function createStudentCard(
  subtopicId: string,
  data: { front: string; back: string },
): Promise<void> {
  // Placeholder: en producción llama POST /flashcards/student
  console.log(`[useFlashcardSession] createStudentCard(${subtopicId})`, data);
  await new Promise((r) => setTimeout(r, 300));
}

// ─── Hook ────────────────────────────────────────────────

export function useFlashcardSession(subtopicId: string): UseFlashcardSessionReturn {
  // ── Core state ──
  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [dueItems, setDueItems] = useState<DueFlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Session tracking ──
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [sessionGrades, setSessionGrades] = useState<Grade[]>([]);
  const [results, setResults] = useState<SessionReviewResult[]>([]);

  // ── Feedback state ──
  const [lastFeedback, setLastFeedback] = useState<SubmitReviewRes['feedback'] | null>(null);
  const [lastGrade, setLastGrade] = useState<Grade | null>(null);

  // ── Student card creator ──
  const [showCreator, setShowCreator] = useState(false);

  // ── Timing ──
  const cardStartTime = useRef<number>(Date.now());
  const [responseTimeMs, setResponseTimeMs] = useState(0);

  // ── Derived ──
  const totalCards = dueItems.length;
  const currentCard = dueItems[currentIndex] ?? null;

  // ═════════════════════════════════════════════════════════
  // EFFECTS
  // ═════════════════════════════════════════════════════════

  // Fetch due cards on mount / subtopicId change
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPhase('loading');
      try {
        const items = await fetchDueCards(subtopicId);
        if (cancelled) return;

        if (items.length === 0) {
          setPhase('empty');
        } else {
          setDueItems(items);
          setCurrentIndex(0);
          setSessionGrades([]);
          setResults([]);
          setIsFlipped(false);
          setPhase('studying');
          cardStartTime.current = Date.now();
        }
      } catch (err) {
        console.error('[useFlashcardSession] fetch error:', err);
        if (!cancelled) setPhase('empty');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [subtopicId]);

  // Reset card timer when moving to a new card
  useEffect(() => {
    if (phase === 'studying') {
      cardStartTime.current = Date.now();
      setIsFlipped(false);
    }
  }, [phase, currentIndex]);

  // ═════════════════════════════════════════════════════════
  // ACTIONS
  // ═════════════════════════════════════════════════════════

  const flipCard = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const handleGrade = useCallback(
    async (grade: Grade) => {
      if (!currentCard || isSubmitting) return;

      const elapsed = Date.now() - cardStartTime.current;
      setResponseTimeMs(elapsed);
      setIsSubmitting(true);

      try {
        const res = await submitReview(sessionId, currentCard, grade, elapsed);

        // Track results
        setSessionGrades((prev) => [...prev, grade]);
        setResults((prev) => [
          ...prev,
          { grade, feedback: res.feedback, response_time_ms: elapsed },
        ]);

        // Show feedback
        setLastFeedback(res.feedback);
        setLastGrade(grade);
        setPhase('feedback');
      } catch (err) {
        console.error('[useFlashcardSession] submit error:', err);
        // On error, still advance to avoid stuck state
        setSessionGrades((prev) => [...prev, grade]);
        handleContinueInternal();
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, sessionId],
  );

  // Internal continue (used by error path too)
  const handleContinueInternal = useCallback(() => {
    if (currentIndex + 1 >= totalCards) {
      setPhase('summary');
    } else {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setLastFeedback(null);
      setLastGrade(null);
      setPhase('studying');
    }
  }, [currentIndex, totalCards]);

  const handleContinue = useCallback(() => {
    handleContinueInternal();
  }, [handleContinueInternal]);

  const restartSession = useCallback(() => {
    setCurrentIndex(0);
    setSessionGrades([]);
    setResults([]);
    setLastFeedback(null);
    setLastGrade(null);
    setIsFlipped(false);
    setPhase('studying');
    cardStartTime.current = Date.now();
  }, []);

  // ── Creator ──
  const openCreator = useCallback(() => setShowCreator(true), []);
  const closeCreator = useCallback(() => setShowCreator(false), []);

  const handleCreateCard = useCallback(
    async (data: { front: string; back: string }) => {
      try {
        await createStudentCard(subtopicId, data);
        setShowCreator(false);
      } catch (err) {
        console.error('[useFlashcardSession] create card error:', err);
      }
    },
    [subtopicId],
  );

  // ═════════════════════════════════════════════════════════
  // RETURN
  // ═════════════════════════════════════════════════════════

  return {
    phase,
    currentIndex,
    totalCards,
    currentCard,
    isFlipped,
    flipCard,
    sessionGrades,
    isSubmitting,
    handleGrade,
    lastFeedback,
    lastGrade,
    handleContinue,
    results,
    restartSession,
    showCreator,
    openCreator,
    closeCreator,
    handleCreateCard,
    responseTimeMs,
  };
}
