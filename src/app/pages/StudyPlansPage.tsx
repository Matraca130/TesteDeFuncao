// ============================================================
// A6-12 | StudyPlansPage.tsx | Agent 6 — PRISM
// UI para planes de estudio del alumno
// P3: Refactored to use useStudyPlans hook
// P6: Modularized — EditorPageShell, ConfirmDeleteDialog
// P7: Extracted StudyPlanCard, PlanDetailPanel (P3 refactor)
// ============================================================
import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { useStudyPlans } from '../hooks/use-study-plans';
import { EditorPageShell } from '../components/professor/EditorPageShell';
import { StudyPlanCard } from '../components/professor/StudyPlanCard';
import { PlanDetailPanel } from '../components/professor/PlanDetailPanel';
import { EmptyState } from '../components/shared/EmptyState';

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

  const activePlan = plans.find((p) => p.id === selectedPlan) ?? null;

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

  return (
    <EditorPageShell
      title="Planos de Estudo"
      subtitle="Organize sua jornada de aprendizagem"
      headerIcon={<Target className="w-7 h-7 text-teal-500" />}
      isLoading={isLoading}
      loadingVariant="study"
      error={error}
      onRetry={refetch}
    >
      {/* Create Plan Button */}
      <div className="flex justify-end -mt-4">
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
        {/* Plans List — P7: Extracted StudyPlanCard */}
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
            plans.map((plan, index) => (
              <StudyPlanCard
                key={plan.id}
                plan={plan}
                index={index}
                isSelected={selectedPlan === plan.id}
                onClick={setSelectedPlan}
              />
            ))
          )}
        </div>

        {/* Plan Detail — P7: Extracted PlanDetailPanel */}
        <div className="lg:col-span-2">
          <PlanDetailPanel
            plan={activePlan}
            onDelete={handleDelete}
            onToggleItem={handleToggleItem}
          />
        </div>
      </div>
    </EditorPageShell>
  );
}
