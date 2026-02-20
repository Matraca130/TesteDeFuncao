// ============================================================
// AXON v4.4 — routes-institutions-v2.tsx
// SQL-based Institution CRUD (replaces KV version)
// Uses: institutions, memberships, profiles, institution_plans tables
//
// Routes:
//   GET    /institutions                         — list all
//   GET    /institutions/by-slug/:slug           — get by slug
//   GET    /institutions/check-slug/:slug        — check slug availability
//   GET    /institutions/:instId                 — get by id
//   GET    /institutions/:instId/dashboard-stats — dashboard stats
//   POST   /institutions                         — create + owner membership
//   PUT    /institutions/:instId                 — update
//   DELETE /institutions/:instId                 — soft-delete (is_active=false)
// ============================================================
import { Hono } from "npm:hono";
import { db, ok, err, notFoundErr, validationErr, unauthorizedErr, getAuthUserId, getAuthUser, ensureProfile } from "./db.ts";

const institutions = new Hono();

// ── GET /institutions ───────────────────────────────────
institutions.get("/institutions", async (c) => {
  try {
    const { data, error } = await db()
      .from("institutions")
      .select("*, owner:profiles!institutions_owner_id_fkey(id, email, full_name, avatar_url)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return c.json(ok(data || []));
  } catch (e: any) {
    console.log("[Institutions] GET list error:", e?.message);
    return c.json(err(`Failed to list institutions: ${e?.message}`), 500);
  }
});

// ── GET /institutions/by-slug/:slug ─────────────────────
institutions.get("/institutions/by-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    const { data, error } = await db()
      .from("institutions")
      .select("*, owner:profiles!institutions_owner_id_fkey(id, email, full_name, avatar_url)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return c.json(notFoundErr("Institution"), 404);

    return c.json(ok(data));
  } catch (e: any) {
    console.log("[Institutions] GET by-slug error:", e?.message);
    return c.json(err(`Failed to get institution: ${e?.message}`), 500);
  }
});

// ── GET /institutions/check-slug/:slug ──────────────────
institutions.get("/institutions/check-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    const { data, error } = await db()
      .from("institutions")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const suggestion = `${slug}-${Date.now() % 10000}`;
      return c.json(ok({ available: false, suggestion }));
    }
    return c.json(ok({ available: true }));
  } catch (e: any) {
    console.log("[Institutions] check-slug error:", e?.message);
    return c.json(err(`Failed to check slug: ${e?.message}`), 500);
  }
});

// ── GET /institutions/:instId ───────────────────────────
institutions.get("/institutions/:instId", async (c) => {
  try {
    const instId = c.req.param("instId");

    const { data, error } = await db()
      .from("institutions")
      .select("*, owner:profiles!institutions_owner_id_fkey(id, email, full_name, avatar_url)")
      .eq("id", instId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return c.json(notFoundErr("Institution"), 404);

    return c.json(ok(data));
  } catch (e: any) {
    console.log("[Institutions] GET by-id error:", e?.message);
    return c.json(err(`Failed to get institution: ${e?.message}`), 500);
  }
});

// ── GET /institutions/:instId/dashboard-stats ───────────
institutions.get("/institutions/:instId/dashboard-stats", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);

  try {
    const instId = c.req.param("instId");

    const { data: institution, error: instErr } = await db()
      .from("institutions")
      .select("id, name")
      .eq("id", instId)
      .maybeSingle();

    if (instErr) throw instErr;

    const { data: members, error: memErr } = await db()
      .from("memberships")
      .select("id, role, is_active")
      .eq("institution_id", instId);

    if (memErr) throw memErr;

    const membersByRole: Record<string, number> = {};
    let totalMembers = 0;
    let activeStudents = 0;
    let inactiveMembers = 0;

    for (const m of members || []) {
      totalMembers++;
      membersByRole[m.role] = (membersByRole[m.role] || 0) + 1;
      if (m.role === "student" && m.is_active) activeStudents++;
      if (!m.is_active) inactiveMembers++;
    }

    const { count: totalPlans, error: planErr } = await db()
      .from("institution_plans")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", instId)
      .eq("is_active", true);

    if (planErr) throw planErr;

    const { data: subscription, error: subErr } = await db()
      .from("institution_subscriptions")
      .select("id, status, plan:platform_plans(name, slug)")
      .eq("institution_id", instId)
      .eq("status", "active")
      .maybeSingle();

    if (subErr) throw subErr;

    return c.json(ok({
      institutionName: institution?.name || instId,
      hasInstitution: !!institution,
      totalMembers,
      totalPlans: totalPlans || 0,
      activeStudents,
      inactiveMembers,
      membersByRole,
      subscription: subscription || null,
    }));
  } catch (e: any) {
    console.log("[Institutions] dashboard-stats error:", e?.message);
    return c.json(err(`Failed to get dashboard stats: ${e?.message}`), 500);
  }
});

// ── POST /institutions ──────────────────────────────────
institutions.post("/institutions", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json(unauthorizedErr(), 401);

  try {
    const { name, slug, logo_url, settings } = await c.req.json();

    if (!name || !slug) {
      return c.json(validationErr("name and slug are required"), 400);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return c.json(validationErr("Slug must be lowercase alphanumeric with hyphens"), 400);
    }

    const { data: existing } = await db()
      .from("institutions")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return c.json(err("Slug already in use", "CONFLICT"), 409);
    }

    await ensureProfile(user);

    const { data: institution, error: instErr } = await db()
      .from("institutions")
      .insert({
        name,
        slug,
        logo_url: logo_url || null,
        owner_id: user.id,
        settings: settings || {},
      })
      .select()
      .single();

    if (instErr) throw instErr;

    const { data: membership, error: memErr } = await db()
      .from("memberships")
      .insert({
        user_id: user.id,
        institution_id: institution.id,
        role: "owner",
      })
      .select()
      .single();

    if (memErr) throw memErr;

    console.log(`[Institutions] Created: ${name} (${slug}), owner=${user.id}`);
    return c.json(ok({ ...institution, membership }), 201);
  } catch (e: any) {
    console.log("[Institutions] POST error:", e?.message);
    return c.json(err(`Failed to create institution: ${e?.message}`), 500);
  }
});

// ── PUT /institutions/:instId ───────────────────────────
institutions.put("/institutions/:instId", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);

  try {
    const instId = c.req.param("instId");

    const { data: membership } = await db()
      .from("memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("institution_id", instId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return c.json(err("Only owner or admin can update the institution", "FORBIDDEN"), 403);
    }

    const body = await c.req.json();
    const allowedFields = ["name", "logo_url", "settings"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (body.slug && typeof body.slug === "string") {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
        return c.json(validationErr("Slug must be lowercase alphanumeric with hyphens"), 400);
      }
      const { data: conflict } = await db()
        .from("institutions")
        .select("id")
        .eq("slug", body.slug)
        .neq("id", instId)
        .maybeSingle();
      if (conflict) return c.json(err("Slug already in use", "CONFLICT"), 409);
      updates.slug = body.slug;
    }

    if (Object.keys(updates).length === 0) {
      return c.json(validationErr("No valid fields to update"), 400);
    }

    const { data, error } = await db()
      .from("institutions")
      .update(updates)
      .eq("id", instId)
      .select()
      .single();

    if (error) throw error;
    console.log(`[Institutions] Updated: ${instId}`);
    return c.json(ok(data));
  } catch (e: any) {
    console.log("[Institutions] PUT error:", e?.message);
    return c.json(err(`Failed to update institution: ${e?.message}`), 500);
  }
});

// ── DELETE /institutions/:instId (soft-delete) ──────────
institutions.delete("/institutions/:instId", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json(unauthorizedErr(), 401);

  try {
    const instId = c.req.param("instId");

    const { data: membership } = await db()
      .from("memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("institution_id", instId)
      .maybeSingle();

    if (!membership || membership.role !== "owner") {
      return c.json(err("Only the owner can delete an institution", "FORBIDDEN"), 403);
    }

    const { data, error } = await db()
      .from("institutions")
      .update({ is_active: false })
      .eq("id", instId)
      .select("id, is_active")
      .single();

    if (error) throw error;
    console.log(`[Institutions] Soft-deleted: ${instId}`);
    return c.json(ok(data));
  } catch (e: any) {
    console.log("[Institutions] DELETE error:", e?.message);
    return c.json(err(`Failed to delete institution: ${e?.message}`), 500);
  }
});

export default institutions;
