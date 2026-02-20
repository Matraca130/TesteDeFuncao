// ============================================================
// AXON v4.4 — routes-members-v2.tsx
// SQL-based Membership Management (replaces KV version)
// Uses: memberships, profiles, institution_plans tables
//
// Routes:
//   GET    /members/:institutionId             — list members (with profile + plan)
//   POST   /members                           — create membership (invite or direct)
//   PATCH  /members/:memberId/role            — change member's role
//   PATCH  /members/:memberId/plan            — change member's institution plan NEW
//   PATCH  /members/:memberId/toggle-active   — activate/deactivate member
//   DELETE /members/:memberId                 — hard delete membership
// ============================================================
import { Hono } from "npm:hono";
import { db, ok, err, notFoundErr, validationErr, unauthorizedErr, forbiddenErr, getAuthUserId, getAuthUser, ensureProfile } from "./db.ts";

const members = new Hono();

members.get("/members/:institutionId", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);
  try {
    const instId = c.req.param("institutionId");
    const { data: requesterMembership } = await db().from("memberships").select("role").eq("user_id", userId).eq("institution_id", instId).eq("is_active", true).maybeSingle();
    if (!requesterMembership) return c.json(forbiddenErr("Not a member of this institution"), 403);
    const { data, error } = await db().from("memberships").select(`id, user_id, institution_id, role, institution_plan_id, is_active, created_at, updated_at, profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url), plan:institution_plans!memberships_institution_plan_id_fkey(id, name, description, price_cents, billing_cycle, is_default)`).eq("institution_id", instId).order("created_at", { ascending: true });
    if (error) throw error;
    const enriched = (data || []).map((m: any) => ({ id: m.id, user_id: m.user_id, institution_id: m.institution_id, role: m.role, institution_plan_id: m.institution_plan_id, is_active: m.is_active, created_at: m.created_at, updated_at: m.updated_at, name: m.profile?.full_name || null, email: m.profile?.email || null, avatar_url: m.profile?.avatar_url || null, plan: m.plan || null }));
    return c.json(ok(enriched));
  } catch (e: any) {
    console.log("[Members] GET error:", e?.message);
    return c.json(err(`Failed to list members: ${e?.message}`), 500);
  }
});

members.post("/members", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);
  try {
    const body = await c.req.json();
    const { user_id, institution_id, role, email, name, institution_plan_id } = body;
    if (!institution_id) return c.json(validationErr("institution_id is required"), 400);
    if (!role || !["owner", "admin", "professor", "student"].includes(role)) return c.json(validationErr("Valid role is required (owner, admin, professor, student)"), 400);
    const { data: requesterMembership } = await db().from("memberships").select("role").eq("user_id", requesterId).eq("institution_id", institution_id).eq("is_active", true).maybeSingle();
    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) return c.json(forbiddenErr("Only owner or admin can add members"), 403);
    let targetUserId = user_id;
    if (!targetUserId && email) {
      const { data: existingProfile } = await db().from("profiles").select("id").eq("email", email).maybeSingle();
      if (existingProfile) { targetUserId = existingProfile.id; }
      else {
        const { data: newUser, error: authErr } = await db().auth.admin.createUser({ email, password: crypto.randomUUID(), user_metadata: { name: name || email.split("@")[0] }, email_confirm: true });
        if (authErr) { console.log(`[Members] Failed to create user ${email}: ${authErr.message}`); return c.json(err(`Failed to create user: ${authErr.message}`), 400); }
        targetUserId = newUser.user!.id;
        await ensureProfile({ id: targetUserId, email, name: name || email.split("@")[0], avatar_url: null });
      }
    }
    if (!targetUserId) return c.json(validationErr("Either user_id or email is required"), 400);
    const { data: existingMembership } = await db().from("memberships").select("id, is_active").eq("user_id", targetUserId).eq("institution_id", institution_id).maybeSingle();
    if (existingMembership) {
      if (existingMembership.is_active) return c.json(err("User is already a member of this institution", "CONFLICT"), 409);
      const { data: reactivated, error: reactErr } = await db().from("memberships").update({ role, is_active: true, institution_plan_id: institution_plan_id || null }).eq("id", existingMembership.id).select().single();
      if (reactErr) throw reactErr;
      console.log(`[Members] Reactivated membership: ${existingMembership.id}`);
      return c.json(ok(reactivated));
    }
    const { data: membership, error: memErr } = await db().from("memberships").insert({ user_id: targetUserId, institution_id, role, institution_plan_id: institution_plan_id || null }).select().single();
    if (memErr) throw memErr;
    console.log(`[Members] Created: user=${targetUserId}, inst=${institution_id}, role=${role}`);
    return c.json(ok(membership), 201);
  } catch (e: any) {
    console.log("[Members] POST error:", e?.message);
    return c.json(err(`Failed to create member: ${e?.message}`), 500);
  }
});

members.patch("/members/:memberId/role", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);
  try {
    const memberId = c.req.param("memberId");
    const { role } = await c.req.json();
    if (!role || !["owner", "admin", "professor", "student"].includes(role)) return c.json(validationErr("Valid role is required"), 400);
    const { data: membership, error: fetchErr } = await db().from("memberships").select("id, user_id, institution_id, role").eq("id", memberId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!membership) return c.json(notFoundErr("Membership"), 404);
    const { data: requesterMembership } = await db().from("memberships").select("role").eq("user_id", requesterId).eq("institution_id", membership.institution_id).eq("is_active", true).maybeSingle();
    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) return c.json(forbiddenErr("Only owner or admin can change roles"), 403);
    if (membership.user_id === requesterId) return c.json(err("Cannot change your own role", "FORBIDDEN"), 403);
    if (role === "owner" && requesterMembership.role !== "owner") return c.json(forbiddenErr("Only owner can assign owner role"), 403);
    const { data: updated, error: updateErr } = await db().from("memberships").update({ role }).eq("id", memberId).select().single();
    if (updateErr) throw updateErr;
    console.log(`[Members] Role changed: ${memberId} -> ${role}`);
    return c.json(ok(updated));
  } catch (e: any) {
    console.log("[Members] PATCH role error:", e?.message);
    return c.json(err(`Failed to change role: ${e?.message}`), 500);
  }
});

// PATCH /members/:memberId/plan — Change a student's institution plan
members.patch("/members/:memberId/plan", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);
  try {
    const memberId = c.req.param("memberId");
    const { institution_plan_id } = await c.req.json();
    const { data: membership, error: fetchErr } = await db().from("memberships").select("id, user_id, institution_id, role").eq("id", memberId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!membership) return c.json(notFoundErr("Membership"), 404);
    const { data: requesterMembership } = await db().from("memberships").select("role").eq("user_id", requesterId).eq("institution_id", membership.institution_id).eq("is_active", true).maybeSingle();
    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) return c.json(forbiddenErr("Only owner or admin can change student plans"), 403);
    if (institution_plan_id) {
      const { data: plan, error: planErr } = await db().from("institution_plans").select("id, institution_id, is_active").eq("id", institution_plan_id).maybeSingle();
      if (planErr) throw planErr;
      if (!plan) return c.json(notFoundErr("Institution plan"), 404);
      if (plan.institution_id !== membership.institution_id) return c.json(err("Plan does not belong to this institution", "VALIDATION"), 400);
      if (!plan.is_active) return c.json(err("Cannot assign an inactive plan", "VALIDATION"), 400);
    }
    const { data: updated, error: updateErr } = await db().from("memberships").update({ institution_plan_id: institution_plan_id || null }).eq("id", memberId).select(`*, plan:institution_plans!memberships_institution_plan_id_fkey(id, name, description, price_cents)`).single();
    if (updateErr) throw updateErr;
    console.log(`[Members] Plan changed: member=${memberId}, plan=${institution_plan_id || "null"}`);
    return c.json(ok(updated));
  } catch (e: any) {
    console.log("[Members] PATCH plan error:", e?.message);
    return c.json(err(`Failed to change plan: ${e?.message}`), 500);
  }
});

members.patch("/members/:memberId/toggle-active", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);
  try {
    const memberId = c.req.param("memberId");
    const body = await c.req.json().catch(() => ({}));
    const is_active = body.is_active;
    if (typeof is_active !== "boolean") return c.json(validationErr("is_active (boolean) is required"), 400);
    const { data: membership, error: fetchErr } = await db().from("memberships").select("id, user_id, institution_id").eq("id", memberId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!membership) return c.json(notFoundErr("Membership"), 404);
    const { data: requesterMembership } = await db().from("memberships").select("role").eq("user_id", requesterId).eq("institution_id", membership.institution_id).eq("is_active", true).maybeSingle();
    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) return c.json(forbiddenErr("Only owner or admin can toggle member status"), 403);
    if (membership.user_id === requesterId && !is_active) return c.json(err("Cannot deactivate yourself", "FORBIDDEN"), 403);
    const { data: updated, error: updateErr } = await db().from("memberships").update({ is_active }).eq("id", memberId).select().single();
    if (updateErr) throw updateErr;
    console.log(`[Members] ${is_active ? "Activated" : "Deactivated"}: ${memberId}`);
    return c.json(ok(updated));
  } catch (e: any) {
    console.log("[Members] PATCH toggle-active error:", e?.message);
    return c.json(err(`Failed to toggle member status: ${e?.message}`), 500);
  }
});

members.delete("/members/:memberId", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);
  try {
    const memberId = c.req.param("memberId");
    const { data: membership, error: fetchErr } = await db().from("memberships").select("id, user_id, institution_id, role").eq("id", memberId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!membership) return c.json(notFoundErr("Membership"), 404);
    const { data: requesterMembership } = await db().from("memberships").select("role").eq("user_id", requesterId).eq("institution_id", membership.institution_id).eq("is_active", true).maybeSingle();
    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) return c.json(forbiddenErr("Only owner or admin can remove members"), 403);
    if (membership.role === "owner") return c.json(err("Cannot remove the institution owner", "FORBIDDEN"), 403);
    if (membership.user_id === requesterId) return c.json(err("Cannot remove yourself", "FORBIDDEN"), 403);
    const { error: delErr } = await db().from("memberships").delete().eq("id", memberId);
    if (delErr) throw delErr;
    console.log(`[Members] Removed: ${memberId} from inst ${membership.institution_id}`);
    return c.json(ok({ id: memberId, deleted: true }));
  } catch (e: any) {
    console.log("[Members] DELETE error:", e?.message);
    return c.json(err(`Failed to remove member: ${e?.message}`), 500);
  }
});

export default members;
