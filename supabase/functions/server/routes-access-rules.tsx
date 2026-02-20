// ============================================================
// AXON v4.4 — routes-access-rules.tsx (NEW)
// Plan Access Rules CRUD + access checking
// ============================================================
import { Hono } from "npm:hono";
import { db, ok, err, notFoundErr, validationErr, unauthorizedErr, forbiddenErr, getAuthUserId } from "./db.ts";

const accessRules = new Hono();
const VALID_SCOPE_TYPES = ["course", "semester", "section", "topic", "summary"];

async function getPlanInstitution(planId: string): Promise<string | null> {
  const { data } = await db().from("institution_plans").select("institution_id").eq("id", planId).maybeSingle();
  return data?.institution_id || null;
}
async function requireInstAdmin(userId: string, institutionId: string): Promise<boolean> {
  const { data } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", institutionId).eq("is_active", true).maybeSingle();
  return !!data && ["owner", "admin"].includes(data.role);
}

accessRules.get("/institution-plans/:planId/access-rules", async (c) => {
  try {
    const { data, error } = await db().from("plan_access_rules").select("*").eq("plan_id", c.req.param("planId")).order("scope_type", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return c.json(ok(data || []));
  } catch (e: any) { return c.json(err(`Failed to list access rules: ${e?.message}`), 500); }
});

accessRules.post("/plan-access-rules", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const body = await c.req.json();
    const { plan_id } = body;
    if (!plan_id) return c.json(validationErr("plan_id is required"), 400);
    const institutionId = await getPlanInstitution(plan_id);
    if (!institutionId) return c.json(notFoundErr("Institution plan"), 404);
    if (!(await requireInstAdmin(userId, institutionId))) return c.json(forbiddenErr("Only owner or admin can manage access rules"), 403);
    const rules = body.rules || [{ scope_type: body.scope_type, scope_id: body.scope_id }];
    for (const rule of rules) {
      if (!rule.scope_type || !VALID_SCOPE_TYPES.includes(rule.scope_type)) return c.json(validationErr(`scope_type must be one of: ${VALID_SCOPE_TYPES.join(", ")}`), 400);
      if (!rule.scope_id) return c.json(validationErr("scope_id is required"), 400);
    }
    const rows = rules.map((r: any) => ({ plan_id, scope_type: r.scope_type, scope_id: r.scope_id }));
    const { data, error } = await db().from("plan_access_rules").upsert(rows, { onConflict: "plan_id,scope_type,scope_id", ignoreDuplicates: true }).select();
    if (error) throw error;
    console.log(`[AccessRules] Added ${data.length} rules for plan ${plan_id}`);
    return c.json(ok(data), 201);
  } catch (e: any) { return c.json(err(`Failed to create access rules: ${e?.message}`), 500); }
});

accessRules.delete("/plan-access-rules/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const id = c.req.param("id");
    const { data: rule, error: fetchErr } = await db().from("plan_access_rules").select("id, plan_id").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!rule) return c.json(notFoundErr("Access rule"), 404);
    const institutionId = await getPlanInstitution(rule.plan_id);
    if (!institutionId) return c.json(notFoundErr("Institution plan"), 404);
    if (!(await requireInstAdmin(userId, institutionId))) return c.json(forbiddenErr("Only owner or admin can manage access rules"), 403);
    const { error: delErr } = await db().from("plan_access_rules").delete().eq("id", id);
    if (delErr) throw delErr;
    return c.json(ok({ id, deleted: true }));
  } catch (e: any) { return c.json(err(`Failed to delete access rule: ${e?.message}`), 500); }
});

accessRules.put("/institution-plans/:planId/access-rules", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const planId = c.req.param("planId");
    const { rules } = await c.req.json();
    if (!Array.isArray(rules)) return c.json(validationErr("rules must be an array"), 400);
    const institutionId = await getPlanInstitution(planId);
    if (!institutionId) return c.json(notFoundErr("Institution plan"), 404);
    if (!(await requireInstAdmin(userId, institutionId))) return c.json(forbiddenErr("Only owner or admin can manage access rules"), 403);
    for (const rule of rules) {
      if (!rule.scope_type || !VALID_SCOPE_TYPES.includes(rule.scope_type)) return c.json(validationErr(`Invalid scope_type: ${rule.scope_type}`), 400);
      if (!rule.scope_id) return c.json(validationErr("scope_id is required for each rule"), 400);
    }
    await db().from("plan_access_rules").delete().eq("plan_id", planId);
    if (rules.length > 0) {
      const rows = rules.map((r: any) => ({ plan_id: planId, scope_type: r.scope_type, scope_id: r.scope_id }));
      const { data, error } = await db().from("plan_access_rules").insert(rows).select();
      if (error) throw error;
      console.log(`[AccessRules] Bulk replaced ${data.length} rules for plan ${planId}`);
      return c.json(ok(data));
    }
    return c.json(ok([]));
  } catch (e: any) { return c.json(err(`Failed to bulk replace access rules: ${e?.message}`), 500); }
});

// Utility: check if a user has access to a specific scope
accessRules.get("/check-access/:userId/:scopeType/:scopeId", async (c) => {
  try {
    const targetUserId = c.req.param("userId");
    const scopeType = c.req.param("scopeType");
    const scopeId = c.req.param("scopeId");
    const institutionId = c.req.query("institution_id");
    if (!institutionId) return c.json(validationErr("institution_id query param required"), 400);
    const { data: membership, error: memErr } = await db().from("memberships").select("id, role, institution_plan_id, is_active").eq("user_id", targetUserId).eq("institution_id", institutionId).maybeSingle();
    if (memErr) throw memErr;
    if (!membership || !membership.is_active) return c.json(ok({ has_access: false, reason: "Not an active member" }));
    if (["owner", "admin", "professor"].includes(membership.role)) return c.json(ok({ has_access: true, reason: "Role grants full access" }));
    if (!membership.institution_plan_id) return c.json(ok({ has_access: false, reason: "No plan assigned" }));
    const { data: rules, error: ruleErr } = await db().from("plan_access_rules").select("scope_type, scope_id").eq("plan_id", membership.institution_plan_id);
    if (ruleErr) throw ruleErr;
    const directMatch = (rules || []).some((r: any) => r.scope_type === scopeType && r.scope_id === scopeId);
    if (directMatch) return c.json(ok({ has_access: true, reason: "Direct scope match" }));
    return c.json(ok({ has_access: false, reason: "No matching access rule", plan_id: membership.institution_plan_id }));
  } catch (e: any) { return c.json(err(`Failed to check access: ${e?.message}`), 500); }
});

export default accessRules;
