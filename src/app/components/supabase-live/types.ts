// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Type definitions
// Extracted from SupabaseLiveView.tsx for modularity
// ══════════════════════════════════════════════════════════════════════════════

// ── Prefix Discovery ──

export interface PrefixProbeResult {
  prefixId: string;
  label: string;
  description: string;
  healthStatus: "ok" | "error" | "loading" | "timeout";
  healthData: any | null;
  healthError: string | null;
  healthLatency: number;
  auditStatus: "ok" | "error" | "loading" | "skipped";
  auditSummary: { total: number; primaries: number; indices: number; score: number } | null;
  auditKvTable: string | null;
  routeSample: { path: string; status: number; state: string } | null;
}

// ── Health / KV ──

export interface HealthResponse {
  status: string;
  timestamp: string;
  prefix: string;
  kvTable: string;
  tableExists: boolean;
}

export interface KvGroup { prefix: string; count: number; samples: string[]; }

export interface KvStatsResponse {
  success: boolean; total: number; groups: KvGroup[];
  tableExists?: boolean; error?: string;
}

export interface KvItem { key: string; value: any; }

export interface KvBrowseResponse {
  success: boolean; count: number; prefix: string; items: KvItem[];
  tableExists?: boolean; error?: string;
}

// ── Audit ──

export interface AuditAlert {
  severity: "error" | "warning" | "info" | "success";
  category: string;
  title: string;
  detail: string;
}

export interface PatternDetail {
  pattern: string;
  count: number;
  isIndex: boolean;
}

export interface DevProgressItem {
  dev: string;
  totalKeys: number;
  primaries: number;
  indices: number;
  sampleKeys: string[];
  expectedPatterns: number;
  populatedPatterns: number;
  patternsDetail: PatternDetail[];
}

export interface EntityDetail {
  pattern: string;
  count: number;
  isIndex: boolean;
  dev: string;
  entity: string;
  description: string;
  samples: { key: string; valuePreview: string }[];
}

export interface DataShapeIssue {
  key: string;
  entity: string;
  missing: string[];
  extra: string[];
}

export interface IndexCheck {
  indexKey: string;
  referencedPrimary: string;
  exists: boolean;
}

export interface AuditResponse {
  success: boolean;
  timestamp: string;
  tableExists: boolean;
  summary: {
    total: number;
    primaries: number;
    indices: number;
    unknown: number;
    score: number;
  };
  alerts: AuditAlert[];
  devProgress: DevProgressItem[];
  keyPatterns: {
    recognized: { pattern: string; count: number }[];
    unknown: { key: string; suggestion: string }[];
  };
  dataShapeIssues: DataShapeIssue[];
  indexIntegrity: IndexCheck[];
  entityDetails: EntityDetail[];
  error?: string;
}

// ── Route Probing ──

export type RouteStatus = "live" | "auth_required" | "not_found" | "error" | "pending" | "timeout";

export interface RouteProbeResult {
  path: string;
  method: string;
  dev: string;
  group: string;
  httpStatus: number;
  state: RouteStatus;
  latency: number;
}

// ── Route Registry ──

export interface RouteGroup {
  group: string;
  dev: string;
  probePath: string;
  probeMethod: string;
  totalRoutes: number;
  routes: string[];
  section: number;
  description: string;
}

export interface DevDeliverables {
  dev: string;
  label: string;
  oleada: string;
  kvPrimaries: string[];
  kvIndices: string[];
  routeGroups: string[];
}

// ── Oleada Tracking ──

export interface OleadaItem {
  type: "route" | "kv-primary" | "kv-index";
  key: string;
  dev: string;
  label: string;
}

export interface OleadaDefinition {
  id: number;
  name: string;
  status: "done" | "in-progress" | "pending";
  description: string;
  items: OleadaItem[];
}
