// A7-06 | QuizFeedbackView.tsx — Agent 7 (NEXUS)
// UI post-quiz feedback with AI insights
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  CheckCircle, XCircle, AlertTriangle, BookOpen,
  ArrowLeft, RotateCcw, Layers, Brain, Sparkles, Clock,
  Target, TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '../components/ui/accordion';
import { FeedbackSkeleton } from '../components/shared/ErrorBoundary';

// ── Mock Data (Section 14) ──
const MOCK_QUIZ_FEEDBACK = {
  bundle_id: 'bnd-1',
  summary: {
    total_questions: 10,
    correct: 7,
    incorrect: 3,
    accuracy: 70,
    time_spent_seconds: 720,
  },
  strengths: [
    'Bom dominio dos conceitos basicos de biologia celular',
    'Excelente compreensao de vocabulario tecnico',
  ],
  weaknesses: [
    'Confusao entre meiose e mitose',
    'Dificuldade em aplicar conceitos a situacoes novas',
  ],
  recommendations: [
    'Revisar o capitulo sobre divisao celular',
    'Praticar mais flashcards sobre meiose vs mitose',
    'Fazer exercicios de aplicacao pratica',
  ],
  per_question_feedback: [
    { question_id: 'qq-1', question_text: 'Qual organela produz ATP?', was_correct: true, student_answer: 'Mitocondria', correct_answer: 'Mitocondria', ai_explanation: 'Correto! A mitocondria e a "usina de energia" da celula, responsavel pela producao de ATP atraves da respiracao celular.' },
    { question_id: 'qq-2', question_text: 'A meiose produz celulas diploides.', was_correct: false, student_answer: 'Verdadeiro', correct_answer: 'Falso', ai_explanation: 'A meiose produz celulas HAPLOIDES (com metade dos cromossomos). A MITOSE e que produz celulas diploides.' },
    { question_id: 'qq-3', question_text: 'A enzima responsavel pela replicacao do DNA e a _____.', was_correct: true, student_answer: 'DNA polimerase', correct_answer: 'DNA polimerase', ai_explanation: 'Exato! A DNA polimerase catalisa a sintese de novas fitas de DNA durante a replicacao.' },
    { question_id: 'qq-4', question_text: 'Qual estrutura celular contem DNA?', was_correct: true, student_answer: 'Nucleo', correct_answer: 'Nucleo', ai_explanation: 'Correto! O nucleo e o principal compartimento onde o DNA esta localizado nas celulas eucarioticas.' },
    { question_id: 'qq-5', question_text: 'O ribossomo e responsavel pela sintese de _____.', was_correct: true, student_answer: 'Proteinas', correct_answer: 'Proteinas', ai_explanation: 'Perfeito! Os ribossomos sao organelas responsaveis pela traducao do mRNA em proteinas.' },
    { question_id: 'qq-6', question_text: 'A osmose envolve o transporte de solutos.', was_correct: false, student_answer: 'Verdadeiro', correct_answer: 'Falso', ai_explanation: 'A osmose e o transporte de AGUA (solvente), nao de solutos, atraves de uma membrana semipermeavel.' },
    { question_id: 'qq-7', question_text: 'Qual organela realiza a fotossintese?', was_correct: true, student_answer: 'Cloroplasto', correct_answer: 'Cloroplasto', ai_explanation: 'Correto! O cloroplasto e a organela vegetal responsavel pela fotossintese.' },
    { question_id: 'qq-8', question_text: 'O complexo de Golgi esta envolvido em que processo?', was_correct: true, student_answer: 'Modificacao e empacotamento de proteinas', correct_answer: 'Modificacao e empacotamento de proteinas', ai_explanation: 'Exato! O complexo de Golgi modifica, empacota e direciona proteinas e lipideos para seus destinos finais.' },
    { question_id: 'qq-9', question_text: 'Celulas procarioticas possuem nucleo definido.', was_correct: false, student_answer: 'Verdadeiro', correct_answer: 'Falso', ai_explanation: 'Celulas procarioticas NAO possuem nucleo definido (membrana nuclear). Seu material genetico fica disperso no citoplasma.' },
    { question_id: 'qq-10', question_text: 'O reticulo endoplasmatico rugoso possui _____ em sua superficie.', was_correct: true, student_answer: 'Ribossomos', correct_answer: 'Ribossomos', ai_explanation: 'Correto! O RER (Reticulo Endoplasmatico Rugoso) recebe esse nome por ter ribossomos aderidos a sua membrana.' },
  ],
  study_strategy: 'Foque em revisar os conceitos de divisao celular esta semana. Recomendo 20 minutos diarios de flashcards sobre meiose e mitose, seguidos de 2-3 questoes praticas. Tambem revise os conceitos de transporte celular (osmose vs difusao).',
  encouragement: 'Voce acertou 70% das questoes, o que mostra um bom progresso! Seus pontos fortes em organelas celulares sao evidentes. Continue assim e foque nas areas de melhoria — voce esta no caminho certo para dominar biologia celular!',
};

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0min';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

export function QuizFeedbackView() {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<typeof MOCK_QUIZ_FEEDBACK | null>(null);

  useEffect(() => {
    // Simulate API call to POST /ai/quiz-feedback
    const timer = setTimeout(() => {
      setData(MOCK_QUIZ_FEEDBACK);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [bundleId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2ea]">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <p className="text-indigo-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Analisando seu desempenho...
            </p>
          </div>
          <FeedbackSkeleton />
        </div>
      </div>
    );
  }

  const { summary, strengths, weaknesses, recommendations, per_question_feedback, study_strategy, encouragement } = data;
  const accuracyColor = summary.accuracy >= 75 ? 'text-green-600' : summary.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      <ScrollArea className="h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Accuracy Circle */}
            <div className="relative flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-8 border-gray-200 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-gray-200" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                    strokeDasharray={`${summary.accuracy * 2.64} 264`}
                    strokeLinecap="round"
                    className={summary.accuracy >= 75 ? 'stroke-green-500' : summary.accuracy >= 50 ? 'stroke-yellow-500' : 'stroke-red-500'}
                  />
                </svg>
                <span className={`text-3xl ${accuracyColor}`} style={{ fontFamily: 'Georgia, serif' }}>
                  {summary.accuracy}%
                </span>
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Quiz Feedback
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Total: {summary.total_questions}</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Acertos: {summary.correct}</span>
                </div>
                <div className="flex items-center gap-1 text-red-500">
                  <XCircle className="w-4 h-4" />
                  <span>Erros: {summary.incorrect}</span>
                </div>
                {summary.time_spent_seconds != null && summary.time_spent_seconds > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(summary.time_spent_seconds)}</span>
                  </div>
                )}
              </div>
              <Progress value={summary.accuracy} className="mt-3 h-2" />
            </div>
          </div>

          <Separator />

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700" style={{ fontFamily: 'Georgia, serif' }}>
                  <CheckCircle className="w-5 h-5" />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {strengths.map((s, i) => (
                    <Badge key={i} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-700" style={{ fontFamily: 'Georgia, serif' }}>
                  <AlertTriangle className="w-5 h-5" />
                  Areas de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weaknesses.map((w, i) => (
                    <Badge key={i} variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      {w}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-Question Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Feedback por Pergunta
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Inter, sans-serif' }}>
                Clique em cada pergunta para ver a explicacao detalhada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {per_question_feedback.map((q, i) => (
                  <AccordionItem key={q.question_id} value={q.question_id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        {q.was_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>
                          <span className="text-gray-500 mr-2">P{i + 1}.</span>
                          {q.question_text}
                        </span>
                        <Badge variant={q.was_correct ? 'outline' : 'destructive'} className="ml-auto shrink-0">
                          {q.was_correct ? 'Correta' : 'Errada'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className={`rounded-lg p-3 ${q.was_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <p className="text-xs text-gray-500 mb-1">Sua resposta</p>
                            <p className={q.was_correct ? 'text-green-800' : 'text-red-800'}>
                              {q.student_answer}
                            </p>
                          </div>
                          {!q.was_correct && (
                            <div className="rounded-lg p-3 bg-green-50 border border-green-200">
                              <p className="text-xs text-gray-500 mb-1">Resposta correta</p>
                              <p className="text-green-800">{q.correct_answer}</p>
                            </div>
                          )}
                        </div>
                        <div className="rounded-lg p-3 bg-indigo-50 border border-indigo-200">
                          <div className="flex items-start gap-2">
                            <Brain className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-indigo-900">{q.ai_explanation}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Study Strategy */}
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700" style={{ fontFamily: 'Georgia, serif' }}>
                <TrendingUp className="w-5 h-5" />
                Estrategia de Estudo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                {study_strategy}
              </p>
              <div className="space-y-2">
                <p className="text-indigo-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Recomendacoes:
                </p>
                {recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5" style={{ fontSize: '11px' }}>
                      {i + 1}
                    </div>
                    <span className="text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{r}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Encouragement */}
          <Card className="border-teal-200 bg-teal-50/30">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-teal-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {encouragement}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate(`/study/quiz-feedback/${bundleId}`)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => navigate('/study/flashcard-feedback')}>
              <Layers className="w-4 h-4 mr-2" />
              Estudar Flashcards
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}