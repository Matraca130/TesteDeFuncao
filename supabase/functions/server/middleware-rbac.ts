// ============================================================
// AXON v4.4 — RBAC Middleware (NUEVO — Dev 2)
// ============================================================
// Middleware reutilizable para proteger endpoints por rol.
//
// Uso:
//   import { requireAuth, requireRole, requireOwner, requireMember } from "./middleware-rbac.ts";
//
//   app.get("/auth/me", requireAuth(), handler);
//   app.post("/institutions/:id/plans", requireRole("owner"), handler);
//   app.get("/institutions/:id/members", requireMember(), handler);
//
// El middleware pone en el context de Hono:
//   c.get("userId")         → string
//   c.get("membership")     → object (si requireRole/requireMember)
//   c.get("institutionId")  → string (si requireRole/requireMember)
// ============================================================

import type { Context, Next, MiddlewareHandler } from "npm:hono";
import { memberKey, KV_PREFIXES } from "./kv-keys.ts";
import { getSupabaseAdmin } from "./crud-factory.tsx";
import * as kv from "./kv_store.tsx";

// ── Helper interno: obtener todas las memberships de un usuario ──
async function getAllMemberships(userId: string): Promise<any[]> {
  const prefix = KV_PREFIXES.IDX_USER_INSTS + userId + ":";
  const instIds = await kv.getByPrefix(prefix);
  if (!instIds || instIds.length === 0) return [];
  const keys = (instIds as string[]).map((iid) => memberKey(iid, userId));
  const results = await kv.mget(keys);
  return results.filter(Boolean);
}

// ── Helper interno: extraer institution_id de múltiples fuentes ──
function extractInstitutionId(c: Context): string | undefined {
  return (
    c.req.query("institution_id") ||
    c.req.header("X-Institution-Id") ||
    c.req.param("id") ||
    undefined
  );
}

/**
 * requireAuth()
 * Valida JWT via Supabase. Pone userId en c.set("userId", id).
 * Retorna 401 si no hay token o es inválido.
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
      const supabase = getSupabaseAdmin();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

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
 * requireAuth() + verifica rol en membership.
 * Lee institution_id de: query ?institution_id= || header X-Institution-Id || URL param :id
 *
 * Si NO hay institution_id: busca en TODAS las memberships del usuario.
 * Si hay institution_id: busca membership específica.
 *
 * Pone: userId, membership, institutionId en context.
 * 403 si no tiene el rol requerido.
 */
export function requireRole(...roles: string[]): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    // Paso 1: validar auth
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("[RBAC] No token provided");
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "No token provided" } },
        401
      );
    }

    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log(`[RBAC] Invalid token: ${error?.message || "user not found"}`);
      return c.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
        401
      );
    }

    c.set("userId", user.id);

    // Paso 2: encontrar institution_id
    const instId = extractInstitutionId(c);

    if (!instId) {
      // Sin institution_id → buscar en TODAS las memberships
      const allMemberships = await getAllMemberships(user.id);
      const matching = allMemberships.find((m: any) => roles.includes(m.role));

      if (!matching) {
        console.log(
          `[RBAC] Denied: user ${user.id} has no role in [${roles.join(", ")}] in any institution`
        );
        return c.json(
          { success: false, error: { code: "FORBIDDEN", message: "Insufficient role in any institution" } },
          403
        );
      }

      c.set("membership", matching);
      c.set("institutionId", matching.institution_id);
      await next();
      return;
    }

    // Con institution_id → buscar membership específica
    const membership = await kv.get(memberKey(instId, user.id));

    if (!membership) {
      console.log(`[RBAC] Denied: user ${user.id} is not a member of institution ${instId}`);
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not a member of this institution" } },
        403
      );
    }

    if (!roles.includes((membership as any).role)) {
      console.log(
        `[RBAC] Denied: user ${user.id} has role '${(membership as any).role}', needs [${roles.join(", ")}] in inst ${instId}`
      );
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
 * Shorthand para requireRole("owner").
 * El institution_id es OBLIGATORIO (query, header, o URL param).
 */
export function requireOwner(): MiddlewareHandler {
  return requireRole("owner");
}

/**
 * requireMember()
 * requireAuth() + verifica que es miembro de la institución (cualquier rol).
 * Equivale a requireRole("owner", "admin", "professor", "student").
 */
export function requireMember(): MiddlewareHandler {
  return requireRole("owner", "admin", "professor", "student");
}
