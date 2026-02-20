// ============================================================
// routes-plans.tsx — Agent 1 (ATLAS) P1
// PricingPlan CRUD with soft-delete
// Endpoints:
//   GET    /plans                    — list all (active) plans
//   GET    /plans/:id                — get plan by id
//   POST   /plans                    — create plan
//   PUT    /plans/:id                — update plan
//   DELETE /plans/:id                — soft-delete plan
//   GET    /institutions/:instId/plans — list plans for institution
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const plans = new Hono();

// ── GET /plans ──────────────────────────────────────────
plans.get("/plans", async (c) => {
  try {
    const all = await kv.getByPrefix(PFX.plans);
    const active = all.filter((p: any) => p && typeof p === "object" && !p.deleted_at);
    return c.json(ok(active));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to list plans"), 500);
  }
});

// ── GET /plans/:id ──────────────────────────────────────
plans.get("/plans/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const plan = await kv.get(K.plan(id));
    if (!plan) return c.json(err("Plan not found", "NOT_FOUND"), 404);
    return c.json(ok(plan));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to get plan"), 500);
  }
});

// ── POST /plans ─────────────────────────────────────────
plans.post("/plans", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name) return c.json(err("name is required", "VALIDATION"), 400);

    const id = uid();
    const now = ts();
    const plan = {
      id,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-"),
      description: body.description || null,
      price_monthly: body.price_monthly ?? 0,
      price_yearly: body.price_yearly ?? 0,
      currency: body.currency || "BRL",
      max_students: body.max_students ?? null,
      max_courses: body.max_courses ?? null,
      max_storage_mb: body.max_storage_mb ?? null,
      features: body.features || [],
      institution_id: body.institution_id || null,
      is_active: true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const keys = [K.plan(id)];
    const vals: any[] = [plan];

    // Index by institution if provided
    if (body.institution_id) {
      keys.push(`idx:inst-plans:${body.institution_id}:${id}`);
      vals.push(id);
    }

    await kv.mset(keys, vals);
    console.log(`[Plans] Created plan: ${plan.name} (${id})`);
    return c.json(ok(plan), 201);
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to create plan"), 500);
  }
});

// ── PUT /plans/:id ──────────────────────────────────────
plans.put("/plans/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(K.plan(id));
    if (!existing) return c.json(err("Plan not found", "NOT_FOUND"), 404);

    const body = await c.req.json();
    const updated = {
      ...(existing as any),
      ...body,
      id, // immutable
      created_at: (existing as any).created_at, // immutable
      updated_at: ts(),
    };

    await kv.set(K.plan(id), updated);
    console.log(`[Plans] Updated plan: ${id}`);
    return c.json(ok(updated));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to update plan"), 500);
  }
});

// ── DELETE /plans/:id (soft-delete) ─────────────────────
plans.delete("/plans/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(K.plan(id));
    if (!existing) return c.json(err("Plan not found", "NOT_FOUND"), 404);

    const softDeleted = {
      ...(existing as any),
      deleted_at: ts(),
      is_active: false,
      updated_at: ts(),
    };

    await kv.set(K.plan(id), softDeleted);
    console.log(`[Plans] Soft-deleted plan: ${id}`);
    return c.json(ok({ id, deleted_at: softDeleted.deleted_at }));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to delete plan"), 500);
  }
});

// ── GET /institutions/:instId/plans ─────────────────────
plans.get("/institutions/:instId/plans", async (c) => {
  try {
    const instId = c.req.param("instId");
    const idxEntries = await kv.getByPrefix(`idx:inst-plans:${instId}:`);

    if (!idxEntries || idxEntries.length === 0) {
      return c.json(ok([]));
    }

    // idxEntries are plan IDs
    const planIds = idxEntries.filter((id: any) => typeof id === "string");
    const planKeys = planIds.map((id: string) => K.plan(id));
    const plansData = planKeys.length > 0 ? await kv.mget(planKeys) : [];
    const active = (plansData as any[]).filter((p: any) => p && !p.deleted_at);

    return c.json(ok(active));
  } catch (e: any) {
    return c.json(err(e?.message ?? "Failed to list institution plans"), 500);
  }
});

export default plans;
