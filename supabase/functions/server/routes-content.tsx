// ============================================================
// routes-content.tsx
// Routes: summaries (GET, POST, PUT status),
//         keywords (GET, POST)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PREFIX, getUserId, uuid } from "./_server-helpers.ts";

const content = new Hono();

// ================================================================
// SUMMARIES
// ================================================================

content.get(`${PREFIX}/summaries`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const all: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const courseIds = await kv.getByPrefix(`${K.PFX.IDX_INST_COURSES}${instId}:`);
      for (const courseId of courseIds) {
        if (typeof courseId !== "string") continue;
        const semIds = await kv.getByPrefix(`${K.PFX.IDX_COURSE_SEMESTERS}${courseId}:`);
        for (const semId of semIds) {
          if (typeof semId !== "string") continue;
          const secIds = await kv.getByPrefix(`${K.PFX.IDX_SEMESTER_SECTIONS}${semId}:`);
          for (const secId of secIds) {
            if (typeof secId !== "string") continue;
            const topicIds = await kv.getByPrefix(`${K.PFX.IDX_SECTION_TOPICS}${secId}:`);
            for (const topicId of topicIds) {
              if (typeof topicId !== "string") continue;
              const sumIds = await kv.getByPrefix(`${K.PFX.IDX_TOPIC_SUMMARIES}${topicId}:`);
              for (const sumId of sumIds) {
                if (typeof sumId !== "string") continue;
                const summary = await kv.get(K.summary(sumId));
                if (summary) all.push(summary);
              }
            }
          }
        }
      }
    }
    return c.json({ success: true, data: all, summaries: all });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

content.post(`${PREFIX}/summaries`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { title, content: bodyContent, topic_id, status } = await c.req.json();
    if (!title || !bodyContent || !topic_id) return c.json({ success: false, error: { code: "VALIDATION", message: "title, content, topic_id required" } }, 400);
    const id = uuid();
    const summary = {
      id, title, content: bodyContent, content_markdown: bodyContent,
      topic_id, status: status || "draft", author_id: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await kv.set(K.summary(id), summary);
    await kv.set(K.idxTopicSummaries(topic_id, id), id);
    return c.json({ success: true, data: summary, summary });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

content.put(`${PREFIX}/summaries/:id/status`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const summary: any = await kv.get(K.summary(id));
    if (!summary) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Summary not found" } }, 404);
    const updated = { ...summary, status, updated_at: new Date().toISOString() };
    await kv.set(K.summary(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ================================================================
// KEYWORDS
// ================================================================

content.get(`${PREFIX}/keywords`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const all: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const kwIds = await kv.getByPrefix(`${K.PFX.IDX_INST_KW}${instId}:`);
      for (const kwId of kwIds) {
        if (typeof kwId !== "string") continue;
        const keyword = await kv.get(K.kw(kwId));
        if (keyword) all.push(keyword);
      }
    }
    return c.json({ success: true, data: all, keywords: all });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

content.post(`${PREFIX}/keywords`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { term, definition, topic_id, institution_id } = await c.req.json();
    if (!term) return c.json({ success: false, error: { code: "VALIDATION", message: "term is required" } }, 400);
    const id = uuid();
    const keyword = {
      id, term, definition: definition || "",
      topic_id: topic_id || null, institution_id: institution_id || null,
      priority: 3,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await kv.set(K.kw(id), keyword);
    if (institution_id) await kv.set(K.idxInstKw(institution_id, id), id);
    return c.json({ success: true, data: keyword, keyword });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

export default content;
