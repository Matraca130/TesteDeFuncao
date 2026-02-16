// ============================================================
// useFlashcardSession — Logic hook for FlashcardView
// Manages: navigation state machine, session cards, ratings
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/app/context/AppContext';
import type { Section, Topic, Flashcard } from '@/app/data/courses';

// ── Types ──

export type FlashcardViewState = 'hub' | 'section' | 'deck' | 'session' | 'summary';

export interface MasteryStats {
  avg: number;
  pct: number;
  mastered: number;
  learning: number;
  newCards: number;
}

// ── Pure utility (exported for reuse) ──

export function getMasteryStats(cards: Flashcard[]): MasteryStats {
  if (cards.length === 0) return { avg: 0, pct: 0, mastered: 0, learning: 0, newCards: 0 };
  const avg = cards.reduce((s, c) => s + c.mastery, 0) / cards.length;
  return {
    avg,
    pct: (avg / 5) * 100,
    mastered: cards.filter(c => c.mastery >= 4).length,
    learning: cards.filter(c => c.mastery === 3).length,
    newCards: cards.filter(c => c.mastery <= 2).length,
  };
}

// ── Constants ──

export const RATINGS = [
  { value: 1, label: 'N\u00e3o sei', color: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-500', desc: 'Repetir logo' },
  { value: 2, label: 'Dif\u00edcil', color: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-500', desc: 'Repetir em breve' },
  { value: 3, label: 'M\u00e9dio', color: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'text-yellow-500', desc: 'D\u00favida razo\u00e1vel' },
  { value: 4, label: 'F\u00e1cil', color: 'bg-lime-500', hover: 'hover:bg-lime-600', text: 'text-lime-600', desc: 'Entendi bem' },
  { value: 5, label: 'Perfeito', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-500', desc: 'Memorizado' },
] as const;

// ── Hook ──

export function useFlashcardSession() {
  const { currentCourse, setActiveView, setCurrentTopic } = useApp();

  // View state machine
  const [viewState, setViewState] = useState<FlashcardViewState>('hub');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);

  // Session state
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<number[]>([]);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);

  // Derived data
  const allSections = useMemo(() => {
    return currentCourse.semesters.flatMap(sem => sem.sections);
  }, [currentCourse]);

  const allFlashcards = useMemo(() => {
    return allSections.flatMap(sec => sec.topics.flatMap(t => t.flashcards || []));
  }, [allSections]);

  // Reset on course change
  useEffect(() => {
    setViewState('hub');
    setSelectedSection(null);
    setSelectedTopic(null);
  }, [currentCourse]);

  // ── Navigation actions ──

  const openSection = useCallback((section: Section, idx: number) => {
    setSelectedSection(section);
    setSelectedSectionIdx(idx);
    setViewState('section');
  }, []);

  const openDeck = useCallback((topic: Topic) => {
    setSelectedTopic(topic);
    setViewState('deck');
  }, []);

  const goBack = useCallback(() => {
    if (viewState === 'deck') { setViewState('section'); setSelectedTopic(null); }
    else if (viewState === 'section') { setViewState('hub'); setSelectedSection(null); }
    else { setActiveView('study'); }
  }, [viewState, setActiveView]);

  // ── Session actions ──

  const startSession = useCallback((cards: Flashcard[]) => {
    if (cards.length === 0) return;
    setSessionCards(cards);
    setViewState('session');
    setCurrentIndex(0);
    setSessionStats([]);
    setIsRevealed(false);
  }, []);

  const handleRate = useCallback((rating: number) => {
    setSessionStats(prev => [...prev, rating]);
    setIsRevealed(false);

    const advanceOrFinish = (idx: number) => {
      if (idx < sessionCards.length - 1) {
        setTimeout(() => setCurrentIndex(p => p + 1), 200);
      } else {
        setTimeout(() => setViewState('summary'), 200);
      }
    };

    setCurrentIndex(prev => {
      advanceOrFinish(prev);
      return prev;
    });
  }, [sessionCards.length]);

  const restartSession = useCallback(() => {
    setCurrentIndex(0);
    setSessionStats([]);
    setIsRevealed(false);
    setViewState('session');
  }, []);

  const exitSession = useCallback(() => {
    setViewState(selectedTopic ? 'deck' : selectedSection ? 'section' : 'hub');
  }, [selectedTopic, selectedSection]);

  // ── Study topic action ──

  const studySelectedTopic = useCallback(() => {
    if (selectedTopic) {
      setCurrentTopic(selectedTopic);
      setActiveView('study');
    }
  }, [selectedTopic, setCurrentTopic, setActiveView]);

  return {
    viewState,
    selectedSection,
    selectedTopic,
    selectedSectionIdx,
    isRevealed,
    setIsRevealed,
    currentIndex,
    sessionStats,
    sessionCards,
    allSections,
    allFlashcards,
    currentCourse,
    openSection,
    openDeck,
    goBack,
    startSession,
    handleRate,
    restartSession,
    exitSession,
    studySelectedTopic,
    setActiveView,
  };
}