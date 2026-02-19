// ============================================================
// routes-curriculum.tsx
// Routes: courses (GET, POST, DELETE),
//         semesters (GET, POST),
//         sections (GET, POST),
//         topics (GET, POST)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PREFIX, getUserId, uuid } from "./_server-helpers.ts";

const curriculum = new Hono();

// ================================================================
// COURSES
// ================================================================

curriculum.get(`${PREFIX}/courses`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const allCourses: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const courseIds = await kv.getByPrefix(`${K.PFX.IDX_INST_COURSES}${instId}:`);
      for (const courseId of courseIds) {
        if (typeof courseId !== "string") continue;
        const course = await kv.get(K.course(courseId));
        if (course) allCourses.push(course);
      }
    }
    return c.json({ success: true, data: allCourses, courses: allCourses });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

curriculum.post(`${PREFIX}/courses`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, description, institution_id, color } = await c.req.json();
    if (!name || !institution_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and institution_id required" } }, 400);
    const id = uuid();
    const course = { id, name, description: description || "", institution_id, color: color || "#0ea5e9", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await kv.set(K.course(id), course);
    await kv.set(K.idxInstCourses(institution_id, id), id);
    return c.json({ success: true, data: course, course });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

curriculum.delete(`${PREFIX}/courses/:id`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const id = c.req.param("id");
    const course: any = await kv.get(K.course(id));
    if (!course) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Course not found" } }, 404);
    await kv.del(K.course(id));
    await kv.del(K.idxInstCourses(course.institution_id, id));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ================================================================
// SEMESTERS
// ================================================================

curriculum.get(`${PREFIX}/semesters`, async (c) => {
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
          const sem = await kv.get(K.semester(semId));
          if (sem) all.push(sem);
        }
      }
    }
    return c.json({ success: true, data: all, semesters: all });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

curriculum.post(`${PREFIX}/semesters`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, course_id, order_index } = await c.req.json();
    if (!name || !course_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and course_id required" } }, 400);
    const id = uuid();
    const semester = { id, name, course_id, order_index: order_index || 0, created_at: new Date().toISOString() };
    await kv.set(K.semester(id), semester);
    await kv.set(K.idxCourseSemesters(course_id, id), id);
    return c.json({ success: true, data: semester, semester });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ================================================================
// SECTIONS
// ================================================================

curriculum.get(`${PREFIX}/sections`, async (c) => {
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
            const sec = await kv.get(K.section(secId));
            if (sec) all.push(sec);
          }
        }
      }
    }
    return c.json({ success: true, data: all, sections: all });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

curriculum.post(`${PREFIX}/sections`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, semester_id, order_index } = await c.req.json();
    if (!name || !semester_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and semester_id required" } }, 400);
    const id = uuid();
    const section = { id, name, semester_id, order_index: order_index || 0, created_at: new Date().toISOString() };
    await kv.set(K.section(id), section);
    await kv.set(K.idxSemesterSections(semester_id, id), id);
    return c.json({ success: true, data: section, section });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ================================================================
// TOPICS
// ================================================================

curriculum.get(`${PREFIX}/topics`, async (c) => {
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
              const topic = await kv.get(K.topic(topicId));
              if (topic) all.push(topic);
            }
          }
        }
      }
    }
    return c.json({ success: true, data: all, topics: all });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

curriculum.post(`${PREFIX}/topics`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, section_id, order_index } = await c.req.json();
    if (!name || !section_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and section_id required" } }, 400);
    const id = uuid();
    const topic = { id, name, section_id, order_index: order_index || 0, created_at: new Date().toISOString() };
    await kv.set(K.topic(id), topic);
    await kv.set(K.idxSectionTopics(section_id, id), id);
    return c.json({ success: true, data: topic, topic });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

export default curriculum;
