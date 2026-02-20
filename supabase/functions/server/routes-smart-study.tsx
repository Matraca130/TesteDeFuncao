// Axon v4.4 — Hono Routes: Smart Study Recommendations (BKT/FSRS stubbed)
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

r.get("/students/:studentId/smart-recommendations", async (c) => {
  try {
    const { studentId } = c.req.param();
    const limit = parseInt(c.req.query("limit") || "10");
    const all = await kv.getByPrefix(PFX.smartRecs);
    const filtered = all
      .filter((r: any) => r.student_id === studentId && r.status === 'pending')
      .sort((a: any, b: any) => a.priority - b.priority)
      .slice(0, limit);
    return c.json(ok(filtered));
  } catch (e) { console.log("GET smart-recommendations error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/smart-recommendations/:recId/dismiss", async (c) => {
  try {
    const { recId } = c.req.param();
    const existing = await kv.get(K.smartRec(recId));
    if (!existing) return c.json(err(`Recommendation ${recId} not found`), 404);
    const updated = { ...existing, status: 'dismissed' };
    await kv.set(K.smartRec(recId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH dismiss recommendation error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/smart-recommendations/:recId/complete", async (c) => {
  try {
    const { recId } = c.req.param();
    const existing = await kv.get(K.smartRec(recId));
    if (!existing) return c.json(err(`Recommendation ${recId} not found`), 404);
    const updated = { ...existing, status: 'completed' };
    await kv.set(K.smartRec(recId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH complete recommendation error:", e); return c.json(err(`${e}`), 500); }
});

export default r;
