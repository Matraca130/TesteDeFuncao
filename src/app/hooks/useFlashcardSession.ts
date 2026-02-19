// ┌────────────────────────────────────────────────────────────┐
// │ @deprecated — LEGACY HOOK (SM-2, local data, 1-5 scale)     │
// │                                                            │
// │ This hook is the OLD flashcard session manager that works   │
// │ with local course data and the SM-2 algorithm.              │
// │                                                            │
// │ The NEW hook lives at:                                      │
// │   components/flashcard/useFlashcardSession.ts               │
// │   (FSRS-based, API-connected, Grade 0-1 scale)              │
// │                                                            │
// │ This file will be removed once all consumers migrate.       │
// └────────────────────────────────────────────────────────────┘

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/app/context/AppContext';
import type { Section, Topic, Flashcard } from '@/app/data/courses';

export type FlashcardViewState = 'hub' | 'section' | 'deck' | 'session' | 'summary';

export interface MasteryStats {
  avg: number;
  pct: number;
  mastered: number;
  learning: number;
  newCards: number;
}

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

export const RATINGS = [
  { value: 1, label: 'Nao sei', color: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-500', desc: 'Repetir logo' },
  { value: 2, label: 'Dificil', color: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-500', desc: 'Repetir em breve' },
  { value: 3, label: 'Medio', color: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'text-yellow-500', desc: 'Duvida razoavel' },
  { value: 4, label: 'Facil', color: 'bg-lime-500', hover: 'hover:bg-lime-600', text: 'text-lime-600', desc: 'Entendi bem' },
  { value: 5, label: 'Perfeito', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-500', desc: 'Memorizado' },
] as const;

/**
 * @deprecated Use `useFlashcardSession` from `components/flashcard/` instead.
 * This legacy hook uses local course data + SM-2 algorithm.
 * The new hook uses the API + FSRS algorithm.
 */
export function useFlashcardSession() {
  const { currentCourse, setActiveView, setCurrentTopic } = useApp();

  const [viewState, setViewState] = useState<FlashcardViewState>('hub');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);

  const [isRevealed, setIsRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<number[]>([]);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);

  const allSections = useMemo(() => {
    return currentCourse.semesters.flatMap(sem => sem.sections);
  }, [currentCourse]);

  const allFlashcards = useMemo(() => {
    return allSections.flatMap(sec => sec.topics.flatMap(t => {
      const topicCards = t.flashcards || [];
      const subCards = (t.subtopics || []).flatMap(st => st.flashcards || []);
      return [...topicCards, ...subCards];
    }));
  }, [allSections]);

  useEffect(() => {
    setViewState('hub');
    setSelectedSection(null);
    setSelectedTopic(null);
  }, [currentCourse]);

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
    else if (viewState === 'session' || viewState === 'summary') {
      setViewState(selectedTopic ? 'deck' : selectedSection ? 'section' : 'hub');
    }
    else { setViewState('hub'); }
  }, [viewState, selectedTopic, selectedSection]);

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

    // Advance to next card or show summary after a brief delay
    setTimeout(() => {
      setCurrentIndex(prev => {
        if (prev < sessionCards.length - 1) {
          return prev + 1;
        } else {
          setViewState('summary');
          return prev;
        }
      });
    }, 200);
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

  const studySelectedTopic = useCallback(() => {
    // No study view in this module - just go back to deck
    if (selectedTopic) {
      setCurrentTopic(selectedTopic);
    }
  }, [selectedTopic, setCurrentTopic]);

  return {
    viewState, selectedSection, selectedTopic, selectedSectionIdx,
    isRevealed, setIsRevealed, currentIndex, sessionStats, sessionCards,
    allSections, allFlashcards, currentCourse,
    openSection, openDeck, goBack, startSession, handleRate,
    restartSession, exitSession, studySelectedTopic, setActiveView,
  };
}
