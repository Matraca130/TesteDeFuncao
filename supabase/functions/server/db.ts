// ============================================================
// AXON v4.4 — Database Client Singleton
// Provides a typed Supabase admin client for direct SQL queries
// against the relational schema (Phase 1: 8 admin tables).
// ============================================================
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2.49.8";

let _admin: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase admin client using SERVICE_ROLE_KEY.
 * This bypasses RLS — use only in server-side code.
 */
export function db(): SupabaseClient {
  if (!_admin) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      throw new Error("[DB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    _admin = createClient(url, key);
  }
  return _admin;
}

// ── Response helpers (consistent across all admin routes) ────

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true as const, data, ...meta };
}

export function err(message: string, code = "SERVER_ERROR") {
  return { success: false as const, error: { code, message } };
}

export function notFoundErr(entity: string) {
  return err(`${entity} not found`, "NOT_FOUND");
}

export function validationErr(message: string, details?: unknown) {
  return { success: false as const, error: { code: "VALIDATION", message, details } };
}

export function unauthorizedErr(message = "Not authenticated") {
  return err(message, "UNAUTHORIZED");
}

export function forbiddenErr(message = "Insufficient permissions") {
  return err(message, "FORBIDDEN");
}

// ── Auth helper: extract user from JWT ──────────────────────

export async function getAuthUserId(c: any): Promise<string | null> {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  try {
    const { data: { user }, error } = await db().auth.getUser(token);
    if (error || !user?.id) return null;
    return user.id;
  } catch (e) {
    console.log("[DB] getAuthUserId error:", e);
    return null;
  }
}

export async function getAuthUser(c: any): Promise<{
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
} | null> {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  try {
    const { data: { user }, error } = await db().auth.getUser(token);
    if (error || !user?.id) return null;
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.email?.split("@")[0] || "",
      avatar_url: user.user_metadata?.avatar_url || null,
    };
  } catch (e) {
    console.log("[DB] getAuthUser error:", e);
    return null;
  }
}

// ── Profile sync: ensure auth user has a profiles row ───────

export async function ensureProfile(user: {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}): Promise<void> {
  const { error } = await db()
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: user.name,
        avatar_url: user.avatar_url,
      },
      { onConflict: "id" }
    );
  if (error) {
    console.log(`[DB] ensureProfile error for ${user.id}: ${error.message}`);
  }
}
