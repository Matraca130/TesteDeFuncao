// ============================================================
// Axon v4.4 — FlashcardSession (Thin Orchestrator)
// PASO 5: Reemplaza el monolito flashcard-session.tsx (32KB)
//
// Este componente tiene UNA sola responsabilidad:
//   hook → switch(phase) → vista correspondiente
//
// Toda la lógica vive en useFlashcardSession (Paso 3).
// Toda la UI vive en views/ (Paso 4) y sub-componentes (Paso 2).
// ============================================================

import { AnimatePresence } from 'motion/react';

import { useFlashcardSession } from './useFlashcardSession';
import { LoadingView, EmptyView, SummaryView, StudyingView } from './views';
import { StudentCardCreator } from './StudentCardCreator';

interface FlashcardSessionProps {
  subtopicId: string;
  onGoBack?: () => void;
}

export function FlashcardSession({ subtopicId, onGoBack }: FlashcardSessionProps) {
  const session = useFlashcardSession(subtopicId);

  return (
    <div className="relative min-h-[60vh]">
      {/* Phase router */}
      <AnimatePresence mode="wait">
        {session.phase === 'loading' && <LoadingView key="loading" />}

        {session.phase === 'empty' && (
          <EmptyView
            key="empty"
            onGoBack={onGoBack}
            onCreateCard={session.openCreator}
          />
        )}

        {session.phase === 'summary' && (
          <SummaryView
            key="summary"
            results={session.results}
            sessionGrades={session.sessionGrades}
            totalCards={session.totalCards}
            onRestart={session.restartSession}
            onCreateCard={session.openCreator}
          />
        )}

        {(session.phase === 'studying' || session.phase === 'feedback') &&
          session.currentCard && (
            <StudyingView
              key="studying"
              phase={session.phase}
              currentCard={session.currentCard}
              currentIndex={session.currentIndex}
              totalCards={session.totalCards}
              isFlipped={session.isFlipped}
              flipCard={session.flipCard}
              sessionGrades={session.sessionGrades}
              isSubmitting={session.isSubmitting}
              handleGrade={session.handleGrade}
              lastFeedback={session.lastFeedback}
              lastGrade={session.lastGrade}
              handleContinue={session.handleContinue}
            />
          )}
      </AnimatePresence>

      {/* Student card creator modal */}
      {session.showCreator && (
        <StudentCardCreator
          onSubmit={session.handleCreateCard}
          onClose={session.closeCreator}
        />
      )}
    </div>
  );
}
