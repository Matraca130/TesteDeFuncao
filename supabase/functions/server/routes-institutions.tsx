// ============================================================
// routes-institutions.tsx
// FIX: Removed ${PREFIX} from paths — the prefix is applied
// by app.route(PREFIX, institutions) in index.ts.
// ADDED: GET /institutions/check-slug/:slug
// ADDED: GET /institutions/:instId/dashboard-stats
// Routes:
//   GET  /institutions
//   GET  /institutions/by-slug/:slug
//   GET  /institutions/check-slug/:slug
//   GET  /institutions/:instId/dashboard-stats
//   POST /institutions
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, getUserId, createMembership, uuid } from "./_server-helpers.ts";

const institutions = new Hono();

// ── GET /institutions ───────────────────────────────────
institutions.get("/institutions", async (c) => {
  try {
    const allInsts = await kv.getByPrefix(K.PFX.INST);
    const filtered = allInsts.filter((i: any) => i && typeof i === "object" && i.id);
    return c.json({ success: true, data: filtered });
  } catch (err) {
    console.log(`[Institutions] GET list error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── GET /institutions/by-slug/:slug ─────────────────────
institutions.get("/institutions/by-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    // Try index first
    const instId = await kv.get(K.idxSlugInst(slug));
    if (instId && typeof instId === "string") {
      const institution = await kv.get(K.inst(instId));
      if (institution) return c.json({ success: true, data: institution });
    }

    // Fallback: scan all institutions
    const allInsts = await kv.getByPrefix(K.PFX.INST);
    const institution = allInsts.find((i: any) => i && typeof i === "object" && i.slug === slug);
    if (!institution) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: "Instituicao nao encontrada" } }, 404);
    }

    // Rebuild index for next time
    if ((institution as any).id) {
      try { await kv.set(K.idxSlugInst(slug), (institution as any).id); } catch {}
    }
    return c.json({ success: true, data: institution });
  } catch (err) {
    console.log(`[Institutions] GET by-slug error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── GET /institutions/check-slug/:slug ──────────────────
institutions.get("/institutions/check-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const existing = await kv.get(K.idxSlugInst(slug));
    if (existing) {
      // Suggest alternative
      const suggestion = `${slug}-${Date.now() % 10000}`;
      return c.json({ success: true, data: { available: false, suggestion } });
    }
    return c.json({ success: true, data: { available: true } });
  } catch (err) {
    console.log(`[Institutions] check-slug error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── GET /institutions/:instId/dashboard-stats ───────────
institutions.get("/institutions/:instId/dashboard-stats", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instId = c.req.param("instId");

    // Get institution info
    const institution = await kv.get(K.inst(instId));
    const instName = institution ? (institution as any).name : instId;

    // Count members by role
    const memberUserIds = await kv.getByPrefix(`${K.PFX.IDX_INST_MEMBERS}${instId}:`);
    const membersByRole: Record<string, number> = {};
    let totalMembers = 0;
    let activeStudents = 0;
    let pendingInvites = 0;

    for (const mUserId of memberUserIds) {
      if (typeof mUserId !== "string") continue;
      const membership = await kv.get(K.member(instId, mUserId));
      if (!membership) continue;
      totalMembers++;
      const role = (membership as any).role || 'unknown';
      membersByRole[role] = (membersByRole[role] || 0) + 1;
      if (role === 'student' && (membership as any).status !== 'suspended') activeStudents++;
      if ((membership as any).status === 'invited') pendingInvites++;
    }

    // Count plans for institution
    const planIds = await kv.getByPrefix(`idx:inst-plans:${instId}:`);
    const totalPlans = planIds.filter((id: any) => typeof id === "string").length;

    return c.json({
      success: true,
      data: {
        institutionName: instName,
        hasInstitution: !!institution,
        totalMembers,
        totalPlans,
        activeStudents,
        pendingInvites,
        membersByRole,
      },
    });
  } catch (err) {
    console.log(`[Institutions] dashboard-stats error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── POST /institutions ──────────────────────────────────
institutions.post("/institutions", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, slug, logo_url, plan } = await c.req.json();
    if (!name || !slug) return c.json({ success: false, error: { code: "VALIDATION", message: "name and slug required" } }, 400);

    const existing = await kv.get(K.idxSlugInst(slug));
    if (existing) return c.json({ success: false, error: { code: "CONFLICT", message: "Slug already in use" } }, 409);

    const id = uuid();
    const institution = {
      id, name, slug,
      logo_url: logo_url || null,
      plan: plan || "free",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(K.inst(id), institution);
    await kv.set(K.idxSlugInst(slug), id);
    await createMembership(userId, id, "owner");

    console.log(`[Server] Created institution: ${name} (${slug}), owner=${userId}`);
    return c.json({ success: true, data: institution });
  } catch (err) {
    console.log(`[Institutions] POST error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

export default institutions;
