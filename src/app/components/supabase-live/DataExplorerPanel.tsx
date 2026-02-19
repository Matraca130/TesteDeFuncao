// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Data Explorer Panel
// Extracted from SupabaseLiveView.tsx (Paso 6/6 — sub-extraction E)
//
// Exports: DataExplorerPanel
// KV data browser with search, quick-prefix buttons, and JSON viewer.
// All browse state is internalized. External browse requests (e.g. from
// AuditSectionsPanel entity search) arrive via the externalBrowseRequest prop.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { KvItem, KvBrowseResponse, EntityDetail } from "./types";
import { apiFetch, JsonViewer, Section } from "./helpers";

export interface DataExplorerPanelProps {
  /** Entity details from audit — used for quick-prefix filter buttons */
  entityDetails: EntityDetail[];
  /** When set (non-null), triggers a browse for that prefix. Parent should reset to null after. */
  externalBrowseRequest: string | null;
  /** Called after the external browse request has been consumed */
  onExternalBrowseHandled: () => void;
}

export function DataExplorerPanel({
  entityDetails,
  externalBrowseRequest,
  onExternalBrowseHandled,
}: DataExplorerPanelProps) {
  const [browseData, setBrowseData] = useState<KvBrowseResponse | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePrefix, setBrowsePrefix] = useState("");
  const [activePrefixFilter, setActivePrefixFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<KvItem | null>(null);

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

  // Handle external browse requests (e.g. from AuditSectionsPanel entity search button)
  useEffect(() => {
    if (externalBrowseRequest !== null) {
      setBrowsePrefix(externalBrowseRequest);
      fetchBrowse(externalBrowseRequest);
      onExternalBrowseHandled();
    }
  }, [externalBrowseRequest, fetchBrowse, onExternalBrowseHandled]);

  return (
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
        {entityDetails.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => fetchBrowse("")} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${activePrefixFilter === "" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              TODO
            </button>
            {entityDetails.slice(0, 15).map((ed) => (
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
  );
}
