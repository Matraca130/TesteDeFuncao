// ════════════════════════════════════════════════════════════
// Axon — Singleton Supabase Client
//
// ALL frontend code MUST import from here instead of calling
// createClient() directly. This prevents the
// "Multiple GoTrueClient instances" warning.
//
// Symbol.for guarantees the same symbol across Vite HMR reloads.
// ════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SUPA_KEY = Symbol.for('axon-supabase');

function getSupabaseClient(): SupabaseClient {
  const g = globalThis as Record<symbol, unknown>;
  if (!g[SUPA_KEY]) {
    g[SUPA_KEY] = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return g[SUPA_KEY] as SupabaseClient;
}

export const supabase = getSupabaseClient();
