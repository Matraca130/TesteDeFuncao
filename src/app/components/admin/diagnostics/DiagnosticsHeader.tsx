// ============================================================
// Axon v4.4 — Diagnostics: Header with stats + action buttons
// ============================================================
import React from 'react';
import {
  Activity, CheckCircle, XCircle, Loader2, Play, RotateCcw,
} from 'lucide-react';

interface Props {
  passCount: number;
  failCount: number;
  totalCount: number;
  isRunning: boolean;
  onRunAll: () => void;
  onReset: () => void;
}

export function DiagnosticsHeader({
  passCount,
  failCount,
  totalCount,
  isRunning,
  onRunAll,
  onReset,
}: Props) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity size={20} className="text-teal-500" />
          Diagn\u00f3stico de Conectividade
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          4 camadas \u00b7 {totalCount} testes \u00b7 Valida\u00e7\u00e3o completa frontend \u2194 backend
        </p>
      </div>
      <div className="flex items-center gap-2">
        {passCount + failCount > 0 && (
          <div className="flex items-center gap-3 mr-3">
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle size={14} /> {passCount}
            </span>
            {failCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                <XCircle size={14} /> {failCount}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {passCount}/{totalCount}
            </span>
          </div>
        )}
        <button
          onClick={onRunAll}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          {isRunning ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {isRunning ? 'Executando...' : 'Executar Todas'}
        </button>
        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 rounded-xl text-sm font-medium transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
