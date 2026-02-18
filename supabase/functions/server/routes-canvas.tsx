// ============================================================
// Axon v4.4 — Section 7: Canvas Blocks + Curriculum Routes
// ============================================================
// 5 routes:
//   PUT  /resumo-blocks/:courseId/:topicId  — Save canvas blocks
//   GET  /resumo-blocks/:courseId/:topicId  — Get blocks for topic
//   GET  /resumo-blocks/:courseId           — Get all blocks for course
//   POST /curriculum/:courseId              — Save curriculum tree
//   GET  /curriculum/:courseId              — Get curriculum
//
// Imports:
//   ./kv-keys.ts      — Canonical key generation functions
//   ./shared-types.ts  — Entity type definitions
//   ./crud-factory.tsx — Shared helpers (auth, errors)
//   ./kv_store.tsx     — KV CRUD operations
//
// KV Keys used:
//   resumo-blocks:{courseId}:{topicId}                → ResumoBlocksDocument
//   curriculum:{courseId}                              → CurriculumDocument
//   idx:course-resumo-blocks:{courseId}:{topicId}     → topicId
//
// Frontend consumers:
//   Canvas Blocks: SummarySessionNew.tsx (editor), PreviewBlock (student)
//   Curriculum: CurriculumAdminView.tsx + useCurriculumCrud.ts
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import type {
  CanvasBlock,
  ResumoBlocksDocument,
  EditableSemester,
  CurriculumDocument,
} from "./shared-types.ts";
import {
  resumoBlocksKey,
  curriculumKey,
  idxCourseResumoBlocks,
  courseKey,
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "./crud-factory.tsx";

const canvas = new Hono();

const VALID_BLOCK_TYPES = [
  "heading", "subheading", "text", "image",
  "callout", "divider", "list", "quote",
];

canvas.put("/resumo-blocks/:courseId/:topicId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");
    const topicId = c.req.param("topicId");

    const course = await kv.get(courseKey(courseId));
    if (!course) return notFound(c, "Course");

    const body = await c.req.json();
    const { blocks } = body;

    if (!blocks || !Array.isArray(blocks)) {
      return validationError(c, "blocks must be an array");
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!block.id) {
        return validationError(c, `blocks[${i}].id is required`);
      }
      if (!block.type || !VALID_BLOCK_TYPES.includes(block.type)) {
        return validationError(
          c,
          `blocks[${i}].type must be one of: ${VALID_BLOCK_TYPES.join(", ")}`
        );
      }
      if (block.content === undefined || block.content === null) {
        return validationError(c, `blocks[${i}].content is required (can be empty string)`);
      }
    }

    const now = new Date().toISOString();

    const doc: ResumoBlocksDocument = {
      course_id: courseId,
      topic_id: topicId,
      blocks: blocks as CanvasBlock[],
      block_count: blocks.length,
      updated_at: now,
      updated_by: user.id,
    };

    await kv.mset(
      [
        resumoBlocksKey(courseId, topicId),
        idxCourseResumoBlocks(courseId, topicId),
      ],
      [doc, topicId]
    );

    console.log(
      `[Canvas] Blocks saved: course=${courseId.slice(0, 8)}... topic=${topicId.slice(0, 8)}... ` +
        `blocks=${blocks.length} by=${user.id.slice(0, 8)}...`
    );

    return c.json({
      success: true,
      data: {
        blocks: doc.blocks,
        block_count: doc.block_count,
        updated_at: doc.updated_at,
      },
    });
  } catch (err) {
    return serverError(c, "PUT /resumo-blocks/:courseId/:topicId", err);
  }
});

canvas.get("/resumo-blocks/:courseId/:topicId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");
    const topicId = c.req.param("topicId");

    const doc: ResumoBlocksDocument | null = await kv.get(
      resumoBlocksKey(courseId, topicId)
    );

    if (!doc) {
      return c.json({
        success: true,
        data: {
          course_id: courseId,
          topic_id: topicId,
          blocks: [],
          block_count: 0,
          updated_at: null,
        },
      });
    }

    return c.json({ success: true, data: doc });
  } catch (err) {
    return serverError(c, "GET /resumo-blocks/:courseId/:topicId", err);
  }
});

canvas.get("/resumo-blocks/:courseId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");

    const topicIds: string[] = await kv.getByPrefix(
      KV_PREFIXES.IDX_COURSE_RESUMO_BLOCKS + courseId + ":"
    );

    if (!topicIds || topicIds.length === 0) {
      return c.json({ success: true, data: [], total: 0 });
    }

    const docs = await kv.mget(
      topicIds.map((topicId: string) => resumoBlocksKey(courseId, topicId))
    );

    const validDocs = docs.filter(Boolean);

    console.log(
      `[Canvas] Course blocks listed: course=${courseId.slice(0, 8)}... ` +
        `topics=${validDocs.length}/${topicIds.length}`
    );

    return c.json({
      success: true,
      data: validDocs,
      total: validDocs.length,
    });
  } catch (err) {
    return serverError(c, "GET /resumo-blocks/:courseId", err);
  }
});

canvas.post("/curriculum/:courseId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");

    const course = await kv.get(courseKey(courseId));
    if (!course) return notFound(c, "Course");

    const body = await c.req.json();
    const { semesters } = body;

    if (!Array.isArray(semesters)) {
      return validationError(c, "semesters must be an array");
    }

    for (let si = 0; si < semesters.length; si++) {
      const sem = semesters[si];
      if (!sem.id || !sem.name) {
        return validationError(c, `semesters[${si}] must have id and name`);
      }
      if (!Array.isArray(sem.sections)) {
        return validationError(c, `semesters[${si}].sections must be an array`);
      }
      for (let sei = 0; sei < sem.sections.length; sei++) {
        const sec = sem.sections[sei];
        if (!sec.id || !sec.name) {
          return validationError(
            c,
            `semesters[${si}].sections[${sei}] must have id and name`
          );
        }
        if (!Array.isArray(sec.topics)) {
          return validationError(
            c,
            `semesters[${si}].sections[${sei}].topics must be an array`
          );
        }
        for (let ti = 0; ti < sec.topics.length; ti++) {
          const topic = sec.topics[ti];
          if (!topic.id || !topic.name) {
            return validationError(
              c,
              `semesters[${si}].sections[${sei}].topics[${ti}] must have id and name`
            );
          }
        }
      }
    }

    const now = new Date().toISOString();

    const doc: CurriculumDocument = {
      course_id: courseId,
      semesters: semesters as EditableSemester[],
      semester_count: semesters.length,
      updated_at: now,
      updated_by: user.id,
    };

    await kv.set(curriculumKey(courseId), doc);

    let totalSections = 0;
    let totalTopics = 0;
    for (const sem of semesters) {
      totalSections += (sem.sections || []).length;
      for (const sec of sem.sections || []) {
        totalTopics += (sec.topics || []).length;
      }
    }

    console.log(
      `[Canvas] Curriculum saved: course=${courseId.slice(0, 8)}... ` +
        `semesters=${semesters.length} sections=${totalSections} ` +
        `topics=${totalTopics} by=${user.id.slice(0, 8)}...`
    );

    return c.json({ success: true, data: { ok: true, updated_at: now } });
  } catch (err) {
    return serverError(c, "POST /curriculum/:courseId", err);
  }
});

canvas.get("/curriculum/:courseId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");

    const doc: CurriculumDocument | null = await kv.get(
      curriculumKey(courseId)
    );

    if (!doc) {
      return c.json({
        success: true,
        data: {
          course_id: courseId,
          semesters: [],
          semester_count: 0,
          updated_at: null,
        },
      });
    }

    return c.json({ success: true, data: doc });
  } catch (err) {
    return serverError(c, "GET /curriculum/:courseId", err);
  }
});

export default canvas;
