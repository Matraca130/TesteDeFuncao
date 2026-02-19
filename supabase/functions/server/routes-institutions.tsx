// ============================================================
// Axon v4.4 — Institutions Routes (Dev 6 — Integration)
// Provides public endpoints for institution lookup.
// GET /institutions/:id — fetch institution by ID
// GET /institutions/by-slug/:slug — fetch institution by slug
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { instKey, idxSlugInst, KV_PREFIXES } from "./kv-keys.ts";

const institutions = new Hono();

// ── GET /institutions/:id ────────────────────────────────────
institutions.get("/institutions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const inst = await kv.get(instKey(id));
    if (!inst) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: `Institution not found: ${id}` } },
        404
      );
    }
    console.log(`[Institutions] GET /${id}: ${(inst as any).name}`);
    return c.json({ success: true, data: inst });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[Institutions] GET /:id error: ${msg}`);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: msg } }, 500);
  }
});

// ── GET /institutions/by-slug/:slug ──────────────────────────
institutions.get("/institutions/by-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    // Strategy 1: Use slug→instId index (fast, O(1))
    const instId = await kv.get(idxSlugInst(slug));
    if (instId && typeof instId === "string") {
      const inst = await kv.get(instKey(instId));
      if (inst) {
        console.log(`[Institutions] by-slug (index hit): found '${(inst as any).name}' for slug '${slug}'`);
        return c.json({ success: true, data: inst });
      }
    }

    // Strategy 2: Fallback — scan all institutions by prefix
    const allInsts = await kv.getByPrefix(KV_PREFIXES.INST);
    const inst = allInsts.find((i: any) => i?.slug === slug);
    if (!inst) {
      console.log(`[Institutions] by-slug: not found for slug '${slug}'`);
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: `Institution not found for slug: ${slug}` } },
        404
      );
    }

    // Cache the slug→id mapping for future lookups
    if ((inst as any).id) {
      try {
        await kv.set(idxSlugInst(slug), (inst as any).id);
      } catch (_) { /* non-critical */ }
    }

    console.log(`[Institutions] by-slug (scan): found '${(inst as any).name}' for slug '${slug}'`);
    return c.json({ success: true, data: inst });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[Institutions] by-slug error: ${msg}`);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: msg } }, 500);
  }
});

export default institutions;
