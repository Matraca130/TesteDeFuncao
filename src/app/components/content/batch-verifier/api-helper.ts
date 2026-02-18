// ============================================================
// Axon v4.4 — BatchVerifier API Helper
// Low-level fetch wrapper + KV inspect utility.
// Extracted from BatchVerifier.tsx for modularity.
//
// ⚠️  INTENTIONALLY separate from lib/api-client.ts (Step 8 audit).
// Reasons this does NOT use the centralized ApiClient:
//
//   1. Dual-token auth — sends publicAnonKey as Authorization
//      (gateway HS256) AND user JWT via X-Auth-Token (server ES256).
//      ApiClient only supports a single Authorization header.
//
//   2. No-throw design — returns { ok, status, data, ms } instead
//      of throwing ApiClientError. Test runner needs this to report
//      pass/fail without try/catch overhead on every test case.
//
//   3. Built-in timing — tracks performance.now() per request,
//      which ApiClient doesn't expose.
//
//   4. Self-contained diagnostic — batch-verifier is a standalone
//      test tool that runs independently of app auth state.
//
// DO NOT migrate to ApiClient without addressing all 4 points.
// ============================================================

import type { ApiResponse, KvKeyResult } from './types';

// HARDCODED — backend lives on project xdnciktarvxyhkrokbng
const API = 'https://xdnciktarvxyhkrokbng.supabase.co/functions/v1/make-server-7a20cd7d';

/**
 * Extract the "payload" from a server response.
 * The server may wrap data as `{ data: { ... } }` or return flat `{ ... }`.
 */
export function extractPayload(data: any): any {
  if (data?.data && typeof data.data === 'object') return data.data;
  return data ?? {};
}

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
  const payload = extractPayload(res.data);
  const results = payload?.results;

  if (res.ok && Array.isArray(results)) {
    if (payload.mismatches > 0 || payload.mget_error) {
      console.log('[KV-INSPECT DIAGNOSTIC]', JSON.stringify({
        mismatches: payload.mismatches,
        mget_error: payload.mget_error,
        mget_raw_length: payload.mget_raw_length,
        mget_raw_types: payload.mget_raw_types,
        results: payload.results,
      }, null, 2));
    }
    return results.map((r: any) => ({
      key: r.key,
      exists: r.exists,
      mget_exists: r.mget_exists,
      get_exists: r.get_exists,
      mismatch: r.mismatch,
    }));
  }

  // Log diagnostic when kv-inspect fails
  if (!res.ok) {
    console.warn('[KV-INSPECT FAIL]', { status: res.status, data: res.data });
  }
  return keys.map(k => ({ key: k, exists: false }));
}
