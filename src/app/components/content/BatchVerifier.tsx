// ============================================================
// Axon v4.4 — BatchVerifier (Thin Shell)
//
// Modularized: logic extracted to batch-verifier/ submodules.
//   types.ts       — TestStatus, TestResult, KvKeyResult, etc.
//   api-helper.ts  — apiFetch(), kvInspect()
//   StatusBadge.tsx — StatusBadge, KvKeyBadges
//   test-runner.ts — runAllTests() (phases 1-7)
//
// This file keeps ONLY: React state, callbacks, and JSX layout.
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import { projectId } from '/utils/supabase/info';
import {
  CheckCircle2, XCircle, Loader2, Play, Trash2,
  Shield, Brain, Database, Server, Clock, Zap, AlertTriangle,
  Search, Key,
} from 'lucide-react';

// ── Extracted submodules ──
import type { TestResult } from './batch-verifier/types';
import { StatusBadge, KvKeyBadges } from './batch-verifier/StatusBadge';
import { runAllTests } from './batch-verifier/test-runner';
import type { RunnerCallbacks } from './batch-verifier/test-runner';

// ── Group icon registry ──
const groupIcons: Record<string, React.ReactNode> = {
  Server: <Server size={14} />,
  Auth: <Shield size={14} />,
  AI: <Brain size={14} />,
  Cleanup: <Trash2 size={14} />,
  'Inst+Membership': <Database size={14} />,
  'KV Verify': <Key size={14} />,
  'CRUD Chain': <Database size={14} />,
  Fatal: <XCircle size={14} />,
};

// ── Main Component ────────────────────────────────────────
export function BatchVerifier() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('');
  const abortRef = useRef(false);

  const updateResult = useCallback((id: string, patch: Partial<TestResult>) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const addResult = useCallback((r: TestResult) => {
    setResults(prev => [...prev, r]);
    return r.id;
  }, []);

  // ── Run all tests via extracted runner ──
  const runAll = useCallback(async () => {
    setRunning(true);
    setResults([]);
    abortRef.current = false;

    const callbacks: RunnerCallbacks = {
      addResult,
      updateResult,
      setPhase,
      abortRef,
    };

    try {
      await runAllTests(callbacks);
    } catch (err) {
      console.error('[BatchVerifier] Fatal:', err);
      addResult({
        id: 'Fatal::error', group: 'Fatal', name: 'Uncaught error',
        method: '-', path: '-', status: 'fail',
        detail: err instanceof Error ? err.message : String(err),
      });
      setPhase('Error');
    } finally {
      setRunning(false);
    }
  }, [addResult, updateResult]);

  // ── Stats ─────────────────────────────────────────────
  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const warn = results.filter(r => r.status === 'warn').length;
  const total = results.length;
  const totalMs = results.reduce((sum, r) => sum + (r.ms || 0), 0);
  const kvChecks = results.filter(r => r.kvKeys && r.kvKeys.length > 0);
  const kvTotal = kvChecks.reduce((s, r) => s + (r.kvKeys?.length || 0), 0);
  const kvFound = kvChecks.reduce((s, r) => s + (r.kvKeys?.filter(k => k.exists).length || 0), 0);

  // Group results
  const groups: Record<string, TestResult[]> = {};
  for (const r of results) {
    if (!groups[r.group]) groups[r.group] = [];
    groups[r.group].push(r);
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f5f2ea]">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-amber-500" size={24} />
              Axon v4.4 — Deep Batch Verifier
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Auth via browser Supabase client + KV inspection via{' '}
              <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">/dev/kv-inspect</code>
            </p>
          </div>
          <button
            onClick={runAll}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow transition-colors"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {running ? phase : 'Run Deep Batch'}
          </button>
        </div>

        {/* Stats */}
        {total > 0 && (
          <div className="grid grid-cols-6 gap-3 mb-6">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Tests</div>
              <div className="text-2xl font-bold text-gray-900">{total}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-emerald-100">
              <div className="text-xs text-emerald-600 uppercase tracking-wide flex items-center gap-1"><CheckCircle2 size={10} /> Pass</div>
              <div className="text-2xl font-bold text-emerald-700">{pass}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-red-100">
              <div className="text-xs text-red-600 uppercase tracking-wide flex items-center gap-1"><XCircle size={10} /> Fail</div>
              <div className="text-2xl font-bold text-red-700">{fail}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100">
              <div className="text-xs text-amber-600 uppercase tracking-wide flex items-center gap-1"><AlertTriangle size={10} /> Warn</div>
              <div className="text-2xl font-bold text-amber-700">{warn}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
              <div className="text-xs text-purple-600 uppercase tracking-wide flex items-center gap-1"><Key size={10} /> KV</div>
              <div className="text-2xl font-bold text-purple-700">{kvFound}/{kvTotal}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <div className="text-xs text-blue-600 uppercase tracking-wide flex items-center gap-1"><Clock size={10} /> Time</div>
              <div className="text-2xl font-bold text-blue-700">{(totalMs / 1000).toFixed(1)}s</div>
            </div>
          </div>
        )}

        {/* Progress */}
        {running && total > 0 && (
          <div className="mb-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                style={{ width: `${(results.filter(r => r.status !== 'running').length / Math.max(total, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {Object.entries(groups).map(([group, items]) => {
          const gPass = items.filter(i => i.status === 'pass').length;
          const gFail = items.filter(i => i.status === 'fail').length;
          const gTotal = items.length;
          return (
            <div key={group} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500">{groupIcons[group] || <Database size={14} />}</span>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{group}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  gFail === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {gPass}/{gTotal}
                </span>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {items.map((r) => (
                  <div key={r.id} className="px-4 py-2.5 hover:bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                        r.method === 'GET' ? 'bg-blue-50 text-blue-700' :
                        r.method === 'POST' ? 'bg-green-50 text-green-700' :
                        r.method === 'PUT' ? 'bg-amber-50 text-amber-700' :
                        r.method === 'DELETE' ? 'bg-red-50 text-red-700' :
                        r.method === 'AUTH' ? 'bg-purple-50 text-purple-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {r.method}
                      </span>
                      <span className="text-sm text-gray-800 font-medium flex-1 truncate">{r.name}</span>
                      <StatusBadge status={r.status} httpStatus={r.httpStatus} ms={r.ms} />
                    </div>
                    {r.detail && r.status !== 'pending' && r.status !== 'running' && (
                      <div className={`mt-1 ml-14 text-xs px-2 py-1 rounded font-mono break-all ${
                        r.status === 'fail' ? 'text-red-600 bg-red-50' :
                        r.status === 'warn' ? 'text-amber-700 bg-amber-50' :
                        'text-gray-500 bg-gray-50'
                      }`}>
                        {r.detail}
                      </div>
                    )}
                    {r.kvKeys && <div className="ml-14"><KvKeyBadges keys={r.kvKeys} /></div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {total === 0 && !running && (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-500 mb-2">Deep Batch Verification</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
              Auth via <strong>browser Supabase client</strong> (no server-side token dependency).
              Then verifies every KV key via <code className="bg-gray-200 px-1 rounded text-xs">/dev/kv-inspect</code>.
            </p>
            <div className="bg-white rounded-lg p-4 max-w-lg mx-auto text-left text-xs text-gray-600 border space-y-2">
              <div className="font-semibold text-gray-800 mb-2">Fixed in this version:</div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={12} /> Token obtained via browser <code>signInWithPassword</code> (not server-side)
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={12} /> No <code>publicAnonKey</code> fallback — explicit bearer on every call
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={12} /> Deep KV inspection: each key checked individually
              </div>
              <div className="mt-3 pt-3 border-t font-semibold text-gray-800">4 flagged KV keys:</div>
              {[
                'inst:{id}',
                'membership:{instId}:{userId}',
                'idx:inst-members:{instId}:{userId}',
                'idx:user-insts:{userId}:{instId}',
              ].map(k => (
                <div key={k} className="flex items-center gap-2">
                  <Key size={12} className="text-purple-500" />
                  <code>{k}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final summary */}
        {!running && total > 0 && (
          <div className={`mt-6 p-4 rounded-lg border-2 text-center ${
            fail === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="text-lg font-bold">
              {fail === 0 ? (
                <span className="text-emerald-700">All {pass} tests + {kvTotal} KV keys verified!</span>
              ) : (
                <span className="text-red-700">{fail} of {total} tests failed{kvTotal > kvFound ? ` (${kvTotal - kvFound} KV keys missing)` : ''}</span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Prefix: <code className="font-mono text-xs">7a20cd7d</code> |
              KV: <code className="font-mono text-xs">kv_store_7a20cd7d</code> |
              Project: <code className="font-mono text-xs">{projectId}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
