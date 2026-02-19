// ============================================================
// AxonAIAssistant — Slim orchestrator (~100 lines)
// Delegates UI to sub-components, logic to useAIAssistant hook
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { useAIAssistant } from './useAIAssistant';
import { AssistantHeader } from './AssistantHeader';
import { ModeTabs } from './ModeTabs';
import { ChatView } from './ChatView';
import { FlashcardsView } from './FlashcardsView';
import { QuizView } from './QuizView';
import { ExplainView } from './ExplainView';

interface AxonAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AxonAIAssistant({ isOpen, onClose }: AxonAIAssistantProps) {
  const ai = useAIAssistant(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-[#f5f6fa] shadow-2xl z-[70] flex flex-col"
          >
            <AssistantHeader onClose={onClose} />

            <ModeTabs current={ai.mode} onChange={ai.resetMode} />

            <div className="flex-1 overflow-hidden flex flex-col">
              {ai.mode === 'chat' && (
                <ChatView
                  messages={ai.chat.messages}
                  input={ai.chat.input}
                  setInput={ai.chat.setInput}
                  sendChat={ai.chat.sendChat}
                  handleKeyDown={ai.chat.handleKeyDown}
                  isLoading={ai.isLoading}
                  copiedId={ai.copiedId}
                  copyText={ai.copyText}
                  inputRef={ai.chat.inputRef}
                  chatEndRef={ai.chat.chatEndRef}
                  currentCourse={ai.currentCourse}
                  currentTopic={ai.currentTopic}
                />
              )}

              {ai.mode === 'flashcards' && (
                <FlashcardsView
                  topic={ai.flashcards.topic}
                  setTopic={ai.flashcards.setTopic}
                  count={ai.flashcards.count}
                  setCount={ai.flashcards.setCount}
                  cards={ai.flashcards.cards}
                  setCards={ai.flashcards.setCards}
                  flippedCards={ai.flashcards.flippedCards}
                  toggleFlip={ai.flashcards.toggleFlip}
                  generate={ai.flashcards.generate}
                  isLoading={ai.isLoading}
                  currentTopicTitle={ai.currentTopic?.title}
                />
              )}

              {ai.mode === 'quiz' && (
                <QuizView
                  topic={ai.quiz.topic}
                  setTopic={ai.quiz.setTopic}
                  difficulty={ai.quiz.difficulty}
                  setDifficulty={ai.quiz.setDifficulty}
                  questions={ai.quiz.questions}
                  setQuestions={ai.quiz.setQuestions}
                  selectedAnswers={ai.quiz.selectedAnswers}
                  showExplanations={ai.quiz.showExplanations}
                  selectAnswer={ai.quiz.selectAnswer}
                  generate={ai.quiz.generate}
                  isLoading={ai.isLoading}
                  currentTopicTitle={ai.currentTopic?.title}
                />
              )}

              {ai.mode === 'explain' && (
                <ExplainView
                  concept={ai.explain.concept}
                  setConcept={ai.explain.setConcept}
                  explanation={ai.explain.explanation}
                  setExplanation={ai.explain.setExplanation}
                  run={ai.explain.run}
                  isLoading={ai.isLoading}
                  copiedId={ai.copiedId}
                  copyText={ai.copyText}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
