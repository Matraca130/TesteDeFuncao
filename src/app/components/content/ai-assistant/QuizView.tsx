// ============================================================
// QuizView — AI-generated quiz with answer checking
// ============================================================

import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Zap, Loader2, ArrowLeft, RotateCcw } from 'lucide-react';
import { DIFFICULTY_OPTIONS } from './types';
import type { QuizDifficulty } from './types';
import type { GeneratedQuestion } from '@/app/services/aiService';

// Explicit class map — Tailwind cannot detect dynamic interpolation
// like `bg-${color}-100`, so we map each difficulty to full class strings.
const DIFFICULTY_ACTIVE_CLASSES: Record<QuizDifficulty, string> = {
  basic:        'bg-emerald-100 text-emerald-700 border border-emerald-300',
  intermediate: 'bg-amber-100 text-amber-700 border border-amber-300',
  advanced:     'bg-red-100 text-red-700 border border-red-300',
};

interface QuizViewProps {
  topic: string;
  setTopic: (v: string) => void;
  difficulty: QuizDifficulty;
  setDifficulty: (d: QuizDifficulty) => void;
  questions: GeneratedQuestion[];
  setQuestions: (q: GeneratedQuestion[]) => void;
  selectedAnswers: Map<number, number>;
  showExplanations: Set<number>;
  selectAnswer: (qi: number, oi: number) => void;
  generate: () => Promise<void>;
  isLoading: boolean;
  currentTopicTitle?: string;
}

export function QuizView({
  topic,
  setTopic,
  difficulty,
  setDifficulty,
  questions,
  setQuestions,
  selectedAnswers,
  showExplanations,
  selectAnswer,
  generate,
  isLoading,
  currentTopicTitle,
}: QuizViewProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar-light px-4 py-4 space-y-4">
      {questions.length === 0 ? (
        <QuizForm
          topic={topic}
          setTopic={setTopic}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          generate={generate}
          isLoading={isLoading}
          currentTopicTitle={currentTopicTitle}
        />
      ) : (
        <QuizResults
          questions={questions}
          selectedAnswers={selectedAnswers}
          showExplanations={showExplanations}
          selectAnswer={selectAnswer}
          onBack={() => setQuestions([])}
          onRegenerate={generate}
        />
      )}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────

function QuizForm({
  topic,
  setTopic,
  difficulty,
  setDifficulty,
  generate,
  isLoading,
  currentTopicTitle,
}: {
  topic: string;
  setTopic: (v: string) => void;
  difficulty: QuizDifficulty;
  setDifficulty: (d: QuizDifficulty) => void;
  generate: () => Promise<void>;
  isLoading: boolean;
  currentTopicTitle?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border border-amber-200/60 mb-3">
          <GraduationCap size={24} className="text-amber-500" />
        </div>
        <h3
          className="font-bold text-gray-800"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Quiz com IA
        </h3>
        <p className="text-gray-400 text-xs mt-1">
          Questoes no estilo residencia medica
        </p>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200/60 space-y-3">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Topico
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder={currentTopicTitle || 'Ex: Farmacologia dos Antibioticos'}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Dificuldade
          </label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                  difficulty === d.id
                    ? DIFFICULTY_ACTIVE_CLASSES[d.id]
                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          {isLoading ? 'Gerando...' : 'Gerar Quiz'}
        </button>
      </div>
    </div>
  );
}

// ── Results ───────────────────────────────────────────────

function QuizResults({
  questions,
  selectedAnswers,
  showExplanations,
  selectAnswer,
  onBack,
  onRegenerate,
}: {
  questions: GeneratedQuestion[];
  selectedAnswers: Map<number, number>;
  showExplanations: Set<number>;
  selectAnswer: (qi: number, oi: number) => void;
  onBack: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <span className="text-xs text-gray-400">{questions.length} questoes</span>
      </div>

      {questions.map((q, qi) => (
        <QuestionCard
          key={qi}
          question={q}
          index={qi}
          selectedAnswer={selectedAnswers.get(qi)}
          showExplanation={showExplanations.has(qi)}
          onSelectAnswer={oi => selectAnswer(qi, oi)}
        />
      ))}

      <button
        onClick={onRegenerate}
        className="w-full py-2.5 border-2 border-dashed border-amber-300/60 text-amber-600 rounded-xl text-sm font-medium hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={14} /> Gerar Novo Quiz
      </button>
    </div>
  );
}

// ── Single question card ──────────────────────────────────

function QuestionCard({
  question: q,
  index: qi,
  selectedAnswer,
  showExplanation,
  onSelectAnswer,
}: {
  question: GeneratedQuestion;
  index: number;
  selectedAnswer: number | undefined;
  showExplanation: boolean;
  onSelectAnswer: (oi: number) => void;
}) {
  const isAnswered = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === q.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: qi * 0.08 }}
      className="bg-white rounded-xl border border-gray-200/60 overflow-hidden"
    >
      <div className="px-4 pt-4 pb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Questao {qi + 1}
        </span>
        <p className="text-sm text-gray-800 font-medium mt-1 leading-relaxed">
          {q.question}
        </p>
      </div>

      <div className="px-4 pb-3 space-y-2">
        {q.options.map((opt, oi) => {
          const isThisCorrect = oi === q.correctAnswer;
          const isThisSelected = selectedAnswer === oi;
          return (
            <button
              key={oi}
              onClick={() => onSelectAnswer(oi)}
              className={clsx(
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border',
                !isAnswered && 'hover:bg-gray-50 border-gray-200 text-gray-600',
                isAnswered &&
                  isThisCorrect &&
                  'bg-emerald-50 border-emerald-300 text-emerald-800',
                isAnswered &&
                  isThisSelected &&
                  !isThisCorrect &&
                  'bg-red-50 border-red-300 text-red-800',
                isAnswered &&
                  !isThisCorrect &&
                  !isThisSelected &&
                  'border-gray-100 text-gray-400 opacity-60'
              )}
              disabled={isAnswered}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className={clsx(
                'mx-4 mb-4 p-3 rounded-lg text-xs leading-relaxed',
                isCorrect
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              )}
            >
              <span className="font-bold">
                {isCorrect ? 'Correto!' : 'Incorreto.'}
              </span>{' '}
              {q.explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
