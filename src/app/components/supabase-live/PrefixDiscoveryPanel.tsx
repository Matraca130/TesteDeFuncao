// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — PrefixDiscoveryPanel
// Extracted from SupabaseLiveView.tsx (Paso 4/6)
//
// Tests all KNOWN_PREFIXES to discover which server(s) respond,
// have KV data, and have oleada routes deployed.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import {
  Radio, Loader2, RefreshCw,
  CheckCircle2, Clock, AlertCircle,
  Database, Route, Zap, Wifi, WifiOff,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { PrefixProbeResult } from "./types";
import { KNOWN_PREFIXES } from "./route-registry";

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function PrefixDiscoveryPanel() {
  const [results, setResults] = useState<PrefixProbeResult[]>([]);
  const [probing, setProbing] = useState(false);
  const [hasProbed, setHasProbed] = useState(false);

  const probeAll = useCallback(async () => {
    setProbing(true);
    const baseUrl = `https://${projectId}.supabase.co/functions/v1`;
    const headers = { Authorization: `Bearer ${publicAnonKey}` };

    const probes = KNOWN_PREFIXES.map(async (prefix): Promise<PrefixProbeResult> => {
      const result: PrefixProbeResult = {
        prefixId: prefix.id,
        label: prefix.label,
        description: prefix.description,
        healthStatus: "loading",
        healthData: null,
        healthError: null,
        healthLatency: 0,
        auditStatus: "skipped",
        auditSummary: null,
        auditKvTable: null,
        routeSample: null,
      };

      // 1. Probe /health
      const healthStart = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${baseUrl}/make-server-${prefix.id}/health`, {
          headers, signal: controller.signal,
        });
        clearTimeout(timeout);
        result.healthLatency = Date.now() - healthStart;

        if (res.ok) {
          result.healthData = await res.json();
          result.healthStatus = "ok";
        } else {
          result.healthError = `HTTP ${res.status}`;
          result.healthStatus = "error";
        }
      } catch (err: any) {
        result.healthLatency = Date.now() - healthStart;
        result.healthError = err.name === "AbortError" ? "Timeout (8s)" : err.message;
        result.healthStatus = err.name === "AbortError" ? "timeout" : "error";
      }

      // 2. If health OK, probe /audit
      if (result.healthStatus === "ok") {
        result.auditStatus = "loading";
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(`${baseUrl}/make-server-${prefix.id}/audit`, {
            headers, signal: controller.signal,
          });
          clearTimeout(timeout);

          if (res.ok) {
            const auditData = await res.json();
            result.auditStatus = "ok";
            result.auditSummary = auditData.summary || null;
            result.auditKvTable = auditData.tableExists
              ? (result.healthData?.kvTable || "unknown")
              : "(tabla no existe)";
          } else {
            result.auditStatus = "error";
          }
        } catch {
          result.auditStatus = "error";
        }

        // 3. Probe one real route (/auth/me) to check if oleada routes exist
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${baseUrl}/make-server-${prefix.id}/auth/me`, {
            headers, signal: controller.signal,
          });
          clearTimeout(timeout);
          const state = res.status === 200 || res.status === 201 ? "live"
            : res.status === 401 || res.status === 403 ? "auth_required"
            : res.status === 404 ? "not_found"
            : `http_${res.status}`;
          result.routeSample = { path: "/auth/me", status: res.status, state };
        } catch {
          result.routeSample = { path: "/auth/me", status: 0, state: "timeout" };
        }
      }

      return result;
    });

    const allResults = await Promise.all(probes);
    setResults(allResults);
    setProbing(false);
    setHasProbed(true);
  }, []);

  useEffect(() => { probeAll(); }, []);

  const liveServers = results.filter(r => r.healthStatus === "ok");
  const serversWithData = results.filter(r => r.auditSummary && r.auditSummary.total > 0);
  const serversWithRoutes = results.filter(r => r.routeSample && r.routeSample.state !== "not_found");

  return (
    <div className="rounded-xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden">
      <div className="px-5 py-3.5 bg-violet-100/60 border-b border-violet-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-violet-600" />
          <div>
            <h3 className="text-sm font-bold text-violet-900">Descubrimiento de Prefijos</h3>
            <p className="text-[10px] text-violet-600">
              Probando {KNOWN_PREFIXES.length} servidores conocidos en <code className="bg-violet-200/50 px-1 rounded">{projectId}</code>
            </p>
          </div>
        </div>
        <button
          onClick={probeAll}
          disabled={probing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors text-xs font-medium disabled:opacity-50 cursor-pointer"
        >
          {probing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {probing ? "Probando..." : "Re-probar"}
        </button>
      </div>

      {/* Summary bar */}
      {hasProbed && (
        <div className="px-5 py-2.5 bg-white/50 border-b border-violet-200 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${liveServers.length > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
            <strong>{liveServers.length}</strong>/{KNOWN_PREFIXES.length} servers responden
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-blue-500" />
            <strong>{serversWithData.length}</strong> con datos en KV
          </span>
          <span className="flex items-center gap-1.5">
            <Route className="w-3 h-3 text-purple-500" />
            <strong>{serversWithRoutes.length}</strong> con rutas de oleada (auth/me)
          </span>
        </div>
      )}

      {/* Results grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {(probing && results.length === 0 ? KNOWN_PREFIXES.map(p => ({
          prefixId: p.id, label: p.label, description: p.description,
          healthStatus: "loading" as const, healthData: null, healthError: null, healthLatency: 0,
          auditStatus: "skipped" as const, auditSummary: null, auditKvTable: null, routeSample: null,
        })) : results).map((r) => {
          const isLive = r.healthStatus === "ok";
          const hasData = r.auditSummary && r.auditSummary.total > 0;
          const hasRoutes = r.routeSample && r.routeSample.state !== "not_found";

          return (
            <div
              key={r.prefixId}
              className={`rounded-lg border-2 p-3.5 space-y-2.5 transition-all ${
                isLive && hasData ? "border-emerald-300 bg-emerald-50/50 shadow-sm" :
                isLive ? "border-blue-300 bg-blue-50/30" :
                r.healthStatus === "loading" ? "border-gray-200 bg-white animate-pulse" :
                "border-red-200 bg-red-50/30"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-800">{r.label}</div>
                  <code className="text-[10px] text-gray-500 font-mono">make-server-{r.prefixId}</code>
                </div>
                {r.healthStatus === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : r.healthStatus === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : r.healthStatus === "timeout" ? (
                  <Clock className="w-4 h-4 text-amber-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>

              {/* Health row */}
              <div className="text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">/health</span>
                  {r.healthStatus === "ok" ? (
                    <span className="text-emerald-600 font-medium">{r.healthLatency}ms</span>
                  ) : r.healthStatus === "loading" ? (
                    <span className="text-gray-400">...</span>
                  ) : (
                    <span className="text-red-600 font-medium">{r.healthError}</span>
                  )}
                </div>

                {/* KV Table */}
                {r.healthData?.kvTable && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">KV Table</span>
                    <code className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{r.healthData.kvTable}</code>
                  </div>
                )}

                {/* Audit / Data */}
                {r.auditStatus === "ok" && r.auditSummary && (
                  <div className="mt-1.5 p-2 rounded bg-white border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600 font-medium">Datos en KV</span>
                      <span className={`font-bold ${r.auditSummary.total > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                        {r.auditSummary.total} keys
                      </span>
                    </div>
                    {r.auditSummary.total > 0 && (
                      <div className="flex gap-3 text-[10px]">
                        <span className="text-blue-600">{r.auditSummary.primaries} primarias</span>
                        <span className="text-purple-600">{r.auditSummary.indices} indices</span>
                        <span className={`font-bold ${r.auditSummary.score >= 90 ? "text-emerald-600" : r.auditSummary.score >= 70 ? "text-amber-600" : "text-red-600"}`}>
                          Score: {r.auditSummary.score}
                        </span>
                      </div>
                    )}
                    {r.auditSummary.total === 0 && (
                      <span className="text-[10px] text-gray-400">Tabla vacia -- ningun dev ha escrito datos aun</span>
                    )}
                  </div>
                )}

                {/* Route sample */}
                {r.routeSample && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500">GET /auth/me</span>
                    {r.routeSample.state === "auth_required" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5" /> 401 RUTA EXISTE
                      </span>
                    ) : r.routeSample.state === "live" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        <Wifi className="w-2.5 h-2.5" /> LIVE
                      </span>
                    ) : r.routeSample.state === "not_found" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                        <WifiOff className="w-2.5 h-2.5" /> 404 NO EXISTE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                        {r.routeSample.state}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom tags */}
              <div className="flex flex-wrap gap-1">
                {isLive && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">RESPONDE</span>}
                {hasData && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">TIENE DATA</span>}
                {hasRoutes && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">TIENE RUTAS</span>}
                {!isLive && r.healthStatus !== "loading" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">NO RESPONDE</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnosis */}
      {hasProbed && (
        <div className="px-5 py-3 bg-white/70 border-t border-violet-200 text-xs space-y-1.5">
          <div className="font-bold text-violet-900 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Diagnostico Automatico
          </div>
          {liveServers.length === 0 && (
            <p className="text-red-600">Ningun servidor responde. Verifica que las edge functions esten desplegadas.</p>
          )}
          {liveServers.length > 0 && serversWithData.length === 0 && (
            <p className="text-amber-600">
              {liveServers.length} server(s) responden pero ninguno tiene datos en KV.
              {serversWithRoutes.length > 0
                ? " Las rutas de oleada existen -- necesitas hacer signup/seed para crear datos."
                : " Las rutas de oleada (auth/me) no existen -- solo hay las 4 rutas diagnosticas V1."
              }
            </p>
          )}
          {serversWithData.length > 0 && (
            <p className="text-emerald-700">
              Servidor(es) con datos: {serversWithData.map(s => `${s.label} (${s.auditSummary?.total} keys)`).join(", ")}.
              {serversWithData.some(s => s.prefixId !== "229c9fbf") && (
                <span className="font-bold text-violet-700"> El monitor actual apunta a 229c9fbf -- considera cambiar API_BASE al servidor que tiene data.</span>
              )}
            </p>
          )}
          {serversWithRoutes.length > 0 && !serversWithRoutes.find(s => s.prefixId === "229c9fbf") && (
            <p className="text-violet-700">
              Las rutas de oleada estan en <strong>{serversWithRoutes.map(s => s.label).join(", ")}</strong> pero NO en este monitor (229c9fbf).
              El Route Prober de abajo va a dar 404 en todo porque apunta al servidor equivocado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
