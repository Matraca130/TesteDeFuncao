// Axon v4.4 — Hono Routes: Student Study Plans + Goals
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

// ── Study Plans ──────────────────────────────────────────────
r.get("/students/:studentId/study-plans", async (c) => {
  try {
    const { studentId } = c.req.param();
    const courseId = c.req.query("course_id");
    let all = await kv.getByPrefix(PFX.studyPlans);
    all = all.filter((p: any) => p.student_id === studentId);
    if (courseId) all = all.filter((p: any) => p.course_id === courseId);
    return c.json(ok(all));
  } catch (e) { console.log("GET study-plans error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/study-plans", async (c) => {
  try {
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const plan = {
      id, student_id: body.student_id || '', course_id: body.course_id || '',
      name: body.name || 'Novo Plano', description: body.description ?? null,
      target_date: body.target_date ?? null, daily_minutes_target: body.daily_minutes_target ?? 30,
      status: body.status || 'active', created_at: now, updated_at: now,
    };
    await kv.set(K.studyPlan(id), plan);
    return c.json(ok(plan), 201);
  } catch (e) { console.log("POST study-plan error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/study-plans/:planId", async (c) => {
  try {
    const { planId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.studyPlan(planId));
    if (!existing) return c.json(err(`StudyPlan ${planId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.studyPlan(planId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT study-plan error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/study-plans/:planId", async (c) => {
  try {
    const { planId } = c.req.param();
    await kv.del(K.studyPlan(planId));
    // Also delete associated goals
    const goals = await kv.getByPrefix(PFX.studyGoals);
    const toDelete = goals.filter((g: any) => g.plan_id === planId).map((g: any) => K.studyGoal(g.id));
    if (toDelete.length > 0) await kv.mdel(toDelete);
    return c.json(ok(null));
  } catch (e) { console.log("DELETE study-plan error:", e); return c.json(err(`${e}`), 500); }
});

// ── Study Goals ──────────────────────────────────────────────
r.get("/study-plans/:planId/goals", async (c) => {
  try {
    const { planId } = c.req.param();
    const all = await kv.getByPrefix(PFX.studyGoals);
    return c.json(ok(all.filter((g: any) => g.plan_id === planId)));
  } catch (e) { console.log("GET study-goals error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/study-plans/:planId/goals", async (c) => {
  try {
    const { planId } = c.req.param();
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const goal = {
      id, plan_id: planId, topic_id: body.topic_id || '',
      topic_name: body.topic_name || '', target_mastery: body.target_mastery ?? 80,
      current_mastery: body.current_mastery ?? 0, status: body.status || 'pending',
      due_date: body.due_date ?? null, created_at: now, updated_at: now,
    };
    await kv.set(K.studyGoal(id), goal);
    return c.json(ok(goal), 201);
  } catch (e) { console.log("POST study-goal error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/study-goals/:goalId", async (c) => {
  try {
    const { goalId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.studyGoal(goalId));
    if (!existing) return c.json(err(`StudyGoal ${goalId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.studyGoal(goalId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT study-goal error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/study-goals/:goalId", async (c) => {
  try {
    const { goalId } = c.req.param();
    await kv.del(K.studyGoal(goalId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE study-goal error:", e); return c.json(err(`${e}`), 500); }
});

export default r;
