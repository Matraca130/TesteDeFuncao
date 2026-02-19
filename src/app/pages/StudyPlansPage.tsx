// ============================================================
// A6-12 | StudyPlansPage.tsx | Agent 6 — PRISM
// UI para planes de estudio del alumno
// P3: Refactored to use useStudyPlans hook
// ============================================================
import { useState } from 'react';
import { Plus, Calendar, CheckCircle2, Trash2, ChevronRight, Target, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';
import { useStudyPlans } from '../hooks/use-study-plans';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { PageTransition } from '../components/shared/PageTransition';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonPage } from '../components/shared/SkeletonPage';

export function StudyPlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // P3: Hook layer
  const {
    plans,
    isLoading,
    error,
    isMutating,
    createPlan,
    deletePlan,
    toggleItem,
    refetch,
  } = useStudyPlans();

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');

  const activePlan = plans.find((p) => p.id === selectedPlan);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormStart('');
    setFormEnd('');
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    const newPlan = await createPlan({
      title: formTitle,
      description: formDescription,
      start_date: formStart || new Date().toISOString().split('T')[0],
      end_date: formEnd || '',
      items: [],
    });
    setIsDialogOpen(false);
    resetForm();
    setSelectedPlan(newPlan.id);
  };

  const handleDelete = async (id: string) => {
    await deletePlan(id);
    if (selectedPlan === id) setSelectedPlan(null);
  };

  const handleToggleItem = async (planId: string, itemId: string) => {
    await toggleItem(planId, itemId);
  };

  const daysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return <SkeletonPage variant="study" />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-gray-900 tracking-tight flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
              <Target className="w-7 h-7 text-teal-500" />
              Planos de Estudo
            </h1>
            <p className="text-gray-500 mt-1">Organize sua jornada de aprendizagem</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="bg-teal-500 hover:bg-teal-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: "'Georgia', serif" }}>Novo Plano de Estudo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-gray-700 mb-1 block">Titulo *</label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Revisao Biologia" />
                </div>
                <div>
                  <label className="text-gray-700 mb-1 block">Descricao</label>
                  <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Objetivo do plano..." rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-700 mb-1 block">Data inicio</label>
                    <Input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-gray-700 mb-1 block">Data fim</label>
                    <Input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={isMutating} className="bg-teal-500 hover:bg-teal-600 text-white">Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Layout: Plans list + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plans List */}
          <div className="space-y-3">
            {plans.length === 0 ? (
              <EmptyState
                variant="plans"
                title="Nenhum plano criado"
                description="Crie um plano para organizar sua jornada de aprendizagem"
                actionLabel="Criar Plano"
                onAction={() => { resetForm(); setIsDialogOpen(true); }}
              />
            ) : (
              plans.map((plan, index) => {
                const remaining = daysRemaining(plan.end_date);
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.08, 0.3),
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                  <Card
                    className={`border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedPlan === plan.id ? 'ring-2 ring-teal-500 border-teal-200' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-gray-900 truncate">{plan.title}</h3>
                          <p className="text-gray-500 truncate mt-0.5" style={{ fontSize: '0.75rem' }}>
                            {plan.description}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedPlan === plan.id ? 'text-teal-500 rotate-90' : 'text-gray-300'}`} />
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400" style={{ fontSize: '0.75rem' }}>Progresso</span>
                          <span className="text-gray-600" style={{ fontSize: '0.75rem' }}>{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-gray-400" style={{ fontSize: '0.75rem' }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {plan.start_date}
                        </span>
                        {remaining !== null && (
                          <Badge variant="secondary" className={remaining <= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'} style={{ fontSize: '0.625rem' }}>
                            {remaining > 0 ? `${remaining} dias restantes` : 'Expirado'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Plan Detail */}
          <div className="lg:col-span-2">
            {!activePlan ? (
              <Card className="border-gray-200 h-full">
                <CardContent className="flex items-center justify-center py-0 min-h-[300px]">
                  <EmptyState
                    variant="plans"
                    title="Selecione um plano"
                    description="Escolha um plano na lista ao lado para ver os detalhes e acompanhar o progresso"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle style={{ fontFamily: "'Georgia', serif" }}>{activePlan.title}</CardTitle>
                      <p className="text-gray-500 mt-1" style={{ fontSize: '0.875rem' }}>{activePlan.description}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar plano?</AlertDialogTitle>
                          <AlertDialogDescription>O plano "{activePlan.title}" sera removido permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(activePlan.id)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-gray-400" style={{ fontSize: '0.75rem' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {activePlan.start_date} — {activePlan.end_date || 'Sem prazo'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activePlan.items.filter((i) => i.completed).length}/{activePlan.items.length} concluidos
                    </span>
                  </div>
                  <Progress value={activePlan.progress} className="h-2 mt-3" />
                </CardHeader>
                <Separator />
                <CardContent className="p-5">
                  {activePlan.items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhum item no plano</p>
                      <p className="text-gray-400 mt-1" style={{ fontSize: '0.875rem' }}>
                        Adicione keywords ou resumos ao plano
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activePlan.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            item.completed ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:border-teal-200'
                          }`}
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => handleToggleItem(activePlan.id, item.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {item.title}
                            </span>
                          </div>
                          {item.keyword_id && (
                            <Badge variant="outline" className="border-teal-200 text-teal-700 shrink-0" style={{ fontSize: '0.625rem' }}>
                              Keyword
                            </Badge>
                          )}
                          {item.summary_id && (
                            <Badge variant="outline" className="border-blue-200 text-blue-700 shrink-0" style={{ fontSize: '0.625rem' }}>
                              Resumo
                            </Badge>
                          )}
                          {item.completed && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}