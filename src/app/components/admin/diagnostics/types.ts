// ============================================================
// Axon v4.4 — Diagnostics: Shared Types & Constants
// ============================================================
import type React from 'react';
import {
  Clock, Loader2, CheckCircle, XCircle, PauseCircle, AlertTriangle,
} from 'lucide-react';

export type TestStatus = 'idle' | 'running' | 'pass' | 'fail' | 'skip' | 'warn';

export interface TestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  duration?: number;
  message?: string;
  details?: any;
}

export interface TestLayer {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  tests: TestResult[];
  status: TestStatus;
}

export const STATUS_CONFIG: Record<
  TestStatus,
  { color: string; bg: string; icon: React.ElementType; label: string }
> = {
  idle:    { color: 'text-gray-400',   bg: 'bg-gray-50',    icon: Clock,           label: 'Pendente' },
  running: { color: 'text-blue-600',   bg: 'bg-blue-50',    icon: Loader2,         label: 'Executando...' },
  pass:    { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle,     label: 'OK' },
  fail:    { color: 'text-red-600',    bg: 'bg-red-50',     icon: XCircle,         label: 'FALHOU' },
  skip:    { color: 'text-gray-400',   bg: 'bg-gray-50',    icon: PauseCircle,     label: 'Pulado' },
  warn:    { color: 'text-amber-600',  bg: 'bg-amber-50',   icon: AlertTriangle,   label: 'Aviso' },
};
