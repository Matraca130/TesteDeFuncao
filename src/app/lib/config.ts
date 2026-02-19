// ============================================================
// Axon — Environment Config (dual-mode: Figma Make + Production)
// ============================================================
//
// HOW IT WORKS:
//   - In PRODUCTION (Vercel): reads from Vite env vars (VITE_SUPABASE_*)
//   - In FIGMA MAKE (dev):    falls back to auto-generated utils/supabase/info.tsx
//
// VERCEL ENV VARS (set in Vercel Dashboard → Settings → Environment Variables):
//   VITE_SUPABASE_URL        https://<your-permanent-project>.supabase.co
//   VITE_SUPABASE_ANON_KEY   your permanent anon key
//   VITE_API_BASE_URL        (optional) full base URL to the Edge Function API
//                            e.g. https://<id>.supabase.co/functions/v1/server/api
//                            If not set, defaults to <URL>/functions/v1/make-server-8cb6316a
// ============================================================

import { projectId as fmProjectId, publicAnonKey as fmAnonKey } from '/utils/supabase/info';

// ── Detect environment ──────────────────────────────────────
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const envApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

const isProduction = !!(envUrl && envKey);

// ── Resolved values ─────────────────────────────────────────
export const supabaseUrl: string = isProduction
  ? envUrl!
  : `https://${fmProjectId}.supabase.co`;

export const supabaseAnonKey: string = isProduction
  ? envKey!
  : fmAnonKey;

// API base URL: in production, use VITE_API_BASE_URL or derive from VITE_SUPABASE_URL.
// In Figma Make, always use the auto-generated function name.
const FM_FUNCTION_NAME = 'make-server-8cb6316a';

export const apiBaseUrl: string = isProduction
  ? (envApiBase || `${envUrl!}/functions/v1/${FM_FUNCTION_NAME}`)
  : `https://${fmProjectId}.supabase.co/functions/v1/${FM_FUNCTION_NAME}`;

// ── Debug: log config at startup (stripped in prod builds) ───
if (import.meta.env.DEV) {
  console.log('[Config] Environment:', isProduction ? 'PRODUCTION' : 'FIGMA_MAKE');
  console.log('[Config] Supabase URL:', supabaseUrl);
  console.log('[Config] API Base URL:', apiBaseUrl);
  console.log('[Config] Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
}
