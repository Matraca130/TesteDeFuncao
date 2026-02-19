// ============================================================
// Axon v4.4 — Content Routes: Semesters
// ============================================================
// T1.6: title -> name, sort_order -> order_index
//
// POST   /semesters
// GET    /semesters        ?course_id=xxx
// GET    /semesters/:id
// PUT    /semesters/:id
// DELETE /semesters/:id    (cascade: sections > topics)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  semesterKey,
  sectionKey,
  topicKey,
  idxCourseSemesters,
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

router.post("/semesters", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!(body.name || body.title) || !body.course_id)
      return validationError(c, "Missing name or course_id");

    const id = crypto.randomUUID();
    const semester = {
      id,
      course_id: body.course_id,
      name: body.name || body.title,
      year: body.year ?? null,
      order_index: body.order_index ?? body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [semesterKey(id), idxCourseSemesters(body.course_id, id)],
      [semester, id]
    );
    console.log(`[Content] POST /semesters: created '${semester.name}' (${id})`);
    return c.json({ success: true, data: semester }, 201);
  } catch (err) {
    return serverError(c, "POST /semesters", err);
  }
});

router.get("/semesters", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const courseId = c.req.query("course_id");
    if (!courseId)
      return validationError(c, "course_id query param required");
    const semesters = await getChildren(
      KV_PREFIXES.IDX_COURSE_SEMESTERS + courseId + ":",
      semesterKey
    );
    return c.json({ success: true, data: semesters });
  } catch (err) {
    return serverError(c, "GET /semesters", err);
  }
});

router.get("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const sem = await kv.get(semesterKey(c.req.param("id")));
    if (!sem) return notFound(c, "Semester");
    return c.json({ success: true, data: sem });
  } catch (err) {
    return serverError(c, "GET /semesters/:id", err);
  }
});

router.put("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(semesterKey(id));
    if (!existing) return notFound(c, "Semester");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(semesterKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /semesters/:id", err);
  }
});

// DELETE with cascade: sections > topics
router.delete("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const sem = await kv.get(semesterKey(id));
    if (!sem) return notFound(c, "Semester");

    const keysToDelete: string[] = [
      semesterKey(id),
      idxCourseSemesters(sem.course_id, id),
    ];
    const secIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SEMESTER_SECTIONS + id + ":"
    );
    for (const secId of secIds) {
      keysToDelete.push(sectionKey(secId), idxSemesterSections(id, secId));
      const topicIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":"
      );
      for (const topicId of topicIds) {
        keysToDelete.push(topicKey(topicId), idxSectionTopics(secId, topicId));
      }
    }

    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /semesters/:id", err);
  }
});

export default router;
