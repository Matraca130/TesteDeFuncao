// ============================================================
// COMPATIBILITY SHIM — DO NOT add logic here
// ============================================================
//
// FIX: This file previously created its OWN Supabase client
// using createClient() with Symbol.for, causing a SECOND
// GoTrueClient instance when lib/supabase-client.ts was also
// imported (e.g. by App.tsx).
//
// Now it just re-exports the singleton from lib/supabase-client.ts.
// All existing imports like:
//   import { supabase } from '../services/supabaseClient'
// will use the SAME singleton instance.
//
// In a future cleanup, update all imports to point directly
// to '../lib/supabase-client' and delete this file.
// ============================================================

export { supabase } from '../lib/supabase-client';
