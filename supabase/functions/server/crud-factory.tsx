// ============================================================
// Axon v4.2 — Shared CRUD Helpers
// ============================================================
// Used by all route modules. Auth uses Supabase's getUser().
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

// ── Auth helper ───────────────────────────────────────────────
// Extracts Bearer token from Authorization header, validates
// with Supabase Auth, returns { id, email, ... } or null.
// ──────────────────────────────────────────────────────────────
export const getAuthUser = async (c: any) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return null;

    const token = authHeader.replace("Bearer ", "");
    if (!token) return null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log(`[Auth] getAuthUser failed: ${error?.message ?? "no user"}`);
      return null;
    }

    return user;
  } catch (err) {
    console.log(`[Auth] getAuthUser exception: ${err}`);
    return null;
  }
};

// ── Standard error responses ─────────────────────────────────
export const unauthorized = (c: any) =>
  c.json(
    {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    },
    401
  );

export const notFound = (c: any, entity: string) =>
  c.json(
    {
      success: false,
      error: { code: "NOT_FOUND", message: `${entity} not found` },
    },
    404
  );

export const validationError = (c: any, message: string) =>
  c.json(
    {
      success: false,
      error: { code: "VALIDATION_ERROR", message },
    },
    400
  );

export const serverError = (c: any, route: string, err: any) => {
  console.log(`[Server Error] ${route}: ${err?.message ?? err}`);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: `Server error in ${route}: ${err?.message ?? "unknown"}`,
      },
    },
    500
  );
};

// ── getChildren: fetch child IDs by prefix, then mget objects ─
// Returns array of non-null values.
// ──────────────────────────────────────────────────────────────
export const getChildren = async (
  prefix: string,
  keyBuilder: (id: string) => string
): Promise<any[]> => {
  const ids: string[] = await kv.getByPrefix(prefix);
  if (!ids || ids.length === 0) return [];
  const objects = await kv.mget(ids.map(keyBuilder));
  return objects.filter(Boolean);
};
