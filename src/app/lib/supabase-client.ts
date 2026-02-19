// ============================================================
// Axon v4.4 — Supabase Client (frontend singleton)
// Handles session persistence and automatic token refresh.
// Reads config from config.ts (supports both Figma Make + Production)
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './config';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
