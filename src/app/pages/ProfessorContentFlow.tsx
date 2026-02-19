// ============================================================
// A6-14 | ProfessorContentFlow.tsx | Agent 6 — PRISM
// Flujo wizard: Summary → Keywords → Flashcards → Quiz → Videos
// P3: Refactored to use hooks layer
// ============================================================
import { useState } from 'react';
import { Check, BookOpen, Key, Layers, HelpCircle, Play, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useSummaries } from '../hooks/use-summaries';
import { useKeywords } from '../hooks/use-keywords';
import { useFlashcards } from '../hooks/use-flashcards';
import { useQuizQuestions } from '../hooks/use-quiz-questions';
import { useVideos } from '../hooks/use-videos';
import { Link } from 'react-router';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';

const STEPS = [
  { id: 1, label: 'Summary', icon: BookOpen, description: 'Selecionar ou criar resumo' },
  { id: 2, label: 'Keywords', icon: Key, description: 'Adicionar keywords' },
  { id: 3, label: 'Flashcards', icon: Layers, description: 'Criar flashcards' },
  { id: 4, label: 'Quiz', icon: HelpCircle, description: 'Criar perguntas' },
  { id: 5, label: 'Videos', icon: Play, description: 'Agregar videos' },
];

export function ProfessorContentFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSummary, setSelectedSummary] = useState<string>('');

  // P3: Hook layer
  const { summaries, isLoading: summariesLoading } = useSummaries();
  const { filteredKeywords: summaryKeywords } = useKeywords({ summaryId: selectedSummary });
  const { filteredFlashcards: summaryFlashcards } = useFlashcards({ summaryId: selectedSummary });
  const { filteredQuestions: summaryQuestions } = useQuizQuestions({ summaryId: selectedSummary });
  const { filteredVideos: summaryVideos } = useVideos({ summaryId: selectedSummary });

  const progress = (currentStep / STEPS.length) * 100;

  const canGoNext = () => {
    if (currentStep === 1) return !!selectedSummary;
    return true;
  };

  if (summariesLoading) {
    return <SkeletonPage variant="wizard" />;
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-gray-900 tracking-tight flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
            <Rocket className="w-7 h-7 text-teal-500" />
            Fluxo de Criacao de Conteudo
          </h1>
          <p className="text-gray-500 mt-1">Crie conteudo completo passo a passo</p>
        </div>

        {/* Step Indicator */}
        <Card className="border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : isDone
                          ? 'bg-green-50 text-green-700 cursor-pointer'
                          : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-green-500 text-white' : isActive ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <div className="hidden sm:block text-left">
                        <p style={{ fontSize: '0.75rem' }} className={isActive ? 'text-teal-700' : isDone ? 'text-green-700' : 'text-gray-400'}>
                          Paso {step.id}
                        </p>
                        <p style={{ fontSize: '0.875rem' }} className={isActive || isDone ? '' : 'text-gray-400'}>
                          {step.label}
                        </p>
                      </div>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${step.id < currentStep ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-1.5" />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
            {/* Step 1: Summary */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>Selecionar Summary</h2>
                  <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Escolha um resumo existente ou crie um novo</p>
                </div>
                <Select value={selectedSummary} onValueChange={setSelectedSummary}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Selecionar resumo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {summaries.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title} ({s.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSummary && (
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                    <p className="text-teal-700" style={{ fontSize: '0.875rem' }}>
                      Summary selecionado: <strong>{summaries.find((s) => s.id === selectedSummary)?.title}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Keywords */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>Keywords</h2>
                    <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Gerencie as keywords deste resumo</p>
                  </div>
                  <Link to="/professor/keywords">
                    <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                      Abrir Editor Completo
                    </Button>
                  </Link>
                </div>
                {summaryKeywords.length === 0 ? (
                  <EmptyState
                    variant="keywords"
                    title="Nenhuma keyword ainda"
                    description="Abra o editor completo para criar keywords"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summaryKeywords.map((kw) => (
                      <div key={kw.id} className="p-3 rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-teal-500" />
                          <span className="text-gray-900">{kw.term}</span>
                          <Badge variant="secondary" className={kw.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'} style={{ fontSize: '0.625rem' }}>
                            {kw.status}
                          </Badge>
                        </div>
                        <p className="text-gray-500 mt-1 truncate" style={{ fontSize: '0.75rem' }}>{kw.definition}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Flashcards */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>Flashcards</h2>
                    <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Crie flashcards para cada keyword</p>
                  </div>
                  <Link to="/professor/flashcards">
                    <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                      Abrir Editor Completo
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summaryFlashcards.length === 0 ? (
                    <div className="col-span-full">
                      <EmptyState
                        variant="flashcards"
                        title="Nenhuma flashcard ainda"
                        description="Abra o editor completo para criar flashcards"
                      />
                    </div>
                  ) : (
                    summaryFlashcards.map((fc) => (
                      <div key={fc.id} className="p-3 rounded-xl border border-gray-200 bg-white">
                        <p className="text-gray-900 truncate" style={{ fontSize: '0.875rem' }}>{fc.front}</p>
                        <p className="text-gray-500 truncate mt-1" style={{ fontSize: '0.75rem' }}>{fc.back}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Quiz */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>Quiz Questions</h2>
                    <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Adicione perguntas de quiz</p>
                  </div>
                  <Link to="/professor/quizzes">
                    <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                      Abrir Editor Completo
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {summaryQuestions.length === 0 ? (
                    <EmptyState
                      variant="quiz"
                      title="Nenhuma pergunta ainda"
                      description="Abra o editor completo para criar perguntas"
                    />
                  ) : (
                    summaryQuestions.map((q) => (
                      <div key={q.id} className="p-3 rounded-xl border border-gray-200 bg-white flex items-center gap-3">
                        <Badge variant="secondary" className="bg-teal-50 text-teal-700 shrink-0" style={{ fontSize: '0.625rem' }}>
                          {q.quiz_type}
                        </Badge>
                        <span className="text-gray-900 truncate" style={{ fontSize: '0.875rem' }}>{q.question}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Videos */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>Videos</h2>
                    <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>Vincule videos ao resumo</p>
                  </div>
                  <Link to="/professor/videos">
                    <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                      Abrir Editor Completo
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {summaryVideos.length === 0 ? (
                    <EmptyState
                      variant="videos"
                      title="Nenhum video ainda"
                      description="Abra o editor completo para agregar videos"
                    />
                  ) : (
                    summaryVideos.map((v) => (
                      <div key={v.id} className="p-3 rounded-xl border border-gray-200 bg-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                          <Play className="w-5 h-5 text-teal-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 truncate" style={{ fontSize: '0.875rem' }}>{v.title}</p>
                          <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{Math.floor(v.duration_seconds / 60)} min</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Final Summary */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200">
                  <h3 className="text-teal-800 mb-3" style={{ fontFamily: "'Georgia', serif" }}>Resumo do Conteudo</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-teal-700" style={{ fontSize: '1.25rem', fontFamily: "'Georgia', serif" }}>{summaryKeywords.length}</p>
                      <p className="text-teal-600" style={{ fontSize: '0.75rem' }}>Keywords</p>
                    </div>
                    <div className="text-center">
                      <p className="text-teal-700" style={{ fontSize: '1.25rem', fontFamily: "'Georgia', serif" }}>{summaryFlashcards.length}</p>
                      <p className="text-teal-600" style={{ fontSize: '0.75rem' }}>Flashcards</p>
                    </div>
                    <div className="text-center">
                      <p className="text-teal-700" style={{ fontSize: '1.25rem', fontFamily: "'Georgia', serif" }}>{summaryQuestions.length}</p>
                      <p className="text-teal-600" style={{ fontSize: '0.75rem' }}>Perguntas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-teal-700" style={{ fontSize: '1.25rem', fontFamily: "'Georgia', serif" }}>{summaryVideos.length}</p>
                      <p className="text-teal-600" style={{ fontSize: '0.75rem' }}>Videos</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          {currentStep < STEPS.length ? (
            <Button
              onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}
              disabled={!canGoNext()}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              Proximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              <Rocket className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}