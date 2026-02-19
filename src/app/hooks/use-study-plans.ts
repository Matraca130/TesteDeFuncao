// ============================================================
// useStudyPlans — CRUD hook for student study plans
// Added by Agent 6 — PRISM — P3 Hook Layer
// TODO P3+: Replace mock calls with real Agent 4 API hooks
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MOCK_STUDY_PLANS, type StudyPlan } from '../data/mock-data';
import { mockFetchAll, mockCreate, mockHardDelete, mockUpdate } from '../api-client/mock-api';

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
      const data = await mockFetchAll(MOCK_STUDY_PLANS);
      setPlans(data);
    } catch {
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
        const newPlan: StudyPlan = {
          ...data,
          id: `sp-${Date.now()}`,
          progress: 0,
          created_at: new Date().toISOString().split('T')[0],
        };
        await mockCreate(newPlan);
        setPlans((prev) => [...prev, newPlan]);
        toast.success('Plano criado com sucesso');
        return newPlan;
      } catch {
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
      await mockHardDelete(id);
      toast.success('Plano eliminado');
    } catch {
      toast.error('Erro ao eliminar plano');
      await fetchPlans();
    } finally {
      setIsMutating(false);
    }
  }, [fetchPlans]);

  const toggleItem = useCallback(async (planId: string, itemId: string) => {
    setIsMutating(true);
    try {
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
      await mockUpdate({ planId, itemId });
    } catch {
      toast.error('Erro ao atualizar item');
      await fetchPlans();
    } finally {
      setIsMutating(false);
    }
  }, [fetchPlans]);

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
