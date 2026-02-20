// ============================================================
// Axon v4.4 — useAdminScopes Hook
// Agent 5: FORGE — 3-Layer: Components → [Hooks] → api-admin
// Phase 4: imports directly from api-admin.ts (no barrel)
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMembers,
  getAdminScopes,
  createAdminScope,
  deleteAdminScope,
  getScopeOptions,
} from '../lib/api-admin';
import type { MembershipFull, AdminScope, ScopeOption } from '../../types/auth';

interface UseAdminScopesReturn {
  members: MembershipFull[];
  eligibleMembers: MembershipFull[];
  scopes: AdminScope[];
  scopeOptions: ScopeOption[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createScope: (data: Partial<AdminScope>) => Promise<AdminScope>;
  removeScope: (scopeId: string) => Promise<void>;
}

export function useAdminScopes(instId: string): UseAdminScopesReturn {
  const [members, setMembers] = useState<MembershipFull[]>([]);
  const [scopes, setScopes] = useState<AdminScope[]>([]);
  const [scopeOptions, setScopeOptions] = useState<ScopeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersData, scopesData, optionsData] = await Promise.all([
        getMembers(instId),
        getAdminScopes(instId),
        getScopeOptions(instId),
      ]);
      setMembers(membersData);
      setScopes(scopesData);
      setScopeOptions(optionsData);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [instId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const eligibleMembers = useMemo(
    () => members.filter((m) => m.role === 'admin' || m.role === 'professor'),
    [members]
  );

  const createScope = useCallback(
    async (data: Partial<AdminScope>) => {
      const created = await createAdminScope(instId, data);
      setScopes((prev) => [...prev, created]);
      return created;
    },
    [instId]
  );

  const removeScope = useCallback(
    async (scopeId: string) => {
      await deleteAdminScope(instId, scopeId);
      setScopes((prev) => prev.filter((s) => s.id !== scopeId));
    },
    [instId]
  );

  return { members, eligibleMembers, scopes, scopeOptions, loading, error, reload, createScope, removeScope };
}
