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
//
// NOTE: GET /topics/:id/full lives in routes-reading.tsx (Dev 2)
//       which returns the richer response with BKT/FSRS/annotations.
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

// Canonical key functions — kv-keys.ts (ZERO references to kv-keys.tsx)
import {
  // Primary keys
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
  fcKey,
  quizKey,
  // Index keys
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
  idxInstMembers,
  idxUserInsts,
  // Prefixes
  KV_PREFIXES,
} from "./kv-keys.ts";

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
    KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":"
  );
  const keys: string[] = [];
  for (const sId of summaryIds) {
    keys.push(summaryKey(sId), idxTopicSummaries(topicId, sId));
    // Chunks
    const chunkIds = await kv.getByPrefix(KV_PREFIXES.IDX_SUMMARY_CHUNKS + sId + ":");
    for (const cId of chunkIds) keys.push(chunkKey(cId));
    // Keyword cross-references (both directions)
    const kwIds = await kv.getByPrefix(KV_PREFIXES.IDX_SUMMARY_KW + sId + ":");
    for (const kwId of kwIds) {
      keys.push(
        idxSummaryKw(sId, kwId),
        idxKwSummaries(kwId, sId)
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
  primaryKey: courseKey,
  requiredFields: ["name", "institution_id"],
  optionalDefaults: {
    description: null,
    color: "#3b82f6",
    accent_color: "#60a5fa",
    sort_order: 0,
  },
  parentField: "institution_id",
  indexKey: idxInstCourses,
  parentQueryParam: "institution_id",
  listPrefix: (instId: string) => KV_PREFIXES.IDX_INST_COURSES + instId + ":",
  cascadeDelete: async (courseId) => {
    const keys = await cascadeCollect(courseId, [
      {
        childPrefix: (cId: string) => KV_PREFIXES.IDX_COURSE_SEMESTERS + cId + ":",
        childPrimaryKey: semesterKey,
        childIndexKey: idxCourseSemesters,
      },
      {
        childPrefix: (sId: string) => KV_PREFIXES.IDX_SEMESTER_SECTIONS + sId + ":",
        childPrimaryKey: sectionKey,
        childIndexKey: idxSemesterSections,
      },
      {
        childPrefix: (secId: string) => KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
        childPrimaryKey: topicKey,
        childIndexKey: idxSectionTopics,
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
  route: "semesters",
  label: "Semester",
  primaryKey: semesterKey,
  requiredFields: ["name", "course_id"],
  optionalDefaults: { year: null, sort_order: 0 },
  parentField: "course_id",
  indexKey: idxCourseSemesters,
  parentQueryParam: "course_id",
  listPrefix: (courseId: string) => KV_PREFIXES.IDX_COURSE_SEMESTERS + courseId + ":",
  cascadeDelete: async (semesterId) => {
    const keys = await cascadeCollect(semesterId, [
      {
        childPrefix: (sId: string) => KV_PREFIXES.IDX_SEMESTER_SECTIONS + sId + ":",
        childPrimaryKey: sectionKey,
        childIndexKey: idxSemesterSections,
      },
      {
        childPrefix: (secId: string) => KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
        childPrimaryKey: topicKey,
        childIndexKey: idxSectionTopics,
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
  primaryKey: sectionKey,
  requiredFields: ["name", "semester_id"],
  optionalDefaults: { region: null, image_url: null, sort_order: 0 },
  parentField: "semester_id",
  indexKey: idxSemesterSections,
  parentQueryParam: "semester_id",
  listPrefix: (semId: string) => KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":",
  cascadeDelete: async (sectionId) => {
    const keys = await cascadeCollect(sectionId, [
      {
        childPrefix: (secId: string) => KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
        childPrimaryKey: topicKey,
        childIndexKey: idxSectionTopics,
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
  primaryKey: topicKey,
  requiredFields: ["name", "section_id"],
  optionalDefaults: { description: null, sort_order: 0 },
  parentField: "section_id",
  indexKey: idxSectionTopics,
  parentQueryParam: "section_id",
  listPrefix: (secId: string) => KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
  cascadeDelete: (topicId) => collectSummaryCascadeKeys(topicId),
});

// NOTE: GET /topics/:id/full is handled by routes-reading.tsx (Dev 2)
// which returns the richer response including BKT, FSRS, flashcards,
// quiz questions, and annotations. Do NOT re-add it here.

registerCrudRoutes(content, {
  route: "subtopics",
  label: "SubTopic",
  primaryKey: subtopicKey,
  requiredFields: ["keyword_id", "title"],
  optionalDefaults: { description: null, priority: null, status: "draft" },
  parentField: "keyword_id",
  indexKey: idxKwSubtopics,
  parentQueryParam: "keyword_id",
  listPrefix: (kwId: string) => KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":",
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
    await kv.set(instKey(id), inst);

    const membership = {
      id: crypto.randomUUID(),
      institution_id: id,
      user_id: user.id,
      role: "admin",
      joined_at: inst.created_at,
    };
    await kv.mset(
      [
        memberKey(id, user.id),
        idxInstMembers(id, user.id),
        idxUserInsts(user.id, id),
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
    const inst = await kv.get(instKey(c.req.param("id")));
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
    const userIds = await kv.getByPrefix(KV_PREFIXES.IDX_INST_MEMBERS + instId + ":");
    if (!userIds || userIds.length === 0)
      return c.json({ success: true, data: [] });
    const memberships = await kv.mget(
      userIds.map((uid: string) => memberKey(instId, uid))
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
      id: crypto.randomUUID(),
      institution_id: instId,
      user_id: body.user_id,
      role: body.role,
      joined_at: new Date().toISOString(),
    };
    await kv.mset(
      [
        memberKey(instId, body.user_id),
        idxInstMembers(instId, body.user_id),
        idxUserInsts(body.user_id, instId),
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
      memberKey(instId, userId),
      idxInstMembers(instId, userId),
      idxUserInsts(userId, instId),
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
    if (!body.topic_id || !body.course_id || !body.content_markdown || !body.status)
      return validationError(c, "Missing topic_id, course_id, content_markdown, or status");
    const id = crypto.randomUUID();
    const summary = {
      id,
      topic_id: body.topic_id,
      course_id: body.course_id,
      institution_id: body.institution_id || null,
      title: body.title || null,
      content_markdown: body.content_markdown,
      status: body.status,
      source: body.source || "manual",
      created_at: new Date().toISOString(),
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };
    await kv.mset(
      [summaryKey(id), idxTopicSummaries(body.topic_id, id)],
      [summary, id]
    );
    console.log(`[Content] POST /summaries \u2192 kv.mset OK for summary:${id}`);
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
      KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":",
      summaryKey
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
    const summary = await kv.get(summaryKey(c.req.param("id")));
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
    const existing = await kv.get(summaryKey(id));
    if (!existing) return notFound(c, "Summary");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      topic_id: existing.topic_id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(summaryKey(id), updated);
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
    const summary = await kv.get(summaryKey(id));
    if (!summary) return notFound(c, "Summary");
    const keysToDelete: string[] = [
      summaryKey(id),
      idxTopicSummaries(summary.topic_id, id),
    ];
    const chunkIds = await kv.getByPrefix(KV_PREFIXES.IDX_SUMMARY_CHUNKS + id + ":");
    for (const cId of chunkIds) keysToDelete.push(chunkKey(cId));
    const kwIds = await kv.getByPrefix(KV_PREFIXES.IDX_SUMMARY_KW + id + ":");
    for (const kwId of kwIds) {
      keysToDelete.push(
        idxSummaryKw(id, kwId),
        idxKwSummaries(kwId, id)
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
      KV_PREFIXES.IDX_SUMMARY_CHUNKS + c.req.param("id") + ":",
      chunkKey
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
    const chunkText = body.chunk_text || body.content;
    if (!chunkText) return validationError(c, "Missing chunk_text");
    const id = crypto.randomUUID();
    const chunkIndex = body.chunk_index ?? body.sort_order ?? 0;
    const chunk = {
      id,
      summary_id: summaryId,
      chunk_text: chunkText,
      chunk_index: chunkIndex,
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
      kwKey(id),
      idxInstKw(body.institution_id, id),
    ];
    const vals: any[] = [keyword, id];
    if (body.summary_ids && Array.isArray(body.summary_ids)) {
      for (const sId of body.summary_ids) {
        keys.push(idxSummaryKw(sId, id));
        vals.push(id);
        keys.push(idxKwSummaries(id, sId));
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
      keys.push(kwInstKey(instId));
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
    const keyword = await kv.get(kwKey(id));
    if (!keyword) return notFound(c, "Keyword");
    const subtopics = await getChildren(
      KV_PREFIXES.IDX_KW_SUBTOPICS + id + ":",
      subtopicKey
    );
    const connIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_CONN + id + ":");
    let connections: any[] = [];
    if (connIds.length > 0) {
      connections = (
        await kv.mget(connIds.map((cId: string) => connKey(cId)))
      ).filter(Boolean);
    }
    const summaryIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_SUMMARIES + id + ":"
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
    const existing = await kv.get(kwKey(id));
    if (!existing) return notFound(c, "Keyword");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(kwKey(id), updated);
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
    const keyword = await kv.get(kwKey(id));
    if (!keyword) return notFound(c, "Keyword");
    const stIds = await kv.getByPrefix(KV_PREFIXES.IDX_KW_SUBTOPICS + id + ":");
    const cIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_CONN + id + ":"
    );
    const sIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_SUMMARIES + id + ":"
    );
    const keysToDelete: string[] = [
      kwKey(id),
      idxInstKw(keyword.institution_id, id),
      ...stIds.map((stId: string) => subtopicKey(stId)),
      ...stIds.map((stId: string) => idxKwSubtopics(id, stId)),
      ...cIds.map((cId: string) => connKey(cId)),
      ...cIds.map((cId: string) =>
        idxKwConn(id, cId)
      ),
      ...sIds.map((sId: string) =>
        idxKwSummaries(id, sId)
      ),
      ...sIds.map((sId: string) =>
        idxSummaryKw(sId, id)
      ),
    ];
    for (const cId of cIds) {
      const conn = await kv.get(connKey(cId));
      if (conn) {
        const otherId =
          conn.keyword_a_id === id
            ? conn.keyword_b_id
            : conn.keyword_a_id;
        keysToDelete.push(idxKwConn(otherId, cId));
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
        connKey(id),
        idxKwConn(body.keyword_a_id, id),
        idxKwConn(body.keyword_b_id, id),
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
      KV_PREFIXES.IDX_KW_CONN + kwId + ":"
    );
    if (!connIds || connIds.length === 0)
      return c.json({ success: true, data: [] });
    const conns = (
      await kv.mget(connIds.map((cId: string) => connKey(cId)))
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
    const conn = await kv.get(connKey(c.req.param("id")));
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
    const conn = await kv.get(connKey(id));
    if (!conn) return notFound(c, "Connection");
    await kv.mdel([
      connKey(id),
      idxKwConn(conn.keyword_a_id, id),
      idxKwConn(conn.keyword_b_id, id),
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
      keyword: kwKey,
      subtopic: subtopicKey,
      summary: summaryKey,
      flashcard: fcKey,
      quiz_question: quizKey,
    };

    const results: any[] = [];
    const keysToWrite: string[] = [];
    const valsToWrite: any[] = [];

    for (const item of items) {
      const entity_type = item.entity_type || item.type;
      const id = item.id;
      const new_status = item.new_status || item.status;
      if (!entity_type || !id || !new_status)
        return validationError(
          c,
          "Invalid item: missing entity_type/type, id, or new_status/status"
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
