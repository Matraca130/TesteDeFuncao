// ============================================================
// PlanDetailPanel.tsx | Added by Agent 6 — PRISM — P7 DRY (P3)
// Right-side detail panel in StudyPlansPage showing plan header,
// progress bar, date range, and interactive checklist items.
// ============================================================
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { ConfirmDeleteDialog } from '../shared/ConfirmDeleteDialog';
import { EmptyState } from '../shared/EmptyState';
import type { StudyPlan } from '../../data/mock-data';

interface PlanDetailPanelProps {
  /** The currently selected plan, or null */
  plan: StudyPlan | null;
  onDelete: (id: string) => void;
  onToggleItem: (planId: string, itemId: string) => void;
}

export function PlanDetailPanel({ plan, onDelete, onToggleItem }: PlanDetailPanelProps) {
  if (!plan) {
    return (
      <Card className="border-gray-200 h-full">
        <CardContent className="flex items-center justify-center py-0 min-h-[300px]">
          <EmptyState
            variant="plans"
            title="Selecione um plano"
            description="Escolha um plano na lista ao lado para ver os detalhes e acompanhar o progresso"
          />
        </CardContent>
      </Card>
    );
  }

  const completedCount = plan.items.filter((i) => i.completed).length;

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle style={{ fontFamily: "'Georgia', serif" }}>
              {plan.title}
            </CardTitle>
            <p className="text-gray-500 mt-1" style={{ fontSize: '0.875rem' }}>
              {plan.description}
            </p>
          </div>
          <ConfirmDeleteDialog
            title="Eliminar plano?"
            description={`O plano "${plan.title}" sera removido permanentemente.`}
            onConfirm={() => onDelete(plan.id)}
            triggerClassName="text-gray-400 hover:text-red-500"
          />
        </div>
        <div
          className="flex items-center gap-4 mt-3 text-gray-400"
          style={{ fontSize: '0.75rem' }}
        >
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {plan.start_date} —{' '}
            {plan.end_date || 'Sem prazo'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {completedCount}/{plan.items.length}{' '}
            concluidos
          </span>
        </div>
        <Progress value={plan.progress} className="h-2 mt-3" />
      </CardHeader>
      <Separator />
      <CardContent className="p-5">
        {plan.items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum item no plano</p>
            <p className="text-gray-400 mt-1" style={{ fontSize: '0.875rem' }}>
              Adicione keywords ou resumos ao plano
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {plan.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  item.completed
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-100 hover:border-teal-200'
                }`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => onToggleItem(plan.id, item.id)}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`${
                      item.completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                {item.keyword_id && (
                  <Badge
                    variant="outline"
                    className="border-teal-200 text-teal-700 shrink-0"
                    style={{ fontSize: '0.625rem' }}
                  >
                    Keyword
                  </Badge>
                )}
                {item.summary_id && (
                  <Badge
                    variant="outline"
                    className="border-blue-200 text-blue-700 shrink-0"
                    style={{ fontSize: '0.625rem' }}
                  >
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
  );
}
