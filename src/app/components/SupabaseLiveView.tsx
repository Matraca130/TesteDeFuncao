import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Database,
  Server, Hash, AlertCircle, Loader2,
  Search, X,
  AlertTriangle, Link2,
  FileWarning, Shapes,
  Route, Zap,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";
import { GitHubMonitorPanel } from "./GitHubMonitorPanel";
import type { GitHubStatusResponse } from "./GitHubMonitorPanel";
import { ContractPushPanel } from "./ContractPushPanel";
import type {
  HealthResponse,
  KvItem,
  KvBrowseResponse,
  AuditResponse,
  RouteProbeResult,
} from "./supabase-live/types";
import {
  LIVE_PREFIX,
  ROUTE_GROUPS,
  OLEADAS,
} from "./supabase-live/route-registry";
import {
  DIAG_PREFIX,
  API_BASE,
  apiFetch,
  probeRoute,
  StatusBadge,
  JsonViewer,
  ScoreGauge,
  isRouteAlive,
  Section,
  StatCard,
} from "./supabase-live/helpers";
import { PrefixDiscoveryPanel } from "./supabase-live/PrefixDiscoveryPanel";
import { OleadaTracker } from "./supabase-live/OleadaTracker";
import { BackendRoutesSection } from "./supabase-live/BackendRoutesSection";
import { DevDeliverablesSection } from "./supabase-live/DevDeliverablesSection";
import { AuditSectionsPanel } from "./supabase-live/AuditSectionsPanel";

// ── DUAL-BASE ARCHITECTURE ──
// Diagnostic endpoints (/health, /audit, /kv/browse, /kv/stats) → THIS project's server (229c9fbf)
// Route probing (auth/me, courses, flashcards, etc.) → LIVE Axon server (7a20cd7d)
// DIAG_PREFIX, API_BASE, LIVE_API_BASE — imported from ./supabase-live/helpers

// ── LIVE TOGGLE ──
// v4.4 backend is LIVE with 89 endpoints via CI/CD from GitHub repo.
// KV table fixed: kv_store_7a20cd7d (commit c617751).
const SHOW_LIVE = true;

// PrefixDiscoveryPanel — extracted to ./supabase-live/PrefixDiscoveryPanel.tsx (Paso 4/6)

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS — all extracted to ./supabase-live/helpers.tsx (Paso 3/6)
// apiFetch, probeRoute, StatusBadge, JsonViewer, ScoreGauge, isRouteAlive, Section, StatCard
// ══════════════════════════════════════════════════════════════════════════════

// OleadaTracker — extracted to ./supabase-live/OleadaTracker.tsx (Paso 5/6)

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function SupabaseLiveView() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(true);

  const [routeProbes, setRouteProbes] = useState<RouteProbeResult[]>([]);
  const [routeProbing, setRouteProbing] = useState(false);
  const [routeProbed, setRouteProbed] = useState(false);

  const [githubData, setGithubData] = useState<GitHubStatusResponse | null>(null);

  const [browseData, setBrowseData] = useState<KvBrowseResponse | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePrefix, setBrowsePrefix] = useState("");
  const [activePrefixFilter, setActivePrefixFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<KvItem | null>(null);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Fetchers ──
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await apiFetch<HealthResponse>("/health");
      setHealth(data);
    } catch (err: any) {
      console.error("[SupabaseLive] Health:", err.message);
      setHealthError(err.message);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await apiFetch<AuditResponse>("/audit");
      setAudit(data);
    } catch (err: any) {
      console.error("[SupabaseLive] Audit:", err.message);
      setAudit({ success: false, timestamp: "", tableExists: false, summary: { total: 0, primaries: 0, indices: 0, unknown: 0, score: 0 }, alerts: [{ severity: "error", category: "connection", title: "Audit fallido", detail: err.message }], devProgress: [], keyPatterns: { recognized: [], unknown: [] }, dataShapeIssues: [], indexIntegrity: [], entityDetails: [], error: err.message });
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const probeAllRoutes = useCallback(async () => {
    setRouteProbing(true);
    try {
      const results = await Promise.all(ROUTE_GROUPS.map(probeRoute));
      setRouteProbes(results);
      setRouteProbed(true);
    } catch (err: any) {
      console.error("[SupabaseLive] Route probing:", err.message);
    } finally {
      setRouteProbing(false);
    }
  }, []);

  const fetchBrowse = useCallback(async (prefix: string = "") => {
    setBrowseLoading(true);
    setActivePrefixFilter(prefix);
    try {
      const param = prefix ? `?prefix=${encodeURIComponent(prefix)}` : "";
      const data = await apiFetch<KvBrowseResponse>(`/kv/browse${param}`);
      setBrowseData(data);
    } catch (err: any) {
      console.error("[SupabaseLive] Browse:", err.message);
      setBrowseData({ success: false, count: 0, prefix, items: [], error: err.message });
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLastRefresh(new Date());
    const tasks = [fetchHealth(), fetchAudit()];
    if (SHOW_LIVE) tasks.push(probeAllRoutes());
    await Promise.all(tasks);
  }, [fetchHealth, fetchAudit, probeAllRoutes]);

  // Auto-retry on initial load: edge functions have cold starts (~2-5s)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await refreshAll();
      // If health failed, wait and retry once (cold start)
      if (!cancelled) {
        setTimeout(async () => {
          if (!cancelled) {
            await refreshAll();
          }
        }, 4000);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const healthStatus = healthLoading ? "loading" : health ? "ok" : "error";

  // ── Route summary stats ──
  const routesLive = routeProbes.filter(r => isRouteAlive(r.state)).length;
  const routesTotal = ROUTE_GROUPS.length;
  const routeEndpointsLive = ROUTE_GROUPS.filter(g => {
    const probe = routeProbes.find(r => r.group === g.group);
    return probe && isRouteAlive(probe.state);
  }).reduce((sum, g) => sum + g.totalRoutes, 0);
  const routeEndpointsTotal = ROUTE_GROUPS.reduce((sum, g) => sum + g.totalRoutes, 0);

  // ── KV pattern lookup from audit ──
  const getKvPatternCount = (pattern: string): number => {
    if (!audit) return 0;
    const found = audit.keyPatterns.recognized.find(r => r.pattern === pattern);
    return found?.count ?? 0;
  };

  // ── Route probe lookup ──
  const getRouteProbe = (group: string): RouteProbeResult | undefined => {
    return routeProbes.find(r => r.group === group);
  };

  return (
    <div className="py-6 space-y-5">
      {/* ══════════════════════ PREFIX DISCOVERY ══════════════════════ */}
      {SHOW_LIVE && <PrefixDiscoveryPanel />}

      {/* ══════════════════════ GITHUB CODE MONITOR ══════════════════════ */}
      <GitHubMonitorPanel
        liveRouteCount={SHOW_LIVE && routeProbed ? routesLive : undefined}
        liveKvCount={SHOW_LIVE ? audit?.summary.total : undefined}
        onDataUpdate={setGithubData}
      />

      {/* ══════════════════════ CONTRACT PUSH ══════════════════════ */}
      <ContractPushPanel />

      {/* ══════════════════════ HEADER ══════════════════════ */}
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
              {SHOW_LIVE && (<>
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
          {audit?.summary && <ScoreGauge score={audit.summary.score} />}
          <button onClick={refreshAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors text-xs font-medium shadow-sm">
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
                onClick={refreshAll}
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

      {/* ══════════════════════ SUMMARY CARDS ══════════════════════ */}
      <div className={`grid grid-cols-2 md:grid-cols-4 ${SHOW_LIVE ? "lg:grid-cols-7" : "lg:grid-cols-5"} gap-3`}>
        <StatCard icon={<Hash className="w-4 h-4" />} label="Total registros KV" value={audit?.summary.total ?? "—"} loading={auditLoading} />
        <StatCard icon={<Shapes className="w-4 h-4" />} label="Primarias" value={audit?.summary.primaries ?? "—"} loading={auditLoading} sub="entidades" />
        <StatCard icon={<Link2 className="w-4 h-4" />} label="Indices" value={audit?.summary.indices ?? "—"} loading={auditLoading} sub="idx:*" />
        <StatCard icon={<FileWarning className="w-4 h-4" />} label="No reconocidas" value={audit?.summary.unknown ?? "—"} loading={auditLoading} alert={audit != null && audit.summary.unknown > 0} />
        {SHOW_LIVE && <StatCard icon={<Route className="w-4 h-4" />} label="Rutas vivas" value={routeProbed ? `${routesLive}/${routesTotal}` : "—"} loading={routeProbing} sub={routeProbed ? `${routeEndpointsLive}/${routeEndpointsTotal} endpoints` : undefined} />}
        {SHOW_LIVE && <StatCard icon={<Zap className="w-4 h-4" />} label="Rutas 404" value={routeProbed ? routeProbes.filter(r => r.state === "not_found").length : "—"} loading={routeProbing} alert={routeProbed && routeProbes.filter(r => r.state === "not_found").length > 10} />}
        <StatCard icon={<Server className="w-4 h-4" />} label="Server" value={health ? "OK" : "—"} loading={healthLoading} sub={health?.prefix} />
      </div>

      {/* ══════════════════════ OLEADA TRACKER ══════════════════════ */}
      {(routeProbed || audit || githubData) && (
        <OleadaTracker
          oleadas={OLEADAS}
          routeProbes={routeProbes}
          getKvPatternCount={getKvPatternCount}
          isRouteAlive={isRouteAlive}
          githubRouteGroups={githubData?.codeAnalysis?.allRouteGroups || []}
          githubKvPrefixes={githubData?.codeAnalysis?.allKvPrefixes || []}
          githubLoaded={!!githubData}
          githubFiles={githubData?.files}
          keyConflicts={githubData?.keyConflicts}
          allDetectedRoutes={githubData?.codeAnalysis?.allDetectedRoutes || []}
          debugRawMatches={githubData?.codeAnalysis?._debugRawMatches || []}
          perFileRoutes={githubData?.codeAnalysis?._perFileRoutes || []}
          extraFilesScanned={githubData?._extraFilesScanned || []}
          showLive={SHOW_LIVE}
        />
      )}

      {/* ══════════════════════ BACKEND ROUTES ══════════════════════ */}
      {SHOW_LIVE && <BackendRoutesSection
        routeProbes={routeProbes}
        routeProbing={routeProbing}
        routeProbed={routeProbed}
        routesLive={routesLive}
        routesTotal={routesTotal}
      />}

      {/* ══════════════════════ DEV DELIVERABLES ══════════════════════ */}
      <DevDeliverablesSection
        routeProbed={routeProbed}
        hasAuditData={!!audit}
        getKvPatternCount={getKvPatternCount}
        getRouteProbe={getRouteProbe}
      />

      {/* ══════════════════════ AUDIT SECTIONS ══════════════════════ */}
      <AuditSectionsPanel
        audit={audit}
        auditLoading={auditLoading}
        health={health}
        onBrowsePrefix={fetchBrowse}
      />

      {/* ══════════════════════ DATA EXPLORER ══════════════════════ */}
      <Section title="Explorador de datos" icon={<Search className="w-4 h-4 text-gray-500" />}>
        <div className="p-5 space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <input
              type="text" value={browsePrefix} onChange={(e) => setBrowsePrefix(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchBrowse(browsePrefix)}
              placeholder="Ej: course:, user:, idx:inst-courses:, fc:..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
            <button onClick={() => fetchBrowse(browsePrefix)} disabled={browseLoading}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {browseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
            </button>
          </div>

          {/* Quick prefix buttons */}
          {audit && audit.entityDetails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => fetchBrowse("")} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${activePrefixFilter === "" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                TODO
              </button>
              {audit.entityDetails.slice(0, 15).map((ed) => (
                <button key={ed.pattern} onClick={() => fetchBrowse(ed.pattern + ":")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-colors ${activePrefixFilter === ed.pattern + ":" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {ed.pattern}: <span className="opacity-60">({ed.count})</span>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {browseData && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                <span className="text-xs text-gray-500">
                  <strong>{browseData.count}</strong> registros — prefijo: <code className="text-violet-600">{browseData.prefix}</code>
                </span>
                <button onClick={() => { setBrowseData(null); setActivePrefixFilter(""); setSelectedItem(null); }}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {browseLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
                </div>
              ) : browseData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Sin registros</div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {browseData.items.map((item) => (
                    <div key={item.key} className="px-4 py-2.5">
                      <button onClick={() => setSelectedItem(selectedItem?.key === item.key ? null : item)} className="w-full text-left">
                        <div className="flex items-center justify-between">
                          <code className="text-[11px] font-mono text-gray-700 break-all">{item.key}</code>
                          <span className="text-[9px] text-gray-400 ml-2 shrink-0 font-mono">
                            {typeof item.value === "object" && item.value !== null ? `{${Object.keys(item.value).length}}` : typeof item.value}
                          </span>
                        </div>
                      </button>
                      {selectedItem?.key === item.key && (
                        <div className="mt-2"><JsonViewer data={item.value} initialOpen /></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ══════════════════════ CONNECTION INFO ══════════════════════ */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-500">Endpoint:</strong>{" "}
          <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-[10px]">{API_BASE}</code>{" "}
          — Tabla: <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-[10px]">{health?.kvTable || "kv_store_0ada7954"}</code>{" "}
          — Validacion contra <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-[10px]">kv-schema.ts</code> (27 primarias + 30 indices)
          {" "}— <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-[10px]">api-contract.ts</code> ({routeEndpointsTotal} endpoints en {routesTotal} grupos)
        </p>
      </div>
    </div>
  );
}

// StatCard — moved to ./supabase-live/helpers.tsx (Paso 3/6)