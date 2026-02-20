// Agent 7 — NEXUS Dashboard
// Navigation hub for all AI feedback pages
// P5/A7-10: Migrated inline fontFamily → font-heading / font-body
import { useNavigate } from 'react-router';
import {
  Brain, Layers, BookOpen, User, AlertTriangle,
  Sparkles, ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';

const AI_PAGES = [
  {
    title: 'Quiz Feedback',
    description: 'Feedback AI detalhado apos completar um quiz. Analise de pontos fortes, areas de melhoria, e explicacao por pergunta.',
    icon: Brain,
    path: '/study/quiz-feedback/bnd-1',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    badge: 'A7-06',
  },
  {
    title: 'Flashcard Feedback',
    description: 'Analise de desempenho em sessoes de flashcards. Retencao, cards com dificuldade, e dicas AI personalizadas.',
    icon: Layers,
    path: '/study/flashcard-feedback',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badge: 'A7-07',
  },
  {
    title: 'Summary Diagnostic',
    description: 'Diagnostico completo de um resumo. Dominio por keyword com cores BKT, performance em quizzes e flashcards.',
    icon: BookOpen,
    path: '/study/summary-diagnostic/sum-1',
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    badge: 'A7-08',
  },
  {
    title: 'Learning Profile',
    description: 'Perfil completo de aprendizagem com timeline de progresso, estilo de aprendizagem, e recomendacoes AI.',
    icon: User,
    path: '/study/learning-profile',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: 'A7-09',
  },
];

export function AgentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700">
            <Sparkles className="w-4 h-4" />
            <span className="font-body">Agent 7 — NEXUS</span>
          </div>
          <h1 className="text-gray-900 font-heading">
            Axon v4.4 — AI Features
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto font-body">
            Plataforma educativa com feedback AI personalizado. Explore as paginas de AI feedback,
            diagnostico e perfil de aprendizagem.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300">
              Primary: teal-500
            </Badge>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
              AI: indigo-500
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-300">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Live + Mock Fallback
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Page Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AI_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <Card
                key={page.path}
                className={`${page.borderColor} hover:shadow-md transition-shadow cursor-pointer group`}
                onClick={() => navigate(page.path)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg ${page.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${page.color}`} />
                    </div>
                    <Badge variant="outline" className="text-gray-400">{page.badge}</Badge>
                  </div>
                  <CardTitle className="font-heading">
                    {page.title}
                  </CardTitle>
                  <CardDescription className="font-body">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between group-hover:bg-gray-50">
                    <span className="font-body">Abrir</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Error Boundary Info */}
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 font-heading">
              <AlertTriangle className="w-5 h-5" />
              ErrorBoundary + Skeletons (A7-11)
            </CardTitle>
            <CardDescription className="font-body">
              Componente ErrorBoundary global e skeleton presets reutilizaveis implementados em 
              <code className="mx-1 px-1 bg-gray-100 rounded">src/app/components/shared/ErrorBoundary.tsx</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">PageSkeleton</Badge>
              <Badge variant="outline">CardGridSkeleton</Badge>
              <Badge variant="outline">FeedbackSkeleton</Badge>
              <Badge variant="outline">ProfileSkeleton</Badge>
              <Badge variant="outline">ErrorBoundary</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Design System Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Design System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-500" />
                <span className="font-body">Primary (teal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-500" />
                <span className="font-body">AI Insight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-500" />
                <span className="font-body">Strength</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500" />
                <span className="font-body">Weakness</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-500" />
                <span className="font-body">p &lt; 0.25</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500" />
                <span className="font-body">p 0.25-0.5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-500" />
                <span className="font-body">p 0.5-0.75</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-500" />
                <span className="font-body">p &gt; 0.75</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-6">
              <div>
                <p className="text-gray-500 mb-1 font-body">Headings</p>
                <p className="font-heading">Georgia, serif</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1 font-body">Body</p>
                <p className="font-body">Inter, sans-serif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-400 py-4 font-body">
          Axon v4.4 — Agent 7: NEXUS — AI Features, Polish & Quality Assurance
        </div>
      </div>
    </div>
  );
}
