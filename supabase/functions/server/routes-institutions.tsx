// ============================================================
// routes-institutions.tsx
// Routes: GET /institutions, GET /institutions/by-slug/:slug,
//         POST /institutions
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PREFIX, getUserId, createMembership, uuid } from "./_server-helpers.ts";

const institutions = new Hono();

// ── GET /institutions ───────────────────────────────────
institutions.get(`${PREFIX}/institutions`, async (c) => {
  try {
    const allInsts = await kv.getByPrefix(K.PFX.INST);
    const filtered = allInsts.filter((i: any) => i && typeof i === "object" && i.id);
    return c.json({ success: true, data: filtered });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── GET /institutions/by-slug/:slug ─────────────────────
institutions.get(`${PREFIX}/institutions/by-slug/:slug`, async (c) => {
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
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── POST /institutions ──────────────────────────────────
institutions.post(`${PREFIX}/institutions`, async (c) => {
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
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

export default institutions;
