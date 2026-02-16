// ============================================================
// Axon — Keyword-Aware Quiz Component (Demo)
// Demonstrates the new spaced repetition system with keywords
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, Target, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import {
  KeywordState,
  calculateNeedScore,
  calculateKeywordRetention,
} from '@/app/services/spacedRepetition';
import {
  QuestionKeywords,
  LearningEventResult,
  updateKeywordsAfterEvent,
  selectKeywordsForStudy,
  getKeywordStats,
  KeywordCollection,
} from '@/app/services/keywordManager';

interface KeywordQuizDemoProps {
  courseId: string;
  topicId: string;
  initialKeywords?: KeywordCollection;
  onKeywordsUpdated?: (keywords: KeywordCollection) => void;
}

interface DemoQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  keywords: QuestionKeywords;
  expectedTimeMs: number;
}

// Example questions with keyword annotations
const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 1,
    question: 'Qual músculo NÃO faz parte do manguito rotador?',
    options: ['Supraespinal', 'Infraespinal', 'Deltoide', 'Subescapular'],
    correctAnswer: 2,
    keywords: {
      primary: ['manguito rotador', 'músculos do ombro'],
      secondary: ['deltoide', 'supraespinal', 'infraespinal', 'subescapular'],
    },
    expectedTimeMs: 8000,
  },
  {
    id: 2,
    question: 'Qual nervo pode ser lesado em fraturas do colo cirúrgico do úmero?',
    options: ['Nervo radial', 'Nervo ulnar', 'Nervo axilar', 'Nervo mediano'],
    correctAnswer: 2,
    keywords: {
      primary: ['nervo axilar', 'colo cirúrgico do úmero'],
      secondary: ['fraturas do úmero', 'lesão nervosa'],
    },
    expectedTimeMs: 10000,
  },
  {
    id: 3,
    question: 'Quantas câmaras tem o coração?',
    options: ['2 (1 átrio e 1 ventrículo)', '3 (2 átrios e 1 ventrículo)', '4 (2 átrios e 2 ventrículos)', '5 (2 átrios, 2 ventrículos e 1 septo)'],
    correctAnswer: 2,
    keywords: {
      primary: ['câmaras cardíacas', 'anatomia do coração'],
      secondary: ['átrios', 'ventrículos'],
    },
    expectedTimeMs: 6000,
  },
];

export function KeywordQuizDemo({ courseId, topicId, initialKeywords = {}, onKeywordsUpdated }: KeywordQuizDemoProps) {
  const [keywords, setKeywords] = useState<KeywordCollection>(initialKeywords);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  const question = DEMO_QUESTIONS[currentQuestion];
  const stats = getKeywordStats(keywords);

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentQuestion]);

  const handleAnswer = () => {
    if (selectedAnswer === null) return;

    const responseTime = Date.now() - startTime;
    const correct = selectedAnswer === question.correctAnswer;

    // Create learning event result
    const result: LearningEventResult = {
      correct,
      responseTimeMs: responseTime,
      usedHint: false,
    };

    // Update keywords based on performance
    const updatedKeywords = updateKeywordsAfterEvent(
      keywords,
      question.keywords,
      result,
      'quiz'
    );

    setKeywords(updatedKeywords);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + 1);
    }

    // Notify parent component
    onKeywordsUpdated?.(updatedKeywords);
  };

  const handleNext = () => {
    if (currentQuestion < DEMO_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
    }
  };

  const getColorForKeyword = (color: 'red' | 'yellow' | 'green') => {
    switch (color) {
      case 'red': return 'text-red-500 bg-red-50';
      case 'yellow': return 'text-yellow-600 bg-yellow-50';
      case 'green': return 'text-green-600 bg-green-50';
    }
  };

  if (quizFinished) {
    const priorityKeywords = selectKeywordsForStudy(keywords, 5, 0.3);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-8 space-y-6"
      >
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#ec43ef] to-[#b830e8] text-white mb-4">
              <Brain className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Concluído!</h2>
            <p className="text-gray-600">
              Sua pontuação: {score}/{DEMO_QUESTIONS.length}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Keywords Rastreadas</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats.averageMastery * 100)}%
              </div>
              <div className="text-sm text-gray-600">Domínio Médio</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.dueCount}</div>
              <div className="text-sm text-gray-600">Pendentes Revisão</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#ec43ef]" />
              Distribuição de Domínio
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-red-400 h-full"
                  style={{ width: `${(stats.byColor.red / stats.total) * 100}%` }}
                />
                <div
                  className="bg-yellow-400 h-full"
                  style={{ width: `${(stats.byColor.yellow / stats.total) * 100}%` }}
                />
                <div
                  className="bg-green-400 h-full"
                  style={{ width: `${(stats.byColor.green / stats.total) * 100}%` }}
                />
              </div>
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  {stats.byColor.red}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  {stats.byColor.yellow}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  {stats.byColor.green}
                </span>
              </div>
            </div>
          </div>

          {priorityKeywords.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#ec43ef]" />
                Keywords Prioritárias para Estudo
              </h3>
              <div className="space-y-2">
                {priorityKeywords.map(({ keyword, needScore, state }) => (
                  <div
                    key={keyword}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getColorForKeyword(state.color)}`}>
                        {state.color}
                      </div>
                      <span className="font-medium text-gray-900">{keyword}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Domínio: {Math.round(state.mastery * 100)}%</span>
                      <span>Urgência: {Math.round(needScore * 100)}%</span>
                      <span>Exposições: {state.exposures}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <strong>Como funciona o sistema:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Cada keyword tem domínio (mastery), estabilidade (stability) e agenda de revisão</li>
                  <li>O peso de cada keyword combina 4 fatores: atraso, baixo domínio, fragilidade e cobertura</li>
                  <li>Keywords primárias recebem 100% do impacto, secundárias 60%</li>
                  <li>Cores mudam com histerese para evitar oscilação</li>
                  <li>O sistema usa EMA (média móvel exponencial) para suavização</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-8 space-y-6"
    >
      {/* Header with progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quiz com Keywords</h2>
            <p className="text-gray-600">
              Questão {currentQuestion + 1} de {DEMO_QUESTIONS.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Pontuação</div>
            <div className="text-2xl font-bold text-gray-900">{score}/{currentQuestion}</div>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ec43ef] to-[#b830e8] transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / DEMO_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ec43ef]/10 text-[#ec43ef] font-bold flex-shrink-0">
              {currentQuestion + 1}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 flex-1">
              {question.question}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Clock className="w-4 h-4" />
            <span>Tempo esperado: {question.expectedTimeMs / 1000}s</span>
          </div>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  showResult
                    ? index === question.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : index === selectedAnswer
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                    : selectedAnswer === index
                    ? 'border-[#ec43ef] bg-[#ec43ef]/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    showResult
                      ? index === question.correctAnswer
                        ? 'border-green-500 bg-green-500'
                        : index === selectedAnswer
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300'
                      : selectedAnswer === index
                      ? 'border-[#ec43ef] bg-[#ec43ef]'
                      : 'border-gray-300'
                  }`}>
                    {showResult && index === question.correctAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                    {showResult && index === selectedAnswer && index !== question.correctAnswer && (
                      <XCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {!showResult && (
          <button
            onClick={handleAnswer}
            disabled={selectedAnswer === null}
            className="w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-[#ec43ef] to-[#b830e8] text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Confirmar Resposta
          </button>
        )}

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className={`p-4 rounded-xl ${
              selectedAnswer === question.correctAnswer
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                {selectedAnswer === question.correctAnswer ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-900">Correto!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-900">Incorreto</span>
                  </>
                )}
                <span className="ml-auto text-gray-600">
                  Tempo: {((Date.now() - startTime) / 1000).toFixed(1)}s
                </span>
              </div>

              <div className="text-sm text-gray-700">
                <div className="font-medium mb-2">Keywords atualizadas:</div>
                <div className="flex flex-wrap gap-2">
                  {[...question.keywords.primary, ...question.keywords.secondary].map((kw) => {
                    const state = keywords[kw.toLowerCase()];
                    if (!state) return null;
                    return (
                      <div
                        key={kw}
                        className={`px-2 py-1 rounded text-xs font-medium ${getColorForKeyword(state.color)}`}
                      >
                        {kw}: {Math.round(state.mastery * 100)}%
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-[#ec43ef] to-[#b830e8] text-white hover:shadow-lg transition-all"
            >
              {currentQuestion < DEMO_QUESTIONS.length - 1 ? 'Próxima Questão' : 'Ver Resultados'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Keyword stats sidebar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado das Keywords</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{stats.byColor.red}</div>
            <div className="text-xs text-gray-600">Vermelho</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{stats.byColor.yellow}</div>
            <div className="text-xs text-gray-600">Amarelo</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.byColor.green}</div>
            <div className="text-xs text-gray-600">Verde</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
