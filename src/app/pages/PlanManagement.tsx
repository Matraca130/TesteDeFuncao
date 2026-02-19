// Axon v4.4 — Plan Management (A5-03)
// Agent 5: FORGE — CRUD plans, access rules, card-based layout
// 3-Layer: [Component] → usePlans → api-client

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Users, Check, X, ChevronDown, ChevronUp, Infinity, ShieldCheck, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../components/ui/utils';
import { AccessRulesSection } from '../components/admin/AccessRulesSection';
import { ErrorState } from '../components/admin/ErrorState';
import { usePlans } from '../hooks/usePlans';
import { CURRENT_INST_ID } from '../lib/admin-constants';
import { headingStyle } from '../lib/design-tokens';
import type { PricingPlan, PlanCreatePayload, Currency } from '../../types/auth';

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'BRL', label: 'Real (BRL)', symbol: 'R$' },
  { value: 'USD', label: 'Dollar (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '\u20ac' },
];
const DURATION_OPTIONS = [
  { value: 30, label: '30 dias (mensal)' },
  { value: 90, label: '90 dias (trimestral)' },
  { value: 180, label: '180 dias (semestral)' },
  { value: 365, label: '365 dias (anual)' },
];
function getCurrencySymbol(currency: string): string {
  return CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency;
}

export function PlanManagement() {
  const { plans, loading, error, reload, create, update, remove, toggleActive } = usePlans(CURRENT_INST_ID);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [deletePlanDialog, setDeletePlanDialog] = useState<PricingPlan | null>(null);

  const handleToggleActive = async (plan: PricingPlan) => {
    try { const updated = await toggleActive(plan.id); toast.success(updated.active ? 'Plano ativado' : 'Plano desativado'); }
    catch (e: any) { toast.error('Erro ao alterar status', { description: e?.message }); }
  };
  const handleDeletePlan = async () => {
    if (!deletePlanDialog) return;
    try { await remove(deletePlanDialog.id); toast.success('Plano excluido'); }
    catch (e: any) { toast.error('Erro ao excluir plano', { description: e?.message }); }
    setDeletePlanDialog(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={headingStyle} className="text-zinc-900">Planos de Precos</h1>
          <p className="text-sm text-zinc-500 mt-1">Crie e gerencie os planos de acesso da sua instituicao.</p>
        </div>
        <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }} className="bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="size-4 mr-1" /> Novo Plano
        </Button>
      </div>

      {loading ? <PlansLoadingSkeleton /> : error ? (
        <ErrorState title="Erro ao carregar planos" message={error} onRetry={reload} />
      ) : plans.length === 0 ? <PlansEmptyState onCreate={() => setPlanDialogOpen(true)} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan}
              onEdit={() => { setEditingPlan(plan); setPlanDialogOpen(true); }}
              onToggleActive={() => handleToggleActive(plan)}
              onDelete={() => setDeletePlanDialog(plan)} />
          ))}
        </div>
      )}

      <PlanFormDialog open={planDialogOpen} onOpenChange={setPlanDialogOpen} editingPlan={editingPlan}
        onSave={async (payload) => editingPlan ? await update(editingPlan.id, payload) : await create(payload)} />

      <AlertDialog open={!!deletePlanDialog} onOpenChange={(open) => !open && setDeletePlanDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o plano <strong>{deletePlanDialog?.name}</strong>?
              {(deletePlanDialog?.active_students ?? 0) > 0 && <span className="block mt-2 text-red-600">Este plano possui {deletePlanDialog?.active_students} alunos ativos. Remova-os antes de excluir.</span>}
              <br /><span className="text-red-600">Esta acao nao pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" disabled={(deletePlanDialog?.active_students ?? 0) > 0} onClick={handleDeletePlan}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PlanCard({ plan, onEdit, onToggleActive, onDelete }: { plan: PricingPlan; onEdit: () => void; onToggleActive: () => void; onDelete: () => void; }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const isFree = plan.price === 0;
  const symbol = getCurrencySymbol(plan.currency || 'BRL');
  return (
    <Card className={cn('transition-all', !plan.active && 'opacity-60', isFree && 'border-dashed bg-zinc-50', plan.active && !isFree && 'border-teal-200')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle style={headingStyle}>{plan.name}</CardTitle>
            <div className="mt-2">
              {isFree ? <span className="text-emerald-600" style={{ ...headingStyle, fontSize: '1.5rem' }}>Gratis</span> : (
                <span style={{ ...headingStyle, fontSize: '1.5rem' }} className="text-zinc-900">{symbol} {(plan.price ?? 0).toFixed(2)}<span className="text-sm text-zinc-400"> / {plan.duration_days} dias</span></span>
              )}
            </div>
          </div>
          <Switch checked={plan.active} onCheckedChange={onToggleActive} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={plan.active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}>{plan.active ? 'Ativo' : 'Inativo'}</Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Users className="size-3 mr-1" />{plan.active_students ?? 0} alunos</Badge>
          <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200">{plan.max_students === null ? <><Infinity className="size-3 mr-1" /> Ilimitado</> : `Max: ${plan.max_students}`}</Badge>
        </div>
        <div className="space-y-1.5">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2"><Check className="size-3.5 text-teal-500 mt-0.5 shrink-0" /><span className="text-sm text-zinc-600">{feature}</span></div>
          ))}
        </div>
        <Separator />
        <div>
          <button onClick={() => setRulesOpen(!rulesOpen)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 w-full">
            <ShieldCheck className="size-4" /> Regras de Acesso {rulesOpen ? <ChevronUp className="size-4 ml-auto" /> : <ChevronDown className="size-4 ml-auto" />}
          </button>
          {rulesOpen && <AccessRulesSection planId={plan.id} />}
        </div>
        <Separator />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}><Pencil className="size-3 mr-1" /> Editar</Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={onDelete} disabled={(plan.active_students ?? 0) > 0}><Trash2 className="size-3" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanFormDialog({ open, onOpenChange, editingPlan, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editingPlan: PricingPlan | null; onSave: (payload: PlanCreatePayload) => Promise<PricingPlan>; }) {
  const isEditing = !!editingPlan;
  const [form, setForm] = useState<PlanCreatePayload>({ name: '', price: 0, currency: 'BRL', duration_days: 30, features: [], max_students: null, active: true });
  const [newFeature, setNewFeature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unlimitedStudents, setUnlimitedStudents] = useState(true);

  useEffect(() => {
    if (editingPlan) {
      setForm({ name: editingPlan.name, price: editingPlan.price ?? 0, currency: (editingPlan.currency || 'BRL') as Currency, duration_days: editingPlan.duration_days ?? 30, features: [...editingPlan.features], max_students: editingPlan.max_students, active: editingPlan.active });
      setUnlimitedStudents(editingPlan.max_students === null);
    } else {
      setForm({ name: '', price: 0, currency: 'BRL', duration_days: 30, features: [], max_students: null, active: true });
      setUnlimitedStudents(true);
    }
    setNewFeature(''); setErrors({});
  }, [editingPlan, open]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nome e obrigatorio';
    if (form.price < 0) e.price = 'Preco nao pode ser negativo';
    if (form.duration_days <= 0) e.duration_days = 'Duracao deve ser maior que 0';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const addFeature = () => { if (!newFeature.trim()) return; setForm((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] })); setNewFeature(''); };
  const removeFeature = (idx: number) => { setForm((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) })); };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave({ ...form, max_students: unlimitedStudents ? null : (form.max_students ?? 0) });
      toast.success(isEditing ? 'Plano atualizado' : 'Plano criado'); onOpenChange(false);
    } catch (e: any) { toast.error('Erro ao salvar plano', { description: e?.message }); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle style={headingStyle}>{isEditing ? 'Editar Plano' : 'Novo Plano'}</DialogTitle><DialogDescription>{isEditing ? 'Altere os dados do plano.' : 'Defina os dados do novo plano de precos.'}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome do Plano <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Plano Essencial" aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Preco <span className="text-red-500">*</span></Label>
              <Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} aria-invalid={!!errors.price} />
              {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v as Currency }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duracao <span className="text-red-500">*</span></Label>
            <Select value={String(form.duration_days)} onValueChange={(v) => setForm((f) => ({ ...f, duration_days: parseInt(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DURATION_OPTIONS.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Maximo de Alunos</Label>
              <label className="flex items-center gap-2 text-sm text-zinc-500 cursor-pointer">
                <Switch checked={unlimitedStudents} onCheckedChange={(v) => { setUnlimitedStudents(v); if (v) setForm((f) => ({ ...f, max_students: null })); else setForm((f) => ({ ...f, max_students: 100 })); }} /> Ilimitado
              </label>
            </div>
            {!unlimitedStudents && <Input type="number" min={1} value={form.max_students ?? ''} onChange={(e) => setForm((f) => ({ ...f, max_students: parseInt(e.target.value) || 0 }))} />}
          </div>
          <div className="space-y-2">
            <Label>Funcionalidades</Label>
            <div className="space-y-1.5">
              {form.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                  <Check className="size-3 text-teal-500 shrink-0" /><span className="text-sm text-zinc-700 flex-1">{feat}</span>
                  <button onClick={() => removeFeature(idx)} className="text-zinc-400 hover:text-red-500"><X className="size-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Nova funcionalidade..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} />
              <Button variant="outline" size="sm" onClick={addFeature} disabled={!newFeature.trim()}><Plus className="size-3" /></Button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
            <div><p className="text-sm text-zinc-700">Plano Ativo</p><p className="text-xs text-zinc-400">Planos inativos nao aparecem para alunos.</p></div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-500 hover:bg-teal-600 text-white">{submitting ? <Loader2 className="size-4 animate-spin" /> : isEditing ? 'Salvar Alteracoes' : 'Criar Plano'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlansLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => <Card key={i}><CardContent className="py-6 space-y-4"><Skeleton className="h-6 w-40" /><Skeleton className="h-8 w-24" /><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></CardContent></Card>)}
    </div>
  );
}

function PlansEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card><CardContent className="flex flex-col items-center justify-center py-12">
      <Package className="size-12 text-zinc-300 mb-3" />
      <p className="text-zinc-600">Nenhum plano criado</p>
      <p className="text-sm text-zinc-400 mt-1">Crie o primeiro plano de precos para sua instituicao.</p>
      <Button className="mt-4 bg-teal-500 hover:bg-teal-600 text-white" onClick={onCreate}><Plus className="size-4 mr-1" /> Criar Primeiro Plano</Button>
    </CardContent></Card>
  );
}
