// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Helpers
// Extracted from SupabaseLiveView.tsx (Paso 3/6)
//
// Exports:
//   Constants : DIAG_PREFIX, DIAG_API_BASE, LIVE_API_BASE, API_BASE
//   Functions : apiFetch, probeRoute, severityBg, devColor, routeStateBadge, isRouteAlive
//   Components: StatusBadge, JsonViewer, SeverityIcon, ScoreGauge, Section, StatCard
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import {
  ChevronRight, ChevronDown,
  AlertCircle, CheckCircle2, Loader2,
  Eye, AlertTriangle, Info,
  Gauge, Wifi, WifiOff, Clock, CircleDot,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { LIVE_PREFIX } from "./route-registry";
import type { RouteGroup, RouteProbeResult, RouteStatus } from "./types";

// ══════════════════════════════════════════════════════════════════════════════
// API BASE URLS
// Diagnostic endpoints → THIS project's server (229c9fbf)
// Route probing        → LIVE Axon server (7a20cd7d)
// ══════════════════════════════════════════════════════════════════════════════

export const DIAG_PREFIX = "229c9fbf";
export const DIAG_API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-${DIAG_PREFIX}`;
export const LIVE_API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-${LIVE_PREFIX}`;
export const API_BASE = DIAG_API_BASE;

// ══════════════════════════════════════════════════════════════════════════════
// apiFetch — typed fetch wrapper targeting the diagnostic server
// ══════════════════════════════════════════════════════════════════════════════

export async function apiFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error(`Timeout (15s) conectando a ${API_BASE}${path}`);
    }
    if (err.message === "Failed to fetch") {
      throw new Error(
        `No se pudo conectar a ${API_BASE}${path} — el edge function puede no estar desplegado o esta reiniciando. Intenta de nuevo en unos segundos.`
      );
    }
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// probeRoute — HTTP probe for a single RouteGroup against the LIVE server
// ══════════════════════════════════════════════════════════════════════════════

export async function probeRoute(group: RouteGroup): Promise<RouteProbeResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${LIVE_API_BASE}${group.probePath}`, {
      method: group.probeMethod === "POST" ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "Content-Type": "application/json",
      },
      body: group.probeMethod === "POST" ? JSON.stringify({}) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    const httpStatus = res.status;

    let state: RouteStatus = "error";
    if (httpStatus === 200 || httpStatus === 201) state = "live";
    else if (httpStatus === 401 || httpStatus === 403) state = "auth_required";
    else if (httpStatus === 404) state = "not_found";
    else if (httpStatus === 400 || httpStatus === 422) state = "live"; // route exists, bad input
    else if (httpStatus === 405) state = "live"; // method not allowed = route group exists
    else if (httpStatus >= 500) state = "error";

    return {
      path: group.probePath,
      method: group.probeMethod,
      dev: group.dev,
      group: group.group,
      httpStatus,
      state,
      latency,
    };
  } catch (err: any) {
    return {
      path: group.probePath,
      method: group.probeMethod,
      dev: group.dev,
      group: group.group,
      httpStatus: 0,
      state: err.name === "AbortError" ? "timeout" : "not_found",
      latency: Date.now() - start,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// StatusBadge — connection status pill
// ══════════════════════════════════════════════════════════════════════════════

export function StatusBadge({ status }: { status: "ok" | "error" | "loading" }) {
  if (status === "loading")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
        <Loader2 className="w-3 h-3 animate-spin" /> Conectando...
      </span>
    );
  if (status === "ok")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" /> Conectado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
      <AlertCircle className="w-3 h-3" /> Error
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// JsonViewer — collapsible JSON display
// ══════════════════════════════════════════════════════════════════════════════

export function JsonViewer({ data, initialOpen = false }: { data: any; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const json = JSON.stringify(data, null, 2);
  const lines = json.split("\n").length;
  if (typeof data !== "object" || data === null)
    return <span className="text-sm text-blue-600 font-mono">{String(data)}</span>;
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Eye className="w-3 h-3" /> {open ? "Ocultar" : "Ver"} ({lines} lineas)
      </button>
      {open && (
        <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto max-h-[400px] overflow-y-auto">
          {json}
        </pre>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SeverityIcon — icon for audit alert severity
// ══════════════════════════════════════════════════════════════════════════════

export function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "error":   return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "success": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    default:        return <Info className="w-4 h-4 text-blue-500" />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// severityBg — Tailwind classes for alert background based on severity
// ══════════════════════════════════════════════════════════════════════════════

export function severityBg(s: string): string {
  switch (s) {
    case "error":   return "bg-red-50 border-red-200";
    case "warning": return "bg-amber-50 border-amber-200";
    case "success": return "bg-emerald-50 border-emerald-200";
    default:        return "bg-blue-50 border-blue-200";
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ScoreGauge — colored score display
// ══════════════════════════════════════════════════════════════════════════════

export function ScoreGauge({ score }: { score: number }) {
  const color = score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600";
  const bg    = score >= 90 ? "bg-emerald-100"   : score >= 70 ? "bg-amber-100"   : "bg-red-100";
  const ring  = score >= 90 ? "ring-emerald-300"  : score >= 70 ? "ring-amber-300"  : "ring-red-300";
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${bg} ring-2 ${ring}`}>
      <Gauge className={`w-5 h-5 ${color}`} />
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-gray-500">/100</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// devColor — per-dev Tailwind color palette
// ══════════════════════════════════════════════════════════════════════════════

export function devColor(dev: string): {
  bg: string; text: string; border: string; accent: string;
} {
  if (dev.includes("1+2"))                                      return { bg: "bg-cyan-100",    text: "text-cyan-700",    border: "border-cyan-200",    accent: "bg-cyan-500" };
  if (dev.includes("3+4"))                                      return { bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200",  accent: "bg-violet-500" };
  if (dev.includes("3-5"))                                      return { bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-200", accent: "bg-fuchsia-500" };
  if (dev.includes("1") && !dev.includes("+"))                  return { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200",    accent: "bg-blue-500" };
  if (dev.includes("2") && !dev.includes("1"))                  return { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200",    accent: "bg-teal-500" };
  if (dev.includes("3") && !dev.includes("5") && !dev.includes("4")) return { bg: "bg-purple-100",  text: "text-purple-700",  border: "border-purple-200",  accent: "bg-purple-500" };
  if (dev.includes("4"))                                        return { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200",  accent: "bg-orange-500" };
  if (dev.includes("5"))                                        return { bg: "bg-pink-100",    text: "text-pink-700",    border: "border-pink-200",    accent: "bg-pink-500" };
  if (dev.includes("6"))                                        return { bg: "bg-indigo-100",  text: "text-indigo-700",  border: "border-indigo-200",  accent: "bg-indigo-500" };
  return                                                               { bg: "bg-gray-100",    text: "text-gray-700",    border: "border-gray-200",    accent: "bg-gray-500" };
}

// ══════════════════════════════════════════════════════════════════════════════
// routeStateBadge — colored pill for a RouteStatus value
// ══════════════════════════════════════════════════════════════════════════════

export function routeStateBadge(state: RouteStatus) {
  switch (state) {
    case "live":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold"><Wifi className="w-2.5 h-2.5" /> LIVE</span>;
    case "auth_required":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold"><CheckCircle2 className="w-2.5 h-2.5" /> AUTH OK</span>;
    case "not_found":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold"><WifiOff className="w-2.5 h-2.5" /> 404</span>;
    case "error":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold"><AlertTriangle className="w-2.5 h-2.5" /> ERROR</span>;
    case "timeout":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold"><Clock className="w-2.5 h-2.5" /> TIMEOUT</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold"><CircleDot className="w-2.5 h-2.5" /> PENDING</span>;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// isRouteAlive — predicate: is a probed route considered "alive"?
// ══════════════════════════════════════════════════════════════════════════════

export function isRouteAlive(state: RouteStatus): boolean {
  return state === "live" || state === "auth_required";
}

// ══════════════════════════════════════════════════════════════════════════════
// Section — collapsible card with icon, title, count badge, and optional badge
// ══════════════════════════════════════════════════════════════════════════════

export function Section({
  title, icon, count, badge, children, defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">{count}</span>
          )}
          {badge}
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400" />
          : <ChevronRight className="w-4 h-4 text-gray-400" />
        }
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// StatCard — metric card for the summary grid
// ══════════════════════════════════════════════════════════════════════════════

export function StatCard({
  icon, label, value, loading, sub, alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className={`p-3.5 rounded-xl border bg-white ${alert ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
      <div className="flex items-center gap-1.5 mb-2 text-gray-400">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
      ) : (
        <div>
          <p className={`text-xl font-bold ${alert ? "text-red-600" : "text-gray-900"}`}>{value}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
      )}
    </div>
  );
}
