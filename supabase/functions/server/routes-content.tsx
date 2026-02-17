// ============================================================
// Axon v4.2 — Dev 1: Content Management Routes
// CRUD for: Institution, Membership, Course, Semester, Section,
//           Topic, Summary, Chunk, Keyword, SubTopic, Connection
// + Batch content approval (D20)
//
// Standard entities (courses, semesters, sections, topics,
// subtopics) use the generic CRUD factory from crud-factory.tsx.
// Complex entities (institutions, summaries, keywords,
// connections) remain manual due to custom logic.
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { KV } from "./kv-keys.tsx";
import {
  registerCrudRoutes,
  cascadeCollect,
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  getChildren,
} from "./crud-factory.tsx";

const content = new Hono();

// ── Cascade helper: collect summary + chunk + kw-xref keys ────
// Reused by topic, section, semester, and course cascade deletes.
async function collectSummaryCascadeKeys(
  topicId: string
): Promise<string[]> {
  const summaryIds = await kv.getByPrefix(
    KV.PREFIX.summariesOfTopic(topicId)
  );
  const keys: string[] = [];
  for (const sId of summaryIds) {
    keys.push(KV.summary(sId), KV.IDX.summaryOfTopic(topicId, sId));
    // Chunks
    const chunkIds = await kv.getByPrefix(KV.PREFIX.chunksOfSummary(sId));
    for (const cId of chunkIds) keys.push(KV.chunk(cId));
    // Keyword cross-references (both directions)
    const kwIds = await kv.getByPrefix(KV.PREFIX.keywordsOfSummary(sId));
    for (const kwId of kwIds) {
      keys.push(
        KV.IDX.keywordOfSummary(sId, kwId),
        KV.IDX.summaryOfKeyword(kwId, sId)
      );
    }
  }
  return keys;
}

// ================================================================
// FACTORY-REGISTERED ENTITIES
// 5 configs x 5 handlers each = 25 routes generated automatically
// ================================================================

registerCrudRoutes(content, {
  route: "courses",
  label: "Course",
  primaryKey: KV.course,
  requiredFields: ["name", "institution_id"],
  optionalDefaults: {
    description: null,
    color: "#3b82f6",
    accent_color: "#60a5fa",
    sort_order: 0,
  },
  parentField: "institution_id",
  indexKey: KV.IDX.courseOfInst,
  parentQueryParam: "institution_id",
  listPrefix: KV.PREFIX.coursesOfInst,
  cascadeDelete: async (courseId) => {
    // Level 0-2: semesters -> sections -> topics
    const keys = await cascadeCollect(courseId, [
      {
        childPrefix: KV.PREFIX.semestersOfCourse,
        childPrimaryKey: KV.semester,
        childIndexKey: KV.IDX.semesterOfCourse,
      },
      {
        childPrefix: KV.PREFIX.sectionsOfSemester,
        childPrimaryKey: KV.section,
        childIndexKey: KV.IDX.sectionOfSemester,
      },
      {
        childPrefix: KV.PREFIX.topicsOfSection,
        childPrimaryKey: KV.topic,
        childIndexKey: KV.IDX.topicOfSection,
      },
    ]);
    // Level 3+: summaries -> chunks + keyword cross-refs
    const topicIds = keys
      .filter((k) => k.startsWith("topic:"))
      .map((k) => k.slice(6));
    for (const tid of topicIds) {
      keys.push(...(await collectSummaryCascadeKeys(tid)));
    }
    return keys;
  },
});

registerCrudRoutes(content, {
  route: "semesters",
  label: "Semester",
  primaryKey: KV.semester,
  requiredFields: ["title", "course_id"],
  optionalDefaults: { year: null, sort_order: 0 },
  parentField: "course_id",
  indexKey: KV.IDX.semesterOfCourse,
  parentQueryParam: "course_id",
  listPrefix: KV.PREFIX.semestersOfCourse,
  cascadeDelete: async (semesterId) => {
    const keys = await cascadeCollect(semesterId, [
      {
        childPrefix: KV.PREFIX.sectionsOfSemester,
        childPrimaryKey: KV.section,
        childIndexKey: KV.IDX.sectionOfSemester,
      },
      {
        childPrefix: KV.PREFIX.topicsOfSection,
        childPrimaryKey: KV.topic,
        childIndexKey: KV.IDX.topicOfSection,
      },
    ]);
    const topicIds = keys
      .filter((k) => k.startsWith("topic:"))
      .map((k) => k.slice(6));
    for (const tid of topicIds) {
      keys.push(...(await collectSummaryCascadeKeys(tid)));
    }
    return keys;
  },
});

registerCrudRoutes(content, {
  route: "sections",
  label: "Section",
  primaryKey: KV.section,
  requiredFields: ["title", "semester_id"],
  optionalDefaults: { region: null, image_url: null, sort_order: 0 },
  parentField: "semester_id",
  indexKey: KV.IDX.sectionOfSemester,
  parentQueryParam: "semester_id",
  listPrefix: KV.PREFIX.sectionsOfSemester,
  cascadeDelete: async (sectionId) => {
    const keys = await cascadeCollect(sectionId, [
      {
        childPrefix: KV.PREFIX.topicsOfSection,
        childPrimaryKey: KV.topic,
        childIndexKey: KV.IDX.topicOfSection,
      },
    ]);
    const topicIds = keys
      .filter((k) => k.startsWith("topic:"))
      .map((k) => k.slice(6));
    for (const tid of topicIds) {
      keys.push(...(await collectSummaryCascadeKeys(tid)));
    }
    return keys;
  },
});

registerCrudRoutes(content, {
  route: "topics",
  label: "Topic",
  primaryKey: KV.topic,
  requiredFields: ["title", "section_id"],
  optionalDefaults: { description: null, sort_order: 0 },
  parentField: "section_id",
  indexKey: KV.IDX.topicOfSection,
  parentQueryParam: "section_id",
  listPrefix: KV.PREFIX.topicsOfSection,
  cascadeDelete: (topicId) => collectSummaryCascadeKeys(topicId),
});

registerCrudRoutes(content, {
  route: "subtopics",
  label: "SubTopic",
  primaryKey: KV.subtopic,
  requiredFields: ["keyword_id", "title"],
  optionalDefaults: { description: null, priority: null, status: "draft" },
  parentField: "keyword_id",
  indexKey: KV.IDX.subtopicOfKeyword,
  parentQueryParam: "keyword_id",
  listPrefix: KV.PREFIX.subtopicsOfKeyword,
  // Leaf entity — no cascade needed
});

// ================================================================
// MANUAL ROUTES — Institutions (auto-membership on create)
// ================================================================

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
  } catch (err) {
    return serverError(c, "POST /institutions", err);
  }
});

content.get("/institutions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const inst = await kv.get(KV.institution(c.req.param("id")));
    if (!inst) return notFound(c, "Institution");
    return c.json({ success: true, data: inst });
  } catch (err) {
    return serverError(c, "GET /institutions/:id", err);
  }
});

content.get("/institutions/:id/members", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.param("id");
    const userIds = await kv.getByPrefix(KV.PREFIX.membersOfInst(instId));
    if (!userIds || userIds.length === 0)
      return c.json({ success: true, data: [] });
    const memberships = await kv.mget(
      userIds.map((uid: string) => KV.membership(instId, uid))
    );
    return c.json({ success: true, data: memberships.filter(Boolean) });
  } catch (err) {
    return serverError(c, "GET /institutions/:id/members", err);
  }
});

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
  } catch (err) {
    return serverError(c, "POST /institutions/:id/members", err);
  }
});

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
  } catch (err) {
    return serverError(c, "DELETE member", err);
  }
});

// ================================================================
// MANUAL ROUTES — Summaries (chunks, keyword cross-refs, status)
// ================================================================

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
      status: body.status || "draft",
      source: body.source || "manual",
      created_at: new Date().toISOString(),
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };
    await kv.mset(
      [KV.summary(id), KV.IDX.summaryOfTopic(body.topic_id, id)],
      [summary, id]
    );
    console.log(`[Content] POST /summaries → kv.mset OK for summary:${id}`);
    return c.json({ success: true, data: summary }, 201);
  } catch (err) {
    return serverError(c, "POST /summaries", err);
  }
});

content.get("/summaries", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const topicId = c.req.query("topic_id");
    if (!topicId)
      return validationError(c, "topic_id query param required");
    const summaries = await getChildren(
      KV.PREFIX.summariesOfTopic(topicId),
      KV.summary
    );
    return c.json({ success: true, data: summaries });
  } catch (err) {
    return serverError(c, "GET /summaries", err);
  }
});

content.get("/summaries/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const summary = await kv.get(KV.summary(c.req.param("id")));
    if (!summary) return notFound(c, "Summary");
    return c.json({ success: true, data: summary });
  } catch (err) {
    return serverError(c, "GET /summaries/:id", err);
  }
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
      topic_id: existing.topic_id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(KV.summary(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /summaries/:id", err);
  }
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
    const chunkIds = await kv.getByPrefix(KV.PREFIX.chunksOfSummary(id));
    for (const cId of chunkIds) keysToDelete.push(KV.chunk(cId));
    const kwIds = await kv.getByPrefix(KV.PREFIX.keywordsOfSummary(id));
    for (const kwId of kwIds) {
      keysToDelete.push(
        KV.IDX.keywordOfSummary(id, kwId),
        KV.IDX.summaryOfKeyword(kwId, id)
      );
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /summaries/:id", err);
  }
});

content.get("/summaries/:id/chunks", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const chunks = await getChildren(
      KV.PREFIX.chunksOfSummary(c.req.param("id")),
      KV.chunk
    );
    return c.json({ success: true, data: chunks });
  } catch (err) {
    return serverError(c, "GET /summaries/:id/chunks", err);
  }
});

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
  } catch (err) {
    return serverError(c, "POST /summaries/:id/chunk", err);
  }
});

// ================================================================
// MANUAL ROUTES — Keywords (enriched GET, cross-refs, instances)
// ================================================================

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
      KV.keyword(id),
      KV.IDX.keywordOfInst(body.institution_id, id),
    ];
    const vals: any[] = [keyword, id];
    if (body.summary_ids && Array.isArray(body.summary_ids)) {
      for (const sId of body.summary_ids) {
        keys.push(KV.IDX.keywordOfSummary(sId, id));
        vals.push(id);
        keys.push(KV.IDX.summaryOfKeyword(id, sId));
        vals.push(sId);
      }
    }
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
  } catch (err) {
    return serverError(c, "POST /keywords", err);
  }
});

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
    return validationError(
      c,
      "institution_id or summary_id query param required"
    );
  } catch (err) {
    return serverError(c, "GET /keywords", err);
  }
});

content.get("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const keyword = await kv.get(KV.keyword(id));
    if (!keyword) return notFound(c, "Keyword");
    const subtopics = await getChildren(
      KV.PREFIX.subtopicsOfKeyword(id),
      KV.subtopic
    );
    const connIds = await kv.getByPrefix(KV.PREFIX.connectionsOfKeyword(id));
    let connections: any[] = [];
    if (connIds.length > 0) {
      connections = (
        await kv.mget(connIds.map((cId: string) => KV.connection(cId)))
      ).filter(Boolean);
    }
    const summaryIds = await kv.getByPrefix(
      KV.PREFIX.summariesOfKeyword(id)
    );
    return c.json({
      success: true,
      data: {
        ...keyword,
        subtopics,
        connections,
        linked_summary_ids: summaryIds,
      },
    });
  } catch (err) {
    return serverError(c, "GET /keywords/:id", err);
  }
});

content.put("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(KV.keyword(id));
    if (!existing) return notFound(c, "Keyword");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(KV.keyword(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /keywords/:id", err);
  }
});

content.delete("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const kw = await kv.get(KV.keyword(id));
    if (!kw) return notFound(c, "Keyword");
    const stIds = await kv.getByPrefix(KV.PREFIX.subtopicsOfKeyword(id));
    const connIds = await kv.getByPrefix(
      KV.PREFIX.connectionsOfKeyword(id)
    );
    const summaryIds = await kv.getByPrefix(
      KV.PREFIX.summariesOfKeyword(id)
    );
    const keysToDelete: string[] = [
      KV.keyword(id),
      KV.IDX.keywordOfInst(kw.institution_id, id),
      ...stIds.map((stId: string) => KV.subtopic(stId)),
      ...stIds.map((stId: string) => KV.IDX.subtopicOfKeyword(id, stId)),
      ...connIds.map((cId: string) => KV.connection(cId)),
      ...connIds.map((cId: string) =>
        KV.IDX.connectionOfKeyword(id, cId)
      ),
      ...summaryIds.map((sId: string) =>
        KV.IDX.summaryOfKeyword(id, sId)
      ),
      ...summaryIds.map((sId: string) =>
        KV.IDX.keywordOfSummary(sId, id)
      ),
    ];
    for (const cId of connIds) {
      const conn = await kv.get(KV.connection(cId));
      if (conn) {
        const otherId =
          conn.keyword_a_id === id
            ? conn.keyword_b_id
            : conn.keyword_a_id;
        keysToDelete.push(KV.IDX.connectionOfKeyword(otherId, cId));
      }
    }
    await kv.mdel(keysToDelete);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /keywords/:id", err);
  }
});

// ================================================================
// MANUAL ROUTES — Connections (bidirectional indices)
// ================================================================

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
  } catch (err) {
    return serverError(c, "POST /connections", err);
  }
});

content.get("/connections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.query("keyword_id");
    if (!kwId)
      return validationError(c, "keyword_id query param required");
    const connIds = await kv.getByPrefix(
      KV.PREFIX.connectionsOfKeyword(kwId)
    );
    if (!connIds || connIds.length === 0)
      return c.json({ success: true, data: [] });
    const conns = (
      await kv.mget(connIds.map((cId: string) => KV.connection(cId)))
    ).filter(Boolean);
    return c.json({ success: true, data: conns });
  } catch (err) {
    return serverError(c, "GET /connections", err);
  }
});

content.get("/connections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const conn = await kv.get(KV.connection(c.req.param("id")));
    if (!conn) return notFound(c, "Connection");
    return c.json({ success: true, data: conn });
  } catch (err) {
    return serverError(c, "GET /connections/:id", err);
  }
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
  } catch (err) {
    return serverError(c, "DELETE /connections/:id", err);
  }
});

// ================================================================
// BATCH CONTENT APPROVAL (D20)
// PUT /content/batch-status
// Supports: keyword, subtopic, summary, flashcard, quiz_question
// ================================================================

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
      keyword: KV.keyword,
      subtopic: KV.subtopic,
      summary: KV.summary,
      flashcard: KV.flashcard,
      quiz_question: KV.quizQuestion,
    };

    const results: any[] = [];
    const keysToWrite: string[] = [];
    const valsToWrite: any[] = [];

    for (const item of items) {
      const { entity_type, id, new_status } = item;
      if (!entity_type || !id || !new_status)
        return validationError(
          c,
          "Invalid item: missing entity_type, id, or new_status"
        );
      if (!validStatuses.includes(new_status))
        return validationError(
          c,
          `Invalid status: ${new_status}. Must be one of: ${validStatuses.join(", ")}`
        );
      const keyFn = entityKeyFns[entity_type];
      if (!keyFn)
        return validationError(
          c,
          `Unsupported entity_type: ${entity_type}. Must be one of: ${Object.keys(entityKeyFns).join(", ")}`
        );

      const existing = await kv.get(keyFn(id));
      if (!existing) {
        results.push({
          id,
          entity_type,
          success: false,
          reason: "not found",
        });
        continue;
      }
      const updated = {
        ...existing,
        status: new_status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewer_note: item.reviewer_note || body.reviewer_note || null,
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
        approved: results.filter(
          (r) => r.success && r.new_status === "published"
        ).length,
        rejected: results.filter(
          (r) => r.success && r.new_status === "rejected"
        ).length,
        errors: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (err) {
    return serverError(c, "PUT /content/batch-status", err);
  }
});

export default content;