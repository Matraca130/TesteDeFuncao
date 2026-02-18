import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Database, ChevronRight, ChevronDown,
  Server, Clock, Hash, AlertCircle, CheckCircle2, Loader2,
  Search, X, ShieldAlert,
  AlertTriangle, Users, Link2, Layers, BarChart3,
  FileWarning, Unlink, Shapes, Wifi, WifiOff,
  Route, Zap, CircleDot, ArrowRight, Radio,
  Flag, Package, GitBranch,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { GitHubMonitorPanel } from "./GitHubMonitorPanel";
import type { GitHubStatusResponse } from "./GitHubMonitorPanel";
import { ContractPushPanel } from "./ContractPushPanel";
import type {
  PrefixProbeResult,
  HealthResponse,
  KvItem,
  KvBrowseResponse,
  AuditResponse,
  RouteStatus,
  RouteProbeResult,
  RouteGroup,
  DevDeliverables,
  OleadaItem,
  OleadaDefinition,
} from "./supabase-live/types";
import {
  LIVE_PREFIX,
  KNOWN_PREFIXES,
  ROUTE_GROUPS,
  DEV_DELIVERABLES,
  OLEADAS,
} from "./supabase-live/route-registry";
import {
  DIAG_PREFIX,
  API_BASE,
  apiFetch,
  probeRoute,
  StatusBadge,
  JsonViewer,
  SeverityIcon,
  severityBg,
  ScoreGauge,
  devColor,
  routeStateBadge,
  isRouteAlive,
  Section,
  StatCard,
} from "./supabase-live/helpers";
import { PrefixDiscoveryPanel } from "./supabase-live/PrefixDiscoveryPanel";

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
// apiFetch, probeRoute, StatusBadge, JsonViewer, SeverityIcon, severityBg,
// ScoreGauge, devColor, routeStateBadge, isRouteAlive, Section, StatCard
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// OLEADA TRACKER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function OleadaTracker({ oleadas, routeProbes, getKvPatternCount, isRouteAlive: isAlive, githubRouteGroups, githubKvPrefixes, githubLoaded, githubFiles, keyConflicts, allDetectedRoutes, debugRawMatches, perFileRoutes, extraFilesScanned, showLive = false }: {
  oleadas: OleadaDefinition[];
  routeProbes: RouteProbeResult[];
  getKvPatternCount: (p: string) => number;
  isRouteAlive: (s: RouteStatus) => boolean;
  githubRouteGroups: string[];
  githubKvPrefixes: string[];
  githubLoaded: boolean;
  githubFiles?: { path: string; label: string; dev: string; exists: boolean; sha: string; routeCount: number; totalKvCalls: number; hasRealPersistence: boolean; detectedRouteGroups?: string[]; detectedKvPrefixes?: string[] }[];
  keyConflicts?: { found: string; expected: string; severity: string; message: string; file: string }[];
  allDetectedRoutes?: string[];
  debugRawMatches?: string[];
  perFileRoutes?: { file: string; dev: string; routes: string[]; count: number }[];
  extraFilesScanned?: string[];
  showLive?: boolean;
}) {
  const [expandedOleada, setExpandedOleada] = useState<number | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Helper: check if item exists in GitHub code
  const isInGitHub = (item: OleadaItem): boolean => {
    if (!githubLoaded) return false;
    if (item.type === "route") return githubRouteGroups.includes(item.key);
    return githubKvPrefixes.includes(item.key);
  };

  // Status icon for dual-state
  const DualIcon = ({ inCode, isLive }: { inCode: boolean; isLive: boolean }) => {
    if (isLive) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    if (inCode) return <GitBranch className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    return <CircleDot className="w-3.5 h-3.5 text-gray-300 shrink-0" />;
  };

  // Compute auto-status per oleada
  const computeAutoStatus = (codePct: number, livePct: number): { label: string; color: string } => {
    if (showLive) {
      if (livePct === 100) return { label: "LIVE 100%", color: "text-emerald-600" };
      if (livePct > 0) return { label: `LIVE ${livePct}%`, color: "text-emerald-500" };
    }
    if (codePct === 100) return { label: "COMPLETO", color: "text-emerald-600" };
    if (codePct > 0) return { label: `${codePct}%`, color: "text-sky-500" };
    return { label: "PENDIENTE", color: "text-gray-400" };
  };

  // Count oleadas that are fully in code
  const oleadasInCode = oleadas.filter(o => {
    const codeOk = o.items.filter(i => isInGitHub(i)).length;
    return codeOk === o.items.length && o.items.length > 0;
  }).length;
  const oleadasLive = oleadas.filter(o => {
    const liveOk = o.items.filter(i => {
      if (i.type === "route") {
        const probe = routeProbes.find(r => r.group === i.key);
        return probe ? isAlive(probe.state) : false;
      }
      return getKvPatternCount(i.key) > 0;
    }).length;
    return liveOk === o.items.length && o.items.length > 0;
  }).length;

  return (
    <Section
      title="Tracking por Oleada"
      icon={<Flag className="w-4 h-4 text-amber-500" />}
      badge={
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center gap-1">
            <GitBranch className="w-2.5 h-2.5" />{oleadasInCode}/{oleadas.length} en codigo
          </span>
          {showLive && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
            <Wifi className="w-2.5 h-2.5" />{oleadasLive}/{oleadas.length} live
          </span>}
        </div>
      }
      defaultOpen
    >
      {/* Legend */}
      <div className="px-5 py-2 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><CircleDot className="w-3 h-3 text-gray-300" /> No existe</span>
        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3 text-sky-500" /> En GitHub{showLive ? " (no desplegado)" : ""}</span>
        {showLive && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Live en servidor</span>}
        {!showLive && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verificado en codigo</span>}
      </div>

      {/* ── Dev Verification Status — Manual confirmations from checklist reviews ── */}
      <div className="px-5 py-3 bg-emerald-50/60 border-b border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">Verificacion Manual de Devs</span>
          <span className="text-[10px] text-emerald-500">(checklist line-by-line review)</span>
        </div>
        <div className="space-y-1.5">
          {/* Dev 1 — VERIFIED */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-emerald-200">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">Dev 1</span>
              <span className="text-[11px] font-medium text-emerald-800">Admin/Content — 45/45 rutas, 21/21 KV keys, 6/6 patrones</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">VERIFICADO</span>
              <code className="text-[9px] text-gray-400">592abef</code>
              <span className="text-[9px] text-gray-400">18-feb-2026</span>
            </div>
          </div>
          <div className="pl-9 flex flex-wrap gap-1 mt-0.5">
            <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">5 flags menores aceptables</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">title en Summary OK</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">summary_ids plural OK</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">updated_at factory OK</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">campos extra audit OK</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">name no title OK</span>
          </div>
          {/* Dev 2-6 — PENDING */}
          {[
            { dev: "Dev 2", label: "Reading/Annotations", color: "bg-teal-100 text-teal-700" },
            { dev: "Dev 3", label: "Flashcards/Reviews", color: "bg-purple-100 text-purple-700" },
            { dev: "Dev 4", label: "Quiz", color: "bg-orange-100 text-orange-700" },
            { dev: "Dev 5", label: "Progress/Study Plans", color: "bg-pink-100 text-pink-700" },
            { dev: "Dev 6", label: "Auth/AI", color: "bg-indigo-100 text-indigo-700" },
          ].map(d => (
            <div key={d.dev} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/50 border border-gray-200">
              <div className="flex items-center gap-2">
                <CircleDot className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${d.color}`}>{d.dev}</span>
                <span className="text-[11px] text-gray-500">{d.label}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">pendiente</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Conflict Warning */}
      {(keyConflicts ?? []).length > 0 && (
        <div className="px-5 py-3 bg-orange-50 border-b border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-orange-800">Conflictos de naming detectados</span>
          </div>
          {keyConflicts!.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-orange-700 mb-1.5">
              <span className="shrink-0 mt-0.5">•</span>
              <div>
                <code className="bg-orange-100 px-1 rounded font-bold">{c.file}</code> usa{" "}
                <code className="bg-red-100 px-1 rounded text-red-700 line-through">{c.found}:</code> pero el contrato exige{" "}
                <code className="bg-emerald-100 px-1 rounded text-emerald-700 font-bold">{c.expected}:</code>
                <span className="text-orange-500 ml-1">— {c.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deploy Checklist — only shown when LIVE mode is enabled */}
      {showLive && githubLoaded && githubFiles && githubFiles.length > 0 && (() => {
        const deployableFiles = githubFiles.filter(f =>
          f.exists && (f.routeCount > 0 || f.totalKvCalls > 0) && f.label !== "index.tsx"
        );
        const filesWithLiveGap = deployableFiles.filter(f => {
          const fileRouteGroups = f.detectedRouteGroups || [];
          const hasDeadRoute = fileRouteGroups.some(rg => {
            const probe = routeProbes.find(r => r.group === rg);
            return !probe || !isAlive(probe.state);
          });
          return hasDeadRoute;
        });
        if (filesWithLiveGap.length === 0) return null;
        return (
          <div className="px-5 py-3 bg-sky-50/80 border-b border-sky-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-sky-800">
                Deploy Checklist — {filesWithLiveGap.length} archivo(s) necesitan copiarse al LIVE
              </span>
            </div>
            <div className="space-y-1.5">
              {filesWithLiveGap.map(f => {
                const fileRouteGroups = f.detectedRouteGroups || [];
                const liveGroups = fileRouteGroups.filter(rg => {
                  const probe = routeProbes.find(r => r.group === rg);
                  return probe && isAlive(probe.state);
                });
                const deadGroups = fileRouteGroups.filter(rg => !liveGroups.includes(rg));
                return (
                  <div key={f.path} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-sky-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <ArrowRight className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <code className="text-[11px] font-mono text-sky-800 font-medium">{f.label}</code>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">{f.dev}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {deadGroups.map(rg => (
                        <span key={rg} className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold">{rg} 404</span>
                      ))}
                      {liveGroups.map(rg => (
                        <span key={rg} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-bold">{rg} OK</span>
                      ))}
                      <span className="text-[9px] text-gray-400 font-mono">{f.sha}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-sky-500 mt-2">
              Copia estos archivos al proyecto LIVE (0ada7954). <strong>index.tsx</strong> requiere cambiar PREFIX.
            </p>
          </div>
        );
      })()}

      {/* ── Code Readiness Gate — per-route matching against GitHub ── */}
      {githubLoaded && (() => {
        // Match each expected route (from ROUTE_GROUPS definition) against GitHub-detected routes
        const allExpectedRoutes = ROUTE_GROUPS.flatMap(p => p.routes.map(r => ({ route: r, group: p.group, dev: p.dev })));
        
        // Normalize route for matching: strip params, trailing slashes, template vars
        const normalizeRoute = (r: string) => r
          .replace(/:[a-zA-Z_]+(?=\/|$)/g, ":id")  // :userId → :id
          .replace(/\$\{[^}]+\}/g, "")              // strip template vars like ${entity}
          .replace(/\/+/g, "/")                      // collapse double slashes
          .replace(/\/$/g, "")                       // strip trailing slash
          .trim();
        const detectedList = allDetectedRoutes ?? [];
        const detectedNormalized = new Set(detectedList.map(normalizeRoute));
        
        const matched = allExpectedRoutes.filter(e => detectedNormalized.has(normalizeRoute(e.route)));
        const unmatched = allExpectedRoutes.filter(e => !detectedNormalized.has(normalizeRoute(e.route)));
        const totalExpected = allExpectedRoutes.length;
        const detectedCount = detectedList.length;
        const matchPct = totalExpected > 0 ? Math.round((matched.length / totalExpected) * 100) : 0;
        
        // Group unmatched by dev
        const unmatchedByDev: Record<string, typeof unmatched> = {};
        for (const u of unmatched) {
          if (!unmatchedByDev[u.dev]) unmatchedByDev[u.dev] = [];
          unmatchedByDev[u.dev].push(u);
        }

        // Unmatched routes not in any detected (these might be from files not in GitHub yet)
        const unmatchedNotDetected = detectedList.filter(r => !allExpectedRoutes.some(e => normalizeRoute(e.route) === normalizeRoute(r)));
        
        return (
          <div className="px-5 py-3 bg-indigo-50/80 border-b border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-800">
                  Code Readiness Gate
                </span>
                <span className="text-[10px] text-indigo-500">
                  ({detectedCount} rutas detectadas en GitHub vs {totalExpected} en contrato)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${matchPct === 100 ? "text-emerald-600" : matchPct > 60 ? "text-amber-600" : "text-red-600"}`}>
                  {matched.length}/{totalExpected}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  matchPct === 100 ? "bg-emerald-100 text-emerald-700" : matchPct > 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                }`}>
                  {matchPct}%
                </span>
              </div>
            </div>

            {/* Zero routes detected — diagnostic help */}
            {detectedCount === 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-amber-800 font-medium mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  0 rutas detectadas en el codigo de GitHub
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  Posibles causas: routes-content.tsx no existe en el repo, o usa un patron de routing no detectado.
                  Patrones soportados: <code className="bg-amber-100 px-0.5">app.get("/courses",...)</code>,{" "}
                  <code className="bg-amber-100 px-0.5">{`app.get(\`\${PREFIX}/courses\`,...)`}</code>,{" "}
                  <code className="bg-amber-100 px-0.5">app.route("/courses", router)</code> + sub-routes,{" "}
                  <code className="bg-amber-100 px-0.5">createCrudRoutes(app, "courses",...)</code>
                </p>
              </div>
            )}
            
            {/* Unmatched routes by dev */}
            {unmatched.length > 0 && detectedCount > 0 && (
              <div className="space-y-2 mt-2">
                {Object.entries(unmatchedByDev).map(([dev, routes]) => (
                  <div key={dev} className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">{dev}</span>
                      <span className="text-[10px] text-indigo-600 font-medium">{routes.length} ruta(s) no detectadas en codigo</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {routes.map(r => (
                        <code key={r.route} className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-mono border border-red-200">
                          {r.route}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* All matched — success */}
            {unmatched.length === 0 && detectedCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Todas las {totalExpected} rutas del contrato detectadas en el codigo de GitHub</span>
              </div>
            )}
            
            {/* Detected routes count per group */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ROUTE_GROUPS.map(p => {
                const groupMatched = p.routes.filter(r => detectedNormalized.has(normalizeRoute(r))).length;
                const isComplete = groupMatched === p.routes.length;
                return (
                  <span key={p.group} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isComplete ? "bg-emerald-100 text-emerald-700" : groupMatched > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"
                  }`}>
                    {p.group} {groupMatched}/{p.routes.length}
                  </span>
                );
              })}
            </div>

            {/* Extra routes detected but not in contract */}
            {unmatchedNotDetected.length > 0 && (
              <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-3 py-1.5">
                <span className="text-[9px] text-blue-700 font-medium">{unmatchedNotDetected.length} ruta(s) extra detectadas (no en contrato):</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {unmatchedNotDetected.slice(0, 15).map(r => (
                    <code key={r} className="text-[8px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-mono">{r}</code>
                  ))}
                  {unmatchedNotDetected.length > 15 && <span className="text-[8px] text-blue-400">+{unmatchedNotDetected.length - 15} mas</span>}
                </div>
              </div>
            )}

            {/* Per-file route breakdown */}
            {(perFileRoutes ?? []).length > 0 && (
              <div className="mt-2 rounded border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="text-[9px] text-gray-600 font-medium">Rutas por archivo:</span>
                <div className="space-y-1 mt-1">
                  {(perFileRoutes ?? []).map((pf, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <code className="text-[8px] font-mono text-gray-700 font-medium min-w-[120px]">{pf.file}</code>
                      <span className="text-[8px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">{pf.dev}</span>
                      <span className="text-[8px] text-gray-500">{pf.count} rutas</span>
                      <div className="flex flex-wrap gap-0.5">
                        {pf.routes.slice(0, 8).map(r => (
                          <code key={r} className="text-[7px] px-0.5 rounded bg-gray-200 text-gray-600 font-mono">{r}</code>
                        ))}
                        {pf.routes.length > 8 && <span className="text-[7px] text-gray-400">+{pf.routes.length - 8}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-detected files */}
            {(extraFilesScanned ?? []).length > 0 && (
              <div className="mt-1 flex items-center gap-1 flex-wrap">
                <span className="text-[8px] text-amber-600 font-medium">Auto-detected:</span>
                {(extraFilesScanned ?? []).map(f => (
                  <code key={f} className="text-[7px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-mono">{f}</code>
                ))}
              </div>
            )}

            {/* Debug toggle — raw regex matches */}
            <div className="mt-2 border-t border-indigo-200 pt-1">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-[8px] text-indigo-400 hover:text-indigo-600 font-mono cursor-pointer"
              >
                {showDebug ? "▼" : "▶"} debug: _debugRawMatches ({(debugRawMatches ?? []).length})
              </button>
              {showDebug && (debugRawMatches ?? []).length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded bg-gray-900 px-2 py-1.5 text-[8px] font-mono text-green-400 leading-tight space-y-0.5">
                  {(debugRawMatches ?? []).map((m, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">{m}</div>
                  ))}
                </div>
              )}
              {showDebug && (debugRawMatches ?? []).length === 0 && (
                <div className="mt-1 rounded bg-gray-900 px-2 py-1.5 text-[8px] font-mono text-yellow-400">
                  No hay raw matches. La regex no encontro patrones de routing en el codigo analizado.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="divide-y divide-gray-100">
        {oleadas.map((oleada) => {
          const itemStatuses = oleada.items.map(item => {
            let isLiveNow = false;
            if (item.type === "route") {
              const probe = routeProbes.find(r => r.group === item.key);
              isLiveNow = probe ? isAlive(probe.state) : false;
            } else {
              isLiveNow = getKvPatternCount(item.key) > 0;
            }
            const inCode = isInGitHub(item);
            return { ...item, isLiveNow, inCode };
          });

          const routeItems = itemStatuses.filter(i => i.type === "route");
          const kvPrimaryItems = itemStatuses.filter(i => i.type === "kv-primary");
          const kvIndexItems = itemStatuses.filter(i => i.type === "kv-index");

          const totalItems = itemStatuses.length;
          const codeOk = itemStatuses.filter(i => i.inCode).length;
          const liveOk = itemStatuses.filter(i => i.isLiveNow).length;
          const codePct = totalItems > 0 ? Math.round((codeOk / totalItems) * 100) : 0;
          const livePct = totalItems > 0 ? Math.round((liveOk / totalItems) * 100) : 0;

          const autoStatus = computeAutoStatus(codePct, livePct);

          const isExpanded = expandedOleada === oleada.id;

          // Color based on highest state achieved
          const oleadaColor = (showLive ? livePct === 100 : codePct === 100)
            ? { bg: "bg-emerald-50/50", headerBg: "hover:bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500", codeBg: "bg-sky-200" }
            : (showLive && livePct > 0)
            ? { bg: "bg-emerald-50/30", headerBg: "hover:bg-emerald-50/50", badge: "bg-emerald-100 text-emerald-600", barColor: "bg-emerald-400", codeBg: "bg-sky-200" }
            : codePct > 0
            ? { bg: "bg-sky-50/30", headerBg: "hover:bg-sky-50/50", badge: "bg-sky-100 text-sky-600", barColor: "bg-sky-400", codeBg: "bg-sky-200" }
            : { bg: "bg-gray-50/30", headerBg: "hover:bg-gray-50", badge: "bg-gray-100 text-gray-500", barColor: "bg-gray-300", codeBg: "bg-gray-200" };

          return (
            <div key={oleada.id} className={oleadaColor.bg}>
              <button
                onClick={() => setExpandedOleada(isExpanded ? null : oleada.id)}
                className={`w-full px-5 py-4 flex items-center justify-between transition-colors text-left ${oleadaColor.headerBg}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-sm shrink-0 ${oleadaColor.badge}`}>
                    {oleada.name}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{oleada.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                      <span className={`font-bold ${autoStatus.color}`}>{autoStatus.label}</span>
                      <span className="hidden sm:inline flex items-center gap-1">
                        <GitBranch className="w-2.5 h-2.5 inline text-sky-400 mr-0.5" />{codeOk}/{totalItems}
                        {showLive && <>
                          <span className="mx-1">|</span>
                          <Wifi className="w-2.5 h-2.5 inline text-emerald-400 mr-0.5" />{liveOk}/{totalItems}
                        </>}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Progress bars */}
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <GitBranch className="w-2.5 h-2.5 text-sky-400" />
                      <div className={`${showLive ? "w-16" : "w-24"} h-2 bg-gray-200 rounded-full overflow-hidden`}>
                        <div className={`h-full rounded-full transition-all duration-500 bg-sky-400`} style={{ width: `${codePct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-sky-600 w-8 text-right">{codePct}%</span>
                    </div>
                    {showLive && <div className="flex items-center gap-1.5">
                      <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 bg-emerald-500`} style={{ width: `${livePct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 w-8 text-right">{livePct}%</span>
                    </div>}
                  </div>
                  {/* Mobile: single number */}
                  <div className="sm:hidden text-right">
                    <div className={`text-lg font-bold ${autoStatus.color}`}>{Math.max(codePct, livePct)}%</div>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 space-y-4">
                  {/* Three columns: Routes, KV Primary, KV Index */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Routes */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 uppercase font-medium flex items-center gap-1">
                        <Route className="w-3 h-3" /> Rutas ({showLive ? routeItems.filter(i => i.isLiveNow).length : routeItems.filter(i => i.inCode).length}/{routeItems.length})
                      </p>
                      <div className="space-y-1">
                        {routeItems.map(item => {
                          const isOk = showLive ? item.isLiveNow : item.inCode;
                          return (
                          <div key={item.key} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] ${
                            isOk ? "bg-emerald-50 border border-emerald-200" :
                            (showLive && item.inCode) ? "bg-sky-50 border border-sky-200" :
                            "bg-white border border-gray-200"
                          }`}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {showLive ? <DualIcon inCode={item.inCode} isLive={item.isLiveNow} /> :
                                item.inCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <CircleDot className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                              }
                              <span className={`truncate ${
                                isOk ? "text-emerald-700 font-medium" :
                                (showLive && item.inCode) ? "text-sky-700 font-medium" :
                                "text-gray-500"
                              }`}>{item.label}</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isOk ? "bg-emerald-100 text-emerald-700" :
                              (showLive && item.inCode) ? "bg-sky-100 text-sky-600" :
                              "bg-gray-100 text-gray-400"
                            }`}>
                              {showLive ? (item.isLiveNow ? "LIVE" : item.inCode ? "CODE" : "---") : (item.inCode ? "OK" : "---")}
                            </span>
                          </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* KV Primaries */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 uppercase font-medium flex items-center gap-1">
                        <Package className="w-3 h-3" /> KV Primarias ({showLive ? kvPrimaryItems.filter(i => i.isLiveNow).length : kvPrimaryItems.filter(i => i.inCode).length}/{kvPrimaryItems.length})
                      </p>
                      <div className="space-y-1">
                        {kvPrimaryItems.map(item => {
                          const count = getKvPatternCount(item.key);
                          const isOk = showLive ? item.isLiveNow : item.inCode;
                          return (
                            <div key={item.key} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] ${
                              isOk ? "bg-emerald-50 border border-emerald-200" :
                              (showLive && item.inCode) ? "bg-sky-50 border border-sky-200" :
                              "bg-white border border-gray-200"
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {showLive ? <DualIcon inCode={item.inCode} isLive={item.isLiveNow} /> :
                                  item.inCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <CircleDot className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                }
                                <code className={`text-[10px] truncate ${
                                  isOk ? "text-emerald-700 font-medium" :
                                  (showLive && item.inCode) ? "text-sky-700" :
                                  "text-gray-500"
                                }`}>{item.key}:</code>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {count > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-600">{count}</span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isOk ? "bg-emerald-100 text-emerald-700" :
                                  (showLive && item.inCode) ? "bg-sky-100 text-sky-600" :
                                  "bg-gray-100 text-gray-400"
                                }`}>
                                  {showLive ? (item.isLiveNow ? "LIVE" : item.inCode ? "CODE" : "---") : (item.inCode ? "OK" : "---")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* KV Indices */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 uppercase font-medium flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> KV Indices ({showLive ? kvIndexItems.filter(i => i.isLiveNow).length : kvIndexItems.filter(i => i.inCode).length}/{kvIndexItems.length})
                      </p>
                      <div className="space-y-1">
                        {kvIndexItems.map(item => {
                          const count = getKvPatternCount(item.key);
                          const isOk = showLive ? item.isLiveNow : item.inCode;
                          return (
                            <div key={item.key} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] ${
                              isOk ? "bg-emerald-50 border border-emerald-200" :
                              (showLive && item.inCode) ? "bg-sky-50 border border-sky-200" :
                              "bg-white border border-gray-200"
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {showLive ? <DualIcon inCode={item.inCode} isLive={item.isLiveNow} /> :
                                  item.inCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <CircleDot className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                }
                                <code className={`text-[10px] truncate ${
                                  isOk ? "text-emerald-700 font-medium" :
                                  (showLive && item.inCode) ? "text-sky-700" :
                                  "text-gray-500"
                                }`}>{item.key}:</code>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {count > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-600">{count}</span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isOk ? "bg-emerald-100 text-emerald-700" :
                                  (showLive && item.inCode) ? "bg-sky-100 text-sky-600" :
                                  "bg-gray-100 text-gray-400"
                                }`}>
                                  {showLive ? (item.isLiveNow ? "LIVE" : item.inCode ? "CODE" : "---") : (item.inCode ? "OK" : "---")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Smart alerts based on auto-detected state */}
                  {codePct > 0 && livePct === 0 && (
                    <div className="px-3 py-2.5 rounded-lg bg-sky-50 border border-sky-200 flex items-start gap-2">
                      <GitBranch className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-sky-700">
                        {showLive ? (
                          <><span className="font-bold">LISTO PARA DEPLOY:</span> {codeOk}/{totalItems} items existen en GitHub pero 0 estan desplegados en el servidor LIVE (0ada7954).</>
                        ) : (
                          <><span className="font-bold">EN CODIGO:</span> {codeOk}/{totalItems} items detectados en GitHub.
                          {codePct === 100 && <span className="text-emerald-600 font-bold ml-1">Oleada completa en codigo.</span>}</>
                        )}
                        {codeOk < totalItems && (
                          <span className="block mt-1 text-sky-600">
                            Faltan en codigo: {itemStatuses.filter(i => !i.inCode).map(i =>
                              <code key={i.key} className="bg-sky-100 px-1 rounded mx-0.5 text-[10px]">{i.type === "route" ? i.key : `${i.key}:`}</code>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {showLive && codePct > 0 && livePct > 0 && livePct < 100 && (
                    <div className="px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-amber-700">
                        <span className="font-bold">DEPLOY PARCIAL:</span> {liveOk}/{totalItems} items live, {codeOk}/{totalItems} en codigo.
                        {itemStatuses.filter(i => i.inCode && !i.isLiveNow).length > 0 && (
                          <span className="block mt-1 text-amber-600">
                            En codigo pero no live: {itemStatuses.filter(i => i.inCode && !i.isLiveNow).map(i =>
                              <code key={i.key} className="bg-amber-100 px-1 rounded mx-0.5 text-[10px]">{i.type === "route" ? i.key : `${i.key}:`}</code>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {showLive && livePct === 100 && (
                    <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">
                        Oleada completamente desplegada y verificada — {totalItems} items confirmados en produccion.
                      </span>
                    </div>
                  )}
                  {!githubLoaded && (
                    <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />
                      <span className="text-[11px] text-gray-500">Cargando datos de GitHub...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

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
  const [expandedDevs, setExpandedDevs] = useState<Set<string>>(new Set());
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());

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
  const toggleDev = (dev: string) => {
    setExpandedDevs(prev => {
      const next = new Set(prev);
      next.has(dev) ? next.delete(dev) : next.add(dev);
      return next;
    });
  };
  const toggleDeliverables = (dev: string) => {
    setExpandedDeliverables(prev => {
      const next = new Set(prev);
      next.has(dev) ? next.delete(dev) : next.add(dev);
      return next;
    });
  };

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
      {SHOW_LIVE && <Section
        title="Rutas Backend"
        icon={<Route className="w-4 h-4 text-violet-500" />}
        count={routeProbed ? routesLive : undefined}
        badge={
          routeProbed ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${routesLive > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {routesLive}/{routesTotal} grupos activos
            </span>
          ) : routeProbing ? (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
              <Loader2 className="w-3 h-3 animate-spin inline mr-1" />Probing...
            </span>
          ) : null
        }
        defaultOpen
      >
        <div className="divide-y divide-gray-100">
          {/* Route probing results */}
          {ROUTE_GROUPS.map((rg) => {
            const probe = routeProbes.find(r => r.group === rg.group);
            const dc = devColor(rg.dev);
            const alive = probe ? isRouteAlive(probe.state) : false;
            return (
              <div key={rg.group} className={`px-5 py-2.5 flex items-center justify-between ${alive ? "" : "opacity-70"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${dc.bg} ${dc.text} shrink-0`}>{rg.dev}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{rg.group}</span>
                      <span className="text-[10px] text-gray-400">S{rg.section}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{rg.description} — {rg.totalRoutes} rutas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {probe && probe.latency > 0 && (
                    <span className="text-[9px] text-gray-300 font-mono">{probe.latency}ms</span>
                  )}
                  <code className="text-[10px] text-gray-400 font-mono hidden sm:inline">{rg.probeMethod} {rg.probePath}</code>
                  {probe ? routeStateBadge(probe.state) : (
                    routeProbing
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300" />
                      : <span className="text-[10px] text-gray-300">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>}

      {/* ══════════════════════ DEV DELIVERABLES ══════════════════════ */}
      <Section
        title="Entregables por Dev"
        icon={<Users className="w-4 h-4 text-violet-500" />}
        badge={
          routeProbed && audit ? (
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
              Rutas + KV combinados
            </span>
          ) : null
        }
        defaultOpen
      >
        <div className="divide-y divide-gray-100">
          {DEV_DELIVERABLES.map((dd) => {
            const dc = devColor(dd.dev);
            const isExpanded = expandedDeliverables.has(dd.dev);

            // Route status for this dev
            const devRouteGroups = dd.routeGroups.map(gName => ({
              group: ROUTE_GROUPS.find(rg => rg.group === gName)!,
              probe: getRouteProbe(gName),
            })).filter(x => x.group);

            const routesImplemented = devRouteGroups.filter(r => r.probe && isRouteAlive(r.probe.state)).length;
            const routesExpected = devRouteGroups.length;

            // KV status for this dev
            const kvPrimariesPopulated = dd.kvPrimaries.filter(p => getKvPatternCount(p) > 0).length;
            const kvIndicesPopulated = dd.kvIndices.filter(p => getKvPatternCount(p) > 0).length;
            const kvPrimariesExpected = dd.kvPrimaries.length;
            const kvIndicesExpected = dd.kvIndices.length;

            // Combined score
            const totalExpected = routesExpected + kvPrimariesExpected + kvIndicesExpected;
            const totalDone = routesImplemented + kvPrimariesPopulated + kvIndicesPopulated;
            const pct = totalExpected > 0 ? Math.round((totalDone / totalExpected) * 100) : 0;

            return (
              <div key={dd.dev}>
                <button onClick={() => toggleDeliverables(dd.dev)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${dc.bg} ${dc.text}`}>{dd.dev}</span>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">{dd.label}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{dd.oleada}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Three mini-gauges */}
                    <div className="hidden sm:flex items-center gap-3 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded ${routesImplemented > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                        <Route className="w-2.5 h-2.5 inline mr-0.5" />{routesImplemented}/{routesExpected}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${kvPrimariesPopulated > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                        <Shapes className="w-2.5 h-2.5 inline mr-0.5" />{kvPrimariesPopulated}/{kvPrimariesExpected}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${kvIndicesPopulated > 0 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                        <Link2 className="w-2.5 h-2.5 inline mr-0.5" />{kvIndicesPopulated}/{kvIndicesExpected}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : pct > 0 ? "bg-red-400" : "bg-gray-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-9 text-right ${pct >= 80 ? "text-emerald-600" : pct >= 30 ? "text-amber-600" : "text-gray-400"}`}>{pct}%</span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-4 space-y-3">
                    {/* Route groups */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 uppercase font-medium flex items-center gap-1"><Route className="w-3 h-3" /> Rutas Backend ({routesImplemented}/{routesExpected})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {devRouteGroups.map(({ group: rg, probe }) => (
                          <div key={rg.group} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2 min-w-0">
                              {probe && isRouteAlive(probe.state)
                                ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                : <CircleDot className="w-3 h-3 text-gray-300 shrink-0" />}
                              <span className="text-[11px] text-gray-600">{rg.group}</span>
                              <span className="text-[9px] text-gray-300">{rg.totalRoutes}r</span>
                            </div>
                            {probe ? routeStateBadge(probe.state) : <span className="text-[10px] text-gray-300">—</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* KV Primaries */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 uppercase font-medium flex items-center gap-1"><Shapes className="w-3 h-3" /> KV Primarias ({kvPrimariesPopulated}/{kvPrimariesExpected})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {dd.kvPrimaries.map(p => {
                          const count = getKvPatternCount(p);
                          return (
                            <div key={p} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-2">
                                {count > 0
                                  ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  : <CircleDot className="w-3 h-3 text-gray-300" />}
                                <code className="text-[10px] text-gray-600">{p}:</code>
                              </div>
                              <span className={`text-xs font-bold ${count > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                                {count > 0 ? count : "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* KV Indices */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 uppercase font-medium flex items-center gap-1"><Link2 className="w-3 h-3" /> KV Indices ({kvIndicesPopulated}/{kvIndicesExpected})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {dd.kvIndices.map(p => {
                          const count = getKvPatternCount(p);
                          return (
                            <div key={p} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-2">
                                {count > 0
                                  ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  : <CircleDot className="w-3 h-3 text-gray-300" />}
                                <code className="text-[10px] text-gray-600">{p}:</code>
                              </div>
                              <span className={`text-xs font-bold ${count > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                                {count > 0 ? count : "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ══════════════════════ ALERTS ══════════════════════ */}
      {audit && audit.alerts.length > 0 && (
        <Section title="Alertas de Auditoria" icon={<ShieldAlert className="w-4 h-4 text-amber-500" />} count={audit.alerts.length} defaultOpen>
          <div className="divide-y divide-gray-100">
            {audit.alerts.map((alert, i) => (
              <div key={i} className={`px-5 py-3 ${severityBg(alert.severity)} border-l-4`}>
                <div className="flex items-start gap-2.5">
                  <SeverityIcon severity={alert.severity} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{alert.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/60 text-[10px] font-medium text-gray-500 uppercase">{alert.category}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 break-all">{alert.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ══════════════════════ DEV PROGRESS (KV detail) ══════════════════════ */}
      {audit && audit.devProgress.length > 0 && (
        <Section title="Detalle KV por Dev" icon={<BarChart3 className="w-4 h-4 text-blue-500" />} count={audit.devProgress.filter(d => d.totalKeys > 0).length}>
          <div className="divide-y divide-gray-100">
            {audit.devProgress.map((dp) => {
              const dc = devColor(dp.dev);
              const pct = dp.expectedPatterns > 0 ? Math.round((dp.populatedPatterns / dp.expectedPatterns) * 100) : 0;
              const isExpanded = expandedDevs.has(dp.dev);
              return (
                <div key={dp.dev}>
                  <button onClick={() => toggleDev(dp.dev)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${dc.bg} ${dc.text}`}>{dp.dev}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-gray-700">{dp.totalKeys} keys</span>
                        <span className="text-xs text-gray-400">
                          {dp.primaries} prim + {dp.indices} idx
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct > 0 ? (pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400") : "bg-gray-300"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 w-10 text-right">{dp.populatedPatterns}/{dp.expectedPatterns}</span>
                      </div>
                      {dp.totalKeys === 0 ? (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-400 text-[10px] font-medium">SIN DATOS</span>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                        {dp.patternsDetail.map((pd) => (
                          <div key={pd.pattern} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50">
                            <code className="text-[11px] text-gray-600">{pd.pattern}:</code>
                            <span className={`text-xs font-bold ${pd.count > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                              {pd.count > 0 ? pd.count : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {dp.sampleKeys.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1 uppercase font-medium">Muestra de keys:</p>
                          <div className="space-y-0.5">
                            {dp.sampleKeys.map((k) => (
                              <code key={k} className="block text-[10px] text-gray-500 font-mono truncate">{k}</code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ══════════════════════ ENTITY DETAILS ══════════════════════ */}
      {audit && audit.entityDetails.length > 0 && (
        <Section title="Entidades en la DB" icon={<Layers className="w-4 h-4 text-blue-500" />} count={audit.entityDetails.length}>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {audit.entityDetails.map((ed) => {
              const dc = devColor(ed.dev);
              return (
                <div key={ed.pattern} className="px-5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-xs font-mono text-gray-700 shrink-0">{ed.pattern}:</code>
                    <span className="text-xs text-gray-400 truncate hidden sm:inline">{ed.entity}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${dc.bg} ${dc.text} shrink-0`}>{ed.dev}</span>
                    {ed.isIndex && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px]">IDX</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700">{ed.count}</span>
                    <button onClick={() => fetchBrowse(ed.pattern + ":")} className="text-violet-500 hover:text-violet-700 transition-colors">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ══════════════════════ DATA SHAPE ISSUES ══════════════════════ */}
      {audit && audit.dataShapeIssues.length > 0 && (
        <Section title="Campos faltantes" icon={<FileWarning className="w-4 h-4 text-amber-500" />} count={audit.dataShapeIssues.length}>
          <div className="divide-y divide-gray-100">
            {audit.dataShapeIssues.map((issue, i) => (
              <div key={i} className="px-5 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs font-mono text-gray-700">{issue.key}</code>
                  <span className="text-xs text-gray-400">({issue.entity})</span>
                </div>
                <p className="text-xs text-amber-600 mt-0.5">
                  Faltan: {issue.missing.map((f) => <code key={f} className="bg-amber-100 px-1 rounded mx-0.5">{f}</code>)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ══════════════════════ INDEX INTEGRITY ══════════════════════ */}
      {audit && audit.indexIntegrity.length > 0 && (
        <Section title="Integridad de Indices" icon={<Link2 className="w-4 h-4 text-blue-500" />} count={audit.indexIntegrity.length}>
          <div className="px-5 py-3">
            <div className="grid grid-cols-1 gap-1">
              {audit.indexIntegrity.map((check, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${check.exists ? "bg-emerald-50" : "bg-red-50"}`}>
                  {check.exists ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> : <Unlink className="w-3 h-3 text-red-500 shrink-0" />}
                  <code className="text-gray-600 truncate">{check.indexKey}</code>
                  <span className="text-gray-400 shrink-0"><ArrowRight className="w-3 h-3" /></span>
                  <code className={`truncate ${check.exists ? "text-emerald-700" : "text-red-700 font-bold"}`}>{check.referencedPrimary}</code>
                  {!check.exists && <span className="text-red-500 font-bold shrink-0">ROTO</span>}
                </div>
              ))}
            </div>
            {audit.indexIntegrity.some(c => !c.exists) && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Indices rotos significan que hay referencias a entidades que no existen. Un dev borro la entidad pero no su indice, o viceversa.
              </p>
            )}
          </div>
        </Section>
      )}

      {/* ══════════════════════ UNKNOWN KEYS ══════════════════════ */}
      {audit && audit.keyPatterns.unknown.length > 0 && (
        <Section title="Keys no reconocidas" icon={<AlertTriangle className="w-4 h-4 text-red-500" />} count={audit.keyPatterns.unknown.length} defaultOpen>
          <div className="divide-y divide-gray-100">
            {audit.keyPatterns.unknown.map((u, i) => (
              <div key={i} className="px-5 py-2.5">
                <code className="text-xs font-mono text-red-700">{u.key}</code>
                <p className="text-xs text-gray-400 mt-0.5">{u.suggestion}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ══════════════════════ EMPTY STATE ══════════════════════ */}
      {audit && audit.tableExists && audit.summary.total === 0 && (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Base de datos vacia</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            La tabla KV existe pero no tiene registros. Los devs aun no han ejecutado el seed o guardado datos.
          </p>
        </div>
      )}

      {!audit?.tableExists && !auditLoading && health?.tableExists === false && (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Esperando primer dato</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            La tabla KV se creara automaticamente cuando un dev haga el primer <code className="bg-gray-200 px-1 rounded">kv.set()</code>. El servidor funciona.
          </p>
        </div>
      )}

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
