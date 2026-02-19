// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Monitor Header Section
// Extracted from SupabaseLiveView.tsx (Paso 6/6 — sub-extraction F)
//
// Exports: MonitorHeaderSection
// Renders: Main header bar + Connection Error banner + Table Status banner
// Internalizes: healthStatus derivation
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Database, RefreshCw, AlertCircle, AlertTriangle } from "lucide-react";
import { projectId } from "/utils/supabase/info";
import type { HealthResponse } from "./types";
import { DIAG_PREFIX, API_BASE, StatusBadge, ScoreGauge } from "./helpers";
import { LIVE_PREFIX } from "./route-registry";

export interface MonitorHeaderSectionProps {
  health: HealthResponse | null;
  healthLoading: boolean;
  healthError: string | null;
  /** audit?.summary.score — undefined when audit hasn't loaded */
  auditScore: number | undefined;
  lastRefresh: Date;
  onRefresh: () => void;
  showLive: boolean;
}

export function MonitorHeaderSection({
  health,
  healthLoading,
  healthError,
  auditScore,
  lastRefresh,
  onRefresh,
  showLive,
}: MonitorHeaderSectionProps) {
  const healthStatus = healthLoading ? "loading" : health ? "ok" : "error";

  return (
    <>
      {/* ═════════════════════ HEADER ══════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-violet-100">
            <Database className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Supabase Live Monitor</h2>
            <p className="text-xs text-muted-foreground">
              <code className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">{projectId}</code>
              <span className="mx-1.5 text-gray-300">|</span>
              Diag: <code className="px-1 py-0.5 bg-violet-100 rounded text-[10px] text-violet-700">{DIAG_PREFIX}</code>
              {showLive && (<>
                <span className="mx-1 text-gray-300">/</span>
                Routes: <code className="px-1 py-0.5 bg-emerald-100 rounded text-[10px] text-emerald-700">{LIVE_PREFIX}</code>
              </>)}
              <span className="mx-1.5 text-gray-300">|</span>
              {lastRefresh.toLocaleTimeString("es")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={healthStatus} />
          {auditScore !== undefined && <ScoreGauge score={auditScore} />}
          <button onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors text-xs font-medium shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Auditar Todo
          </button>
        </div>
      </div>

      {/* ══════════════════════ CONNECTION ERROR BANNER ══════════════════════ */}
      {!healthLoading && healthError && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">No se pudo conectar al servidor diagnostico</h3>
              <p className="text-xs text-red-700 leading-relaxed break-all mb-2">
                {healthError}
              </p>
              <div className="text-xs text-red-600 space-y-1">
                <p><strong>Endpoint:</strong> <code className="bg-red-100 px-1 rounded">{API_BASE}/health</code></p>
                <p><strong>Posibles causas:</strong></p>
                <ul className="list-disc list-inside ml-2 text-red-500 space-y-0.5">
                  <li>Cold start del edge function (espera ~5s y haz click en &quot;Auditar Todo&quot;)</li>
                  <li>El servidor no esta desplegado aun</li>
                  <li>Error de compilacion en <code className="bg-red-100 px-1 rounded">index.tsx</code></li>
                </ul>
              </div>
              <button
                onClick={onRefresh}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TABLE STATUS ══════════════════════ */}
      {health && !health.tableExists && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 mb-1">Tabla KV no existe todavia</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                La tabla <code className="bg-amber-100 px-1 rounded">{health.kvTable}</code> se crea automaticamente la primera vez que un dev ejecuta <code className="bg-amber-100 px-1 rounded">kv.set()</code>. El servidor funciona — solo falta datos.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
