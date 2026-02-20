// A7-08 | SummaryDiagnostic.tsx — Agent 7 (NEXUS)
// UI diagnostico de summary completo
// Architecture: UI → useSummaryDiagnostic → ai-api → Backend
// P5/A7-10: Migrated inline fontFamily → font-heading / font-body
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Brain, Sparkles, BookOpen, Target,
  TrendingUp, Layers, Clock, Play, AlertCircle,
  Wifi, WifiOff, RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FeedbackSkeleton } from '../components/shared/ErrorBoundary';
import { useSummaryDiagnostic } from '../hooks/useAiFeedback';

// ── BKT Color Helper ──
function getBktColor(pKnow: number) {
  if (pKnow < 0.25) return { color: '#ef4444', label: 'Nao domina', tw: 'bg-red-500', textTw: 'text-red-700', borderTw: 'border-red-300', bgTw: 'bg-red-50' };
  if (pKnow < 0.5) return { color: '#f97316', label: 'Em progresso', tw: 'bg-orange-500', textTw: 'text-orange-700', borderTw: 'border-orange-300', bgTw: 'bg-orange-50' };
  if (pKnow < 0.75) return { color: '#eab308', label: 'Quase domina', tw: 'bg-yellow-500', textTw: 'text-yellow-700', borderTw: 'border-yellow-300', bgTw: 'bg-yellow-50' };
  return { color: '#22c55e', label: 'Domina', tw: 'bg-green-500', textTw: 'text-green-700', borderTw: 'border-green-300', bgTw: 'bg-green-50' };
}

const STATUS_LABELS: Record<string, string> = {
  dominado: 'Dominado',
  em_progresso: 'Em progresso',
  precisa_atencao: 'Precisa atencao',
  nao_estudado: 'Nao estudado',
};

export function SummaryDiagnostic() {
  const { summaryId } = useParams();
  const navigate = useNavigate();
  const { data, loading, isMock, refetch } = useSummaryDiagnostic(summaryId);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2ea]">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <p className="text-indigo-600 font-body">
              Gerando diagnostico completo com AI...
            </p>
          </div>
          <FeedbackSkeleton />
        </div>
      </div>
    );
  }

  const overallBkt = getBktColor(data.overall_mastery / 100);

  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      <ScrollArea className="h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 space-y-6">

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
              <h1 className="text-gray-900 font-heading">
                {data.summary_title}
              </h1>
              <p className="text-gray-500 font-body">
                Diagnostico completo de dominio
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${overallBkt.bgTw} ${overallBkt.textTw} ${overallBkt.borderTw} border`}>
                {overallBkt.label}
              </Badge>
              <span className="text-3xl font-heading" style={{ color: overallBkt.color }}>
                {data.overall_mastery}%
              </span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overallBkt.tw}`}
              style={{ width: `${data.overall_mastery}%` }}
            />
          </div>

          <Separator />

          {/* Keywords Breakdown Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <BookOpen className="w-5 h-5 text-teal-500" />
                Keywords — Dominio Individual
              </CardTitle>
              <CardDescription className="font-body">
                Nivel de dominio de cada keyword deste resumo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.keywords_breakdown.map((kw) => {
                  const bkt = getBktColor(kw.p_know);
                  return (
                    <div
                      key={kw.keyword_id}
                      className="rounded-lg border p-3 bg-white hover:shadow-sm transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 font-body">
                          {kw.term}
                        </span>
                        <Badge variant="outline" className={`${bkt.bgTw} ${bkt.textTw} ${bkt.borderTw}`}>
                          {STATUS_LABELS[kw.status] || kw.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${bkt.tw}`}
                            style={{ width: `${kw.p_know * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {Math.round(kw.p_know * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Quiz / Flashcard / AI Analysis */}
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="quiz">Quiz Performance</TabsTrigger>
              <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
              <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="quiz">
              <Card>
                <CardContent className="py-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl text-gray-900 font-heading">
                        {data.quiz_performance.total_attempts}
                      </p>
                      <p className="text-gray-500 font-body">Tentativas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl text-gray-900 font-heading">
                        {data.quiz_performance.average_accuracy}%
                      </p>
                      <p className="text-gray-500 font-body">Acuracia Media</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-600 font-body">
                        <Target className="w-4 h-4 inline mr-1" />
                        Melhor: {data.quiz_performance.best_topic}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-500 font-body">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Pior: {data.quiz_performance.worst_topic}
                      </p>
                    </div>
                  </div>
                  <Progress value={data.quiz_performance.average_accuracy} className="h-2" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flashcard">
              <Card>
                <CardContent className="py-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Layers className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                      <p className="text-2xl text-gray-900 font-heading">
                        {data.flashcard_performance.total_reviews}
                      </p>
                      <p className="text-gray-500 font-body">Revisoes Totais</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                      <p className="text-2xl text-gray-900 font-heading">
                        {data.flashcard_performance.retention_rate}%
                      </p>
                      <p className="text-gray-500 font-body">Taxa de Retencao</p>
                    </div>
                    <div className="text-center">
                      <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl text-green-600 font-heading">
                        {data.flashcard_performance.mastered_count}
                      </p>
                      <p className="text-gray-500 font-body">Dominados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <div className="space-y-4">
                <Card className="border-indigo-200 bg-indigo-50/30">
                  <CardContent className="py-5">
                    <div className="flex items-start gap-3">
                      <Brain className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-gray-700 font-body">
                        {data.ai_analysis.overall_assessment}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-700 font-heading">
                        Fortalezas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {data.ai_analysis.key_strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-green-800 font-body">
                            <span className="text-green-500">+</span> {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-orange-700 font-heading">
                        Lacunas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {data.ai_analysis.gaps.map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-orange-800 font-body">
                            <span className="text-orange-500">!</span> {g}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-indigo-700 font-heading">
                      <Sparkles className="w-5 h-5" />
                      Acoes Recomendadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.ai_analysis.recommended_actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 text-xs">
                            {i + 1}
                          </div>
                          <span className="text-gray-700 font-body">{a}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 font-body">
                        {data.ai_analysis.estimated_time_to_mastery}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Study Plan Suggestion */}
          <Card className="border-teal-200 bg-teal-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700 font-heading">
                <BookOpen className="w-5 h-5" />
                Plano de Estudo Sugerido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-600 mb-2 font-body">
                  Keywords prioritarias:
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.study_plan_suggestion.priority_keywords.map((kw, i) => (
                    <Badge key={i} className="bg-red-100 text-red-800 border-red-300 border">
                      {i + 1}. {kw}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-600 mb-2 font-body">
                  Ordem recomendada de estudo:
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  {data.study_plan_suggestion.recommended_order.map((kw, i) => (
                    <span key={i} className="flex items-center">
                      <Badge variant="outline" className="bg-white">{kw}</Badge>
                      {i < data.study_plan_suggestion.recommended_order.length - 1 && (
                        <span className="text-gray-400 mx-1">{'\u2192'}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-teal-700">
                <Clock className="w-4 h-4" />
                <span className="font-body">
                  Meta diaria: {data.study_plan_suggestion.daily_goal_minutes} minutos
                </span>
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
              Iniciar Estudo Inteligente
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
