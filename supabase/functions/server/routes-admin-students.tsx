// ============================================================
// AXON v4.4 — routes-admin-students.tsx
// Admin Student Management (owner + admin)
//
// Combines SQL membership data with KV student learning data
// to give admins a complete view of their institution's students.
//
// Routes:
//   GET    /admin/students                    — list all students (profiles + plans + basic stats)
//   GET    /admin/students/stats              — institution-wide student statistics
//   GET    /admin/students/:userId/detail     — full student detail (profile + KV learning data)
//   PATCH  /admin/students/:userId/plan       — change student's institution plan
//   PATCH  /admin/students/:userId/status     — toggle active/inactive
//   POST   /admin/students/invite             — invite new student by email
//
// Auth: requireRole("owner", "admin") — inline checks
// ============================================================
import { Hono } from "npm:hono";
import {
  db,
  ok,
  err,
  notFoundErr,
  validationErr,
  unauthorizedErr,
  forbiddenErr,
  getAuthUserId,
  ensureProfile,
} from "./db.ts";
import * as kv from "./kv_store.tsx";
import { statsKey, dailyKey, learningProfileKey } from "./kv-keys.ts";

const adminStudents = new Hono();

// ── Helper: verify requester is owner or admin of institution ──
async function verifyAdminAccess(
  userId: string,
  institutionId: string
): Promise<{ allowed: boolean; role?: string; error?: string }> {
  const { data: membership, error: memErr } = await db()
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("institution_id", institutionId)
    .eq("is_active", true)
    .maybeSingle();

  if (memErr) return { allowed: false, error: `DB error: ${memErr.message}` };
  if (!membership) return { allowed: false, error: "Not a member of this institution" };
  if (!["owner", "admin"].includes(membership.role)) {
    return { allowed: false, error: "Only owner or admin can manage students" };
  }
  return { allowed: true, role: membership.role };
}

// ════════════════════════════════════════════════════════════
// GET /admin/students?institution_id=X
// List all students with profiles, plans, and basic stats.
// Supports: ?search=, ?plan_id=, ?is_active=, ?sort_by=, ?order=
// ════════════════════════════════════════════════════════════
adminStudents.get("/admin/students", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);

  try {
    const institutionId = c.req.query("institution_id") || c.req.header("X-Institution-Id");
    if (!institutionId) return c.json(validationErr("institution_id is required (query or header)"), 400);

    const access = await verifyAdminAccess(userId, institutionId);
    if (!access.allowed) return c.json(forbiddenErr(access.error), 403);

    // Build query — only students
    let query = db()
      .from("memberships")
      .select(`
        id,
        user_id,
        institution_id,
        role,
        institution_plan_id,
        is_active,
        created_at,
        updated_at,
        profile:profiles!memberships_user_id_fkey(
          id, email, full_name, avatar_url
        ),
        plan:institution_plans!memberships_institution_plan_id_fkey(
          id, name, description, price_cents, billing_cycle, is_default
        )
      `)
      .eq("institution_id", institutionId)
      .eq("role", "student");

    // Filters
    const isActive = c.req.query("is_active");
    if (isActive !== undefined && isActive !== "") {
      query = query.eq("is_active", isActive === "true");
    }

    const planId = c.req.query("plan_id");
    if (planId) {
      query = query.eq("institution_plan_id", planId);
    }

    // Sorting
    const sortBy = c.req.query("sort_by") || "created_at";
    const order = c.req.query("order") || "desc";
    const validSorts = ["created_at", "updated_at"];
    if (validSorts.includes(sortBy)) {
      query = query.order(sortBy, { ascending: order === "asc" });
    }

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with profile info and search filter
    const search = c.req.query("search")?.toLowerCase();
    let students = (data || []).map((m: any) => ({
      membership_id: m.id,
      user_id: m.user_id,
      institution_id: m.institution_id,
      role: m.role,
      is_active: m.is_active,
      created_at: m.created_at,
      updated_at: m.updated_at,
      // Profile
      name: m.profile?.full_name || null,
      email: m.profile?.email || null,
      avatar_url: m.profile?.avatar_url || null,
      // Plan
      plan: m.plan || null,
      institution_plan_id: m.institution_plan_id,
    }));

    // Client-side search (name or email)
    if (search) {
      students = students.filter(
        (s: any) =>
          (s.name && s.name.toLowerCase().includes(search)) ||
          (s.email && s.email.toLowerCase().includes(search))
      );
    }

    return c.json(ok(students, { total: students.length }));
  } catch (e: any) {
    console.log("[AdminStudents] GET /admin/students error:", e?.message);
    return c.json(err(`Failed to list students: ${e?.message}`), 500);
  }
});

// ════════════════════════════════════════════════════════════
// GET /admin/students/stats?institution_id=X
// Institution-wide student statistics for the admin dashboard.
// ════════════════════════════════════════════════════════════
adminStudents.get("/admin/students/stats", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);

  try {
    const institutionId = c.req.query("institution_id") || c.req.header("X-Institution-Id");
    if (!institutionId) return c.json(validationErr("institution_id is required"), 400);

    const access = await verifyAdminAccess(userId, institutionId);
    if (!access.allowed) return c.json(forbiddenErr(access.error), 403);

    // Count students by status
    const { data: allStudents, error: countErr } = await db()
      .from("memberships")
      .select("id, is_active, institution_plan_id, created_at")
      .eq("institution_id", institutionId)
      .eq("role", "student");

    if (countErr) throw countErr;

    const students = allStudents || [];
    const totalStudents = students.length;
    const activeStudents = students.filter((s: any) => s.is_active).length;
    const inactiveStudents = totalStudents - activeStudents;

    // Students with plans vs without
    const withPlan = students.filter((s: any) => s.institution_plan_id).length;
    const withoutPlan = totalStudents - withPlan;

    // New students this month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const newThisMonth = students.filter(
      (s: any) => s.created_at >= firstOfMonth
    ).length;

    // New students this week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const newThisWeek = students.filter(
      (s: any) => s.created_at >= startOfWeek.toISOString()
    ).length;

    // Count by plan
    const { data: plans } = await db()
      .from("institution_plans")
      .select("id, name")
      .eq("institution_id", institutionId);

    const byPlan = (plans || []).map((plan: any) => ({
      plan_id: plan.id,
      plan_name: plan.name,
      count: students.filter((s: any) => s.institution_plan_id === plan.id).length,
    }));

    return c.json(
      ok({
        total_students: totalStudents,
        active_students: activeStudents,
        inactive_students: inactiveStudents,
        with_plan: withPlan,
        without_plan: withoutPlan,
        new_this_month: newThisMonth,
        new_this_week: newThisWeek,
        by_plan: byPlan,
      })
    );
  } catch (e: any) {
    console.log("[AdminStudents] GET /admin/students/stats error:", e?.message);
    return c.json(err(`Failed to get student stats: ${e?.message}`), 500);
  }
});

// ════════════════════════════════════════════════════════════
// GET /admin/students/:userId/detail?institution_id=X
// Full student detail: SQL profile + KV learning data.
// ════════════════════════════════════════════════════════════
adminStudents.get("/admin/students/:userId/detail", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);

  try {
    const targetUserId = c.req.param("userId");
    const institutionId = c.req.query("institution_id") || c.req.header("X-Institution-Id");
    if (!institutionId) return c.json(validationErr("institution_id is required"), 400);

    const access = await verifyAdminAccess(requesterId, institutionId);
    if (!access.allowed) return c.json(forbiddenErr(access.error), 403);

    // Get student's membership + profile
    const { data: membership, error: memErr } = await db()
      .from("memberships")
      .select(`
        id,
        user_id,
        institution_id,
        role,
        institution_plan_id,
        is_active,
        created_at,
        updated_at,
        profile:profiles!memberships_user_id_fkey(
          id, email, full_name, avatar_url
        ),
        plan:institution_plans!memberships_institution_plan_id_fkey(
          id, name, description, price_cents, billing_cycle, is_default
        )
      `)
      .eq("user_id", targetUserId)
      .eq("institution_id", institutionId)
      .eq("role", "student")
      .maybeSingle();

    if (memErr) throw memErr;
    if (!membership) return c.json(notFoundErr("Student membership in this institution"), 404);

    // Fetch KV learning data (best-effort — may not exist)
    let kvStats = null;
    let kvLearningProfile = null;
    let kvDailyActivity = null;

    try {
      const today = new Date().toISOString().split("T")[0];
      const [stats, profile, daily] = await Promise.all([
        kv.get(statsKey(targetUserId)).catch(() => null),
        kv.get(learningProfileKey(targetUserId)).catch(() => null),
        kv.get(dailyKey(targetUserId, today)).catch(() => null),
      ]);
      kvStats = stats;
      kvLearningProfile = profile;
      kvDailyActivity = daily;
    } catch (kvErr) {
      console.log(`[AdminStudents] KV fetch for ${targetUserId} failed (non-fatal):`, kvErr);
    }

    // Get student's admin scopes (if any — shouldn't for students, but safe)
    const studentDetail = {
      // Membership info
      membership_id: membership.id,
      user_id: membership.user_id,
      institution_id: membership.institution_id,
      role: membership.role,
      is_active: membership.is_active,
      joined_at: membership.created_at,
      updated_at: membership.updated_at,

      // Profile
      name: (membership as any).profile?.full_name || null,
      email: (membership as any).profile?.email || null,
      avatar_url: (membership as any).profile?.avatar_url || null,

      // Plan
      plan: (membership as any).plan || null,
      institution_plan_id: membership.institution_plan_id,

      // KV Learning Data
      stats: kvStats,
      learning_profile: kvLearningProfile,
      today_activity: kvDailyActivity,
    };

    return c.json(ok(studentDetail));
  } catch (e: any) {
    console.log("[AdminStudents] GET detail error:", e?.message);
    return c.json(err(`Failed to get student detail: ${e?.message}`), 500);
  }
});

// ════════════════════════════════════════════════════════════
// PATCH /admin/students/:userId/plan
// Change a student's institution plan.
// Body: { institution_id, institution_plan_id }
// ════════════════════════════════════════════════════════════
adminStudents.patch("/admin/students/:userId/plan", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);

  try {
    const targetUserId = c.req.param("userId");
    const { institution_id, institution_plan_id } = await c.req.json();
    if (!institution_id) return c.json(validationErr("institution_id is required"), 400);

    const access = await verifyAdminAccess(requesterId, institution_id);
    if (!access.allowed) return c.json(forbiddenErr(access.error), 403);

    // Find student membership
    const { data: membership, error: memErr } = await db()
      .from("memberships")
      .select("id, role")
      .eq("user_id", targetUserId)
      .eq("institution_id", institution_id)
      .maybeSingle();

    if (memErr) throw memErr;
    if (!membership) return c.json(notFoundErr("Student membership"), 404);
    if (membership.role !== "student") {
      return c.json(err("Can only change plans for students", "VALIDATION"), 400);
    }

    // Validate plan if provided
    if (institution_plan_id) {
      const { data: plan, error: planErr } = await db()
        .from("institution_plans")
        .select("id, institution_id, is_active")
        .eq("id", institution_plan_id)
        .maybeSingle();

      if (planErr) throw planErr;
      if (!plan) return c.json(notFoundErr("Institution plan"), 404);
      if (plan.institution_id !== institution_id) {
        return c.json(err("Plan does not belong to this institution", "VALIDATION"), 400);
      }
      if (!plan.is_active) {
        return c.json(err("Cannot assign an inactive plan", "VALIDATION"), 400);
      }
    }

    // Update
    const { data: updated, error: updateErr } = await db()
      .from("memberships")
      .update({ institution_plan_id: institution_plan_id || null })
      .eq("id", membership.id)
      .select(`
        *,
        profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url),
        plan:institution_plans!memberships_institution_plan_id_fkey(id, name, price_cents)
      `)
      .single();

    if (updateErr) throw updateErr;

    console.log(`[AdminStudents] Plan changed: user=${targetUserId}, plan=${institution_plan_id || "none"}`);
    return c.json(ok(updated));
  } catch (e: any) {
    console.log("[AdminStudents] PATCH plan error:", e?.message);
    return c.json(err(`Failed to change student plan: ${e?.message}`), 500);
  }
});

// ════════════════════════════════════════════════════════════
// PATCH /admin/students/:userId/status
// Toggle student active/inactive.
// Body: { institution_id, is_active: boolean }
// ════════════════════════════════════════════════════════════
adminStudents.patch("/admin/students/:userId/status", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);

  try {
    const targetUserId = c.req.param("userId");
    const { institution_id, is_active } = await c.req.json();

    if (!institution_id) return c.json(validationErr("institution_id is required"), 400);
    if (typeof is_active !== "boolean") return c.json(validationErr("is_active (boolean) is required"), 400);

    const access = await verifyAdminAccess(requesterId, institution_id);
    if (!access.allowed) return c.json(forbiddenErr(access.error), 403);

    // Find student membership
    const { data: membership, error: memErr } = await db()
      .from("memberships")
      .select("id, role")
      .eq("user_id", targetUserId)
      .eq("institution_id", institution_id)
      .maybeSingle();

    if (memErr) throw memErr;
    if (!membership) return c.json(notFoundErr("Student membership"), 404);
    if (membership.role !== "student") {
      return c.json(err("Can only toggle status for students", "VALIDATION"), 400);
    }

    const { data: updated, error: updateErr } = await db()
      .from("memberships")
      .update({ is_active })
      .eq("id", membership.id)
      .select(`
        *,
        profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url)
      `)
      .single();

    if (updateErr) throw updateErr;

    console.log(`[AdminStudents] Status: user=${targetUserId}, active=${is_active}`);
    return c.json(ok(updated));
  } catch (e: any) {
    console.log("[AdminStudents] PATCH status error:", e?.message);
    return c.json(err(`Failed to toggle student status: ${e?.message}`), 500);
  }
});

// ════════════════════════════════════════════════════════════
// POST /admin/students/invite
// Invite a new student by email. Creates user + membership.
// Body: { institution_id, email, name?, institution_plan_id? }
// ════════════════════════════════════════════════════════════
adminStudents.post("/admin/students/invite", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);

  try {
    const { institution_id, email, name, institution_plan_id } = await c.req.json();

    if (!institution_id) return c.json(validationErr("institution_id is required"), 400);
    if (!email) return c.json(validationErr("email is required"), 400);

    const access = await verifyAdminAccess(requesterId, institution_id);
    if (!access.allowed) return c.json(forbiddenErr(access.error), 403);

    // Validate plan if provided
    if (institution_plan_id) {
      const { data: plan } = await db()
        .from("institution_plans")
        .select("id, institution_id, is_active")
        .eq("id", institution_plan_id)
        .maybeSingle();

      if (!plan) return c.json(notFoundErr("Institution plan"), 404);
      if (plan.institution_id !== institution_id) {
        return c.json(err("Plan does not belong to this institution", "VALIDATION"), 400);
      }
      if (!plan.is_active) {
        return c.json(err("Cannot assign an inactive plan", "VALIDATION"), 400);
      }
    }

    // Check for existing user
    let targetUserId: string | null = null;
    const { data: existingProfile } = await db()
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      targetUserId = existingProfile.id;
    } else {
      // Create new user via Supabase Auth
      const generatedPassword = crypto.randomUUID();
      const { data: newUser, error: authErr } = await db().auth.admin.createUser({
        email,
        password: generatedPassword,
        user_metadata: { name: name || email.split("@")[0] },
        email_confirm: true,
      });

      if (authErr) {
        console.log(`[AdminStudents] Failed to create user ${email}: ${authErr.message}`);
        return c.json(err(`Failed to create user: ${authErr.message}`), 400);
      }

      targetUserId = newUser.user!.id;
      await ensureProfile({
        id: targetUserId,
        email,
        name: name || email.split("@")[0],
        avatar_url: null,
      });
    }

    // Check for existing membership
    const { data: existingMembership } = await db()
      .from("memberships")
      .select("id, is_active, role")
      .eq("user_id", targetUserId)
      .eq("institution_id", institution_id)
      .maybeSingle();

    if (existingMembership) {
      if (existingMembership.is_active) {
        return c.json(err("This user is already a member of this institution", "CONFLICT"), 409);
      }

      // Reactivate as student
      const { data: reactivated, error: reactErr } = await db()
        .from("memberships")
        .update({
          role: "student",
          is_active: true,
          institution_plan_id: institution_plan_id || null,
        })
        .eq("id", existingMembership.id)
        .select(`
          *,
          profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url),
          plan:institution_plans!memberships_institution_plan_id_fkey(id, name)
        `)
        .single();

      if (reactErr) throw reactErr;

      console.log(`[AdminStudents] Reactivated student: ${email} in inst ${institution_id}`);
      return c.json(ok(reactivated));
    }

    // Create new membership
    const { data: membership, error: memErr } = await db()
      .from("memberships")
      .insert({
        user_id: targetUserId,
        institution_id,
        role: "student",
        institution_plan_id: institution_plan_id || null,
      })
      .select(`
        *,
        profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url),
        plan:institution_plans!memberships_institution_plan_id_fkey(id, name)
      `)
      .single();

    if (memErr) throw memErr;

    console.log(`[AdminStudents] Invited student: ${email} to inst ${institution_id}`);
    return c.json(ok(membership), 201);
  } catch (e: any) {
    console.log("[AdminStudents] POST invite error:", e?.message);
    return c.json(err(`Failed to invite student: ${e?.message}`), 500);
  }
});

export default adminStudents;
