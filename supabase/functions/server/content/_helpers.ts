// ============================================================
// Axon v4.4 — Content Routes: Shared Helpers
// ============================================================
// Auth verification, standard error responses, and KV children
// lookup utility. Imported by every content sub-router.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "../kv_store.tsx";

// ── Auth ────────────────────────────────────────────────────
export async function getAuthUser(c: any) {
  const token =
    c.req.header("X-Auth-Token") ||
    c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return user;
  } catch {
    return null;
  }
}

// ── Standard error responses ────────────────────────────────
export function unauthorized(c: any) {
  return c.json(
    { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    401
  );
}

export function notFound(c: any, entity: string) {
  return c.json(
    { success: false, error: { code: "NOT_FOUND", message: `${entity} not found` } },
    404
  );
}

export function validationError(c: any, msg: string, details?: any) {
  return c.json(
    { success: false, error: { code: "VALIDATION_ERROR", message: msg, details } },
    400
  );
}

export function serverError(c: any, ctx: string, err: any) {
  console.log(`[Content] ${ctx} error: ${err?.message || err}`);
  return c.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: `${ctx}: ${err}` } },
    500
  );
}

// ── KV: fetch children by index prefix ──────────────────────
export async function getChildren(
  prefix: string,
  primaryKeyFn: (id: string) => string
) {
  const ids = await kv.getByPrefix(prefix);
  if (!ids || ids.length === 0) return [];
  const items = await kv.mget(ids.map((id: string) => primaryKeyFn(id)));
  return items.filter(Boolean);
}
