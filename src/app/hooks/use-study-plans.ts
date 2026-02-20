// ============================================================
// useStudyPlans — CRUD hook for student study plans
// Added by Agent 6 — PRISM — P3 Hook Layer
// REWIRED: Uses Agent 4 api-study-plans
// NOTE: Heavy adapter — A4 StudyPlan+StudyGoal ↔ A6 StudyPlan+items[]
// A4: { name, target_date, goals with mastery } — goal-based
// A6: { title, start_date, end_date, progress, items with completed } — checklist
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { StudyPlan, StudyPlanItem } from '../data/mock-data';
import {
  getStudyPlans as apiGetPlans,
  createStudyPlan as apiCreatePlan,
  deleteStudyPlan as apiDeletePlan,
  getStudyGoals,
  updateStudyGoal,
} from '../lib/api-client';
import type { StudyPlan as A4Plan, StudyGoal } from '../lib/types-extended';

const STUDENT_ID = 'demo-student-001'; // TODO: Replace with auth context

// — Type Adapter: Agent 4 StudyPlan+Goals → Agent 6 StudyPlan —
function goalToItem(g: StudyGoal): StudyPlanItem {
  return {
    id: g.id,
    keyword_id: undefined,
    summary_id: undefined,
    title: g.topic_name,
    completed: g.status === 'completed',
  };
}

function toA6Plan(a4: A4Plan, goals: StudyGoal[]): StudyPlan {
  const items = goals.map(goalToItem);
  const completed = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
  return {
    id: a4.id,
    title: a4.name,
    description: a4.description || '',
    start_date: a4.created_at.split('T')[0],
    end_date: a4.target_date ? a4.target_date.split('T')[0] : '',
    progress,
    items,
    created_at: a4.created_at.split('T')[0],
  };
}

interface UseStudyPlansReturn {
  plans: StudyPlan[];
  isLoading: boolean;
  error: string | null;
  isMutating: boolean;
  createPlan: (data: Omit<StudyPlan, 'id' | 'created_at' | 'progress'>) => Promise<StudyPlan>;
  deletePlan: (id: string) => Promise<void>;
  toggleItem: (planId: string, itemId: string) => Promise<void>;
  refetch: () => void;
}

export function useStudyPlans(): UseStudyPlansReturn {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // REWIRED: Agent 4 api-study-plans
      const a4Plans = await apiGetPlans(STUDENT_ID);
      const plansWithGoals = await Promise.all(
        a4Plans.map(async (p) => {
          const goals = await getStudyGoals(p.id);
          return toA6Plan(p, goals);
        })
      );
      setPlans(plansWithGoals);
    } catch (err) {
      console.error('[useStudyPlans] fetch error:', err);
      setError('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = useCallback(
    async (data: Omit<StudyPlan, 'id' | 'created_at' | 'progress'>): Promise<StudyPlan> => {
      setIsMutating(true);
      try {
        // REWIRED: Agent 4 api-study-plans
        const a4Plan = await apiCreatePlan({
          student_id: STUDENT_ID,
          name: data.title,
          description: data.description || null,
          target_date: data.end_date || null,
        });
        const newPlan = toA6Plan(a4Plan, []);
        setPlans((prev) => [...prev, newPlan]);
        toast.success('Plano criado com sucesso');
        return newPlan;
      } catch (err) {
        console.error('[useStudyPlans] create error:', err);
        toast.error('Erro ao criar plano');
        throw new Error('Failed to create plan');
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const deletePlan = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      // REWIRED: Agent 4 api-study-plans
      await apiDeletePlan(id);
      toast.success('Plano eliminado');
    } catch (err) {
      console.error('[useStudyPlans] delete error:', err);
      toast.error('Erro ao eliminar plano');
      await fetchPlans();
    } finally {
      setIsMutating(false);
    }
  }, [fetchPlans]);

  const toggleItem = useCallback(async (planId: string, itemId: string) => {
    setIsMutating(true);
    try {
      // Optimistic update
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          const updatedItems = p.items.map((i) =>
            i.id === itemId ? { ...i, completed: !i.completed } : i
          );
          const completed = updatedItems.filter((i) => i.completed).length;
          const progress = updatedItems.length > 0 ? Math.round((completed / updatedItems.length) * 100) : 0;
          return { ...p, items: updatedItems, progress };
        })
      );
      // REWIRED: Agent 4 — toggle goal status
      const plan = plans.find(p => p.id === planId);
      const item = plan?.items.find(i => i.id === itemId);
      if (item) {
        await updateStudyGoal(itemId, {
          status: item.completed ? 'in-progress' : 'completed',
        });
      }
    } catch (err) {
      console.error('[useStudyPlans] toggleItem error:', err);
      toast.error('Erro ao atualizar item');
      await fetchPlans();
    } finally {
      setIsMutating(false);
    }
  }, [fetchPlans, plans]);

  return {
    plans,
    isLoading,
    error,
    isMutating,
    createPlan,
    deletePlan,
    toggleItem,
    refetch: fetchPlans,
  };
}
