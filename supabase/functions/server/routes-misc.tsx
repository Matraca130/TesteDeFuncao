// Axon v4.4 — Hono Routes: Plans, Media (Videos), Admin Scopes, Quiz
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

// ══════════════════════════════════════════════════════════
// Plans
// ══════════════════════════════════════════════════════════
r.get("/institutions/:instId/plans", async (c) => {
  try {
    const { instId } = c.req.param();
    const all = await kv.getByPrefix(PFX.plans);
    return c.json(ok(all.filter((p: any) => p.institution_id === instId)));
  } catch (e) { console.log("GET plans error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/institutions/:instId/plans", async (c) => {
  try {
    const { instId } = c.req.param();
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const plan = {
      id, institution_id: instId, name: body.name || "Novo Plano",
      description: body.description, price: body.price ?? 0,
      currency: body.currency || "BRL", is_default: body.is_default ?? false,
      is_trial: body.is_trial ?? false, trial_duration_days: body.trial_duration_days,
      max_students: body.max_students, features: body.features || [],
      created_at: now, updated_at: now,
    };
    await kv.set(K.plan(id), plan);
    return c.json(ok(plan), 201);
  } catch (e) { console.log("POST plan error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/institutions/:instId/plans/:planId", async (c) => {
  try {
    const { planId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.plan(planId));
    if (!existing) return c.json(err(`Plan ${planId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.plan(planId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT plan error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/institutions/:instId/plans/:planId", async (c) => {
  try {
    const { planId } = c.req.param();
    await kv.del(K.plan(planId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE plan error:", e); return c.json(err(`${e}`), 500); }
});

// ── Plan Rules ───────────────────────────────────────────
r.get("/plans/:planId/rules", async (c) => {
  try {
    const { planId } = c.req.param();
    const all = await kv.getByPrefix(PFX.planRules);
    return c.json(ok(all.filter((r: any) => r.plan_id === planId)));
  } catch (e) { console.log("GET plan-rules error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/plans/:planId/rules", async (c) => {
  try {
    const { planId } = c.req.param();
    const body = await c.req.json();
    const id = uid();
    const rule = {
      id, plan_id: planId, resource_type: body.resource_type || "course",
      resource_id: body.resource_id || "", permission: body.permission || "read",
      created_at: ts(),
    };
    await kv.set(K.planRule(id), rule);
    return c.json(ok(rule), 201);
  } catch (e) { console.log("POST plan-rule error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Videos (Media)
// ══════════════════════════════════════════════════════════
r.get("/summaries/:summaryId/videos", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const all = await kv.getByPrefix(PFX.videos);
    return c.json(ok(all.filter((v: any) => v.summary_id === summaryId)));
  } catch (e) { console.log("GET videos error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/summaries/:summaryId/videos", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const video = {
      id, summary_id: summaryId, title: body.title || "Novo Video",
      url: body.url || "", duration_ms: body.duration_ms,
      thumbnail_url: body.thumbnail_url || null,
      order_index: body.order_index ?? 0, created_at: now, updated_at: now,
      created_by: body.created_by || "demo-user",
    };
    await kv.set(K.video(id), video);
    return c.json(ok(video), 201);
  } catch (e) { console.log("POST video error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/summaries/:summaryId/videos/:videoId", async (c) => {
  try {
    const { videoId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.video(videoId));
    if (!existing) return c.json(err(`Video ${videoId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.video(videoId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT video error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/summaries/:summaryId/videos/:videoId", async (c) => {
  try {
    const { videoId } = c.req.param();
    await kv.del(K.video(videoId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE video error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Admin Scopes
// ══════════════════════════════════════════════════════════
r.get("/institutions/:instId/scopes", async (c) => {
  try {
    const { instId } = c.req.param();
    const all = await kv.getByPrefix(PFX.adminScopes);
    return c.json(ok(all.filter((s: any) => s.institution_id === instId)));
  } catch (e) { console.log("GET admin-scopes error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/institutions/:instId/scopes", async (c) => {
  try {
    const { instId } = c.req.param();
    const body = await c.req.json();
    const id = uid();
    const scope = {
      id, institution_id: instId, user_id: body.user_id || "",
      scope_type: body.scope_type || "course", scope_id: body.scope_id,
      role: body.role || "professor", created_at: ts(),
    };
    await kv.set(K.adminScope(id), scope);
    return c.json(ok(scope), 201);
  } catch (e) { console.log("POST admin-scope error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Quiz
// ══════════════════════════════════════════════════════════
r.get("/quiz-attempts", async (c) => {
  try {
    const studentId = c.req.query("student_id") || "";
    const keywordId = c.req.query("keyword_id");
    const quizType = c.req.query("quiz_type");
    let all = await kv.getByPrefix(PFX.quizAttempts);
    all = all.filter((a: any) => a.student_id === studentId);
    if (keywordId) all = all.filter((a: any) => a.keyword_id === keywordId);
    if (quizType) all = all.filter((a: any) => a.quiz_type === quizType);
    return c.json(ok(all));
  } catch (e) { console.log("GET quiz-attempts error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/quiz-sessions/complete", async (c) => {
  try {
    const body = await c.req.json();
    const attemptIds: string[] = body.attempt_ids || [];
    const attempts: any[] = [];
    for (const aid of attemptIds) {
      const a = await kv.get(K.quizAttempt(aid));
      if (a) attempts.push(a);
    }
    const totalScore = attempts.reduce((s: number, a: any) => s + (a.score || 0), 0);
    const totalQuestions = attempts.reduce((s: number, a: any) => s + (a.total_questions || 0), 0);
    return c.json(ok({
      session_id: body.session_id, attempts,
      summary: { total_score: totalScore, total_questions: totalQuestions, average_score: attempts.length > 0 ? totalScore / attempts.length : 0 },
    }));
  } catch (e) { console.log("POST quiz-complete error:", e); return c.json(err(`${e}`), 500); }
});

export default r;
