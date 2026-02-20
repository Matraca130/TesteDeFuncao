// ============================================================
// AXON v4.4 — routes-admin-scopes-v2.tsx
// SQL-based Admin Scopes CRUD (replaces KV version)
// ============================================================
import { Hono } from "npm:hono";
import { db, ok, err, notFoundErr, validationErr, unauthorizedErr, forbiddenErr, getAuthUserId } from "./db.ts";

const adminScopes = new Hono();
const VALID_SCOPE_TYPES = ["full", "course", "semester", "section"];

adminScopes.get("/admin-scopes/membership/:membershipId", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const membershipId = c.req.param("membershipId");
    const { data: membership, error: memErr } = await db().from("memberships").select("institution_id").eq("id", membershipId).maybeSingle();
    if (memErr) throw memErr;
    if (!membership) return c.json(notFoundErr("Membership"), 404);
    const { data: requester } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", membership.institution_id).eq("is_active", true).maybeSingle();
    if (!requester) return c.json(forbiddenErr("Not a member of this institution"), 403);
    const { data, error } = await db().from("admin_scopes").select("*").eq("membership_id", membershipId).order("created_at", { ascending: true });
    if (error) throw error;
    return c.json(ok(data || []));
  } catch (e: any) { return c.json(err(`Failed to list admin scopes: ${e?.message}`), 500); }
});

adminScopes.get("/admin-scopes/:id", async (c) => {
  try {
    const { data, error } = await db().from("admin_scopes").select("*, membership:memberships(id, user_id, institution_id, role)").eq("id", c.req.param("id")).maybeSingle();
    if (error) throw error;
    if (!data) return c.json(notFoundErr("Admin scope"), 404);
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to get admin scope: ${e?.message}`), 500); }
});

adminScopes.post("/admin-scopes", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const { membership_id, scope_type, scope_id } = await c.req.json();
    if (!membership_id) return c.json(validationErr("membership_id is required"), 400);
    if (!scope_type || !VALID_SCOPE_TYPES.includes(scope_type)) return c.json(validationErr(`scope_type must be one of: ${VALID_SCOPE_TYPES.join(", ")}`), 400);
    if (scope_type !== "full" && !scope_id) return c.json(validationErr("scope_id is required when scope_type is not 'full'"), 400);
    const { data: targetMembership, error: memErr } = await db().from("memberships").select("institution_id, role").eq("id", membership_id).maybeSingle();
    if (memErr) throw memErr;
    if (!targetMembership) return c.json(notFoundErr("Target membership"), 404);
    const { data: requester } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", targetMembership.institution_id).eq("is_active", true).maybeSingle();
    if (!requester || requester.role !== "owner") return c.json(forbiddenErr("Only the institution owner can manage admin scopes"), 403);
    const { data, error } = await db().from("admin_scopes").insert({ membership_id, scope_type, scope_id: scope_type === "full" ? null : scope_id }).select().single();
    if (error) throw error;
    console.log(`[AdminScopes] Created: ${scope_type}${scope_id ? `:${scope_id}` : ""} for membership ${membership_id}`);
    return c.json(ok(data), 201);
  } catch (e: any) { return c.json(err(`Failed to create admin scope: ${e?.message}`), 500); }
});

adminScopes.delete("/admin-scopes/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const id = c.req.param("id");
    const { data: scope, error: scopeErr } = await db().from("admin_scopes").select("id, membership_id, membership:memberships(institution_id)").eq("id", id).maybeSingle();
    if (scopeErr) throw scopeErr;
    if (!scope) return c.json(notFoundErr("Admin scope"), 404);
    const institutionId = (scope as any).membership?.institution_id;
    const { data: requester } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", institutionId).eq("is_active", true).maybeSingle();
    if (!requester || requester.role !== "owner") return c.json(forbiddenErr("Only the institution owner can manage admin scopes"), 403);
    const { error: delErr } = await db().from("admin_scopes").delete().eq("id", id);
    if (delErr) throw delErr;
    return c.json(ok({ id, deleted: true }));
  } catch (e: any) { return c.json(err(`Failed to delete admin scope: ${e?.message}`), 500); }
});

adminScopes.put("/admin-scopes/membership/:membershipId", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const membershipId = c.req.param("membershipId");
    const { scopes } = await c.req.json();
    if (!Array.isArray(scopes)) return c.json(validationErr("scopes must be an array"), 400);
    for (const s of scopes) {
      if (!s.scope_type || !VALID_SCOPE_TYPES.includes(s.scope_type)) return c.json(validationErr(`Invalid scope_type: ${s.scope_type}`), 400);
      if (s.scope_type !== "full" && !s.scope_id) return c.json(validationErr(`scope_id required for scope_type '${s.scope_type}'`), 400);
    }
    const { data: targetMembership, error: memErr } = await db().from("memberships").select("institution_id").eq("id", membershipId).maybeSingle();
    if (memErr) throw memErr;
    if (!targetMembership) return c.json(notFoundErr("Membership"), 404);
    const { data: requester } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", targetMembership.institution_id).eq("is_active", true).maybeSingle();
    if (!requester || requester.role !== "owner") return c.json(forbiddenErr("Only the institution owner can manage admin scopes"), 403);
    await db().from("admin_scopes").delete().eq("membership_id", membershipId);
    if (scopes.length > 0) {
      const rows = scopes.map((s: any) => ({ membership_id: membershipId, scope_type: s.scope_type, scope_id: s.scope_type === "full" ? null : s.scope_id }));
      const { data, error } = await db().from("admin_scopes").insert(rows).select();
      if (error) throw error;
      console.log(`[AdminScopes] Bulk replaced ${data.length} scopes for membership ${membershipId}`);
      return c.json(ok(data));
    }
    return c.json(ok([]));
  } catch (e: any) { return c.json(err(`Failed to bulk replace admin scopes: ${e?.message}`), 500); }
});

// Legacy compat
adminScopes.get("/admin-scopes", async (c) => {
  try {
    const { data, error } = await db().from("admin_scopes").select("*, membership:memberships(id, user_id, institution_id, role)").order("created_at", { ascending: true });
    if (error) throw error;
    return c.json(ok(data || []));
  } catch (e: any) { return c.json(err(`Failed to list admin scopes: ${e?.message}`), 500); }
});

adminScopes.get("/institutions/:instId/admin-scopes", async (c) => {
  try {
    const instId = c.req.param("instId");
    const { data, error } = await db().from("admin_scopes").select(`*, membership:memberships!inner(id, user_id, institution_id, role)`).eq("membership.institution_id", instId).order("created_at", { ascending: true });
    if (error) throw error;
    return c.json(ok(data || []));
  } catch (e: any) { return c.json(err(`Failed to list institution admin scopes: ${e?.message}`), 500); }
});

export default adminScopes;
