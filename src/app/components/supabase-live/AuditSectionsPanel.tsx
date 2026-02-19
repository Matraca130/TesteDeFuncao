// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Audit Sections Panel
// Extracted from SupabaseLiveView.tsx (Paso 6/6 — sub-extraction D)
//
// Exports: AuditSectionsPanel
// Renders: Alerts, Dev Progress KV, Entity Details, Data Shape Issues,
//          Index Integrity, Unknown Keys, and Empty States
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import {
  ChevronRight, ChevronDown,
  CheckCircle2, AlertCircle, AlertTriangle,
  Search, ShieldAlert, Link2, Layers, BarChart3,
  FileWarning, Unlink, ArrowRight, Database,
} from "lucide-react";
import type { AuditResponse, HealthResponse } from "./types";
import {
  devColor,
  severityBg,
  SeverityIcon,
  Section,
} from "./helpers";

export interface AuditSectionsPanelProps {
  audit: AuditResponse | null;
  auditLoading: boolean;
  health: HealthResponse | null;
  onBrowsePrefix: (prefix: string) => void;
}

export function AuditSectionsPanel({
  audit,
  auditLoading,
  health,
  onBrowsePrefix,
}: AuditSectionsPanelProps) {
  const [expandedDevs, setExpandedDevs] = useState<Set<string>>(new Set());

  const toggleDev = (dev: string) => {
    setExpandedDevs(prev => {
      const next = new Set(prev);
      next.has(dev) ? next.delete(dev) : next.add(dev);
      return next;
    });
  };

  return (
    <>
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
                    <button onClick={() => onBrowsePrefix(ed.pattern + ":")} className="text-violet-500 hover:text-violet-700 transition-colors">
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
    </>
  );
}
