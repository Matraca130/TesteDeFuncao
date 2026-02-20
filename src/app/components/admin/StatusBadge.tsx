// ============================================================
// Axon v4.4 — StatusBadge (Shared Admin Component)
// Agent 5: FORGE
//
// Used by: MemberManagement (table + mobile cards)
// ============================================================

import { Badge } from '../ui/badge';
import { STATUS_CONFIG } from '../../lib/admin-constants';
import type { MemberStatus } from '../../../types/auth';

const FALLBACK = { label: '', className: '' };

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as MemberStatus] ?? { ...FALLBACK, label: status };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
