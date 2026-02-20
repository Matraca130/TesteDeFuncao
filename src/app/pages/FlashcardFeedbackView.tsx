// A7-07 | FlashcardFeedbackView.tsx — Agent 7 (NEXUS)
// UI post-flashcard feedback with AI insights
// Architecture: UI → useFlashcardFeedback → ai-api → Backend
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Layers, Brain, Sparkles, Flame, TrendingUp,
  AlertTriangle, Lightbulb, Calendar, BarChart3, Play, Timer,
  Wifi, WifiOff, RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { FeedbackSkeleton } from '../components/shared/ErrorBoundary';
import { useFlashcardFeedback } from '../hooks/useAiFeedback';

const PERIOD_OPTIONS = [
  { value: 7, label: 'Ultimos 7 dias' },
  { value: 14, label: 'Ultimos 14 dias' },
  { value: 30, label: 'Ultimos 30 dias' },
];

export function FlashcardFeedbackView() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const { data, loading, isMock, refetch } = useFlashcardFeedback(selectedPeriod);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2ea]">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <p className="text-indigo-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Analisando suas revisoes com AI...
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
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              {isMock ? (
                <Badge variant="outline" className="text-orange-500 border-orange-300">
                  <WifiOff className="w-3 h-3 mr-1" /> Mock
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  <Wifi className="w-3 h-3 mr-1" /> AI Live
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={refetch}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
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
