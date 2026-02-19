// ============================================================
// useAIAssistant — Custom hook: all state & business logic
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/app/context/AppContext';
import * as ai from '@/app/services/aiService';
import type { ChatMessage, GeneratedFlashcard, GeneratedQuestion } from '@/app/services/aiService';
import type { AssistantMode, DisplayMessage, QuizDifficulty } from './types';

export function useAIAssistant(isOpen: boolean) {
  const { currentCourse, currentTopic } = useApp();

  // ── Shared state ────────────────────────────────────────
  const [mode, setMode] = useState<AssistantMode>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Chat state ──────────────────────────────────────────
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Flashcard state ─────────────────────────────────────
  const [flashcardTopic, setFlashcardTopic] = useState('');
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  // ── Quiz state ──────────────────────────────────────────
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<QuizDifficulty>('intermediate');
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());
  const [showExplanations, setShowExplanations] = useState<Set<number>>(new Set());

  // ── Explain state ───────────────────────────────────────
  const [explainConcept, setExplainConcept] = useState('');
  const [explanation, setExplanation] = useState('');

  // ── Effects ───────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && mode === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, mode]);

  // ── Helpers ───────────────────────────────────────────

  const context: ai.ChatContext = {
    courseName: currentCourse?.name,
    topicTitle: currentTopic?.title,
  };

  const addMessage = (role: DisplayMessage['role'], content: string, isError = false) => {
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        role,
        content,
        timestamp: new Date(),
        isError,
      },
    ]);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Chat actions ────────────────────────────────────────

  const sendChat = useCallback(
    async (text?: string) => {
      const msg = text || input.trim();
      if (!msg || isLoading) return;
      setInput('');

      addMessage('user', msg);
      setIsLoading(true);

      try {
        const history: ChatMessage[] = messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role as 'user' | 'model', content: m.content }));
        history.push({ role: 'user', content: msg });

        const reply = await ai.chat(history, context);
        addMessage('model', reply);
      } catch (err: any) {
        addMessage('system', `Erro: ${err.message}`, true);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, context]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  // ── Flashcard actions ───────────────────────────────────

  const generateFlashcards = async () => {
    const topic = flashcardTopic.trim() || currentTopic?.title || currentCourse?.name;
    if (!topic) return;
    setIsLoading(true);
    setGeneratedCards([]);
    setFlippedCards(new Set());
    try {
      const cards = await ai.generateFlashcards(topic, flashcardCount);
      setGeneratedCards(cards);
    } catch (err: any) {
      addMessage('system', `Erro ao gerar flashcards: ${err.message}`, true);
      setMode('chat');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlipCard = (index: number) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // ── Quiz actions ────────────────────────────────────────

  const generateQuiz = async () => {
    const topic = quizTopic.trim() || currentTopic?.title || currentCourse?.name;
    if (!topic) return;
    setIsLoading(true);
    setGeneratedQuiz([]);
    setSelectedAnswers(new Map());
    setShowExplanations(new Set());
    try {
      const questions = await ai.generateQuiz(topic, 3, quizDifficulty);
      setGeneratedQuiz(questions);
    } catch (err: any) {
      addMessage('system', `Erro ao gerar quiz: ${err.message}`, true);
      setMode('chat');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    if (selectedAnswers.has(questionIndex)) return;
    const nextAnswers = new Map(selectedAnswers);
    nextAnswers.set(questionIndex, optionIndex);
    setSelectedAnswers(nextAnswers);

    const nextExp = new Set(showExplanations);
    nextExp.add(questionIndex);
    setShowExplanations(nextExp);
  };

  // ── Explain actions ─────────────────────────────────────

  const explainFn = async () => {
    const concept = explainConcept.trim();
    if (!concept) return;
    setIsLoading(true);
    setExplanation('');
    try {
      const result = await ai.explainConcept(concept, currentCourse?.name);
      setExplanation(result);
    } catch (err: any) {
      addMessage('system', `Erro ao explicar: ${err.message}`, true);
      setMode('chat');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Mode switching ──────────────────────────────────────

  const resetMode = (newMode: AssistantMode) => {
    setMode(newMode);
    if (newMode === 'flashcards') {
      setGeneratedCards([]);
      setFlashcardTopic(currentTopic?.title || '');
    }
    if (newMode === 'quiz') {
      setGeneratedQuiz([]);
      setQuizTopic(currentTopic?.title || '');
    }
    if (newMode === 'explain') {
      setExplanation('');
      setExplainConcept('');
    }
  };

  // ── Return ────────────────────────────────────────────

  return {
    // Shared
    mode,
    isLoading,
    copiedId,
    copyText,
    resetMode,
    currentCourse,
    currentTopic,

    // Chat
    chat: {
      messages,
      input,
      setInput,
      sendChat,
      handleKeyDown,
      chatEndRef,
      inputRef,
    },

    // Flashcards
    flashcards: {
      topic: flashcardTopic,
      setTopic: setFlashcardTopic,
      count: flashcardCount,
      setCount: setFlashcardCount,
      cards: generatedCards,
      setCards: setGeneratedCards,
      flippedCards,
      toggleFlip: toggleFlipCard,
      generate: generateFlashcards,
    },

    // Quiz
    quiz: {
      topic: quizTopic,
      setTopic: setQuizTopic,
      difficulty: quizDifficulty,
      setDifficulty: setQuizDifficulty,
      questions: generatedQuiz,
      setQuestions: setGeneratedQuiz,
      selectedAnswers,
      showExplanations,
      selectAnswer,
      generate: generateQuiz,
    },

    // Explain
    explain: {
      concept: explainConcept,
      setConcept: setExplainConcept,
      explanation,
      setExplanation,
      run: explainFn,
    },
  };
}

export type AIAssistantHook = ReturnType<typeof useAIAssistant>;
