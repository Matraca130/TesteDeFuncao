// ============================================================
// Axon v4.4 — usePlans Hook
// Agent 5: FORGE — 3-Layer: Components → [Hooks] → api-plans
// Phase 4: imports directly from api-plans.ts (no barrel)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanActive,
} from '../lib/api-plans';
import type { PricingPlan } from '../../types/auth';

interface UsePlansReturn {
  plans: PricingPlan[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  create: (data: Partial<PricingPlan>) => Promise<PricingPlan>;
  update: (planId: string, data: Partial<PricingPlan>) => Promise<PricingPlan>;
  remove: (planId: string) => Promise<void>;
  toggleActive: (planId: string) => Promise<PricingPlan>;
}

export function usePlans(instId: string): UsePlansReturn {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlans(instId);
      setPlans(data);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  }, [instId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (data: Partial<PricingPlan>) => {
      const created = await createPlan(instId, data);
      setPlans((prev) => [...prev, created]);
      return created;
    },
    [instId]
  );

  const update = useCallback(
    async (planId: string, data: Partial<PricingPlan>) => {
      const updated = await updatePlan(instId, planId, data);
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      return updated;
    },
    [instId]
  );

  const remove = useCallback(
    async (planId: string) => {
      await deletePlan(instId, planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    },
    [instId]
  );

  const toggleActive = useCallback(
    async (planId: string) => {
      const updated = await togglePlanActive(instId, planId);
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      return updated;
    },
    [instId]
  );

  return { plans, loading, error, reload, create, update, remove, toggleActive };
}
