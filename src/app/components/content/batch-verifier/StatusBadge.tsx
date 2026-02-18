// ============================================================
// Axon v4.4 — BatchVerifier UI Components
// StatusBadge + KvKeyBadges — extracted from BatchVerifier.tsx
// ============================================================

import React from 'react';
import {
  CheckCircle2, XCircle, Loader2, AlertTriangle, Key,
} from 'lucide-react';
import type { TestStatus, KvKeyResult } from './types';

export function StatusBadge({
  status,
  httpStatus,
  ms,
}: {
  status: TestStatus;
  httpStatus?: number;
  ms?: number;
}) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold';
  switch (status) {
    case 'pass':
      return (
        <span className={`${base} bg-emerald-100 text-emerald-800`}>
          <CheckCircle2 size={12} /> {httpStatus}{' '}
          <span className="text-emerald-500 font-normal">{ms}ms</span>
        </span>
      );
    case 'fail':
      return (
        <span className={`${base} bg-red-100 text-red-800`}>
          <XCircle size={12} /> {httpStatus || 'ERR'}{' '}
          <span className="text-red-500 font-normal">{ms}ms</span>
        </span>
      );
    case 'warn':
      return (
        <span className={`${base} bg-amber-100 text-amber-800`}>
          <AlertTriangle size={12} /> {httpStatus}{' '}
          <span className="text-amber-500 font-normal">{ms}ms</span>
        </span>
      );
    case 'running':
      return (
        <span className={`${base} bg-blue-100 text-blue-700`}>
          <Loader2 size={12} className="animate-spin" /> Running...
        </span>
      );
    case 'skip':
      return <span className={`${base} bg-gray-100 text-gray-500`}>SKIP</span>;
    default:
      return <span className={`${base} bg-gray-50 text-gray-400`}>Pending</span>;
  }
}

export function KvKeyBadges({ keys }: { keys?: KvKeyResult[] }) {
  if (!keys || keys.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {keys.map((k) => (
        <span
          key={k.key}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
            k.exists
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
          title={k.key}
        >
          <Key size={8} />
          {k.key.length > 45
            ? k.key.slice(0, 20) + '...' + k.key.slice(-18)
            : k.key}
          {k.exists ? ' \u2713' : ' \u2717'}
        </span>
      ))}
    </div>
  );
}
