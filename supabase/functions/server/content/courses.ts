// ============================================================
// Axon v4.4 — Content Routes: Courses
// ============================================================
// POST   /courses
// GET    /courses          ?institution_id=xxx
// GET    /courses/:id
// PUT    /courses/:id
// DELETE /courses/:id      (cascade: semesters > sections > topics)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  courseKey,
  semesterKey,
  sectionKey,
  topicKey,
  idxInstCourses,
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

// POST /courses
router.post("/courses", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.name || !body.institution_id)
      return validationError(c, "Missing required fields", {
        name: "required",
        institution_id: "required",
      });

    const id = crypto.randomUUID();
    const course = {
      id,
      institution_id: body.institution_id,
      name: body.name,
      description: body.description ?? null,
      color: body.color || "#3b82f6",
      accent_color: body.accent_color || "#60a5fa",
      sort_order: body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [courseKey(id), idxInstCourses(body.institution_id, id)],
      [course, id]
    );
    console.log(`[Content] POST /courses: created '${body.name}' (${id})`);
    return c.json({ success: true, data: course }, 201);
  } catch (err) {
    return serverError(c, "POST /courses", err);
  }
});

// GET /courses?institution_id=xxx
router.get("/courses", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.query("institution_id");
    if (!instId)
      return validationError(c, "institution_id query param required");
    const courses = await getChildren(
      KV_PREFIXES.IDX_INST_COURSES + instId + ":",
      courseKey
    );
    return c.json({ success: true, data: courses });
  } catch (err) {
    return serverError(c, "GET /courses", err);
  }
});

// GET /courses/:id
router.get("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const course = await kv.get(courseKey(c.req.param("id")));
    if (!course) return notFound(c, "Course");
    return c.json({ success: true, data: course });
  } catch (err) {
    return serverError(c, "GET /courses/:id", err);
  }
});

// PUT /courses/:id
router.put("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(courseKey(id));
    if (!existing) return notFound(c, "Course");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(courseKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /courses/:id", err);
  }
});

// DELETE /courses/:id (cascade: semesters > sections > topics)
router.delete("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const course = await kv.get(courseKey(id));
    if (!course) return notFound(c, "Course");

    const semIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_COURSE_SEMESTERS + id + ":"
    );
    const keysToDelete: string[] = [
      courseKey(id),
      idxInstCourses(course.institution_id, id),
    ];

    for (const semId of semIds) {
      keysToDelete.push(semesterKey(semId), idxCourseSemesters(id, semId));
      const secIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":"
      );
      for (const secId of secIds) {
        keysToDelete.push(sectionKey(secId), idxSemesterSections(semId, secId));
        const topicIds = await kv.getByPrefix(
          KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":"
        );
        for (const topicId of topicIds) {
          keysToDelete.push(
            topicKey(topicId),
            idxSectionTopics(secId, topicId)
          );
        }
      }
    }

    await kv.mdel(keysToDelete);
    console.log(
      `[Content] DELETE /courses/${id}: cascade deleted ${keysToDelete.length} keys`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /courses/:id", err);
  }
});

export default router;
