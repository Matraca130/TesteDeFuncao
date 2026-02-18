// ============================================================
// Axon v4.4 — BatchVerifier API Helper
// Low-level fetch wrapper + KV inspect utility.
// Extracted from BatchVerifier.tsx for modularity.
// ============================================================

import type { ApiResponse, KvKeyResult } from './types';

// HARDCODED — backend lives on project xdnciktarvxyhkrokbng
const API = 'https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-7a20cd7d';

/**
 * Raw fetch helper for batch verification.
 * bearerToken goes in Authorization header (gateway HS256).
 * userToken (if provided) goes in X-Auth-Token (server-side ES256 validation).
 */
export async function apiFetch(
  method: string,
  path: string,
  bearerToken: string,
  body?: unknown,
  userToken?: string
): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${bearerToken}`,
  };
  if (userToken) {
    headers['X-Auth-Token'] = userToken;
  }

  const t0 = performance.now();
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const ms = Math.round(performance.now() - t0);
    let data: any;
    try { data = await res.json(); } catch { data = null; }
    return { ok: res.ok, status: res.status, data, ms };
  } catch (err: unknown) {
    const ms = Math.round(performance.now() - t0);
    return {
      ok: false,
      status: 0,
      data: { error: err instanceof Error ? err.message : String(err) },
      ms,
    };
  }
}

/**
 * Inspect KV keys via /dev/kv-inspect endpoint.
 * Returns per-key existence info with mget/get diagnostic.
 */
export async function kvInspect(
  keys: string[],
  bearerToken: string
): Promise<KvKeyResult[]> {
  const res = await apiFetch('POST', '/dev/kv-inspect', bearerToken, { keys });
  if (res.ok && res.data?.data?.results) {
    const d = res.data.data;
    if (d.mismatches > 0 || d.mget_error) {
      console.log('[KV-INSPECT DIAGNOSTIC]', JSON.stringify({
        mismatches: d.mismatches,
        mget_error: d.mget_error,
        mget_raw_length: d.mget_raw_length,
        mget_raw_types: d.mget_raw_types,
        results: d.results,
      }, null, 2));
    }
    return d.results.map((r: any) => ({
      key: r.key,
      exists: r.exists,
      mget_exists: r.mget_exists,
      get_exists: r.get_exists,
      mismatch: r.mismatch,
    }));
  }
  return keys.map(k => ({ key: k, exists: false }));
}
