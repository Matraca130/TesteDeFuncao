import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useFlashcardSession } from '@/app/hooks/useFlashcardSession';

// ── Extracted sub-screens (Ola 3) ──
import { HubScreen } from './flashcard/FlashcardHubScreen';
import { SectionScreen } from './flashcard/FlashcardSectionScreen';
import { DeckScreen } from './flashcard/FlashcardDeckScreen';
import { SessionScreen } from './flashcard/FlashcardSessionScreen';
import { SummaryScreen } from './flashcard/FlashcardSummaryScreen';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export function FlashcardView() {
  const {
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
  } = useFlashcardSession();

  return (
    <div className="flex flex-col h-full bg-surface-dashboard relative overflow-hidden">
      <AnimatePresence mode="wait">
        {viewState === 'hub' && (
          <HubScreen
            key="hub"
            sections={allSections}
            allCards={allFlashcards}
            courseColor={currentCourse.color}
            courseName={currentCourse.name}
            onOpenSection={openSection}
            onStartAll={() => startSession(allFlashcards)}
            onBack={() => setActiveView('study')}
          />
        )}
        {viewState === 'section' && selectedSection && (
          <SectionScreen
            key="section"
            section={selectedSection}
            sectionIdx={selectedSectionIdx}
            courseColor={currentCourse.color}
            onOpenDeck={openDeck}
            onStartSection={(cards) => startSession(cards)}
            onBack={goBack}
          />
        )}
        {viewState === 'deck' && selectedTopic && (
          <DeckScreen
            key="deck"
            topic={selectedTopic}
            sectionIdx={selectedSectionIdx}
            sectionName={selectedSection?.title || ''}
            courseColor={currentCourse.color}
            onStart={(cards) => startSession(cards)}
            onBack={goBack}
            onStudyTopic={studySelectedTopic}
          />
        )}
        {viewState === 'session' && (
          <SessionScreen
            key="session"
            cards={sessionCards}
            currentIndex={currentIndex}
            isRevealed={isRevealed}
            setIsRevealed={setIsRevealed}
            handleRate={handleRate}
            sessionStats={sessionStats}
            courseColor={currentCourse.color}
            onBack={goBack}
          />
        )}
        {viewState === 'summary' && (
          <SummaryScreen
            key="summary"
            stats={sessionStats}
            courseColor={currentCourse.color}
            courseId={currentCourse.id}
            courseName={currentCourse.name}
            topicId={selectedTopic?.id || null}
            topicTitle={selectedTopic?.title || null}
            onRestart={restartSession}
            onExit={exitSession}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
