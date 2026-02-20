// ============================================================
// routes-admin-scopes.tsx — Agent 1 (ATLAS) P1
// AdminScope CRUD with soft-delete
// AdminScopes define what admin users can access within an institution.
// Endpoints:
//   GET    /admin-scopes                     — list all (active) scopes
//   GET    /admin-scopes/:id                 — get scope by id
//   POST   /admin-scopes                     — create scope
//   PUT    /admin-scopes/:id                 — update scope
//   DELETE /admin-scopes/:id                 — soft-delete scope
//   GET    /institutions/:instId/admin-scopes — list scopes for institution
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const adminScopes = new Hono();

// ── GET /admin-scopes ───────────────────────────────────
adminScopes.get("/admin-scopes", async (c) => {
  try {
    const all = await kv.getByPrefix(PFX.adminScopes);
    const active = all.filter((s: any) => s && typeof s === "object" && !s.deleted_at);
    return c.json(ok(active));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to list admin scopes"), 500);
  }
});

// ── GET /admin-scopes/:id ───────────────────────────────
adminScopes.get("/admin-scopes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const scope = await kv.get(K.adminScope(id));
    if (!scope) return c.json(err("AdminScope not found", "NOT_FOUND"), 404);
    return c.json(ok(scope));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to get admin scope"), 500);
  }
});

// ── POST /admin-scopes ──────────────────────────────────
adminScopes.post("/admin-scopes", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name) return c.json(err("name is required", "VALIDATION"), 400);
    if (!body.institution_id) return c.json(err("institution_id is required", "VALIDATION"), 400);

    const id = uid();
    const now = ts();
    const scope = {
      id,
      name: body.name,
      description: body.description || null,
      institution_id: body.institution_id,
      permissions: body.permissions || [],
      // Which roles this scope applies to
      applies_to_roles: body.applies_to_roles || ["admin"],
      // Specific resource restrictions
      allowed_courses: body.allowed_courses || [], // empty = all
      allowed_semesters: body.allowed_semesters || [],
      max_members: body.max_members ?? null,
      can_manage_billing: body.can_manage_billing ?? false,
      can_manage_members: body.can_manage_members ?? true,
      can_manage_content: body.can_manage_content ?? true,
      is_active: true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const keys = [
      K.adminScope(id),
      `idx:inst-admin-scopes:${body.institution_id}:${id}`,
    ];
    const vals: any[] = [scope, id];

    await kv.mset(keys, vals);
    console.log(`[AdminScopes] Created scope: ${scope.name} (${id}) for inst ${body.institution_id}`);
    return c.json(ok(scope), 201);
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to create admin scope"), 500);
  }
});

// ── PUT /admin-scopes/:id ───────────────────────────────
adminScopes.put("/admin-scopes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(K.adminScope(id));
    if (!existing) return c.json(err("AdminScope not found", "NOT_FOUND"), 404);

    const body = await c.req.json();
    const updated = {
      ...(existing as any),
      ...body,
      id, // immutable
      institution_id: (existing as any).institution_id, // immutable
      created_at: (existing as any).created_at, // immutable
      updated_at: ts(),
    };

    await kv.set(K.adminScope(id), updated);
    console.log(`[AdminScopes] Updated scope: ${id}`);
    return c.json(ok(updated));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to update admin scope"), 500);
  }
});

// ── DELETE /admin-scopes/:id (soft-delete) ──────────────
adminScopes.delete("/admin-scopes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(K.adminScope(id));
    if (!existing) return c.json(err("AdminScope not found", "NOT_FOUND"), 404);

    const softDeleted = {
      ...(existing as any),
      deleted_at: ts(),
      is_active: false,
      updated_at: ts(),
    };

    await kv.set(K.adminScope(id), softDeleted);
    console.log(`[AdminScopes] Soft-deleted scope: ${id}`);
    return c.json(ok({ id, deleted_at: softDeleted.deleted_at }));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to delete admin scope"), 500);
  }
});

// ── GET /institutions/:instId/admin-scopes ──────────────
adminScopes.get("/institutions/:instId/admin-scopes", async (c) => {
  try {
    const instId = c.req.param("instId");
    const idxEntries = await kv.getByPrefix(`idx:inst-admin-scopes:${instId}:`);

    if (!idxEntries || idxEntries.length === 0) {
      return c.json(ok([]));
    }

    const scopeIds = idxEntries.filter((id: any) => typeof id === "string");
    const scopeKeys = scopeIds.map((id: string) => K.adminScope(id));
    const scopesData = scopeKeys.length > 0 ? await kv.mget(scopeKeys) : [];
    const active = (scopesData as any[]).filter((s: any) => s && !s.deleted_at);

    return c.json(ok(active));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to list institution scopes"), 500);
  }
});

export default adminScopes;
