// ============================================================
// AXON v4.4 — routes-plans-v2.tsx
// SQL-based Plans CRUD (replaces KV version)
// Covers TWO plan types:
//   1. Platform Plans  (Axon sells to institutions)
//   2. Institution Plans (institutions sell to students)
// ============================================================
import { Hono } from "npm:hono";
import { db, ok, err, notFoundErr, validationErr, unauthorizedErr, forbiddenErr, getAuthUserId } from "./db.ts";

const plans = new Hono();

async function requirePlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await db().from("profiles").select("platform_role").eq("id", userId).maybeSingle();
  return data?.platform_role === "platform_admin";
}

async function requireInstAdmin(userId: string, institutionId: string): Promise<boolean> {
  const { data } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", institutionId).eq("is_active", true).maybeSingle();
  return !!data && ["owner", "admin"].includes(data.role);
}

// === PLATFORM PLANS ===

plans.get("/platform-plans", async (c) => {
  try {
    const includeInactive = c.req.query("include_inactive") === "true";
    let query = db().from("platform_plans").select("*").order("price_cents", { ascending: true });
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    return c.json(ok(data || []));
  } catch (e: any) { return c.json(err(`Failed to list platform plans: ${e?.message}`), 500); }
});

plans.get("/platform-plans/:id", async (c) => {
  try {
    const { data, error } = await db().from("platform_plans").select("*").eq("id", c.req.param("id")).maybeSingle();
    if (error) throw error;
    if (!data) return c.json(notFoundErr("Platform plan"), 404);
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to get platform plan: ${e?.message}`), 500); }
});

plans.post("/platform-plans", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    if (!(await requirePlatformAdmin(userId))) return c.json(forbiddenErr("Only platform admins can create platform plans"), 403);
    const body = await c.req.json();
    if (!body.name) return c.json(validationErr("name is required"), 400);
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data: existing } = await db().from("platform_plans").select("id").eq("slug", slug).maybeSingle();
    if (existing) return c.json(err("Plan slug already in use", "CONFLICT"), 409);
    const { data, error } = await db().from("platform_plans").insert({ name: body.name, slug, description: body.description || null, price_cents: body.price_cents ?? 0, billing_cycle: body.billing_cycle || "monthly", max_students: body.max_students ?? null, max_courses: body.max_courses ?? null, max_storage_mb: body.max_storage_mb ?? null, features: body.features || {} }).select().single();
    if (error) throw error;
    console.log(`[PlatformPlans] Created: ${data.name} (${data.id})`);
    return c.json(ok(data), 201);
  } catch (e: any) { return c.json(err(`Failed to create platform plan: ${e?.message}`), 500); }
});

plans.put("/platform-plans/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    if (!(await requirePlatformAdmin(userId))) return c.json(forbiddenErr("Only platform admins can update platform plans"), 403);
    const id = c.req.param("id");
    const body = await c.req.json();
    const allowedFields = ["name", "description", "price_cents", "billing_cycle", "max_students", "max_courses", "max_storage_mb", "features", "is_active"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) { if (body[field] !== undefined) updates[field] = body[field]; }
    if (body.slug) {
      const { data: conflict } = await db().from("platform_plans").select("id").eq("slug", body.slug).neq("id", id).maybeSingle();
      if (conflict) return c.json(err("Slug already in use", "CONFLICT"), 409);
      updates.slug = body.slug;
    }
    const { data, error } = await db().from("platform_plans").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to update platform plan: ${e?.message}`), 500); }
});

plans.delete("/platform-plans/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    if (!(await requirePlatformAdmin(userId))) return c.json(forbiddenErr("Only platform admins can delete platform plans"), 403);
    const { data, error } = await db().from("platform_plans").update({ is_active: false }).eq("id", c.req.param("id")).select("id, is_active").single();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to delete platform plan: ${e?.message}`), 500); }
});

// === INSTITUTION PLANS ===

plans.get("/institutions/:instId/plans", async (c) => {
  try {
    const instId = c.req.param("instId");
    const includeInactive = c.req.query("include_inactive") === "true";
    let query = db().from("institution_plans").select(`*, _member_count:memberships(count)`).eq("institution_id", instId).order("created_at", { ascending: true });
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    const enriched = (data || []).map((p: any) => ({ ...p, member_count: p._member_count?.[0]?.count || 0, _member_count: undefined }));
    return c.json(ok(enriched));
  } catch (e: any) { return c.json(err(`Failed to list institution plans: ${e?.message}`), 500); }
});

plans.get("/institution-plans/:id", async (c) => {
  try {
    const { data, error } = await db().from("institution_plans").select(`*, access_rules:plan_access_rules(id, scope_type, scope_id)`).eq("id", c.req.param("id")).maybeSingle();
    if (error) throw error;
    if (!data) return c.json(notFoundErr("Institution plan"), 404);
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to get institution plan: ${e?.message}`), 500); }
});

plans.post("/institution-plans", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const body = await c.req.json();
    if (!body.institution_id) return c.json(validationErr("institution_id is required"), 400);
    if (!body.name) return c.json(validationErr("name is required"), 400);
    if (!(await requireInstAdmin(userId, body.institution_id))) return c.json(forbiddenErr("Only owner or admin can create institution plans"), 403);
    const { data, error } = await db().from("institution_plans").insert({ institution_id: body.institution_id, name: body.name, description: body.description || null, price_cents: body.price_cents ?? 0, billing_cycle: body.billing_cycle || "monthly", is_default: body.is_default ?? false }).select().single();
    if (error) throw error;
    if (data.is_default) { await db().from("institution_plans").update({ is_default: false }).eq("institution_id", body.institution_id).neq("id", data.id); }
    console.log(`[InstitutionPlans] Created: ${data.name} (${data.id})`);
    return c.json(ok(data), 201);
  } catch (e: any) { return c.json(err(`Failed to create institution plan: ${e?.message}`), 500); }
});

plans.put("/institution-plans/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const id = c.req.param("id");
    const { data: existing, error: fetchErr } = await db().from("institution_plans").select("institution_id").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json(notFoundErr("Institution plan"), 404);
    if (!(await requireInstAdmin(userId, existing.institution_id))) return c.json(forbiddenErr("Only owner or admin can update institution plans"), 403);
    const body = await c.req.json();
    const allowedFields = ["name", "description", "price_cents", "billing_cycle", "is_active"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) { if (body[field] !== undefined) updates[field] = body[field]; }
    const { data, error } = await db().from("institution_plans").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to update institution plan: ${e?.message}`), 500); }
});

plans.delete("/institution-plans/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const id = c.req.param("id");
    const { data: existing, error: fetchErr } = await db().from("institution_plans").select("institution_id").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json(notFoundErr("Institution plan"), 404);
    if (!(await requireInstAdmin(userId, existing.institution_id))) return c.json(forbiddenErr("Only owner or admin can delete institution plans"), 403);
    await db().from("memberships").update({ institution_plan_id: null }).eq("institution_plan_id", id);
    const { data, error } = await db().from("institution_plans").update({ is_active: false, is_default: false }).eq("id", id).select("id, is_active").single();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to delete institution plan: ${e?.message}`), 500); }
});

plans.patch("/institution-plans/:id/set-default", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const id = c.req.param("id");
    const { data: plan, error: fetchErr } = await db().from("institution_plans").select("institution_id, is_active").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!plan) return c.json(notFoundErr("Institution plan"), 404);
    if (!plan.is_active) return c.json(err("Cannot set inactive plan as default", "VALIDATION"), 400);
    if (!(await requireInstAdmin(userId, plan.institution_id))) return c.json(forbiddenErr("Only owner or admin can set default plan"), 403);
    await db().from("institution_plans").update({ is_default: false }).eq("institution_id", plan.institution_id).neq("id", id);
    const { data, error } = await db().from("institution_plans").update({ is_default: true }).eq("id", id).select().single();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to set default plan: ${e?.message}`), 500); }
});

// === LEGACY COMPAT ===
plans.get("/plans", async (c) => {
  const { data, error } = await db().from("platform_plans").select("*").eq("is_active", true).order("price_cents", { ascending: true });
  if (error) return c.json(err(error.message), 500);
  return c.json(ok(data || []));
});

plans.get("/plans/:id", async (c) => {
  const { data, error } = await db().from("platform_plans").select("*").eq("id", c.req.param("id")).maybeSingle();
  if (error) return c.json(err(error.message), 500);
  if (!data) return c.json(notFoundErr("Plan"), 404);
  return c.json(ok(data));
});

export default plans;
