// ============================================================
// AXON v4.4 — routes-admin-students.tsx
// Dedicated Student Management for Admin/Owner
//
// Combines SQL data (memberships, profiles, institution_plans)
// with KV data (student stats, sessions, learning profiles)
// to give admins a complete view of their students.
//
// Routes:
//   GET    /admin/students/:institutionId          — list all students
//   GET    /admin/students/:institutionId/search    — search by name/email
//   GET    /admin/students/:institutionId/:userId   — student detail + stats
//   PATCH  /admin/students/:memberId/status         — activate/deactivate
//   PATCH  /admin/students/:memberId/plan           — change student plan
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
} from "./db.ts";
import * as kv from "./kv_store.tsx";
import { K } from "./kv-schema.tsx";

const adminStudents = new Hono();

// ── Helper: verify requester is admin or owner of institution ──
async function verifyAdminOrOwner(
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

  if (memErr) {
    return { allowed: false, error: `DB error: ${memErr.message}` };
  }

  if (!membership) {
    return { allowed: false, error: "Not a member of this institution" };
  }

  if (!["owner", "admin"].includes(membership.role)) {
    return {
      allowed: false,
      error: `Role '${membership.role}' cannot manage students. Requires admin or owner.`,
    };
  }

  return { allowed: true, role: membership.role };
}

// ────────────────────────────────────────────────────────────
// GET /admin/students/:institutionId
// List all students of this institution with profile + plan + KV stats.
// Supports pagination via ?page=1&limit=20
// Supports sorting via ?sort=name|email|created_at&order=asc|desc
// ────────────────────────────────────────────────────────────
adminStudents.get("/admin/students/:institutionId", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);

  try {
    const instId = c.req.param("institutionId");
    const check = await verifyAdminOrOwner(userId, instId);
    if (!check.allowed) return c.json(forbiddenErr(check.error), 403);

    // Pagination
    const page = Math.max(1, parseInt(c.req.query("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
    const offset = (page - 1) * limit;

    // Sorting
    const sortField = c.req.query("sort") || "created_at";
    const sortOrder = c.req.query("order") === "asc" ? true : false;

    // Get total count of students
    const { count, error: countErr } = await db()
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", instId)
      .eq("role", "student");

    if (countErr) throw countErr;

    // Get students with profile and plan joins
    const { data: students, error: fetchErr } = await db()
      .from("memberships")
      .select(
        `id, user_id, institution_id, role, institution_plan_id, is_active, created_at, updated_at,
         profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url),
         plan:institution_plans!memberships_institution_plan_id_fkey(id, name, description, price_cents, billing_cycle, is_default)`
      )
      .eq("institution_id", instId)
      .eq("role", "student")
      .order("created_at", { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    if (fetchErr) throw fetchErr;

    // Enrich with KV stats (batch)
    const enriched = await Promise.all(
      (students || []).map(async (m: any) => {
        // Try to fetch student stats from KV
        let kvStats = null;
        try {
          kvStats = await kv.get(K.studentStats(m.user_id));
        } catch {
          // KV stats might not exist yet
        }

        // Try to fetch learning profile from KV
        let learningProfile = null;
        try {
          learningProfile = await kv.get(K.learningProfile(m.user_id));
        } catch {
          // Learning profile might not exist yet
        }

        return {
          membership_id: m.id,
          user_id: m.user_id,
          institution_id: m.institution_id,
          is_active: m.is_active,
          joined_at: m.created_at,
          updated_at: m.updated_at,
          // Profile
          name: m.profile?.full_name || null,
          email: m.profile?.email || null,
          avatar_url: m.profile?.avatar_url || null,
          // Plan
          plan: m.plan
            ? {
                id: m.plan.id,
                name: m.plan.name,
                is_default: m.plan.is_default,
              }
            : null,
          // KV Stats summary (null if no data yet)
          stats: kvStats
            ? {
                total_study_minutes: kvStats.totalStudyMinutes ?? 0,
                total_sessions: kvStats.totalSessions ?? 0,
                total_cards_reviewed: kvStats.totalCardsReviewed ?? 0,
                total_quizzes_completed: kvStats.totalQuizzesCompleted ?? 0,
                current_streak: kvStats.currentStreak ?? 0,
                last_study_date: kvStats.lastStudyDate ?? null,
              }
            : null,
          // Learning profile summary
          strengths_count: learningProfile?.strengths?.length ?? 0,
          weaknesses_count: learningProfile?.weaknesses?.length ?? 0,
        };
      })
    );

    return c.json(
      ok(enriched, {
        pagination: {
          page,
          limit,
          total: count ?? 0,
          total_pages: Math.ceil((count ?? 0) / limit),
        },
      })
    );
  } catch (e: any) {
    console.log("[AdminStudents] GET list error:", e?.message);
    return c.json(err(`Failed to list students: ${e?.message}`), 500);
  }
});

// ────────────────────────────────────────────────────────────
// GET /admin/students/:institutionId/search?q=maria
// Search students by name or email (case-insensitive)
// ────────────────────────────────────────────────────────────
adminStudents.get("/admin/students/:institutionId/search", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);

  try {
    const instId = c.req.param("institutionId");
    const query = c.req.query("q") || "";

    if (query.length < 2) {
      return c.json(validationErr("Search query must be at least 2 characters"), 400);
    }

    const check = await verifyAdminOrOwner(userId, instId);
    if (!check.allowed) return c.json(forbiddenErr(check.error), 403);

    // Search in memberships joined with profiles
    // We search for students whose profile email or full_name matches
    const { data: memberships, error: memErr } = await db()
      .from("memberships")
      .select(
        `id, user_id, institution_id, role, institution_plan_id, is_active, created_at,
         profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url),
         plan:institution_plans!memberships_institution_plan_id_fkey(id, name, is_default)`
      )
      .eq("institution_id", instId)
      .eq("role", "student");

    if (memErr) throw memErr;

    // Filter by name or email (case-insensitive)
    const lowerQuery = query.toLowerCase();
    const filtered = (memberships || []).filter((m: any) => {
      const name = (m.profile?.full_name || "").toLowerCase();
      const email = (m.profile?.email || "").toLowerCase();
      return name.includes(lowerQuery) || email.includes(lowerQuery);
    });

    const results = filtered.map((m: any) => ({
      membership_id: m.id,
      user_id: m.user_id,
      is_active: m.is_active,
      joined_at: m.created_at,
      name: m.profile?.full_name || null,
      email: m.profile?.email || null,
      avatar_url: m.profile?.avatar_url || null,
      plan: m.plan ? { id: m.plan.id, name: m.plan.name } : null,
    }));

    return c.json(ok(results));
  } catch (e: any) {
    console.log("[AdminStudents] Search error:", e?.message);
    return c.json(err(`Search failed: ${e?.message}`), 500);
  }
});

// ────────────────────────────────────────────────────────────
// GET /admin/students/:institutionId/:userId
// Get full detail of one student: profile, plan, stats,
// recent sessions, course progress, daily activity.
// ────────────────────────────────────────────────────────────
adminStudents.get("/admin/students/:institutionId/:userId", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);

  try {
    const instId = c.req.param("institutionId");
    const targetUserId = c.req.param("userId");

    const check = await verifyAdminOrOwner(requesterId, instId);
    if (!check.allowed) return c.json(forbiddenErr(check.error), 403);

    // Get the student's membership
    const { data: membership, error: memErr } = await db()
      .from("memberships")
      .select(
        `id, user_id, institution_id, role, institution_plan_id, is_active, created_at, updated_at,
         profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url),
         plan:institution_plans!memberships_institution_plan_id_fkey(id, name, description, price_cents, billing_cycle, is_default)`
      )
      .eq("institution_id", instId)
      .eq("user_id", targetUserId)
      .eq("role", "student")
      .maybeSingle();

    if (memErr) throw memErr;
    if (!membership) {
      return c.json(notFoundErr("Student in this institution"), 404);
    }

    // Fetch KV data in parallel
    const [kvStats, courseProgress, dailyActivity, learningProfile] =
      await Promise.all([
        kv.get(K.studentStats(targetUserId)).catch(() => null),
        kv.get(K.courseProgress(targetUserId)).catch(() => null),
        kv.get(K.dailyActivity(targetUserId)).catch(() => null),
        kv.get(K.learningProfile(targetUserId)).catch(() => null),
      ]);

    const detail = {
      // Membership info
      membership_id: (membership as any).id,
      user_id: (membership as any).user_id,
      institution_id: (membership as any).institution_id,
      role: (membership as any).role,
      is_active: (membership as any).is_active,
      joined_at: (membership as any).created_at,
      updated_at: (membership as any).updated_at,

      // Profile
      name: (membership as any).profile?.full_name || null,
      email: (membership as any).profile?.email || null,
      avatar_url: (membership as any).profile?.avatar_url || null,

      // Plan
      plan: (membership as any).plan || null,

      // KV: Study stats
      stats: kvStats || {
        totalStudyMinutes: 0,
        totalSessions: 0,
        totalCardsReviewed: 0,
        totalQuizzesCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageDailyMinutes: 0,
        lastStudyDate: null,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
      },

      // KV: Course progress
      course_progress: courseProgress || [],

      // KV: Daily activity (last 7 entries)
      daily_activity: Array.isArray(dailyActivity)
        ? dailyActivity.slice(-7)
        : [],

      // KV: Learning profile
      learning_profile: learningProfile || null,
    };

    return c.json(ok(detail));
  } catch (e: any) {
    console.log("[AdminStudents] GET detail error:", e?.message);
    return c.json(err(`Failed to get student detail: ${e?.message}`), 500);
  }
});

// ────────────────────────────────────────────────────────────
// PATCH /admin/students/:memberId/status
// Activate or deactivate a student.
// Body: { is_active: boolean }
// ────────────────────────────────────────────────────────────
adminStudents.patch("/admin/students/:memberId/status", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);

  try {
    const memberId = c.req.param("memberId");
    const body = await c.req.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return c.json(validationErr("is_active (boolean) is required"), 400);
    }

    // Get the membership to verify it's a student
    const { data: membership, error: fetchErr } = await db()
      .from("memberships")
      .select("id, user_id, institution_id, role")
      .eq("id", memberId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!membership) return c.json(notFoundErr("Membership"), 404);
    if (membership.role !== "student") {
      return c.json(
        err(
          "This endpoint only manages students. Use /members for other roles.",
          "VALIDATION"
        ),
        400
      );
    }

    // Verify requester is admin/owner
    const check = await verifyAdminOrOwner(
      requesterId,
      membership.institution_id
    );
    if (!check.allowed) return c.json(forbiddenErr(check.error), 403);

    // Update
    const { data: updated, error: updateErr } = await db()
      .from("memberships")
      .update({ is_active })
      .eq("id", memberId)
      .select(
        `*, profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url)`
      )
      .single();

    if (updateErr) throw updateErr;

    console.log(
      `[AdminStudents] Student ${memberId} ${is_active ? "activated" : "deactivated"} by ${requesterId}`
    );
    return c.json(ok(updated));
  } catch (e: any) {
    console.log("[AdminStudents] PATCH status error:", e?.message);
    return c.json(
      err(`Failed to update student status: ${e?.message}`),
      500
    );
  }
});

// ────────────────────────────────────────────────────────────
// PATCH /admin/students/:memberId/plan
// Change a student's institution plan.
// Body: { institution_plan_id: string | null }
// ────────────────────────────────────────────────────────────
adminStudents.patch("/admin/students/:memberId/plan", async (c) => {
  const requesterId = await getAuthUserId(c);
  if (!requesterId) return c.json(unauthorizedErr(), 401);

  try {
    const memberId = c.req.param("memberId");
    const { institution_plan_id } = await c.req.json();

    // Get the membership
    const { data: membership, error: fetchErr } = await db()
      .from("memberships")
      .select("id, user_id, institution_id, role")
      .eq("id", memberId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!membership) return c.json(notFoundErr("Membership"), 404);
    if (membership.role !== "student") {
      return c.json(
        err("This endpoint only manages students", "VALIDATION"),
        400
      );
    }

    // Verify requester
    const check = await verifyAdminOrOwner(
      requesterId,
      membership.institution_id
    );
    if (!check.allowed) return c.json(forbiddenErr(check.error), 403);

    // Validate plan belongs to institution
    if (institution_plan_id) {
      const { data: plan, error: planErr } = await db()
        .from("institution_plans")
        .select("id, institution_id, is_active")
        .eq("id", institution_plan_id)
        .maybeSingle();

      if (planErr) throw planErr;
      if (!plan) return c.json(notFoundErr("Institution plan"), 404);
      if (plan.institution_id !== membership.institution_id) {
        return c.json(
          err("Plan does not belong to this institution", "VALIDATION"),
          400
        );
      }
      if (!plan.is_active) {
        return c.json(
          err("Cannot assign an inactive plan", "VALIDATION"),
          400
        );
      }
    }

    // Update
    const { data: updated, error: updateErr } = await db()
      .from("memberships")
      .update({ institution_plan_id: institution_plan_id || null })
      .eq("id", memberId)
      .select(
        `*,
         profile:profiles!memberships_user_id_fkey(id, email, full_name, avatar_url),
         plan:institution_plans!memberships_institution_plan_id_fkey(id, name, description, price_cents)`
      )
      .single();

    if (updateErr) throw updateErr;

    console.log(
      `[AdminStudents] Plan changed: student=${memberId}, plan=${institution_plan_id || "null"} by ${requesterId}`
    );
    return c.json(ok(updated));
  } catch (e: any) {
    console.log("[AdminStudents] PATCH plan error:", e?.message);
    return c.json(
      err(`Failed to change student plan: ${e?.message}`),
      500
    );
  }
});

export default adminStudents;
