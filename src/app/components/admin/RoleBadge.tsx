// ============================================================
// Axon v4.4 — RoleBadge (Shared Admin Component)
// Agent 5: FORGE
//
// Used by: AdminDashboard, MemberManagement, AdminScopesPage
// Accepts string to handle both MembershipRole and
// Object.entries() string keys from stats.membersByRole.
// ============================================================

import { Badge } from '../ui/badge';
import { ROLE_CONFIG } from '../../lib/admin-constants';
import type { MembershipRole } from '../../../types/auth';

const FALLBACK = { label: '', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' };

export function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role as MembershipRole] ?? { ...FALLBACK, label: role };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
