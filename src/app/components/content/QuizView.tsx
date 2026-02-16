// ══════════════════════════════════════════════════════════════
// AXON — QuizView Orchestrator
// Split: quiz/quiz-helpers.ts, quiz/QuizSelectionScreen.tsx, quiz/QuizSessionScreen.tsx
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { AnimatePresence } from 'motion/react';
import type { Topic } from '@/app/data/courses';
import { QuizSelectionScreen } from './quiz/QuizSelectionScreen';
import { QuizSessionScreen } from './quiz/QuizSessionScreen';

export function QuizView() {
  const { currentTopic, setCurrentTopic, currentCourse, quizAutoStart, setQuizAutoStart } = useApp();
  const [viewState, setViewState] = useState<'selection' | 'session'>('selection');

  useEffect(() => { setViewState('selection'); }, [currentCourse.id]);

  useEffect(() => {
    if (quizAutoStart && currentTopic && currentTopic.quizzes && currentTopic.quizzes.length > 0) {
      setViewState('session');
      setQuizAutoStart(false);
    } else if (quizAutoStart) {
      setQuizAutoStart(false);
    }
  }, [quizAutoStart, currentTopic, setQuizAutoStart]);

  const handleTopicSelect = (topic: Topic) => {
    setCurrentTopic(topic);
    setViewState('session');
  };

  return (
    <div className="h-full bg-slate-50/50 overflow-hidden">
      <AnimatePresence mode="wait">
        {viewState === 'selection' ? (
          <QuizSelectionScreen key="selection" onSelect={handleTopicSelect} />
        ) : (
          <QuizSessionScreen key="session" topic={currentTopic} onBack={() => setViewState('selection')} />
        )}
      </AnimatePresence>
    </div>
  );
}
