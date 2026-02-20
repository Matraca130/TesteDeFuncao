// ============================================================
// Axon v4.4 — AI Feedback Hooks (Agent 7 — NEXUS)
// Architecture: UI → Hook → ai-api → Backend
//
// Each hook provides: { data, loading, error, refetch }
// Falls back to mock data on API failure (for resilience).
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchQuizFeedback, fetchFlashcardFeedback,
  fetchSummaryDiagnostic, fetchLearningProfile,
  regenerateLearningProfile,
  type QuizFeedbackData, type FlashcardFeedbackData,
  type SummaryDiagnosticData, type LearningProfileData,
} from '../services/ai-api';

// ── Generic async hook ──

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isMock: boolean;
}

function useAsyncAi<T>(
  fetcher: () => Promise<T>,
  mockData: T,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null, loading: true, error: null, isMock: false,
  });
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null, isMock: false });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[useAiFeedback] API failed, using mock data: ${msg}`);
      if (mountedRef.current) {
        setState({ data: mockData, loading: false, error: msg, isMock: true });
      }
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);

  return { ...state, refetch: execute };
}

// ── Mock Data (Section 14 — fallback) ──

const MOCK_QUIZ: QuizFeedbackData = {
  bundle_id: 'bnd-1',
  summary: { total_questions: 10, correct: 7, incorrect: 3, accuracy: 70, time_spent_seconds: 720 },
  strengths: ['Bom dominio dos conceitos basicos de biologia celular', 'Excelente compreensao de vocabulario tecnico'],
  weaknesses: ['Confusao entre meiose e mitose', 'Dificuldade em aplicar conceitos a situacoes novas'],
  recommendations: ['Revisar o capitulo sobre divisao celular', 'Praticar mais flashcards sobre meiose vs mitose', 'Fazer exercicios de aplicacao pratica'],
  per_question_feedback: [
    { question_id: 'qq-1', question_text: 'Qual organela produz ATP?', was_correct: true, student_answer: 'Mitocondria', correct_answer: 'Mitocondria', ai_explanation: 'Correto! A mitocondria e a "usina de energia" da celula.' },
    { question_id: 'qq-2', question_text: 'A meiose produz celulas diploides.', was_correct: false, student_answer: 'Verdadeiro', correct_answer: 'Falso', ai_explanation: 'A meiose produz celulas HAPLOIDES.' },
    { question_id: 'qq-3', question_text: 'A enzima responsavel pela replicacao do DNA e a _____.', was_correct: true, student_answer: 'DNA polimerase', correct_answer: 'DNA polimerase', ai_explanation: 'Exato! A DNA polimerase catalisa a sintese de novas fitas de DNA.' },
    { question_id: 'qq-4', question_text: 'Qual estrutura celular contem DNA?', was_correct: true, student_answer: 'Nucleo', correct_answer: 'Nucleo', ai_explanation: 'Correto! O nucleo e o principal compartimento do DNA.' },
    { question_id: 'qq-5', question_text: 'O ribossomo e responsavel pela sintese de _____.', was_correct: true, student_answer: 'Proteinas', correct_answer: 'Proteinas', ai_explanation: 'Perfeito! Os ribossomos traduzem mRNA em proteinas.' },
    { question_id: 'qq-6', question_text: 'A osmose envolve o transporte de solutos.', was_correct: false, student_answer: 'Verdadeiro', correct_answer: 'Falso', ai_explanation: 'A osmose e o transporte de AGUA (solvente), nao de solutos.' },
    { question_id: 'qq-7', question_text: 'Qual organela realiza a fotossintese?', was_correct: true, student_answer: 'Cloroplasto', correct_answer: 'Cloroplasto', ai_explanation: 'Correto! O cloroplasto realiza a fotossintese.' },
    { question_id: 'qq-8', question_text: 'Complexo de Golgi esta envolvido em que processo?', was_correct: true, student_answer: 'Modificacao e empacotamento de proteinas', correct_answer: 'Modificacao e empacotamento de proteinas', ai_explanation: 'Exato! O Golgi modifica e direciona proteinas.' },
    { question_id: 'qq-9', question_text: 'Celulas procarioticas possuem nucleo definido.', was_correct: false, student_answer: 'Verdadeiro', correct_answer: 'Falso', ai_explanation: 'Procarioticas NAO possuem nucleo definido.' },
    { question_id: 'qq-10', question_text: 'O reticulo endoplasmatico rugoso possui _____ em sua superficie.', was_correct: true, student_answer: 'Ribossomos', correct_answer: 'Ribossomos', ai_explanation: 'Correto! O RER tem ribossomos aderidos.' },
  ],
  study_strategy: 'Foque em revisar os conceitos de divisao celular esta semana. Recomendo 20 minutos diarios de flashcards sobre meiose e mitose.',
  encouragement: 'Voce acertou 70% das questoes! Seus pontos fortes em organelas sao evidentes. Continue assim!',
};

const MOCK_FLASHCARD: FlashcardFeedbackData = {
  period: { from: '2026-02-12', to: '2026-02-19', days: 7 },
  stats: { cards_reviewed: 45, cards_mastered: 12, cards_struggling: 5, retention_rate: 78, average_interval_days: 4.2, streak_days: 5 },
  struggling_cards: [
    { flashcard_id: 'fc-1', front: 'O que e a cadeia de transporte de eletrons?', times_failed: 4, ai_tip: 'Pense na cadeia como uma "escada" de energia.' },
    { flashcard_id: 'fc-2', front: 'Diferencie celula procariota de eucariota', times_failed: 3, ai_tip: 'PRO = ANTES do nucleo. EU = nucleo VERDADEIRO.' },
    { flashcard_id: 'fc-3', front: 'Qual a funcao do complexo de Golgi?', times_failed: 3, ai_tip: 'Pense no Golgi como os "Correios" da celula.' },
    { flashcard_id: 'fc-4', front: 'O que e a fosforilacao oxidativa?', times_failed: 3, ai_tip: 'Processo final da respiracao celular na membrana interna da mitocondria.' },
    { flashcard_id: 'fc-5', front: 'Descreva o ciclo de Krebs resumidamente', times_failed: 2, ai_tip: 'Fabrica circular que quebra acetil-CoA na matriz mitocondrial.' },
  ],
  strengths: ['Boa retencao de vocabulario basico', 'Consistencia nas revisoes diarias', 'Melhoria progressiva na taxa de acerto'],
  improvements: ['Aumentar tempo de estudo em 10 min/dia', 'Focar nos cards que falhou 3+ vezes', 'Revisar conceitos de bioquimica'],
  ai_study_tips: [
    'Use "elaborative interrogation": pergunte "por que?" para cada conceito',
    'Crie imagens mentais para associar conceitos abstratos',
    'Revise os cards dificeis logo de manha',
    'Tente explicar cada conceito em voz alta',
  ],
  next_session_recommendation: 'Amanha, foque nos 5 cards dificeis e adicione 3 novos sobre divisao celular. Sessao: 25 min.',
};

const MOCK_DIAGNOSTIC: SummaryDiagnosticData = {
  summary_id: 'sum-1',
  summary_title: 'Biologia Celular',
  overall_mastery: 62,
  bkt_level: 'yellow',
  keywords_breakdown: [
    { keyword_id: 'kw-1', term: 'Mitocondria', p_know: 0.85, bkt_color: '#22c55e', status: 'dominado' },
    { keyword_id: 'kw-2', term: 'Ribossomo', p_know: 0.65, bkt_color: '#eab308', status: 'em_progresso' },
    { keyword_id: 'kw-3', term: 'DNA Polimerase', p_know: 0.45, bkt_color: '#f97316', status: 'em_progresso' },
    { keyword_id: 'kw-4', term: 'Meiose', p_know: 0.15, bkt_color: '#ef4444', status: 'precisa_atencao' },
    { keyword_id: 'kw-5', term: 'Complexo de Golgi', p_know: 0.78, bkt_color: '#22c55e', status: 'dominado' },
    { keyword_id: 'kw-6', term: 'Reticulo Endoplasmatico', p_know: 0.55, bkt_color: '#eab308', status: 'em_progresso' },
    { keyword_id: 'kw-7', term: 'Membrana Plasmatica', p_know: 0.90, bkt_color: '#22c55e', status: 'dominado' },
    { keyword_id: 'kw-8', term: 'Lisossomo', p_know: 0.30, bkt_color: '#f97316', status: 'em_progresso' },
  ],
  quiz_performance: { total_attempts: 8, average_accuracy: 68, best_topic: 'Mitocondria', worst_topic: 'Meiose' },
  flashcard_performance: { total_reviews: 120, retention_rate: 75, mastered_count: 15 },
  ai_analysis: {
    overall_assessment: 'Voce tem uma base solida em biologia celular, especialmente em organelas. Conceitos de divisao celular precisam de mais atencao.',
    key_strengths: ['Organelas celulares', 'Vocabulario tecnico', 'Processos metabolicos basicos'],
    gaps: ['Divisao celular (meiose vs mitose)', 'Replicacao de DNA detalhada', 'Funcao dos lisossomos', 'Aplicacao pratica'],
    recommended_actions: ['Revisar meiose com videos', 'Fazer 10 questoes de divisao celular', 'Criar flashcards de DNA polimerase', 'Revisar lisossomos'],
    estimated_time_to_mastery: 'Aproximadamente 8 horas de estudo focado',
  },
  study_plan_suggestion: {
    priority_keywords: ['Meiose', 'Lisossomo', 'DNA Polimerase'],
    recommended_order: ['Meiose', 'Lisossomo', 'DNA Polimerase', 'Reticulo Endoplasmatico', 'Ribossomo'],
    daily_goal_minutes: 30,
  },
};

const MOCK_PROFILE: LearningProfileData = {
  student_id: 's-1',
  generated_at: '2026-02-19T10:30:00Z',
  cached: false,
  global_stats: {
    total_study_hours: 42, total_quizzes_completed: 15, total_flashcards_reviewed: 320,
    total_keywords_studied: 28, keywords_mastered: 12, keywords_in_progress: 10, keywords_weak: 6,
    overall_accuracy: 72, current_streak_days: 5, longest_streak_days: 14, study_consistency: 68,
  },
  ai_profile: {
    learning_style: 'Visual-Pratico',
    strongest_areas: ['Biologia Celular', 'Genetica Basica', 'Anatomia'],
    weakest_areas: ['Ecologia', 'Evolucao', 'Bioquimica'],
    study_pattern: 'Estuda mais a noite (19h-22h), prefere sessoes curtas de 30-45 minutos',
    personality_insight: 'Aluno dedicado que aprende melhor com exemplos visuais e praticos.',
  },
  ai_recommendations: {
    immediate_actions: ['Revisar Meiose (prioridade alta)', 'Completar 5 flashcards de Ecologia', 'Fazer quiz de revisao de Genetica'],
    weekly_goals: ['Dominar 3 keywords novas', 'Manter racha de estudo', 'Completar 2 quizzes'],
    long_term_strategy: 'Foque em construir uma base solida em Ecologia nas proximas 2 semanas.',
    recommended_study_time: '45 min/dia, 5 dias/semana',
    focus_keywords: ['Meiose', 'Ecossistema', 'Selecao Natural', 'Ciclo de Krebs', 'Fosforilacao'],
  },
  progress_timeline: [
    { week: 'Sem 3', keywords_mastered: 1, accuracy: 55, hours_studied: 3 },
    { week: 'Sem 4', keywords_mastered: 2, accuracy: 58, hours_studied: 4 },
    { week: 'Sem 5', keywords_mastered: 2, accuracy: 60, hours_studied: 5 },
    { week: 'Sem 6', keywords_mastered: 3, accuracy: 65, hours_studied: 7 },
    { week: 'Sem 7', keywords_mastered: 4, accuracy: 72, hours_studied: 8 },
    { week: 'Sem 8', keywords_mastered: 5, accuracy: 75, hours_studied: 9 },
  ],
  motivation: {
    message: 'Voce ja estudou 42 horas e dominou 12 keywords — isso e impressionante!',
    achievement_highlight: 'Racha de 5 dias consecutivos de estudo!',
    next_milestone: 'Faltam 3 keywords para dominar Biologia Celular!',
  },
};

// ── Exported Hooks ──

/** A7-06: Quiz Feedback hook */
export function useQuizFeedback(bundleId: string | undefined) {
  return useAsyncAi(
    () => fetchQuizFeedback(bundleId || 'bnd-1'),
    MOCK_QUIZ,
    [bundleId],
  );
}

/** A7-07: Flashcard Feedback hook */
export function useFlashcardFeedback(periodDays: number) {
  return useAsyncAi(
    () => fetchFlashcardFeedback(periodDays),
    MOCK_FLASHCARD,
    [periodDays],
  );
}

/** A7-08: Summary Diagnostic hook */
export function useSummaryDiagnostic(summaryId: string | undefined) {
  return useAsyncAi(
    () => fetchSummaryDiagnostic(summaryId || 'sum-1'),
    MOCK_DIAGNOSTIC,
    [summaryId],
  );
}

/** A7-09: Learning Profile hook */
export function useLearningProfile() {
  const [state, setState] = useState<{
    data: LearningProfileData | null;
    loading: boolean;
    error: string | null;
    isMock: boolean;
    regenerating: boolean;
  }>({ data: null, loading: true, error: null, isMock: false, regenerating: false });
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetchLearningProfile();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null, isMock: false, regenerating: false });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[useLearningProfile] API failed, using mock: ${msg}`);
      if (mountedRef.current) {
        setState({ data: { ...MOCK_PROFILE, cached: true }, loading: false, error: msg, isMock: true, regenerating: false });
      }
    }
  }, []);

  const regenerate = useCallback(async () => {
    setState(prev => ({ ...prev, regenerating: true, error: null }));
    try {
      const result = await regenerateLearningProfile();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null, isMock: false, regenerating: false });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[useLearningProfile] Regenerate failed: ${msg}`);
      if (mountedRef.current) {
        setState(prev => ({ ...prev, regenerating: false, error: msg }));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return { ...state, refetch: load, regenerate };
}
