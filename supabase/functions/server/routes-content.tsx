// ============================================================
// Axon v4.4 — Dev 1: Content Management Routes
// CRUD for: Institution, Membership, Course, Semester, Section,
//           Topic, Summary, Chunk, Keyword, SubTopic, Connection
// + Batch content approval (D20)
// ============================================================
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { KV } from "./kv-keys.tsx";

const content = new Hono();

// ── Auth helper ──────────────────────────────────────────
async function getAuthUser(c: any) {
  // Prefer X-Auth-Token (ES256 user JWT), fall back to Authorization Bearer
  const token = c.req.header("X-Auth-Token") || c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    return user;
  } catch {
    return null;
  }
}

function unauthorized(c: any) {
  return c.json(
    { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    401
  );
}

function notFound(c: any, entity: string) {
  return c.json(
    { success: false, error: { code: "NOT_FOUND", message: `${entity} not found` } },
    404
  );
}

function validationError(c: any, msg: string, details?: any) {
  return c.json(
    { success: false, error: { code: "VALIDATION_ERROR", message: msg, details } },
    400
  );
}

function serverError(c: any, ctx: string, err: any) {
  console.log(`[Content] ${ctx} error:`, err);
  return c.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: `${ctx}: ${err}` } },
    500
  );
}

// Helper: fetch children by index prefix
async function getChildren(prefix: string, primaryKeyFn: (id: string) => string) {
  const ids = await kv.getByPrefix(prefix);
  if (!ids || ids.length === 0) return [];
  const items = await kv.mget(ids.map((id: string) => primaryKeyFn(id)));
  return items.filter(Boolean);
}

// ════════════════════════════════════════════════════════════
// GROUP 1 — INSTITUTIONS
// ════════════════════════════════════════════════════════════

// POST /institutions
content.post("/institutions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.name) return validationError(c, "Missing required field: name");

    const id = crypto.randomUUID();
    const inst = {
      id,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-"),
      logo_url: body.logo_url || null,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.set(KV.institution(id), inst);

    // Auto-add creator as admin member
    const membership = {
      institution_id: id,
      user_id: user.id,
      role: "admin",
      joined_at: inst.created_at,
    };
    await kv.mset(
      [
        KV.membership(id, user.id),
        KV.IDX.memberOfInst(id, user.id),
        KV.IDX.instOfUser(user.id, id),
      ],
      [membership, user.id, id]
    );

    return c.json({ success: true, data: inst }, 201);
  } catch (err) { return serverError(c, "POST /institutions", err); }
});

// GET /institutions/:id
content.get("/institutions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const inst = await kv.get(KV.institution(c.req.param("id")));
    if (!inst) return notFound(c, "Institution");
    return c.json({ success: true, data: inst });
  } catch (err) { return serverError(c, "GET /institutions/:id", err); }
});

// GET /institutions/:id/members
content.get("/institutions/:id/members", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.param("id");
    const userIds = await kv.getByPrefix(KV.PREFIX.membersOfInst(instId));
    if (!userIds || userIds.length === 0) return c.json({ success: true, data: [] });
    const memberships = await kv.mget(
      userIds.map((uid: string) => KV.membership(instId, uid))
    );
    return c.json({ success: true, data: memberships.filter(Boolean) });
  } catch (err) { return serverError(c, "GET /institutions/:id/members", err); }
});

// POST /institutions/:id/members
content.post("/institutions/:id/members", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.param("id");
    const body = await c.req.json();
    if (!body.user_id || !body.role)
      return validationError(c, "Missing user_id or role");

    const membership = {
      institution_id: instId,
      user_id: body.user_id,
      role: body.role,
      joined_at: new Date().toISOString(),
    };
    await kv.mset(
      [
        KV.membership(instId, body.user_id),
        KV.IDX.memberOfInst(instId, body.user_id),
        KV.IDX.instOfUser(body.user_id, instId),
      ],
      [membership, body.user_id, instId]
    );
    return c.json({ success: true, data: membership }, 201);
  } catch (err) { return serverError(c, "POST /institutions/:id/members", err); }
});

// DELETE /institutions/:id/members/:userId
content.delete("/institutions/:id/members/:userId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.param("id");
    const userId = c.req.param("userId");
    await kv.mdel([
      KV.membership(instId, userId),
      KV.IDX.memberOfInst(instId, userId),
      KV.IDX.instOfUser(userId, instId),
    ]);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE member", err); }
});

// GET /users/:userId/institutions — Uses idx:user-insts reverse index
content.get("/users/:userId/institutions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = c.req.param("userId");
    const instIds = await kv.getByPrefix(KV.PREFIX.instsOfUser(userId));
    if (!instIds || instIds.length === 0) return c.json({ success: true, data: [] });
    const institutions = await kv.mget(
      instIds.map((id: string) => KV.institution(id))
    );
    return c.json({ success: true, data: institutions.filter(Boolean) });
  } catch (err) { return serverError(c, "GET /users/:userId/institutions", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 1 — COURSES
// ════════════════════════════════════════════════════════════

// POST /courses
content.post("/courses", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.name || !body.institution_id)
      return validationError(c, "Missing required fields", { name: "required", institution_id: "required" });

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
      [KV.course(id), KV.IDX.courseOfInst(body.institution_id, id)],
      [course, id]
    );
    return c.json({ success: true, data: course }, 201);
  } catch (err) { return serverError(c, "POST /courses", err); }
});

// GET /courses?institution_id=xxx
content.get("/courses", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.query("institution_id");
    if (!instId) return validationError(c, "institution_id query param required");
    const courses = await getChildren(
      KV.PREFIX.coursesOfInst(instId),
      KV.course
    );
    return c.json({ success: true, data: courses });
  } catch (err) { return serverError(c, "GET /courses", err); }
});

// GET /courses/:id
content.get("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const course = await kv.get(KV.course(c.req.param("id")));
    if (!course) return notFound(c, "Course");
    return c.json({ success: true, data: course });
  } catch (err) { return serverError(c, "GET /courses/:id", err); }
});

// PUT /courses/:id
content.put("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.course(id));
    if (!existing) return notFound(c, "Course");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(KV.course(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /courses/:id", err); }
});

// DELETE /courses/:id
content.delete("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const course = await kv.get(KV.course(id));
    if (!course) return notFound(c, "Course");
    // Cascade: delete semesters → sections → topics
    const semIds = await kv.getByPrefix(KV.PREFIX.semestersOfCourse(id));
    const keysToDelete: string[] = [
      KV.course(id),
      KV.IDX.courseOfInst(course.institution_id, id),
    ];
    for (const semId of semIds) {
      keysToDelete.push(KV.semester(semId), KV.IDX.semesterOfCourse(id, semId));
      const secIds = await kv.getByPrefix(KV.PREFIX.sectionsOfSemester(semId));
      for (const secId of secIds) {
        keysToDelete.push(KV.section(secId), KV.IDX.sectionOfSemester(semId, secId));
        const topicIds = await kv.getByPrefix(KV.PREFIX.topicsOfSection(secId));
        for (const topicId of topicIds) {
          keysToDelete.push(KV.topic(topicId), KV.IDX.topicOfSection(secId, topicId));
        }
      }
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /courses/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 1 — SEMESTERS
// ════════════════════════════════════════════════════════════

content.post("/semesters", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.title || !body.course_id)
      return validationError(c, "Missing title or course_id");

    const id = crypto.randomUUID();
    const semester = {
      id,
      course_id: body.course_id,
      title: body.title,
      year: body.year ?? null,
      sort_order: body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [KV.semester(id), KV.IDX.semesterOfCourse(body.course_id, id)],
      [semester, id]
    );
    return c.json({ success: true, data: semester }, 201);
  } catch (err) { return serverError(c, "POST /semesters", err); }
});

content.get("/semesters", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const courseId = c.req.query("course_id");
    if (!courseId) return validationError(c, "course_id query param required");
    const semesters = await getChildren(
      KV.PREFIX.semestersOfCourse(courseId),
      KV.semester
    );
    return c.json({ success: true, data: semesters });
  } catch (err) { return serverError(c, "GET /semesters", err); }
});

content.get("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const sem = await kv.get(KV.semester(c.req.param("id")));
    if (!sem) return notFound(c, "Semester");
    return c.json({ success: true, data: sem });
  } catch (err) { return serverError(c, "GET /semesters/:id", err); }
});

content.put("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.semester(id));
    if (!existing) return notFound(c, "Semester");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(KV.semester(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /semesters/:id", err); }
});

content.delete("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const sem = await kv.get(KV.semester(id));
    if (!sem) return notFound(c, "Semester");
    const keysToDelete: string[] = [
      KV.semester(id),
      KV.IDX.semesterOfCourse(sem.course_id, id),
    ];
    const secIds = await kv.getByPrefix(KV.PREFIX.sectionsOfSemester(id));
    for (const secId of secIds) {
      keysToDelete.push(KV.section(secId), KV.IDX.sectionOfSemester(id, secId));
      const topicIds = await kv.getByPrefix(KV.PREFIX.topicsOfSection(secId));
      for (const topicId of topicIds) {
        keysToDelete.push(KV.topic(topicId), KV.IDX.topicOfSection(secId, topicId));
      }
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /semesters/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 1 — SECTIONS
// ════════════════════════════════════════════════════════════

content.post("/sections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.title || !body.semester_id)
      return validationError(c, "Missing title or semester_id");

    const id = crypto.randomUUID();
    const section = {
      id,
      semester_id: body.semester_id,
      title: body.title,
      region: body.region ?? null,
      image_url: body.image_url ?? null,
      sort_order: body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [KV.section(id), KV.IDX.sectionOfSemester(body.semester_id, id)],
      [section, id]
    );
    return c.json({ success: true, data: section }, 201);
  } catch (err) { return serverError(c, "POST /sections", err); }
});

content.get("/sections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const semId = c.req.query("semester_id");
    if (!semId) return validationError(c, "semester_id query param required");
    const sections = await getChildren(
      KV.PREFIX.sectionsOfSemester(semId),
      KV.section
    );
    return c.json({ success: true, data: sections });
  } catch (err) { return serverError(c, "GET /sections", err); }
});

content.get("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const sec = await kv.get(KV.section(c.req.param("id")));
    if (!sec) return notFound(c, "Section");
    return c.json({ success: true, data: sec });
  } catch (err) { return serverError(c, "GET /sections/:id", err); }
});

content.put("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.section(id));
    if (!existing) return notFound(c, "Section");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(KV.section(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /sections/:id", err); }
});

content.delete("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const sec = await kv.get(KV.section(id));
    if (!sec) return notFound(c, "Section");
    const keysToDelete: string[] = [
      KV.section(id),
      KV.IDX.sectionOfSemester(sec.semester_id, id),
    ];
    const topicIds = await kv.getByPrefix(KV.PREFIX.topicsOfSection(id));
    for (const topicId of topicIds) {
      keysToDelete.push(KV.topic(topicId), KV.IDX.topicOfSection(id, topicId));
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /sections/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 1 — TOPICS
// ════════════════════════════════════════════════════════════

content.post("/topics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.title || !body.section_id)
      return validationError(c, "Missing title or section_id");

    const id = crypto.randomUUID();
    const topic = {
      id,
      section_id: body.section_id,
      title: body.title,
      description: body.description ?? null,
      sort_order: body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [KV.topic(id), KV.IDX.topicOfSection(body.section_id, id)],
      [topic, id]
    );
    return c.json({ success: true, data: topic }, 201);
  } catch (err) { return serverError(c, "POST /topics", err); }
});

content.get("/topics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const secId = c.req.query("section_id");
    if (!secId) return validationError(c, "section_id query param required");
    const topics = await getChildren(
      KV.PREFIX.topicsOfSection(secId),
      KV.topic
    );
    return c.json({ success: true, data: topics });
  } catch (err) { return serverError(c, "GET /topics", err); }
});

content.get("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const topic = await kv.get(KV.topic(c.req.param("id")));
    if (!topic) return notFound(c, "Topic");
    return c.json({ success: true, data: topic });
  } catch (err) { return serverError(c, "GET /topics/:id", err); }
});

content.put("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.topic(id));
    if (!existing) return notFound(c, "Topic");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(KV.topic(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /topics/:id", err); }
});

content.delete("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const topic = await kv.get(KV.topic(id));
    if (!topic) return notFound(c, "Topic");
    // Cascade: delete summaries of this topic
    const summaryIds = await kv.getByPrefix(KV.PREFIX.summariesOfTopic(id));
    const keysToDelete: string[] = [
      KV.topic(id),
      KV.IDX.topicOfSection(topic.section_id, id),
    ];
    for (const sId of summaryIds) {
      keysToDelete.push(KV.summary(sId), KV.IDX.summaryOfTopic(id, sId));
      // Also delete chunks
      const chunkIds = await kv.getByPrefix(KV.PREFIX.chunksOfSummary(sId));
      for (const cId of chunkIds) {
        keysToDelete.push(KV.chunk(cId));
      }
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /topics/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 2 — SUMMARIES (D13/D20: draft → published → rejected)
// ════════════════════════════════════════════════════════════

content.post("/summaries", async (c) => {
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
      content: body.content ?? "",
      status: body.status || "draft", // D13: starts as draft
      source: body.source || "manual", // D29: "ai_generated" or "manual"
      created_at: new Date().toISOString(),
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };
    await kv.mset(
      [KV.summary(id), KV.IDX.summaryOfTopic(body.topic_id, id)],
      [summary, id]
    );
    return c.json({ success: true, data: summary }, 201);
  } catch (err) { return serverError(c, "POST /summaries", err); }
});

content.get("/summaries", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const topicId = c.req.query("topic_id");
    if (!topicId) return validationError(c, "topic_id query param required");
    const summaries = await getChildren(
      KV.PREFIX.summariesOfTopic(topicId),
      KV.summary
    );
    return c.json({ success: true, data: summaries });
  } catch (err) { return serverError(c, "GET /summaries", err); }
});

content.get("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summary = await kv.get(KV.summary(c.req.param("id")));
    if (!summary) return notFound(c, "Summary");
    return c.json({ success: true, data: summary });
  } catch (err) { return serverError(c, "GET /summaries/:id", err); }
});

content.put("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.summary(id));
    if (!existing) return notFound(c, "Summary");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      topic_id: existing.topic_id, // prevent parent change
      updated_at: new Date().toISOString(),
    };
    await kv.set(KV.summary(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /summaries/:id", err); }
});

content.delete("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const summary = await kv.get(KV.summary(id));
    if (!summary) return notFound(c, "Summary");
    const keysToDelete: string[] = [
      KV.summary(id),
      KV.IDX.summaryOfTopic(summary.topic_id, id),
    ];
    // Delete chunks
    const chunkIds = await kv.getByPrefix(KV.PREFIX.chunksOfSummary(id));
    for (const cId of chunkIds) {
      keysToDelete.push(KV.chunk(cId));
    }
    // Delete keyword links (both directions)
    const kwIds = await kv.getByPrefix(KV.PREFIX.keywordsOfSummary(id));
    for (const kwId of kwIds) {
      keysToDelete.push(
        KV.IDX.keywordOfSummary(id, kwId),
        KV.IDX.summaryOfKeyword(kwId, id)
      );
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /summaries/:id", err); }
});

// GET /summaries/:id/chunks
content.get("/summaries/:id/chunks", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summaryId = c.req.param("id");
    const chunks = await getChildren(
      KV.PREFIX.chunksOfSummary(summaryId),
      KV.chunk
    );
    return c.json({ success: true, data: chunks });
  } catch (err) { return serverError(c, "GET /summaries/:id/chunks", err); }
});

// POST /summaries/:id/chunk
content.post("/summaries/:id/chunk", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summaryId = c.req.param("id");
    const body = await c.req.json();
    if (!body.content) return validationError(c, "Missing content");

    const id = crypto.randomUUID();
    const sortOrder = body.sort_order ?? 0;
    const chunk = {
      id,
      summary_id: summaryId,
      content: body.content,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    };
    await kv.mset(
      [KV.chunk(id), KV.IDX.chunkOfSummary(summaryId, sortOrder)],
      [chunk, id]
    );
    return c.json({ success: true, data: chunk }, 201);
  } catch (err) { return serverError(c, "POST /summaries/:id/chunk", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 3 — KEYWORDS (D7: global within institution)
// ════════════════════════════════════════════════════════════

content.post("/keywords", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.institution_id || !body.term)
      return validationError(c, "Missing institution_id or term");

    const id = crypto.randomUUID();
    const keyword = {
      id,
      institution_id: body.institution_id,
      term: body.term,
      definition: body.definition ?? null,
      priority: body.priority ?? 0, // D23: 0-3
      status: body.status || "draft", // D13
      summary_ids: body.summary_ids || [],
      created_at: new Date().toISOString(),
      created_by: user.id,
    };

    const keys: string[] = [
      KV.keyword(id),
      KV.IDX.keywordOfInst(body.institution_id, id),
    ];
    const vals: any[] = [keyword, id];

    // Link keyword to summaries (D4)
    if (body.summary_ids && Array.isArray(body.summary_ids)) {
      for (const sId of body.summary_ids) {
        keys.push(KV.IDX.keywordOfSummary(sId, id));
        vals.push(id);
        keys.push(KV.IDX.summaryOfKeyword(id, sId));
        vals.push(sId);
      }
    }

    // Auto-create KeywordInstance if summary_id provided (D4)
    if (body.summary_id) {
      const instId = crypto.randomUUID();
      const instance = {
        id: instId,
        keyword_id: id,
        summary_id: body.summary_id,
        chunk_id: body.chunk_id ?? null,
        start_offset: body.start_offset ?? null,
        end_offset: body.end_offset ?? null,
        created_at: new Date().toISOString(),
      };
      keys.push(KV.keywordInstance(instId));
      vals.push(instance);
    }

    await kv.mset(keys, vals);
    return c.json({ success: true, data: keyword }, 201);
  } catch (err) { return serverError(c, "POST /keywords", err); }
});

// GET /keywords?institution_id=xxx OR ?summary_id=xxx
content.get("/keywords", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const instId = c.req.query("institution_id");
    const summaryId = c.req.query("summary_id");

    if (summaryId) {
      const keywords = await getChildren(
        KV.PREFIX.keywordsOfSummary(summaryId),
        KV.keyword
      );
      return c.json({ success: true, data: keywords });
    }

    if (instId) {
      const keywords = await getChildren(
        KV.PREFIX.keywordsOfInst(instId),
        KV.keyword
      );
      return c.json({ success: true, data: keywords });
    }

    return validationError(c, "institution_id or summary_id query param required");
  } catch (err) { return serverError(c, "GET /keywords", err); }
});

// GET /keywords/:id — full keyword with subtopics, instances, connections
content.get("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const keyword = await kv.get(KV.keyword(id));
    if (!keyword) return notFound(c, "Keyword");

    // Fetch related data
    const subtopics = await getChildren(
      KV.PREFIX.subtopicsOfKeyword(id),
      KV.subtopic
    );
    const connIds = await kv.getByPrefix(KV.PREFIX.connectionsOfKeyword(id));
    let connections: any[] = [];
    if (connIds.length > 0) {
      connections = (await kv.mget(connIds.map((cId: string) => KV.connection(cId)))).filter(Boolean);
    }
    const summaryIds = await kv.getByPrefix(KV.PREFIX.summariesOfKeyword(id));

    return c.json({
      success: true,
      data: {
        ...keyword,
        subtopics,
        connections,
        linked_summary_ids: summaryIds,
      },
    });
  } catch (err) { return serverError(c, "GET /keywords/:id", err); }
});

// PUT /keywords/:id
content.put("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.keyword(id));
    if (!existing) return notFound(c, "Keyword");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(KV.keyword(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /keywords/:id", err); }
});

// DELETE /keywords/:id — cascade delete subtopics + connections (D31)
content.delete("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const kw = await kv.get(KV.keyword(id));
    if (!kw) return notFound(c, "Keyword");

    const stIds = await kv.getByPrefix(KV.PREFIX.subtopicsOfKeyword(id));
    const connIds = await kv.getByPrefix(KV.PREFIX.connectionsOfKeyword(id));
    const summaryIds = await kv.getByPrefix(KV.PREFIX.summariesOfKeyword(id));

    const keysToDelete: string[] = [
      KV.keyword(id),
      KV.IDX.keywordOfInst(kw.institution_id, id),
      // SubTopics
      ...stIds.map((stId: string) => KV.subtopic(stId)),
      ...stIds.map((stId: string) => KV.IDX.subtopicOfKeyword(id, stId)),
      // Connections (both sides)
      ...connIds.map((cId: string) => KV.connection(cId)),
      ...connIds.map((cId: string) => KV.IDX.connectionOfKeyword(id, cId)),
      // Summary links
      ...summaryIds.map((sId: string) => KV.IDX.summaryOfKeyword(id, sId)),
      ...summaryIds.map((sId: string) => KV.IDX.keywordOfSummary(sId, id)),
    ];

    // Also remove reverse connection indices
    for (const cId of connIds) {
      const conn = await kv.get(KV.connection(cId));
      if (conn) {
        const otherId = conn.keyword_a_id === id ? conn.keyword_b_id : conn.keyword_a_id;
        keysToDelete.push(KV.IDX.connectionOfKeyword(otherId, cId));
      }
    }

    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /keywords/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 3 — SUBTOPICS (D24: evaluable unit with BKT+FSRS)
// ════════════════════════════════════════════════════════════

content.post("/subtopics", async (c) => {
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
      priority: body.priority ?? null, // D23: inherits from keyword if null
      status: body.status || "draft",
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [KV.subtopic(id), KV.IDX.subtopicOfKeyword(body.keyword_id, id)],
      [subtopic, id]
    );
    return c.json({ success: true, data: subtopic }, 201);
  } catch (err) { return serverError(c, "POST /subtopics", err); }
});

content.get("/subtopics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.query("keyword_id");
    if (!kwId) return validationError(c, "keyword_id query param required");
    const subtopics = await getChildren(
      KV.PREFIX.subtopicsOfKeyword(kwId),
      KV.subtopic
    );
    return c.json({ success: true, data: subtopics });
  } catch (err) { return serverError(c, "GET /subtopics", err); }
});

content.get("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const st = await kv.get(KV.subtopic(c.req.param("id")));
    if (!st) return notFound(c, "SubTopic");
    return c.json({ success: true, data: st });
  } catch (err) { return serverError(c, "GET /subtopics/:id", err); }
});

content.put("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.subtopic(id));
    if (!existing) return notFound(c, "SubTopic");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(KV.subtopic(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /subtopics/:id", err); }
});

content.delete("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const st = await kv.get(KV.subtopic(id));
    if (!st) return notFound(c, "SubTopic");
    await kv.mdel([
      KV.subtopic(id),
      KV.IDX.subtopicOfKeyword(st.keyword_id, id),
    ]);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /subtopics/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 3 — CONNECTIONS (D31: structural, no mastery)
// ════════════════════════════════════════════════════════════

content.post("/connections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.keyword_a_id || !body.keyword_b_id)
      return validationError(c, "Missing keyword_a_id or keyword_b_id");

    const id = crypto.randomUUID();
    const conn = {
      id,
      keyword_a_id: body.keyword_a_id,
      keyword_b_id: body.keyword_b_id,
      relationship_type: body.relationship_type ?? "related",
      description: body.description ?? null,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [
        KV.connection(id),
        KV.IDX.connectionOfKeyword(body.keyword_a_id, id),
        KV.IDX.connectionOfKeyword(body.keyword_b_id, id),
      ],
      [conn, id, id]
    );
    return c.json({ success: true, data: conn }, 201);
  } catch (err) { return serverError(c, "POST /connections", err); }
});

content.get("/connections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.query("keyword_id");
    if (!kwId) return validationError(c, "keyword_id query param required");
    const connIds = await kv.getByPrefix(KV.PREFIX.connectionsOfKeyword(kwId));
    if (!connIds || connIds.length === 0) return c.json({ success: true, data: [] });
    const conns = (await kv.mget(connIds.map((cId: string) => KV.connection(cId)))).filter(Boolean);
    return c.json({ success: true, data: conns });
  } catch (err) { return serverError(c, "GET /connections", err); }
});

content.get("/connections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const conn = await kv.get(KV.connection(c.req.param("id")));
    if (!conn) return notFound(c, "Connection");
    return c.json({ success: true, data: conn });
  } catch (err) { return serverError(c, "GET /connections/:id", err); }
});

content.delete("/connections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const conn = await kv.get(KV.connection(id));
    if (!conn) return notFound(c, "Connection");
    await kv.mdel([
      KV.connection(id),
      KV.IDX.connectionOfKeyword(conn.keyword_a_id, id),
      KV.IDX.connectionOfKeyword(conn.keyword_b_id, id),
    ]);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /connections/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 4 — BATCH CONTENT APPROVAL (D20)
// PUT /content/batch-status
// Changes status of multiple entities at once
// ════════════════════════════════════════════════════════════

content.put("/content/batch-status", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    // body = { items: [{ entity_type, id, new_status }], reviewer_note? }
    const items = body.items;
    if (!items || !Array.isArray(items) || items.length === 0)
      return validationError(c, "Missing items array");

    const validStatuses = ["draft", "published", "rejected"];
    const entityKeyFns: Record<string, (id: string) => string> = {
      keyword: KV.keyword,
      subtopic: KV.subtopic,
      summary: KV.summary,
      // flashcard and quiz_question would be added by Dev 3/4
    };

    const results: any[] = [];
    const keysToWrite: string[] = [];
    const valsToWrite: any[] = [];

    for (const item of items) {
      const { entity_type, id, new_status } = item;

      if (!entity_type || !id || !new_status)
        return validationError(c, `Invalid item: missing entity_type, id, or new_status`);
      if (!validStatuses.includes(new_status))
        return validationError(c, `Invalid status: ${new_status}. Must be one of: ${validStatuses.join(", ")}`);

      const keyFn = entityKeyFns[entity_type];
      if (!keyFn)
        return validationError(c, `Unsupported entity_type: ${entity_type}`);

      const existing = await kv.get(keyFn(id));
      if (!existing) {
        results.push({ id, entity_type, success: false, reason: "not found" });
        continue;
      }

      const updated = {
        ...existing,
        status: new_status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewer_note: body.reviewer_note || null,
      };

      keysToWrite.push(keyFn(id));
      valsToWrite.push(updated);
      results.push({ id, entity_type, success: true, new_status });
    }

    if (keysToWrite.length > 0) {
      await kv.mset(keysToWrite, valsToWrite);
    }

    return c.json({
      success: true,
      data: {
        processed: results.length,
        approved: results.filter((r) => r.success && r.new_status === "published").length,
        rejected: results.filter((r) => r.success && r.new_status === "rejected").length,
        errors: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (err) { return serverError(c, "PUT /content/batch-status", err); }
});

export default content;
