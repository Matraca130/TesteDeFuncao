// ============================================================
// AXON v4.4 — RBAC Middleware (SQL-based)
// Replaces KV-based role checks with direct SQL queries on
// memberships and profiles tables.
//
// Usage:
//   import { requireAuth, requireRole, requireOwner, requireMember, requirePlatformAdmin } from "./middleware-rbac.ts";
//
//   app.get("/auth/me", requireAuth(), handler);
//   app.post("/institutions/:id/plans", requireRole("owner"), handler);
//   app.get("/institutions/:id/members", requireMember(), handler);
//   app.post("/platform-plans", requirePlatformAdmin(), handler);
//
// Context variables set by middleware:
//   c.get("userId")         → string
//   c.get("membership")     → { id, role, institution_id, ... }
//   c.get("institutionId")  → string
// ============================================================

import type { Context, Next, MiddlewareHandler } from "npm:hono";
import { db } from "./db.ts";

// ── Extract institution_id from multiple sources ────────
function extractInstitutionId(c: Context): string | undefined {
  return (
    c.req.query("institution_id") ||
    c.req.header("X-Institution-Id") ||
    c.req.param("id") ||
    c.req.param("instId") ||
    c.req.param("institutionId") ||
    undefined
  );
}

/**
 * requireAuth()
 * Validates JWT via Supabase. Sets userId in context.
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("[RBAC] No token provided");
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "No token provided" } },
        401
      );
    }

    try {
      const { data: { user }, error } = await db().auth.getUser(token);

      if (error || !user) {
        console.log(`[RBAC] Invalid token: ${error?.message || "user not found"}`);
        return c.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
          401
        );
      }

      c.set("userId", user.id);
      await next();
    } catch (err: any) {
      console.log(`[RBAC] Auth error: ${err?.message}`);
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: `Auth error: ${err?.message}` } },
        401
      );
    }
  };
}

/**
 * requireRole(...roles)
 * Auth + role verification via SQL query on memberships table.
 *
 * Reads institution_id from: query, header, or URL param.
 * If no institution_id: searches ALL memberships of the user.
 * If institution_id provided: checks specific membership.
 *
 * Sets: userId, membership, institutionId in context.
 * Returns 403 if user doesn't have the required role.
 */
export function requireRole(...roles: string[]): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "No token provided" } },
        401
      );
    }

    const { data: { user }, error } = await db().auth.getUser(token);
    if (error || !user) {
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
        401
      );
    }

    c.set("userId", user.id);

    const instId = extractInstitutionId(c);

    if (!instId) {
      // No institution_id → search ALL active memberships
      const { data: memberships, error: memErr } = await db()
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .in("role", roles);

      if (memErr) {
        console.log(`[RBAC] DB error fetching memberships: ${memErr.message}`);
        return c.json(
          { success: false, error: { code: "SERVER_ERROR", message: `RBAC query error: ${memErr.message}` } },
          500
        );
      }

      if (!memberships || memberships.length === 0) {
        console.log(`[RBAC] Denied: user ${user.id} has no role [${roles.join(", ")}] in any institution`);
        return c.json(
          { success: false, error: { code: "FORBIDDEN", message: "Insufficient role in any institution" } },
          403
        );
      }

      c.set("membership", memberships[0]);
      c.set("institutionId", memberships[0].institution_id);
      await next();
      return;
    }

    // With institution_id → check specific membership
    const { data: membership, error: memErr } = await db()
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .eq("institution_id", instId)
      .eq("is_active", true)
      .maybeSingle();

    if (memErr) {
      console.log(`[RBAC] DB error: ${memErr.message}`);
      return c.json(
        { success: false, error: { code: "SERVER_ERROR", message: `RBAC query error: ${memErr.message}` } },
        500
      );
    }

    if (!membership) {
      console.log(`[RBAC] Denied: user ${user.id} is not a member of institution ${instId}`);
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not a member of this institution" } },
        403
      );
    }

    if (!roles.includes(membership.role)) {
      console.log(`[RBAC] Denied: user ${user.id} has role '${membership.role}', needs [${roles.join(", ")}]`);
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: `Requires role: ${roles.join(" or ")}` } },
        403
      );
    }

    c.set("membership", membership);
    c.set("institutionId", instId);
    await next();
  };
}

/**
 * requireOwner()
 * Shorthand for requireRole("owner").
 */
export function requireOwner(): MiddlewareHandler {
  return requireRole("owner");
}

/**
 * requireMember()
 * Auth + verifies user is a member of the institution (any role).
 */
export function requireMember(): MiddlewareHandler {
  return requireRole("owner", "admin", "professor", "student");
}

/**
 * requirePlatformAdmin()
 * Verifies user has platform_role = 'platform_admin' in profiles table.
 */
export function requirePlatformAdmin(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "No token provided" } },
        401
      );
    }

    const { data: { user }, error } = await db().auth.getUser(token);
    if (error || !user) {
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
        401
      );
    }

    c.set("userId", user.id);

    const { data: profile } = await db()
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.platform_role !== "platform_admin") {
      console.log(`[RBAC] Denied: user ${user.id} is not a platform admin`);
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "Platform admin access required" } },
        403
      );
    }

    await next();
  };
}
