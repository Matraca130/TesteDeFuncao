// A7-08 | SummaryDiagnostic.tsx — Agent 7 (NEXUS)
// UI diagnostico de summary completo
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Brain, Sparkles, BookOpen, Target,
  TrendingUp, Layers, Clock, Play, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FeedbackSkeleton } from '../components/shared/ErrorBoundary';

// ── BKT Color Helper ──
function getBktColor(pKnow: number) {
  if (pKnow < 0.25) return { color: '#ef4444', label: 'Nao domina', tw: 'bg-red-500', textTw: 'text-red-700', borderTw: 'border-red-300', bgTw: 'bg-red-50' };
  if (pKnow < 0.5) return { color: '#f97316', label: 'Em progresso', tw: 'bg-orange-500', textTw: 'text-orange-700', borderTw: 'border-orange-300', bgTw: 'bg-orange-50' };
  if (pKnow < 0.75) return { color: '#eab308', label: 'Quase domina', tw: 'bg-yellow-500', textTw: 'text-yellow-700', borderTw: 'border-yellow-300', bgTw: 'bg-yellow-50' };
  return { color: '#22c55e', label: 'Domina', tw: 'bg-green-500', textTw: 'text-green-700', borderTw: 'border-green-300', bgTw: 'bg-green-50' };
}

// ── Mock Data (Section 14) ──
const MOCK_SUMMARY_DIAGNOSTIC = {
  summary_id: 'sum-1',
  summary_title: 'Biologia Celular',
  overall_mastery: 62,
  bkt_level: 'yellow' as const,
  keywords_breakdown: [
    { keyword_id: 'kw-1', term: 'Mitocondria', p_know: 0.85, bkt_color: '#22c55e', status: 'dominado' as const },
    { keyword_id: 'kw-2', term: 'Ribossomo', p_know: 0.65, bkt_color: '#eab308', status: 'em_progresso' as const },
    { keyword_id: 'kw-3', term: 'DNA Polimerase', p_know: 0.45, bkt_color: '#f97316', status: 'em_progresso' as const },
    { keyword_id: 'kw-4', term: 'Meiose', p_know: 0.15, bkt_color: '#ef4444', status: 'precisa_atencao' as const },
    { keyword_id: 'kw-5', term: 'Complexo de Golgi', p_know: 0.78, bkt_color: '#22c55e', status: 'dominado' as const },
    { keyword_id: 'kw-6', term: 'Reticulo Endoplasmatico', p_know: 0.55, bkt_color: '#eab308', status: 'em_progresso' as const },
    { keyword_id: 'kw-7', term: 'Membrana Plasmatica', p_know: 0.90, bkt_color: '#22c55e', status: 'dominado' as const },
    { keyword_id: 'kw-8', term: 'Lisossomo', p_know: 0.30, bkt_color: '#f97316', status: 'em_progresso' as const },
  ],
  quiz_performance: { total_attempts: 8, average_accuracy: 68, best_topic: 'Mitocondria', worst_topic: 'Meiose' },
  flashcard_performance: { total_reviews: 120, retention_rate: 75, mastered_count: 15 },
  ai_analysis: {
    overall_assessment: 'Voce tem uma base solida em biologia celular, especialmente em organelas como mitocondria e complexo de Golgi. Porem, conceitos de divisao celular (meiose) precisam de mais atencao. Sua taxa de retencao de flashcards (75%) e boa, mas pode melhorar com sessoes mais frequentes.',
    key_strengths: ['Organelas celulares (mitocondria, Golgi, membrana)', 'Vocabulario tecnico', 'Processos metabolicos basicos'],
    gaps: ['Divisao celular (meiose vs mitose)', 'Replicacao de DNA detalhada', 'Funcao dos lisossomos', 'Aplicacao pratica de conceitos'],
    recommended_actions: [
      'Revisar meiose com videos explicativos',
      'Fazer 10 questoes focadas sobre divisao celular',
      'Criar flashcards proprios sobre DNA polimerase',
      'Revisar funcoes do lisossomo em contexto de digestao celular'
    ],
    estimated_time_to_mastery: 'Aproximadamente 8 horas mais de estudo focado',
  },
  study_plan_suggestion: {
    priority_keywords: ['Meiose', 'Lisossomo', 'DNA Polimerase'],
    recommended_order: ['Meiose', 'Lisossomo', 'DNA Polimerase', 'Reticulo Endoplasmatico', 'Ribossomo'],
    daily_goal_minutes: 30,
  },
};

const STATUS_LABELS: Record<string, string> = {
  dominado: 'Dominado',
  em_progresso: 'Em progresso',
  precisa_atencao: 'Precisa atencao',
  nao_estudado: 'Nao estudado',
};

export function SummaryDiagnostic() {
  const { summaryId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<typeof MOCK_SUMMARY_DIAGNOSTIC | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_SUMMARY_DIAGNOSTIC);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [summaryId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2ea]">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <p className="text-indigo-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Gerando diagnostico completo...
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
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                {data.summary_title}
              </h1>
              <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Diagnostico completo de dominio
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${overallBkt.bgTw} ${overallBkt.textTw} ${overallBkt.borderTw} border`}>
                {overallBkt.label}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-3xl" style={{ fontFamily: 'Georgia, serif', color: overallBkt.color }}>
                  {data.overall_mastery}%
                </span>
              </div>
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
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                <BookOpen className="w-5 h-5 text-teal-500" />
                Keywords — Dominio Individual
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Inter, sans-serif' }}>
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
                        <span className="text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                      <p className="text-2xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                        {data.quiz_performance.total_attempts}
                      </p>
                      <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Tentativas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                        {data.quiz_performance.average_accuracy}%
                      </p>
                      <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Acuracia Media</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <Target className="w-4 h-4 inline mr-1" />
                        Melhor: {data.quiz_performance.best_topic}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                      <p className="text-2xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                        {data.flashcard_performance.total_reviews}
                      </p>
                      <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Revisoes Totais</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                      <p className="text-2xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                        {data.flashcard_performance.retention_rate}%
                      </p>
                      <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Taxa de Retencao</p>
                    </div>
                    <div className="text-center">
                      <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl text-green-600" style={{ fontFamily: 'Georgia, serif' }}>
                        {data.flashcard_performance.mastered_count}
                      </p>
                      <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Dominados</p>
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
                      <p className="text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {data.ai_analysis.overall_assessment}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-700" style={{ fontFamily: 'Georgia, serif' }}>
                        Fortalezas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {data.ai_analysis.key_strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-green-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <span className="text-green-500">+</span> {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-orange-700" style={{ fontFamily: 'Georgia, serif' }}>
                        Lacunas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {data.ai_analysis.gaps.map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-orange-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <span className="text-orange-500">!</span> {g}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-indigo-700" style={{ fontFamily: 'Georgia, serif' }}>
                      <Sparkles className="w-5 h-5" />
                      Acoes Recomendadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.ai_analysis.recommended_actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0" style={{ fontSize: '12px' }}>
                            {i + 1}
                          </div>
                          <span className="text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{a}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
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
              <CardTitle className="flex items-center gap-2 text-teal-700" style={{ fontFamily: 'Georgia, serif' }}>
                <BookOpen className="w-5 h-5" />
                Plano de Estudo Sugerido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                <p className="text-gray-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Ordem recomendada de estudo:
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  {data.study_plan_suggestion.recommended_order.map((kw, i) => (
                    <span key={i} className="flex items-center">
                      <Badge variant="outline" className="bg-white">{kw}</Badge>
                      {i < data.study_plan_suggestion.recommended_order.length - 1 && (
                        <span className="text-gray-400 mx-1">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-teal-700">
                <Clock className="w-4 h-4" />
                <span style={{ fontFamily: 'Inter, sans-serif' }}>
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