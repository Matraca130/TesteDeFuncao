// ══════════════════════════════════════════════════════════════
// AXON — Quiz Session Screen Orchestrator (student-facing)
// Sub-components: QuizResultsScreen, QuizQuestionWidgets
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import {
  CheckCircle2, ChevronLeft, Lightbulb, ChevronDown, BookOpen, X,
} from 'lucide-react';
import type { Topic } from '@/app/data/courses';
import {
  getQuestionType, checkWriteInAnswer, checkFillBlankAnswer,
  type SavedAnswer,
} from './quiz-helpers';
import { QuizResultsScreen } from './QuizResultsScreen';
import { QuestionTypeBadge, MultipleChoiceOptions, WriteInField, FillBlankField } from './QuizQuestionWidgets';

export function QuizSessionScreen({ topic, onBack }: { topic: Topic | null; onBack: () => void }) {
  const questions = topic?.quizzes || [];
  const [savedAnswers, setSavedAnswers] = useState<Record<number, SavedAnswer>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [liveSelectedOption, setLiveSelectedOption] = useState<number | null>(null);
  const [liveTextInput, setLiveTextInput] = useState('');
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    setSavedAnswers({}); setCurrentIdx(0); setIsComplete(false);
    setShowHint(false); setLiveSelectedOption(null); setLiveTextInput(''); setNavDirection('forward');
  }, [topic]);

  if (!topic || questions.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lightbulb size={40} className="text-teal-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Quiz indisponivel</h2>
          <button onClick={onBack} className="text-teal-600 font-bold hover:underline">Voltar para selecao</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const qType = getQuestionType(currentQ);
  const saved = savedAnswers[currentIdx];
  const isReviewing = saved?.answered === true;

  const correctCount = Object.values(savedAnswers).filter(a => a.answered && a.correct).length;
  const wrongCount = Object.values(savedAnswers).filter(a => a.answered && !a.correct).length;
  const answeredCount = Object.values(savedAnswers).filter(a => a.answered).length;

  const showResult = isReviewing;
  const selectedAnswer = isReviewing ? saved.selectedOption : liveSelectedOption;
  const textAnswer = isReviewing ? saved.textInput : liveTextInput;
  const isCorrectResult = isReviewing ? saved.correct : false;

  const handleSubmitMC = () => {
    if (liveSelectedOption === null || isReviewing) return;
    const correct = liveSelectedOption === currentQ.correctAnswer;
    setSavedAnswers(prev => ({ ...prev, [currentIdx]: { selectedOption: liveSelectedOption, textInput: '', correct, answered: true } }));
  };

  const handleSubmitText = () => {
    if (!liveTextInput.trim() || isReviewing) return;
    let correct = false;
    if (qType === 'write-in') correct = checkWriteInAnswer(currentQ, liveTextInput);
    else if (qType === 'fill-blank') correct = checkFillBlankAnswer(currentQ, liveTextInput);
    setSavedAnswers(prev => ({ ...prev, [currentIdx]: { selectedOption: null, textInput: liveTextInput, correct, answered: true } }));
  };

  const goToQuestion = (idx: number, direction: 'forward' | 'back') => {
    setNavDirection(direction);
    setCurrentIdx(idx);
    const savedForIdx = savedAnswers[idx];
    if (savedForIdx && savedForIdx.answered) {
      setLiveSelectedOption(savedForIdx.selectedOption);
      setLiveTextInput(savedForIdx.textInput);
    } else {
      setLiveSelectedOption(null);
      setLiveTextInput('');
    }
    setShowHint(false);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) goToQuestion(currentIdx + 1, 'forward');
    else setIsComplete(true);
  };

  const handlePrev = () => {
    if (currentIdx > 0) goToQuestion(currentIdx - 1, 'back');
  };

  const handleRestart = () => {
    setSavedAnswers({}); setCurrentIdx(0); setIsComplete(false);
    setShowHint(false); setLiveSelectedOption(null); setLiveTextInput(''); setNavDirection('forward');
  };

  // ── Results screen ──
  if (isComplete) {
    return (
      <QuizResultsScreen
        score={correctCount} total={questions.length}
        onReview={() => { setIsComplete(false); goToQuestion(0, 'back'); }}
        onBack={onBack} onRestart={handleRestart}
      />
    );
  }

  // ── Question screen ──
  const slideVariants = {
    enter: { opacity: 0, y: navDirection === 'forward' ? 16 : -16 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: navDirection === 'forward' ? -16 : 16 },
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-5 border-b border-gray-200 shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 p-1.5 -ml-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Voltar para selecao">
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <BookOpen size={14} className="text-teal-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[260px]">Quiz: {topic.title}</span>
        </div>
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Question content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 md:px-10 py-6 md:py-8">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 flex items-center gap-[3px]">
              {questions.map((_, idx) => {
                const sa = savedAnswers[idx];
                let color = 'bg-gray-200';
                if (sa?.answered && sa.correct) color = 'bg-emerald-500';
                else if (sa?.answered && !sa.correct) color = 'bg-rose-400';
                else if (idx === currentIdx) color = 'bg-teal-500';
                const isCurrent = idx === currentIdx;
                return (
                  <button key={idx} onClick={() => goToQuestion(idx, idx < currentIdx ? 'back' : 'forward')}
                    className={clsx("h-1.5 rounded-full flex-1 transition-all cursor-pointer hover:opacity-80", color, isCurrent && "ring-2 ring-teal-300 ring-offset-1")}
                    title={`Questao ${idx + 1}`} />
                );
              })}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-xs text-gray-500 font-medium">{currentIdx + 1} de {questions.length}</span>
              {wrongCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full"><X size={10} /> {wrongCount}</span>
              )}
              {correctCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> {correctCount}</span>
              )}
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div key={currentIdx} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <QuestionTypeBadge qType={qType} isReviewing={isReviewing} />

              <div className="flex gap-4 mb-8">
                <span className="text-gray-400 font-semibold text-lg shrink-0">{currentIdx + 1}.</span>
                <h3 className="text-lg text-gray-800 leading-relaxed">{currentQ.question}</h3>
              </div>

              {qType === 'multiple-choice' && currentQ.options && (
                <MultipleChoiceOptions
                  question={currentQ} selectedAnswer={selectedAnswer} showResult={showResult}
                  isReviewing={isReviewing} onSelect={setLiveSelectedOption}
                />
              )}
              {qType === 'write-in' && (
                <WriteInField
                  question={currentQ} textAnswer={textAnswer} showResult={showResult}
                  isCorrectResult={isCorrectResult} isReviewing={isReviewing}
                  onChangeText={setLiveTextInput} onSubmit={handleSubmitText}
                />
              )}
              {qType === 'fill-blank' && currentQ.blankSentence && (
                <FillBlankField
                  question={currentQ} textAnswer={textAnswer} showResult={showResult}
                  isCorrectResult={isCorrectResult} isReviewing={isReviewing}
                  onChangeText={setLiveTextInput} onSubmit={handleSubmitText}
                />
              )}

              {/* Hint */}
              {currentQ.hint && !isReviewing && (
                <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4">
                  Mostrar pista <ChevronDown size={14} className={clsx("transition-transform", showHint && "rotate-180")} />
                </button>
              )}
              {showHint && currentQ.hint && !isReviewing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                  <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <Lightbulb size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">{currentQ.hint}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-6 md:px-10 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            {currentIdx > 0 ? (
              <button onClick={handlePrev} className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors">
                <ChevronLeft size={16} /> Atras
              </button>
            ) : <div />}
          </div>
          <div>
            {isReviewing ? (
              <button onClick={handleNext} className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all">
                {currentIdx < questions.length - 1 ? 'Proxima' : (answeredCount >= questions.length ? 'Ver Resultado' : 'Proxima')}
              </button>
            ) : (
              <button onClick={qType === 'multiple-choice' ? handleSubmitMC : handleSubmitText}
                disabled={qType === 'multiple-choice' ? liveSelectedOption === null : !liveTextInput.trim()}
                className={clsx("px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  (qType === 'multiple-choice' ? liveSelectedOption !== null : liveTextInput.trim())
                    ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}>
                Verificar
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
