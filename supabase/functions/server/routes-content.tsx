// Axon v4.4 — Hono Routes: Content Hierarchy (courses→semesters→sections→topics→summaries→keywords)
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

// ── Aggregate Fetch ──────────────────────────────────────
r.get("/content/hierarchy", async (c) => {
  try {
    const [courses, semesters, sections, topics, summaries, keywords] = await Promise.all([
      kv.getByPrefix(PFX.courses), kv.getByPrefix(PFX.semesters),
      kv.getByPrefix(PFX.sections), kv.getByPrefix(PFX.topics),
      kv.getByPrefix(PFX.summaries), kv.getByPrefix(PFX.keywords),
    ]);
    return c.json(ok({ courses, semesters, sections, topics, summaries, keywords }));
  } catch (e) { console.log("GET hierarchy error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Courses
// ══════════════════════════════════════════════════════════
r.get("/courses", async (c) => {
  try {
    const instId = c.req.query("institution_id");
    let all = await kv.getByPrefix(PFX.courses);
    if (instId) all = all.filter((x: any) => x.institution_id === instId);
    return c.json(ok(all));
  } catch (e) { console.log("GET courses error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/courses", async (c) => {
  try {
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const course = {
      id, institution_id: body.institution_id || "inst-001",
      name: body.name || "Novo Curso", description: body.description ?? null,
      color: body.color || "#14b8a6", sort_order: body.sort_order ?? 0,
      created_at: now, updated_at: now, created_by: body.created_by || "demo-user",
    };
    await kv.set(K.course(id), course);
    return c.json(ok(course), 201);
  } catch (e) { console.log("POST course error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/courses/:courseId", async (c) => {
  try {
    const { courseId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.course(courseId));
    if (!existing) return c.json(err(`Course ${courseId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.course(courseId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT course error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/courses/:courseId", async (c) => {
  try {
    const { courseId } = c.req.param();
    await kv.del(K.course(courseId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE course error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Semesters
// ══════════════════════════════════════════════════════════
r.get("/courses/:courseId/semesters", async (c) => {
  try {
    const { courseId } = c.req.param();
    const all = await kv.getByPrefix(PFX.semesters);
    return c.json(ok(all.filter((s: any) => s.course_id === courseId)));
  } catch (e) { console.log("GET semesters error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/courses/:courseId/semesters", async (c) => {
  try {
    const { courseId } = c.req.param();
    const body = await c.req.json();
    const id = uid();
    const semester = {
      id, course_id: courseId, name: body.name || "Novo Semestre",
      order_index: body.order_index ?? 0,
    };
    await kv.set(K.semester(id), semester);
    return c.json(ok(semester), 201);
  } catch (e) { console.log("POST semester error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/semesters/:semesterId", async (c) => {
  try {
    const { semesterId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.semester(semesterId));
    if (!existing) return c.json(err(`Semester ${semesterId} not found`), 404);
    const updated = { ...existing, ...body };
    await kv.set(K.semester(semesterId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT semester error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/semesters/:semesterId", async (c) => {
  try {
    const { semesterId } = c.req.param();
    await kv.del(K.semester(semesterId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE semester error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Sections
// ══════════════════════════════════════════════════════════
r.get("/semesters/:semesterId/sections", async (c) => {
  try {
    const { semesterId } = c.req.param();
    const all = await kv.getByPrefix(PFX.sections);
    return c.json(ok(all.filter((s: any) => s.semester_id === semesterId)));
  } catch (e) { console.log("GET sections error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/semesters/:semesterId/sections", async (c) => {
  try {
    const { semesterId } = c.req.param();
    const body = await c.req.json();
    const id = uid();
    const section = {
      id, semester_id: semesterId, name: body.name || "Nova Secao",
      image_url: body.image_url ?? null, order_index: body.order_index ?? 0,
    };
    await kv.set(K.section(id), section);
    return c.json(ok(section), 201);
  } catch (e) { console.log("POST section error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/sections/:sectionId", async (c) => {
  try {
    const { sectionId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.section(sectionId));
    if (!existing) return c.json(err(`Section ${sectionId} not found`), 404);
    const updated = { ...existing, ...body };
    await kv.set(K.section(sectionId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT section error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/sections/:sectionId", async (c) => {
  try {
    const { sectionId } = c.req.param();
    await kv.del(K.section(sectionId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE section error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Topics
// ══════════════════════════════════════════════════════════
r.get("/sections/:sectionId/topics", async (c) => {
  try {
    const { sectionId } = c.req.param();
    const all = await kv.getByPrefix(PFX.topics);
    return c.json(ok(all.filter((t: any) => t.section_id === sectionId)));
  } catch (e) { console.log("GET topics error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/sections/:sectionId/topics", async (c) => {
  try {
    const { sectionId } = c.req.param();
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const topic = {
      id, section_id: sectionId, name: body.name || "Novo Topico",
      order_index: body.order_index ?? 0, created_at: now,
    };
    await kv.set(K.topic(id), topic);
    return c.json(ok(topic), 201);
  } catch (e) { console.log("POST topic error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/topics/:topicId", async (c) => {
  try {
    const { topicId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.topic(topicId));
    if (!existing) return c.json(err(`Topic ${topicId} not found`), 404);
    const updated = { ...existing, ...body };
    await kv.set(K.topic(topicId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT topic error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/topics/:topicId", async (c) => {
  try {
    const { topicId } = c.req.param();
    await kv.del(K.topic(topicId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE topic error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Summaries (content summaries, not study summaries)
// ══════════════════════════════════════════════════════════
r.get("/topics/:topicId/summaries", async (c) => {
  try {
    const { topicId } = c.req.param();
    const all = await kv.getByPrefix(PFX.summaries);
    return c.json(ok(all.filter((s: any) => s.topic_id === topicId)));
  } catch (e) { console.log("GET summaries error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/topics/:topicId/summaries", async (c) => {
  try {
    const { topicId } = c.req.param();
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const summary = {
      id, topic_id: topicId, course_id: body.course_id || "",
      institution_id: body.institution_id, title: body.title ?? null,
      content_markdown: body.content_markdown || "",
      status: body.status || "draft", created_by: body.created_by || "demo-user",
      created_at: now, updated_at: now, version: 1,
    };
    await kv.set(K.summary(id), summary);
    return c.json(ok(summary), 201);
  } catch (e) { console.log("POST summary error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/summaries/:summaryId", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.summary(summaryId));
    if (!existing) return c.json(err(`Summary ${summaryId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts(), version: (existing.version || 0) + 1 };
    await kv.set(K.summary(summaryId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT summary error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/summaries/:summaryId", async (c) => {
  try {
    const { summaryId } = c.req.param();
    await kv.del(K.summary(summaryId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE summary error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// Keywords
// ══════════════════════════════════════════════════════════
r.get("/keywords", async (c) => {
  try {
    const instId = c.req.query("institution_id");
    let all = await kv.getByPrefix(PFX.keywords);
    if (instId) all = all.filter((k: any) => k.institution_id === instId);
    return c.json(ok(all));
  } catch (e) { console.log("GET keywords error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/keywords", async (c) => {
  try {
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const keyword = {
      id, institution_id: body.institution_id || "inst-001",
      term: body.term || "Nova Keyword", definition: body.definition ?? null,
      priority: body.priority ?? 1, status: body.status || "draft",
      source: body.source || "manual", created_by: body.created_by || "demo-user",
      created_at: now, updated_at: now,
    };
    await kv.set(K.keyword(id), keyword);
    return c.json(ok(keyword), 201);
  } catch (e) { console.log("POST keyword error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/keywords/:keywordId", async (c) => {
  try {
    const { keywordId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.keyword(keywordId));
    if (!existing) return c.json(err(`Keyword ${keywordId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.keyword(keywordId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT keyword error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/keywords/:keywordId", async (c) => {
  try {
    const { keywordId } = c.req.param();
    await kv.del(K.keyword(keywordId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE keyword error:", e); return c.json(err(`${e}`), 500); }
});

export default r;
