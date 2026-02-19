// ============================================================
// Axon v4.4 — Dev 1: Content Management Routes
// CRUD for: Institution, Membership, Course, Semester, Section,
//           Topic, Summary, Chunk, Keyword, SubTopic, Connection
// + Batch content approval (D20)
// ============================================================
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import {
  instKey,
  memberKey,
  courseKey,
  semesterKey,
  sectionKey,
  topicKey,
  summaryKey,
  chunkKey,
  kwKey,
  kwInstKey,
  subtopicKey,
  connKey,
  idxInstMembers,
  idxUserInsts,
  idxInstCourses,
  idxCourseSemesters,
  idxSemesterSections,
  idxSectionTopics,
  idxTopicSummaries,
  idxSummaryChunks,
  idxSummaryKw,
  idxKwSummaries,
  idxInstKw,
  idxKwSubtopics,
  idxKwConn,
  idxSlugInst,
  KV_PREFIXES,
} from "./kv-keys.ts";

const content = new Hono();

// ── Auth helper ────────────────────────────────────────────
async function getAuthUser(c: any) {
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
  console.log(`[Content] ${ctx} error: ${err?.message || err}`);
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

// POST /institutions (T1.1 + T1.2: fix membership + slug)
content.post("/institutions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const { name, slug, logo_url } = await c.req.json();
    if (!name) return validationError(c, "Missing required field: name");

    // T1.2: Validate slug
    if (!slug || !/^[a-z0-9-]{3,50}$/.test(slug)) {
      return validationError(c, "Invalid slug: must be 3-50 chars, lowercase alphanumeric and hyphens only");
    }

    // T1.2: Check slug uniqueness
    const existingSlug = await kv.get(idxSlugInst(slug));
    if (existingSlug) {
      return c.json(
        { success: false, error: { code: "CONFLICT", message: "Slug already taken" } },
        409
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const inst = {
      id,
      name,
      slug,
      logo_url: logo_url || null,
      created_at: now,
      updated_at: now,
      created_by: user.id,
    };
    await kv.set(instKey(id), inst);

    // T1.2: Save slug index
    await kv.set(idxSlugInst(slug), id);

    // T1.1: Auto-add creator as OWNER with generated id and created_at
    const membershipId = crypto.randomUUID();
    const membership = {
      id: membershipId,
      user_id: user.id,
      institution_id: id,
      role: "owner",
      plan_id: null,
      created_at: now,
    };
    await kv.mset(
      [
        memberKey(id, user.id),
        idxUserInsts(user.id, id),
        idxInstMembers(id, user.id),
      ],
      [membership, id, user.id]
    );

    console.log(`[Content] POST /institutions: created '${name}' (${id}) with slug '${slug}', owner: ${user.id}`);
    return c.json({ success: true, data: inst }, 201);
  } catch (err) { return serverError(c, "POST /institutions", err); }
});

// GET /institutions/by-slug/:slug (T1.4: public endpoint)
content.get("/institutions/by-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const instId = await kv.get(idxSlugInst(slug));
    if (!instId) {
      console.log(`[Content] by-slug: institution not found for slug '${slug}'`);
      return c.json({ success: false, error: { message: "Institution not found" } }, 404);
    }
    const inst = await kv.get(instKey(instId as string));
    if (!inst) {
      console.log(`[Content] by-slug: institution data missing for id '${instId}', slug '${slug}'`);
      return c.json({ success: false, error: { message: "Institution not found" } }, 404);
    }
    // Return only PUBLIC data
    return c.json({
      success: true,
      data: {
        id: (inst as any).id,
        name: (inst as any).name,
        slug: (inst as any).slug,
        logo_url: (inst as any).logo_url || null,
      },
    });
  } catch (err: any) {
    console.log(`[Content] by-slug error: ${err?.message}`);
    return c.json({ success: false, error: { message: err?.message } }, 500);
  }
});

// GET /institutions/:id
content.get("/institutions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const inst = await kv.get(instKey(c.req.param("id")));
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
    const userIds = await kv.getByPrefix(KV_PREFIXES.IDX_INST_MEMBERS + instId + ":");
    if (!userIds || userIds.length === 0) return c.json({ success: true, data: [] });
    const memberships = await kv.mget(
      userIds.map((uid: string) => memberKey(instId, uid))
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
      id: crypto.randomUUID(),
      institution_id: instId,
      user_id: body.user_id,
      role: body.role,
      plan_id: null,
      created_at: new Date().toISOString(),
    };
    await kv.mset(
      [
        memberKey(instId, body.user_id),
        idxInstMembers(instId, body.user_id),
        idxUserInsts(body.user_id, instId),
      ],
      [membership, body.user_id, instId]
    );
    console.log(`[Content] POST /institutions/${instId}/members: added user ${body.user_id} as ${body.role}`);
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
      memberKey(instId, userId),
      idxInstMembers(instId, userId),
      idxUserInsts(userId, instId),
    ]);
    console.log(`[Content] DELETE member: removed user ${userId} from institution ${instId}`);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE member", err); }
});

// GET /users/:userId/institutions
content.get("/users/:userId/institutions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = c.req.param("userId");
    const instIds = await kv.getByPrefix(KV_PREFIXES.IDX_USER_INSTS + userId + ":");
    if (!instIds || instIds.length === 0) return c.json({ success: true, data: [] });
    const institutions = await kv.mget(
      instIds.map((id: string) => instKey(id))
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
      [courseKey(id), idxInstCourses(body.institution_id, id)],
      [course, id]
    );
    console.log(`[Content] POST /courses: created '${body.name}' (${id})`);
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
      KV_PREFIXES.IDX_INST_COURSES + instId + ":",
      courseKey
    );
    return c.json({ success: true, data: courses });
  } catch (err) { return serverError(c, "GET /courses", err); }
});

// GET /courses/:id
content.get("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const course = await kv.get(courseKey(c.req.param("id")));
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
    const existing = await kv.get(courseKey(id));
    if (!existing) return notFound(c, "Course");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(courseKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /courses/:id", err); }
});

// DELETE /courses/:id
content.delete("/courses/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const course = await kv.get(courseKey(id));
    if (!course) return notFound(c, "Course");
    // Cascade: delete semesters → sections → topics
    const semIds = await kv.getByPrefix(KV_PREFIXES.IDX_COURSE_SEMESTERS + id + ":");
    const keysToDelete: string[] = [
      courseKey(id),
      idxInstCourses(course.institution_id, id),
    ];
    for (const semId of semIds) {
      keysToDelete.push(semesterKey(semId), idxCourseSemesters(id, semId));
      const secIds = await kv.getByPrefix(KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":");
      for (const secId of secIds) {
        keysToDelete.push(sectionKey(secId), idxSemesterSections(semId, secId));
        const topicIds = await kv.getByPrefix(KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":");
        for (const topicId of topicIds) {
          keysToDelete.push(topicKey(topicId), idxSectionTopics(secId, topicId));
        }
      }
    }
    await kv.mdel(keysToDelete);
    console.log(`[Content] DELETE /courses/${id}: cascade deleted ${keysToDelete.length} keys`);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /courses/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 1 — SEMESTERS (T1.6: title→name, sort_order→order_index)
// ════════════════════════════════════════════════════════════

content.post("/semesters", async (c) => {
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
  } catch (err) { return serverError(c, "POST /semesters", err); }
});

content.get("/semesters", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const courseId = c.req.query("course_id");
    if (!courseId) return validationError(c, "course_id query param required");
    const semesters = await getChildren(
      KV_PREFIXES.IDX_COURSE_SEMESTERS + courseId + ":",
      semesterKey
    );
    return c.json({ success: true, data: semesters });
  } catch (err) { return serverError(c, "GET /semesters", err); }
});

content.get("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const sem = await kv.get(semesterKey(c.req.param("id")));
    if (!sem) return notFound(c, "Semester");
    return c.json({ success: true, data: sem });
  } catch (err) { return serverError(c, "GET /semesters/:id", err); }
});

content.put("/semesters/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(semesterKey(id));
    if (!existing) return notFound(c, "Semester");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(semesterKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /semesters/:id", err); }
});

content.delete("/semesters/:id", async (c) => {
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
    const secIds = await kv.getByPrefix(KV_PREFIXES.IDX_SEMESTER_SECTIONS + id + ":");
    for (const secId of secIds) {
      keysToDelete.push(sectionKey(secId), idxSemesterSections(id, secId));
      const topicIds = await kv.getByPrefix(KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":");
      for (const topicId of topicIds) {
        keysToDelete.push(topicKey(topicId), idxSectionTopics(secId, topicId));
      }
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /semesters/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 1 — SECTIONS (T1.6: title→name, sort_order→order_index)
// ════════════════════════════════════════════════════════════

content.post("/sections", async (c) => {
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
  } catch (err) { return serverError(c, "POST /sections", err); }
});

content.get("/sections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const semId = c.req.query("semester_id");
    if (!semId) return validationError(c, "semester_id query param required");
    const sections = await getChildren(
      KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":",
      sectionKey
    );
    return c.json({ success: true, data: sections });
  } catch (err) { return serverError(c, "GET /sections", err); }
});

content.get("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const sec = await kv.get(sectionKey(c.req.param("id")));
    if (!sec) return notFound(c, "Section");
    return c.json({ success: true, data: sec });
  } catch (err) { return serverError(c, "GET /sections/:id", err); }
});

content.put("/sections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(sectionKey(id));
    if (!existing) return notFound(c, "Section");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(sectionKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /sections/:id", err); }
});

content.delete("/sections/:id", async (c) => {
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
    const topicIds = await kv.getByPrefix(KV_PREFIXES.IDX_SECTION_TOPICS + id + ":");
    for (const topicId of topicIds) {
      keysToDelete.push(topicKey(topicId), idxSectionTopics(id, topicId));
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /sections/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 1 — TOPICS (T1.6: title→name, sort_order→order_index)
// ════════════════════════════════════════════════════════════

content.post("/topics", async (c) => {
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
  } catch (err) { return serverError(c, "POST /topics", err); }
});

content.get("/topics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const secId = c.req.query("section_id");
    if (!secId) return validationError(c, "section_id query param required");
    const topics = await getChildren(
      KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
      topicKey
    );
    return c.json({ success: true, data: topics });
  } catch (err) { return serverError(c, "GET /topics", err); }
});

content.get("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const topic = await kv.get(topicKey(c.req.param("id")));
    if (!topic) return notFound(c, "Topic");
    return c.json({ success: true, data: topic });
  } catch (err) { return serverError(c, "GET /topics/:id", err); }
});

content.put("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(topicKey(id));
    if (!existing) return notFound(c, "Topic");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(topicKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /topics/:id", err); }
});

content.delete("/topics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const topic = await kv.get(topicKey(id));
    if (!topic) return notFound(c, "Topic");
    // Cascade: delete summaries of this topic
    const summaryIds = await kv.getByPrefix(KV_PREFIXES.IDX_TOPIC_SUMMARIES + id + ":");
    const keysToDelete: string[] = [
      topicKey(id),
      idxSectionTopics(topic.section_id, id),
    ];
    for (const sId of summaryIds) {
      keysToDelete.push(summaryKey(sId), idxTopicSummaries(id, sId));
      // Also delete chunks
      const chunkIds = await kv.getByPrefix(KV_PREFIXES.IDX_SUMMARY_CHUNKS + sId + ":");
      for (const cId of chunkIds) {
        keysToDelete.push(chunkKey(cId));
      }
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /topics/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 2 — SUMMARIES (T1.6: content→content_markdown)
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
  } catch (err) { return serverError(c, "POST /summaries", err); }
});

content.get("/summaries", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const topicId = c.req.query("topic_id");
    if (!topicId) return validationError(c, "topic_id query param required");
    const summaries = await getChildren(
      KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":",
      summaryKey
    );
    return c.json({ success: true, data: summaries });
  } catch (err) { return serverError(c, "GET /summaries", err); }
});

content.get("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summary = await kv.get(summaryKey(c.req.param("id")));
    if (!summary) return notFound(c, "Summary");
    return c.json({ success: true, data: summary });
  } catch (err) { return serverError(c, "GET /summaries/:id", err); }
});

content.put("/summaries/:id", async (c) => {
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
  } catch (err) { return serverError(c, "PUT /summaries/:id", err); }
});

content.delete("/summaries/:id", async (c) => {
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
    // Delete chunks
    const chunkIds = await kv.getByPrefix(KV_PREFIXES.IDX_SUMMARY_CHUNKS + id + ":");
    for (const cId of chunkIds) {
      keysToDelete.push(chunkKey(cId));
    }
    // Delete keyword links (both directions)
    const kwIds = await kv.getByPrefix(KV_PREFIXES.IDX_SUMMARY_KW + id + ":");
    for (const kwId of kwIds) {
      keysToDelete.push(
        idxSummaryKw(id, kwId),
        idxKwSummaries(kwId, id)
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
      KV_PREFIXES.IDX_SUMMARY_CHUNKS + summaryId + ":",
      chunkKey
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
      priority: body.priority ?? 0,
      status: body.status || "draft",
      summary_ids: body.summary_ids || [],
      created_at: new Date().toISOString(),
      created_by: user.id,
    };

    const keys: string[] = [
      kwKey(id),
      idxInstKw(body.institution_id, id),
    ];
    const vals: any[] = [keyword, id];

    // Link keyword to summaries (D4)
    if (body.summary_ids && Array.isArray(body.summary_ids)) {
      for (const sId of body.summary_ids) {
        keys.push(idxSummaryKw(sId, id));
        vals.push(id);
        keys.push(idxKwSummaries(id, sId));
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
      keys.push(kwInstKey(instId));
      vals.push(instance);
    }

    await kv.mset(keys, vals);
    console.log(`[Content] POST /keywords: created '${body.term}' (${id})`);
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
        KV_PREFIXES.IDX_SUMMARY_KW + summaryId + ":",
        kwKey
      );
      return c.json({ success: true, data: keywords });
    }

    if (instId) {
      const keywords = await getChildren(
        KV_PREFIXES.IDX_INST_KW + instId + ":",
        kwKey
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
    const keyword = await kv.get(kwKey(id));
    if (!keyword) return notFound(c, "Keyword");

    // Fetch related data
    const subtopics = await getChildren(
      KV_PREFIXES.IDX_KW_SUBTOPICS + id + ":",
      subtopicKey
    );
    const connIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_CONN + id + ":");
    let connections: any[] = [];
    if (connIds.length > 0) {
      connections = (await kv.mget(connIds.map((cId: string) => connKey(cId)))).filter(Boolean);
    }
    const summaryIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_SUMMARIES + id + ":");

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
    const existing = await kv.get(kwKey(id));
    if (!existing) return notFound(c, "Keyword");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(kwKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /keywords/:id", err); }
});

// DELETE /keywords/:id — cascade delete subtopics + connections (D31)
content.delete("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const kw = await kv.get(kwKey(id));
    if (!kw) return notFound(c, "Keyword");

    const stIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_SUBTOPICS + id + ":");
    const connIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_CONN + id + ":");
    const summaryIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_SUMMARIES + id + ":");

    const keysToDelete: string[] = [
      kwKey(id),
      idxInstKw(kw.institution_id, id),
      // SubTopics
      ...stIds.map((stId: string) => subtopicKey(stId)),
      ...stIds.map((stId: string) => idxKwSubtopics(id, stId)),
      // Connections (both sides)
      ...connIds.map((cId: string) => connKey(cId)),
      ...connIds.map((cId: string) => idxKwConn(id, cId)),
      // Summary links
      ...summaryIds.map((sId: string) => idxKwSummaries(id, sId)),
      ...summaryIds.map((sId: string) => idxSummaryKw(sId, id)),
    ];

    // Also remove reverse connection indices
    for (const cId of connIds) {
      const conn = await kv.get(connKey(cId));
      if (conn) {
        const otherId = conn.keyword_a_id === id ? conn.keyword_b_id : conn.keyword_a_id;
        keysToDelete.push(idxKwConn(otherId, cId));
      }
    }

    await kv.mdel(keysToDelete);
    console.log(`[Content] DELETE /keywords/${id}: cascade deleted ${keysToDelete.length} keys`);
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
  } catch (err) { return serverError(c, "POST /subtopics", err); }
});

content.get("/subtopics", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.query("keyword_id");
    if (!kwId) return validationError(c, "keyword_id query param required");
    const subtopics = await getChildren(
      KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":",
      subtopicKey
    );
    return c.json({ success: true, data: subtopics });
  } catch (err) { return serverError(c, "GET /subtopics", err); }
});

content.get("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const st = await kv.get(subtopicKey(c.req.param("id")));
    if (!st) return notFound(c, "SubTopic");
    return c.json({ success: true, data: st });
  } catch (err) { return serverError(c, "GET /subtopics/:id", err); }
});

content.put("/subtopics/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(subtopicKey(id));
    if (!existing) return notFound(c, "SubTopic");
    const body = await c.req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await kv.set(subtopicKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return serverError(c, "PUT /subtopics/:id", err); }
});

content.delete("/subtopics/:id", async (c) => {
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
        connKey(id),
        idxKwConn(body.keyword_a_id, id),
        idxKwConn(body.keyword_b_id, id),
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
    const connIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_CONN + kwId + ":");
    if (!connIds || connIds.length === 0) return c.json({ success: true, data: [] });
    const conns = (await kv.mget(connIds.map((cId: string) => connKey(cId)))).filter(Boolean);
    return c.json({ success: true, data: conns });
  } catch (err) { return serverError(c, "GET /connections", err); }
});

content.get("/connections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const conn = await kv.get(connKey(c.req.param("id")));
    if (!conn) return notFound(c, "Connection");
    return c.json({ success: true, data: conn });
  } catch (err) { return serverError(c, "GET /connections/:id", err); }
});

content.delete("/connections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const conn = await kv.get(connKey(id));
    if (!conn) return notFound(c, "Connection");
    await kv.mdel([
      connKey(id),
      idxKwConn(conn.keyword_a_id, id),
      idxKwConn(conn.keyword_b_id, id),
    ]);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) { return serverError(c, "DELETE /connections/:id", err); }
});

// ════════════════════════════════════════════════════════════
// GROUP 4 — BATCH CONTENT APPROVAL (D20)
// PUT /content/batch-status
// ════════════════════════════════════════════════════════════

content.put("/content/batch-status", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const items = body.items;
    if (!items || !Array.isArray(items) || items.length === 0)
      return validationError(c, "Missing items array");

    const validStatuses = ["draft", "published", "rejected"];
    const entityKeyFns: Record<string, (id: string) => string> = {
      keyword: kwKey,
      subtopic: subtopicKey,
      summary: summaryKey,
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

    console.log(`[Content] PUT /content/batch-status: processed ${results.length} items`);
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
