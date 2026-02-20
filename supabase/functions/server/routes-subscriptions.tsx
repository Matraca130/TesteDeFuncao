// ============================================================
// AXON v4.4 — routes-subscriptions.tsx (NEW)
// Institution Subscriptions CRUD
// Uses: institution_subscriptions, platform_plans tables
// ============================================================
import { Hono } from "npm:hono";
import { db, ok, err, notFoundErr, validationErr, unauthorizedErr, forbiddenErr, getAuthUserId } from "./db.ts";

const subscriptions = new Hono();
const VALID_STATUSES = ["active", "past_due", "canceled", "trialing"];

subscriptions.get("/institutions/:instId/subscription", async (c) => {
  try {
    const { data, error } = await db().from("institution_subscriptions").select(`*, plan:platform_plans(*)`).eq("institution_id", c.req.param("instId")).in("status", ["active", "trialing", "past_due"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to get subscription: ${e?.message}`), 500); }
});

subscriptions.get("/institution-subscriptions/:id", async (c) => {
  try {
    const { data, error } = await db().from("institution_subscriptions").select("*, plan:platform_plans(*)").eq("id", c.req.param("id")).maybeSingle();
    if (error) throw error;
    if (!data) return c.json(notFoundErr("Subscription"), 404);
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to get subscription: ${e?.message}`), 500); }
});

subscriptions.post("/institution-subscriptions", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const body = await c.req.json();
    const { institution_id, plan_id, status, current_period_start, current_period_end } = body;
    if (!institution_id) return c.json(validationErr("institution_id is required"), 400);
    if (!plan_id) return c.json(validationErr("plan_id is required"), 400);
    const { data: membership } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", institution_id).eq("is_active", true).maybeSingle();
    if (!membership || membership.role !== "owner") return c.json(forbiddenErr("Only the institution owner can manage subscriptions"), 403);
    const { data: plan } = await db().from("platform_plans").select("id, is_active").eq("id", plan_id).maybeSingle();
    if (!plan) return c.json(notFoundErr("Platform plan"), 404);
    if (!plan.is_active) return c.json(err("Cannot subscribe to an inactive plan", "VALIDATION"), 400);
    await db().from("institution_subscriptions").update({ status: "canceled" }).eq("institution_id", institution_id).in("status", ["active", "trialing", "past_due"]);
    const now = new Date().toISOString();
    const { data, error } = await db().from("institution_subscriptions").insert({ institution_id, plan_id, status: status || "active", current_period_start: current_period_start || now, current_period_end: current_period_end || null }).select("*, plan:platform_plans(*)").single();
    if (error) throw error;
    console.log(`[Subscriptions] Created: inst=${institution_id}, plan=${plan_id}`);
    return c.json(ok(data), 201);
  } catch (e: any) { return c.json(err(`Failed to create subscription: ${e?.message}`), 500); }
});

subscriptions.put("/institution-subscriptions/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const id = c.req.param("id");
    const { data: existing, error: fetchErr } = await db().from("institution_subscriptions").select("institution_id").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json(notFoundErr("Subscription"), 404);
    const { data: membership } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", existing.institution_id).eq("is_active", true).maybeSingle();
    if (!membership || membership.role !== "owner") return c.json(forbiddenErr("Only the institution owner can update subscriptions"), 403);
    const body = await c.req.json();
    const allowedFields = ["status", "plan_id", "current_period_start", "current_period_end"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) { if (body[field] !== undefined) updates[field] = body[field]; }
    if (updates.status && !VALID_STATUSES.includes(updates.status as string)) return c.json(validationErr(`status must be one of: ${VALID_STATUSES.join(", ")}`), 400);
    const { data, error } = await db().from("institution_subscriptions").update(updates).eq("id", id).select("*, plan:platform_plans(*)").single();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to update subscription: ${e?.message}`), 500); }
});

subscriptions.delete("/institution-subscriptions/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const id = c.req.param("id");
    const { data: existing, error: fetchErr } = await db().from("institution_subscriptions").select("institution_id").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json(notFoundErr("Subscription"), 404);
    const { data: membership } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", existing.institution_id).eq("is_active", true).maybeSingle();
    if (!membership || membership.role !== "owner") return c.json(forbiddenErr("Only the institution owner can cancel subscriptions"), 403);
    const { data, error } = await db().from("institution_subscriptions").update({ status: "canceled" }).eq("id", id).select("id, status").single();
    if (error) throw error;
    return c.json(ok(data));
  } catch (e: any) { return c.json(err(`Failed to cancel subscription: ${e?.message}`), 500); }
});

export default subscriptions;
