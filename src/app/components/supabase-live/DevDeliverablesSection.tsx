// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Dev Deliverables Section
// Extracted from SupabaseLiveView.tsx (Paso 6/6 — sub-extraction C)
//
// Exports: DevDeliverablesSection
// Shows per-dev progress: route groups, KV primaries, KV indices with expandable detail
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import {
  ChevronRight, ChevronDown,
  CheckCircle2, CircleDot,
  Users, Route, Shapes, Link2,
} from "lucide-react";
import type { RouteProbeResult } from "./types";
import { ROUTE_GROUPS, DEV_DELIVERABLES } from "./route-registry";
import {
  devColor,
  isRouteAlive,
  routeStateBadge,
  Section,
} from "./helpers";

export interface DevDeliverablesSectionProps {
  routeProbed: boolean;
  hasAuditData: boolean;
  getKvPatternCount: (pattern: string) => number;
  getRouteProbe: (group: string) => RouteProbeResult | undefined;
}

export function DevDeliverablesSection({
  routeProbed,
  hasAuditData,
  getKvPatternCount,
  getRouteProbe,
}: DevDeliverablesSectionProps) {
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());

  const toggleDeliverables = (dev: string) => {
    setExpandedDeliverables(prev => {
      const next = new Set(prev);
      next.has(dev) ? next.delete(dev) : next.add(dev);
      return next;
    });
  };

  return (
    <Section
      title="Entregables por Dev"
      icon={<Users className="w-4 h-4 text-violet-500" />}
      badge={
        routeProbed && hasAuditData ? (
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
  );
}
