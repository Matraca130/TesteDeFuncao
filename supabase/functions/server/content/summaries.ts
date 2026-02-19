// ============================================================
// Axon v4.4 — Content Routes: Summaries + Chunks
// ============================================================
// T1.6: content -> content_markdown
//
// POST   /summaries
// GET    /summaries        ?topic_id=xxx
// GET    /summaries/:id
// PUT    /summaries/:id
// DELETE /summaries/:id    (cascade: chunks + keyword links)
// GET    /summaries/:id/chunks
// POST   /summaries/:id/chunk
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  summaryKey,
  chunkKey,
  idxTopicSummaries,
  idxSummaryChunks,
  idxSummaryKw,
  idxKwSummaries,
  KV_PREFIXES,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  getChildren,
} from "./_helpers.ts";

const router = new Hono();

router.post("/summaries", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.topic_id || !body.institution_id || !body.title)
      return validationError(c, "Missing topic_id, institution_id or title");

    const id = crypto.randomUUID();
    const summary = {
      id,
      topic_id: body.topic_id,
      institution_id: body.institution_id,
      title: body.title,
      content_markdown: body.content_markdown ?? body.content ?? "",
      status: body.status || "draft",
      source: body.source || "manual",
      created_at: new Date().toISOString(),
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };
    await kv.mset(
      [summaryKey(id), idxTopicSummaries(body.topic_id, id)],
      [summary, id]
    );
    console.log(`[Content] POST /summaries: created '${body.title}' (${id})`);
    return c.json({ success: true, data: summary }, 201);
  } catch (err) {
    return serverError(c, "POST /summaries", err);
  }
});

router.get("/summaries", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const topicId = c.req.query("topic_id");
    if (!topicId)
      return validationError(c, "topic_id query param required");
    const summaries = await getChildren(
      KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":",
      summaryKey
    );
    return c.json({ success: true, data: summaries });
  } catch (err) {
    return serverError(c, "GET /summaries", err);
  }
});

router.get("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summary = await kv.get(summaryKey(c.req.param("id")));
    if (!summary) return notFound(c, "Summary");
    return c.json({ success: true, data: summary });
  } catch (err) {
    return serverError(c, "GET /summaries/:id", err);
  }
});

router.put("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(summaryKey(id));
    if (!existing) return notFound(c, "Summary");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      topic_id: existing.topic_id, // prevent parent change
      updated_at: new Date().toISOString(),
    };
    await kv.set(summaryKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /summaries/:id", err);
  }
});

// DELETE with cascade: chunks + keyword links
router.delete("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const summary = await kv.get(summaryKey(id));
    if (!summary) return notFound(c, "Summary");

    const keysToDelete: string[] = [
      summaryKey(id),
      idxTopicSummaries(summary.topic_id, id),
    ];

    // Chunks
    const chunkIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SUMMARY_CHUNKS + id + ":"
    );
    for (const cId of chunkIds) {
      keysToDelete.push(chunkKey(cId));
    }

    // Keyword links (both directions)
    const kwIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SUMMARY_KW + id + ":"
    );
    for (const kwId of kwIds) {
      keysToDelete.push(idxSummaryKw(id, kwId), idxKwSummaries(kwId, id));
    }

    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /summaries/:id", err);
  }
});

// ── Chunks ──────────────────────────────────────────────────

// GET /summaries/:id/chunks
router.get("/summaries/:id/chunks", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summaryId = c.req.param("id");
    const chunks = await getChildren(
      KV_PREFIXES.IDX_SUMMARY_CHUNKS + summaryId + ":",
      chunkKey
    );
    return c.json({ success: true, data: chunks });
  } catch (err) {
    return serverError(c, "GET /summaries/:id/chunks", err);
  }
});

// POST /summaries/:id/chunk
router.post("/summaries/:id/chunk", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summaryId = c.req.param("id");
    const body = await c.req.json();
    if (!body.content) return validationError(c, "Missing content");

    const id = crypto.randomUUID();
    const chunk = {
      id,
      summary_id: summaryId,
      content: body.content,
      sort_order: body.sort_order ?? 0,
      created_at: new Date().toISOString(),
    };
    await kv.mset(
      [chunkKey(id), idxSummaryChunks(summaryId, id)],
      [chunk, id]
    );
    return c.json({ success: true, data: chunk }, 201);
  } catch (err) {
    return serverError(c, "POST /summaries/:id/chunk", err);
  }
});

export default router;
