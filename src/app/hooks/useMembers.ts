// ============================================================
// Axon v4.4 — useMembers Hook
// Agent 5: FORGE — 3-Layer: Components → [Hooks] → api-admin
// Phase 4: imports directly from api-admin.ts (no barrel)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getMembers,
  inviteMember,
  updateMemberRole,
  suspendMember,
  removeMember,
} from '../lib/api-admin';
import type { MembershipFull, MembershipRole, InviteMemberPayload } from '../../types/auth';

interface UseMembersReturn {
  members: MembershipFull[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  invite: (payload: InviteMemberPayload) => Promise<MembershipFull>;
  updateRole: (memberId: string, role: MembershipRole) => Promise<MembershipFull>;
  suspend: (memberId: string) => Promise<MembershipFull>;
  remove: (memberId: string) => Promise<void>;
}

export function useMembers(instId: string): UseMembersReturn {
  const [members, setMembers] = useState<MembershipFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMembers(instId);
      setMembers(data);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  }, [instId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const invite = useCallback(
    async (payload: InviteMemberPayload) => {
      const member = await inviteMember(instId, payload);
      setMembers((prev) => [...prev, member]);
      return member;
    },
    [instId]
  );

  const updateRole = useCallback(
    async (memberId: string, role: MembershipRole) => {
      const updated = await updateMemberRole(instId, memberId, role);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      return updated;
    },
    [instId]
  );

  const suspend = useCallback(
    async (memberId: string) => {
      const updated = await suspendMember(instId, memberId);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      return updated;
    },
    [instId]
  );

  const remove = useCallback(
    async (memberId: string) => {
      await removeMember(instId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    },
    [instId]
  );

  return { members, loading, error, reload, invite, updateRole, suspend, remove };
}
