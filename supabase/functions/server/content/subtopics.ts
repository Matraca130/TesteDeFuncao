// ============================================================
// Axon v4.4 — Content Routes: SubTopics
// ============================================================
// D24: evaluable unit with BKT+FSRS
//
// POST   /subtopics
// GET    /subtopics        ?keyword_id=xxx
// GET    /subtopics/:id
// PUT    /subtopics/:id
// DELETE /subtopics/:id
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  subtopicKey,
  idxKwSubtopics,
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

router.post("/subtopics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.keyword_id || !body.title)
      return validationError(c, "Missing keyword_id or title");

    const id = crypto.randomUUID();
    const subtopic = {
      id,
      keyword_id: body.keyword_id,
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? null,
      status: body.status || "draft",
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [subtopicKey(id), idxKwSubtopics(body.keyword_id, id)],
      [subtopic, id]
    );
    return c.json({ success: true, data: subtopic }, 201);
  } catch (err) {
    return serverError(c, "POST /subtopics", err);
  }
});

router.get("/subtopics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.query("keyword_id");
    if (!kwId)
      return validationError(c, "keyword_id query param required");
    const subtopics = await getChildren(
      KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":",
      subtopicKey
    );
    return c.json({ success: true, data: subtopics });
  } catch (err) {
    return serverError(c, "GET /subtopics", err);
  }
});

router.get("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const st = await kv.get(subtopicKey(c.req.param("id")));
    if (!st) return notFound(c, "SubTopic");
    return c.json({ success: true, data: st });
  } catch (err) {
    return serverError(c, "GET /subtopics/:id", err);
  }
});

router.put("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(subtopicKey(id));
    if (!existing) return notFound(c, "SubTopic");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(subtopicKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /subtopics/:id", err);
  }
});

router.delete("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const st = await kv.get(subtopicKey(id));
    if (!st) return notFound(c, "SubTopic");
    await kv.mdel([
      subtopicKey(id),
      idxKwSubtopics(st.keyword_id, id),
    ]);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /subtopics/:id", err);
  }
});

export default router;
