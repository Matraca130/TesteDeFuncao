// ============================================================
// Axon v4.4 — Supabase Client (frontend singleton)
// ============================================================
//
// FIX: Added Symbol.for singleton pattern to prevent
// "Multiple GoTrueClient instances" warning during Vite HMR.
//
// ALL frontend code MUST import { supabase } from this file
// (or from services/supabaseClient.ts which re-exports this).
//
// Reads URL/key from config.ts which handles both Figma Make
// and Vercel production environments.
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './config';

const SUPA_KEY = Symbol.for('axon-supabase-singleton');

function getOrCreateClient(): SupabaseClient {
  const g = globalThis as Record<symbol, unknown>;
  if (!g[SUPA_KEY]) {
    console.log('[Supabase] Creating singleton client for:', supabaseUrl);
    g[SUPA_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return g[SUPA_KEY] as SupabaseClient;
}

export const supabase = getOrCreateClient();
