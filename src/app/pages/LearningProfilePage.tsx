// A7-09 | LearningProfilePage.tsx — Agent 7 (NEXUS) | SIGNAL: AI_UIS_DONE
// Pagina completa do perfil de aprendizagem do aluno
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Brain, Sparkles, BookOpen, Target, Clock,
  TrendingUp, Flame, BarChart3, RefreshCw, Star,
  Lightbulb, Award, Calendar, User, Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProfileSkeleton } from '../components/shared/ErrorBoundary';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

// ── Mock Data (Section 14) ──
const MOCK_LEARNING_PROFILE = {
  student_id: 's-1',
  generated_at: '2026-02-19T10:30:00Z',
  cached: false,
  global_stats: {
    total_study_hours: 42,
    total_quizzes_completed: 15,
    total_flashcards_reviewed: 320,
    total_keywords_studied: 28,
    keywords_mastered: 12,
    keywords_in_progress: 10,
    keywords_weak: 6,
    overall_accuracy: 72,
    current_streak_days: 5,
    longest_streak_days: 14,
    study_consistency: 68,
  },
  ai_profile: {
    learning_style: 'Visual-Pratico',
    strongest_areas: ['Biologia Celular', 'Genetica Basica', 'Anatomia'],
    weakest_areas: ['Ecologia', 'Evolucao', 'Bioquimica'],
    study_pattern: 'Estuda mais a noite (19h-22h), prefere sessoes curtas de 30-45 minutos',
    personality_insight: 'Aluno dedicado e consistente que aprende melhor com exemplos visuais e praticos. Tende a dominar conceitos gradualmente com revisoes regulares. Mostra forte persistencia ao enfrentar topicos dificeis.',
  },
  ai_recommendations: {
    immediate_actions: ['Revisar Meiose (prioridade alta)', 'Completar 5 flashcards de Ecologia', 'Fazer quiz de revisao de Genetica'],
    weekly_goals: ['Dominar 3 keywords novas', 'Manter racha de estudo', 'Completar 2 quizzes completos'],
    long_term_strategy: 'Foque em construir uma base solida em Ecologia nas proximas 2 semanas. Depois, avance para Evolucao. Mantenha revisoes diarias de 30 min para consolidar o que ja aprendeu. Considere usar mapas mentais para conectar os diferentes topicos de biologia.',
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
    message: 'Voce ja estudou 42 horas e dominou 12 keywords — isso e impressionante! Seu progresso semanal mostra uma melhoria constante. Continue com essa dedicacao!',
    achievement_highlight: 'Conseguiu uma racha de 5 dias consecutivos de estudo!',
    next_milestone: 'Faltam apenas 3 keywords para dominar Biologia Celular completamente!',
  },
};

export function LearningProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<typeof MOCK_LEARNING_PROFILE | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = (force = false) => {
    if (force) setRegenerating(true);
    else setLoading(true);

    // Limpa qualquer timer pendente antes de iniciar um novo
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setData({ ...MOCK_LEARNING_PROFILE, cached: !force });
      setLoading(false);
      setRegenerating(false);
      timerRef.current = null;
    }, force ? 2000 : 1500);
  };

  useEffect(() => {
    loadProfile();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2ea]">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <p className="text-indigo-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Gerando seu perfil de aprendizagem...
            </p>
          </div>
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  const { global_stats, ai_profile, ai_recommendations, progress_timeline, motivation } = data;

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
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <h1 className="text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Meu Perfil de Aprendizagem
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300 border">
                    <Brain className="w-3 h-3 mr-1" />
                    {ai_profile.learning_style}
                  </Badge>
                  <Badge variant="outline">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {global_stats.study_consistency}% consistencia
                  </Badge>
                  {data.cached && (
                    <Badge variant="outline" className="text-gray-400">
                      Cache
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProfile(true)}
              disabled={regenerating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerando...' : 'Regenerar Perfil'}
            </Button>
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-5 text-center">
                <Clock className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                <p className="text-3xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.total_study_hours}h</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Horas de Estudo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 text-center">
                <Target className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                <p className="text-3xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.total_quizzes_completed}</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Quizzes Completos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 text-center">
                <BookOpen className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-3xl text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.total_flashcards_reviewed}</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Flashcards Revisados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 text-center">
                <Star className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-3xl text-green-600" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.keywords_mastered}</p>
                <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Keywords Dominadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Keywords Mastery Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle style={{ fontFamily: 'Georgia, serif' }}>Dominio de Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-2xl text-green-600" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.keywords_mastered}</p>
                  <p className="text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>Dominadas</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-2xl text-yellow-600" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.keywords_in_progress}</p>
                  <p className="text-yellow-700" style={{ fontFamily: 'Inter, sans-serif' }}>Em Progresso</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-2xl text-red-600" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.keywords_weak}</p>
                  <p className="text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>Precisa Atencao</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Acuracia geral:</span>
                <Progress value={global_stats.overall_accuracy} className="flex-1 h-2" />
                <span className="text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>{global_stats.overall_accuracy}%</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-orange-600">
                  <Flame className="w-4 h-4" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>Racha atual: {global_stats.current_streak_days} dias</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Award className="w-4 h-4" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>Recorde: {global_stats.longest_streak_days} dias</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Profile */}
          <Card className="border-indigo-200 bg-indigo-50/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700" style={{ fontFamily: 'Georgia, serif' }}>
                <Brain className="w-5 h-5" />
                Meu Perfil de Aprendizagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg p-4 bg-white border border-indigo-100">
                <p className="text-gray-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Estilo de aprendizagem</p>
                <p className="text-indigo-800" style={{ fontFamily: 'Georgia, serif' }}>{ai_profile.learning_style}</p>
              </div>
              <div className="rounded-lg p-4 bg-white border border-indigo-100">
                <p className="text-gray-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Padrao de estudo</p>
                <p className="text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{ai_profile.study_pattern}</p>
              </div>
              <div className="rounded-lg p-4 bg-white border border-indigo-100">
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Insight de personalidade</p>
                    <p className="text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{ai_profile.personality_insight}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-green-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Fortalezas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ai_profile.strongest_areas.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-green-50 text-green-800 border-green-300">{a}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-orange-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    <Target className="w-4 h-4 inline mr-1" />
                    Areas de Melhoria
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ai_profile.weakest_areas.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">{a}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Tabs defaultValue="immediate" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="immediate">Acoes Imediatas</TabsTrigger>
              <TabsTrigger value="weekly">Metas Semanais</TabsTrigger>
              <TabsTrigger value="strategy">Estrategia</TabsTrigger>
            </TabsList>

            <TabsContent value="immediate">
              <Card>
                <CardContent className="py-5 space-y-3">
                  {ai_recommendations.immediate_actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0" style={{ fontSize: '12px' }}>
                        {i + 1}
                      </div>
                      <span className="text-gray-700 flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{action}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly">
              <Card>
                <CardContent className="py-5 space-y-3">
                  {ai_recommendations.weekly_goals.map((goal, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0" style={{ fontSize: '12px' }}>
                        {i + 1}
                      </div>
                      <span className="text-gray-700 flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{goal}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Calendar className="w-4 h-4" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>
                      Tempo recomendado: {ai_recommendations.recommended_study_time}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Keywords foco:</p>
                    <div className="flex flex-wrap gap-2">
                      {ai_recommendations.focus_keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-300">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategy">
              <Card>
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {ai_recommendations.long_term_strategy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Progress Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                <BarChart3 className="w-5 h-5 text-teal-500" />
                Timeline de Progresso
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Inter, sans-serif' }}>
                Evolucao semanal: keywords dominadas, acuracia e horas estudadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progress_timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
                    <YAxis tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
                    <RechartsTooltip
                      contentStyle={{
                        fontFamily: 'Inter, sans-serif',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                    <Bar dataKey="keywords_mastered" name="Keywords Dominadas" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hours_studied" name="Horas Estudadas" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Separator className="my-4" />
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progress_timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
                    <YAxis tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }} domain={[0, 100]} />
                    <RechartsTooltip
                      contentStyle={{
                        fontFamily: 'Inter, sans-serif',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Acuracia (%)"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Motivation Card */}
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-indigo-50">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-teal-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {motivation.message}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Conquista recente</p>
                    <p className="text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {motivation.achievement_highlight}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Proximo marco</p>
                    <p className="text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {motivation.next_milestone}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated timestamp */}
          <div className="text-center">
            <Badge variant="outline" className="text-gray-400">
              Gerado em: {new Date(data.generated_at).toLocaleString('pt-BR')}
              {data.cached && ' (cache)'}
            </Badge>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}