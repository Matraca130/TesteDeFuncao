// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Oleada Tracker Component
// Extracted from SupabaseLiveView.tsx (Paso 5/6)
//
// Exports: OleadaTracker
// ~670 lines — the largest inline component in the orchestrator
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import {
  ChevronRight, ChevronDown,
  CheckCircle2, Loader2,
  ShieldAlert, AlertTriangle,
  Link2, Wifi,
  Route, CircleDot, ArrowRight,
  Flag, Package, GitBranch,
} from "lucide-react";
import type {
  OleadaDefinition,
  OleadaItem,
  RouteProbeResult,
  RouteStatus,
} from "./types";
import { ROUTE_GROUPS } from "./route-registry";
import { Section } from "./helpers";

// ── Prop sub-types (inline objects from the original SupabaseLiveView) ──

export interface GitHubFileInfo {
  path: string;
  label: string;
  dev: string;
  exists: boolean;
  sha: string;
  routeCount: number;
  totalKvCalls: number;
  hasRealPersistence: boolean;
  detectedRouteGroups?: string[];
  detectedKvPrefixes?: string[];
}

export interface KeyConflict {
  found: string;
  expected: string;
  severity: string;
  message: string;
  file: string;
}

export interface PerFileRoute {
  file: string;
  dev: string;
  routes: string[];
  count: number;
}

// ── Main props interface ──

export interface OleadaTrackerProps {
  oleadas: OleadaDefinition[];
  routeProbes: RouteProbeResult[];
  getKvPatternCount: (p: string) => number;
  isRouteAlive: (s: RouteStatus) => boolean;
  githubRouteGroups: string[];
  githubKvPrefixes: string[];
  githubLoaded: boolean;
  githubFiles?: GitHubFileInfo[];
  keyConflicts?: KeyConflict[];
  allDetectedRoutes?: string[];
  debugRawMatches?: string[];
  perFileRoutes?: PerFileRoute[];
  extraFilesScanned?: string[];
  showLive?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// OLEADA TRACKER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function OleadaTracker({ oleadas, routeProbes, getKvPatternCount, isRouteAlive: isAlive, githubRouteGroups, githubKvPrefixes, githubLoaded, githubFiles, keyConflicts, allDetectedRoutes, debugRawMatches, perFileRoutes, extraFilesScanned, showLive = false }: OleadaTrackerProps) {
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
