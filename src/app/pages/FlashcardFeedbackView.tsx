// A7-07 | FlashcardFeedbackView.tsx — Agent 7 (NEXUS)
// UI post-flashcard feedback with AI insights
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Layers, Brain, Sparkles, Flame, TrendingUp,
  AlertTriangle, Lightbulb, Calendar, BarChart3, Play, Timer
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { FeedbackSkeleton } from '../components/shared/ErrorBoundary';

// ── Mock Data (Section 14) ──
const MOCK_FLASHCARD_FEEDBACK = {
  period: { from: '2026-02-12', to: '2026-02-19', days: 7 },
  stats: {
    cards_reviewed: 45,
    cards_mastered: 12,
    cards_struggling: 5,
    retention_rate: 78,
    average_interval_days: 4.2,
    streak_days: 5,
  },
  struggling_cards: [
    { flashcard_id: 'fc-1', front: 'O que e a cadeia de transporte de eletrons?', times_failed: 4, ai_tip: 'Pense na cadeia como uma "escada" de energia — cada passo libera um pouco de energia para produzir ATP. Imagine os eletrons descendo uma escada, liberando energia em cada degrau.' },
    { flashcard_id: 'fc-2', front: 'Diferencie celula procariota de eucariota', times_failed: 3, ai_tip: 'Lembre: PRO = ANTES do nucleo (sem membrana nuclear). EU = VERDADEIRO nucleo (com membrana). Pro-cariota = "antes do nucleo". Eu-cariota = "nucleo verdadeiro".' },
    { flashcard_id: 'fc-3', front: 'Qual a funcao do complexo de Golgi?', times_failed: 3, ai_tip: 'Pense no Golgi como os "Correios" da celula: ele recebe, empacota e envia proteinas para seus destinos corretos.' },
    { flashcard_id: 'fc-4', front: 'O que e a fosforilacao oxidativa?', times_failed: 3, ai_tip: 'E o processo final da respiracao celular, onde a energia dos eletrons e usada para "bombear" H+ e produzir ATP. Acontece na membrana interna da mitocondria.' },
    { flashcard_id: 'fc-5', front: 'Descreva o ciclo de Krebs resumidamente', times_failed: 2, ai_tip: 'O ciclo de Krebs e como uma "fabrica circular" que quebra o acetil-CoA e gera CO2, NADH, FADH2 e ATP. Acontece na matriz mitocondrial.' },
  ],
  strengths: ['Boa retencao de vocabulario basico', 'Consistencia nas revisoes diarias', 'Melhoria progressiva na taxa de acerto'],
  improvements: ['Aumentar tempo de estudo em 10 min/dia', 'Focar nos cards que falhou 3+ vezes', 'Revisar conceitos de bioquimica'],
  ai_study_tips: [
    'Use a tecnica de "elaborative interrogation": pergunte "por que?" para cada conceito',
    'Crie imagens mentais para associar conceitos abstratos a situacoes concretas',
    'Revise os cards dificeis logo de manha, quando a memoria esta mais fresca',
    'Tente explicar cada conceito em voz alta como se estivesse ensinando alguem',
  ],
  next_session_recommendation: 'Amanha, foque em revisar os 5 cards com dificuldade e adicione 3 novos cards sobre divisao celular. Sessao recomendada: 25 minutos.',
};

const PERIOD_OPTIONS = [
  { value: 7, label: 'Ultimos 7 dias' },
  { value: 14, label: 'Ultimos 14 dias' },
  { value: 30, label: 'Ultimos 30 dias' },
];

export function FlashcardFeedbackView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<typeof MOCK_FLASHCARD_FEEDBACK | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setData(MOCK_FLASHCARD_FEEDBACK);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [selectedPeriod]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2ea]">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <p className="text-indigo-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Analisando suas revisoes...
            </p>
          </div>
          <FeedbackSkeleton />
        </div>
      </div>
    );
  }

  const { stats, struggling_cards, strengths, improvements, ai_study_tips, next_session_recommendation } = data;

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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Flashcard Feedback
              </h1>
              <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Analise de desempenho nas revisoes de flashcards
              </p>
            </div>
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={selectedPeriod === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(opt.value)}
                  className={selectedPeriod === opt.value ? 'bg-teal-600 hover:bg-teal-700' : ''}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="py-5 text-center">
                <Layers className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                <p className="text-3xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{stats.cards_reviewed}</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Cards Revisados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 text-center">
                <BarChart3 className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                <p className="text-3xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{stats.retention_rate}%</p>
                <p className="text-gray-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Taxa de Retencao</p>
                <Progress value={stats.retention_rate} className="h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 text-center">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-3xl text-green-600" style={{ fontFamily: 'Georgia, serif' }}>{stats.cards_mastered}</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Cards Dominados</p>
                <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-300">Excelente</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 text-center">
                <Timer className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <p className="text-3xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{stats.average_interval_days}d</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Intervalo Medio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 text-center">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-3xl text-orange-600" style={{ fontFamily: 'Georgia, serif' }}>{stats.streak_days}</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Dias de Racha</p>
                <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 border-orange-300">
                  <Flame className="w-3 h-3 mr-1" /> Ativo
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Struggling Cards */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700" style={{ fontFamily: 'Georgia, serif' }}>
                <AlertTriangle className="w-5 h-5" />
                Cards com Dificuldade ({stats.cards_struggling})
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Inter, sans-serif' }}>
                Cards que voce errou 2+ vezes com dicas personalizadas de AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {struggling_cards.map((card) => (
                <div key={card.flashcard_id} className="rounded-lg border border-orange-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {card.front}
                    </p>
                    <Badge variant="outline" className="shrink-0 bg-red-50 text-red-700 border-red-300">
                      {card.times_failed}x falhou
                    </Badge>
                  </div>
                  <div className="rounded-lg p-3 bg-indigo-50 border border-indigo-200">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                      <p className="text-indigo-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {card.ai_tip}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700" style={{ fontFamily: 'Georgia, serif' }}>
                  <TrendingUp className="w-5 h-5" />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-green-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-green-500 mt-1">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-700" style={{ fontFamily: 'Georgia, serif' }}>
                  <AlertTriangle className="w-5 h-5" />
                  Areas de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-orange-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-orange-500 mt-1">!</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* AI Study Tips */}
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700" style={{ fontFamily: 'Georgia, serif' }}>
                <Lightbulb className="w-5 h-5" />
                Dicas de Estudo (AI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ai_study_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5" style={{ fontSize: '12px' }}>
                      {i + 1}
                    </div>
                    <p className="text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Session */}
          <Card className="border-teal-200 bg-teal-50/30">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-teal-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Proxima Sessao Recomendada
                  </p>
                  <p className="text-teal-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {next_session_recommendation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              Iniciar Revisao
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}