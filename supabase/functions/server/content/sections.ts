// ============================================================
// Axon v4.4 — Content Routes: Sections
// ============================================================
// T1.6: title -> name, sort_order -> order_index
//
// POST   /sections
// GET    /sections         ?semester_id=xxx
// GET    /sections/:id
// PUT    /sections/:id
// DELETE /sections/:id     (cascade: topics)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  sectionKey,
  topicKey,
  idxSemesterSections,
  idxSectionTopics,
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

router.post("/sections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!(body.name || body.title) || !body.semester_id)
      return validationError(c, "Missing name or semester_id");

    const id = crypto.randomUUID();
    const section = {
      id,
      semester_id: body.semester_id,
      name: body.name || body.title,
      region: body.region ?? null,
      image_url: body.image_url ?? null,
      order_index: body.order_index ?? body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [sectionKey(id), idxSemesterSections(body.semester_id, id)],
      [section, id]
    );
    console.log(`[Content] POST /sections: created '${section.name}' (${id})`);
    return c.json({ success: true, data: section }, 201);
  } catch (err) {
    return serverError(c, "POST /sections", err);
  }
});

router.get("/sections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const semId = c.req.query("semester_id");
    if (!semId)
      return validationError(c, "semester_id query param required");
    const sections = await getChildren(
      KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":",
      sectionKey
    );
    return c.json({ success: true, data: sections });
  } catch (err) {
    return serverError(c, "GET /sections", err);
  }
});

router.get("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const sec = await kv.get(sectionKey(c.req.param("id")));
    if (!sec) return notFound(c, "Section");
    return c.json({ success: true, data: sec });
  } catch (err) {
    return serverError(c, "GET /sections/:id", err);
  }
});

router.put("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(sectionKey(id));
    if (!existing) return notFound(c, "Section");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(sectionKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /sections/:id", err);
  }
});

// DELETE with cascade: topics
router.delete("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const sec = await kv.get(sectionKey(id));
    if (!sec) return notFound(c, "Section");

    const keysToDelete: string[] = [
      sectionKey(id),
      idxSemesterSections(sec.semester_id, id),
    ];
    const topicIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SECTION_TOPICS + id + ":"
    );
    for (const topicId of topicIds) {
      keysToDelete.push(topicKey(topicId), idxSectionTopics(id, topicId));
    }

    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /sections/:id", err);
  }
});

export default router;
