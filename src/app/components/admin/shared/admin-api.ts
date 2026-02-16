// ══════════════════════════════════════════════════════════════
// AXON — Admin API Configuration (Single source of truth)
// Change PREFIX here when deploying to different environments
// ══════════════════════════════════════════════════════════════

import { projectId, publicAnonKey } from '/utils/supabase/info';

// ── Figma Make instance PREFIX ──
// Local (this instance): make-server-1aa05432
// GitHub repo:           make-server-0c4f6a3c
const PREFIX = 'make-server-0c4f6a3c';

export const API_BASE = `https://${projectId}.supabase.co/functions/v1/${PREFIX}`;

export { publicAnonKey };

/**
 * Fetch from the KV store (GET request with auth)
 */
export async function kvFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
  });
  return res.json();
}

/**
 * Save to the KV store (POST request with auth + JSON body)
 */
export async function kvSave(path: string, body: Record<string, any>): Promise<Response> {
  return fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(body),
  });
}
