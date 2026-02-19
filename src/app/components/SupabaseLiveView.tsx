import React, { useState, useEffect, useCallback } from "react";
import {
  Server, Hash, Link2,
  FileWarning, Shapes,
  Route, Zap,
} from "lucide-react";
import { GitHubMonitorPanel } from "./GitHubMonitorPanel";
import type { GitHubStatusResponse } from "./GitHubMonitorPanel";
import { ContractPushPanel } from "./ContractPushPanel";
import type {
  HealthResponse,
  AuditResponse,
  RouteProbeResult,
} from "./supabase-live/types";
import {
  ROUTE_GROUPS,
  OLEADAS,
} from "./supabase-live/route-registry";
import {
  API_BASE,
  apiFetch,
  probeRoute,
  isRouteAlive,
  StatCard,
} from "./supabase-live/helpers";
import { PrefixDiscoveryPanel } from "./supabase-live/PrefixDiscoveryPanel";
import { OleadaTracker } from "./supabase-live/OleadaTracker";
import { BackendRoutesSection } from "./supabase-live/BackendRoutesSection";
import { DevDeliverablesSection } from "./supabase-live/DevDeliverablesSection";
import { AuditSectionsPanel } from "./supabase-live/AuditSectionsPanel";
import { DataExplorerPanel } from "./supabase-live/DataExplorerPanel";
import { MonitorHeaderSection } from "./supabase-live/MonitorHeaderSection";

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
// apiFetch, probeRoute, StatusBadge, ScoreGauge, isRouteAlive, StatCard
// ══════════════════════════════════════════════════════════════════════════════

// OleadaTracker — extracted to ./supabase-live/OleadaTracker.tsx (Paso 5/6)

// ═════════════════════════════════════════════════════════════════════════════
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

  // ── Bridge: AuditSectionsPanel → DataExplorerPanel ──
  const [externalBrowseRequest, setExternalBrowseRequest] = useState<string | null>(null);

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

      {/* ══════════════════════ HEADER + BANNERS ══════════════════════ */}
      <MonitorHeaderSection
        health={health}
        healthLoading={healthLoading}
        healthError={healthError}
        auditScore={audit?.summary?.score}
        lastRefresh={lastRefresh}
        onRefresh={refreshAll}
        showLive={SHOW_LIVE}
      />

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
        onBrowsePrefix={setExternalBrowseRequest}
      />

      {/* ══════════════════════ DATA EXPLORER ══════════════════════ */}
      <DataExplorerPanel
        entityDetails={audit?.entityDetails}
        externalBrowsePrefix={externalBrowseRequest}
        onExternalBrowseHandled={() => setExternalBrowseRequest(null)}
      />

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