// ============================================================
// Axon v4.4 — Content Routes: Topics
// ============================================================
// T1.6: title -> name, sort_order -> order_index
//
// POST   /topics
// GET    /topics           ?section_id=xxx
// GET    /topics/:id
// PUT    /topics/:id
// DELETE /topics/:id       (cascade: summaries > chunks)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  topicKey,
  summaryKey,
  chunkKey,
  idxSectionTopics,
  idxTopicSummaries,
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

router.post("/topics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!(body.name || body.title) || !body.section_id)
      return validationError(c, "Missing name or section_id");

    const id = crypto.randomUUID();
    const topic = {
      id,
      section_id: body.section_id,
      name: body.name || body.title,
      description: body.description ?? null,
      order_index: body.order_index ?? body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [topicKey(id), idxSectionTopics(body.section_id, id)],
      [topic, id]
    );
    console.log(`[Content] POST /topics: created '${topic.name}' (${id})`);
    return c.json({ success: true, data: topic }, 201);
  } catch (err) {
    return serverError(c, "POST /topics", err);
  }
});

router.get("/topics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const secId = c.req.query("section_id");
    if (!secId)
      return validationError(c, "section_id query param required");
    const topics = await getChildren(
      KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
      topicKey
    );
    return c.json({ success: true, data: topics });
  } catch (err) {
    return serverError(c, "GET /topics", err);
  }
});

router.get("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const topic = await kv.get(topicKey(c.req.param("id")));
    if (!topic) return notFound(c, "Topic");
    return c.json({ success: true, data: topic });
  } catch (err) {
    return serverError(c, "GET /topics/:id", err);
  }
});

router.put("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(topicKey(id));
    if (!existing) return notFound(c, "Topic");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(topicKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /topics/:id", err);
  }
});

// DELETE with cascade: summaries > chunks
router.delete("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const topic = await kv.get(topicKey(id));
    if (!topic) return notFound(c, "Topic");

    const summaryIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_TOPIC_SUMMARIES + id + ":"
    );
    const keysToDelete: string[] = [
      topicKey(id),
      idxSectionTopics(topic.section_id, id),
    ];

    for (const sId of summaryIds) {
      keysToDelete.push(summaryKey(sId), idxTopicSummaries(id, sId));
      const chunkIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_SUMMARY_CHUNKS + sId + ":"
      );
      for (const cId of chunkIds) {
        keysToDelete.push(chunkKey(cId));
      }
    }

    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /topics/:id", err);
  }
});

export default router;
