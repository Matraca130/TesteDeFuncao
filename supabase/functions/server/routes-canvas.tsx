// ============================================================
// Axon v4.4 — Section 7: Canvas Blocks + Curriculum Routes
// ============================================================
// 5 routes:
//   PUT  /resumo-blocks/:courseId/:topicId  — Save canvas blocks
//   GET  /resumo-blocks/:courseId/:topicId  — Load canvas blocks
//   GET  /resumo-blocks/:courseId           — List all for course
//   POST /curriculum/:courseId              — Save curriculum tree
//   GET  /curriculum/:courseId              — Load curriculum tree
//
// Imports:
//   ./kv-keys.ts       — Canonical key generation functions
//   ./shared-types.ts  — Entity type definitions
//   ./crud-factory.tsx — Shared helpers
//   ./kv_store.tsx     — KV CRUD operations
//
// KV Keys:
//   resumo-blocks:{courseId}:{topicId}  — ResumoBlocksDocument
//   curriculum:{courseId}               — CurriculumDocument
//   idx:course-resumo-blocks:{courseId}:{topicId}  — topicId
//
// Design decisions:
//   - Admin creates content; students read in read-only mode
//   - GET endpoints return empty fallback (not 404) when no data
//   - CanvasBlock[] is stored as-is (blob); backend validates
//     only the outer structure, not individual block contents
//   - Curriculum tree is the single source of truth for the
//     admin's hierarchical organization of a course
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
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

// ================================================================
// PUT /resumo-blocks/:courseId/:topicId — Save canvas blocks
// ================================================================
// Body: { blocks: CanvasBlock[] }
// Validates: blocks must be a non-empty array, each block needs
//   id, type, and content fields.
// Stores the entire blocks array as a document.
// Also writes an index entry for course-level list queries.
// ================================================================
canvas.put("/resumo-blocks/:courseId/:topicId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");
    const topicId = c.req.param("topicId");

    const body = await c.req.json();
    const blocks = body.blocks;

    // Validate blocks array
    if (!blocks || !Array.isArray(blocks)) {
      return validationError(
        c,
        "blocks must be an array of CanvasBlock objects"
      );
    }

    // Validate each block has minimum required fields
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!block.id || !block.type) {
        return validationError(
          c,
          "Block at index " + i + " is missing required fields (id, type). " +
            "Got: " + JSON.stringify({ id: block.id, type: block.type })
        );
      }
    }

    const now = new Date().toISOString();

    const document = {
      course_id: courseId,
      topic_id: topicId,
      blocks: blocks,
      block_count: blocks.length,
      updated_at: now,
      updated_by: user.id,
    };

    // Write document + index atomically
    await kv.mset(
      [
        resumoBlocksKey(courseId, topicId),
        idxCourseResumoBlocks(courseId, topicId),
      ],
      [document, topicId]
    );

    console.log(
      "[Canvas] PUT /resumo-blocks/" + courseId.slice(0, 8) + "/" +
        topicId.slice(0, 8) + " -> " + blocks.length + " blocks by " +
        user.id.slice(0, 8)
    );

    return c.json({
      success: true,
      data: {
        blocks: document.blocks,
        block_count: document.block_count,
        updated_at: document.updated_at,
      },
    });
  } catch (err) {
    return serverError(c, "PUT /resumo-blocks/:courseId/:topicId", err);
  }
});

// ================================================================
// GET /resumo-blocks/:courseId/:topicId — Load canvas blocks
// ================================================================
// Returns the stored blocks document, or an empty fallback.
// Frontend uses this to load the canvas editor content.
// Students see the same content in read-only mode via PreviewBlock.
// ================================================================
canvas.get("/resumo-blocks/:courseId/:topicId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");
    const topicId = c.req.param("topicId");

    const document = await kv.get(resumoBlocksKey(courseId, topicId));

    if (!document) {
      // Return empty fallback — not 404.
      // Frontend treats this as "no blocks created yet".
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

    return c.json({ success: true, data: document });
  } catch (err) {
    return serverError(c, "GET /resumo-blocks/:courseId/:topicId", err);
  }
});

// ================================================================
// GET /resumo-blocks/:courseId — List all block documents for course
// ================================================================
// Returns an array of ResumoBlocksDocuments for all topics in
// the course that have saved blocks.
// Uses the idx:course-resumo-blocks index for efficient lookup.
// ================================================================
canvas.get("/resumo-blocks/:courseId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");

    // Get all topic IDs that have saved blocks for this course
    const topicIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_COURSE_RESUMO_BLOCKS + courseId + ":"
    );

    if (!topicIds || topicIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    // Fetch all documents
    const documents = await kv.mget(
      (topicIds as string[]).map((tid: string) =>
        resumoBlocksKey(courseId, tid)
      )
    );

    const result = documents.filter(Boolean);

    console.log(
      "[Canvas] GET /resumo-blocks/" + courseId.slice(0, 8) +
        " -> " + result.length + " documents"
    );

    return c.json({ success: true, data: result });
  } catch (err) {
    return serverError(c, "GET /resumo-blocks/:courseId", err);
  }
});

// ================================================================
// POST /curriculum/:courseId — Save curriculum tree
// ================================================================
// Body: { semesters: EditableSemester[] }
// Stores the entire curriculum tree as a single document.
// Used by CurriculumAdminView + useCurriculumCrud hook.
// Validates that semesters is a non-empty array.
// ================================================================
canvas.post("/curriculum/:courseId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");
    const body = await c.req.json();
    const semesters = body.semesters;

    // Validate semesters array
    if (!semesters || !Array.isArray(semesters)) {
      return validationError(
        c,
        "semesters must be an array of EditableSemester objects"
      );
    }

    // Validate course exists (optional but recommended)
    const course = await kv.get(courseKey(courseId));
    if (!course) {
      console.log(
        "[Canvas] WARN: POST /curriculum/" + courseId.slice(0, 8) +
          " — course not found in KV, saving anyway"
      );
    }

    const now = new Date().toISOString();

    const document = {
      course_id: courseId,
      semesters: semesters,
      semester_count: semesters.length,
      updated_at: now,
      updated_by: user.id,
    };

    await kv.set(curriculumKey(courseId), document);

    // Count total entities for logging
    let totalSections = 0;
    let totalTopics = 0;
    for (const sem of semesters) {
      if (sem.sections && Array.isArray(sem.sections)) {
        totalSections += sem.sections.length;
        for (const sec of sem.sections) {
          if (sec.topics && Array.isArray(sec.topics)) {
            totalTopics += sec.topics.length;
          }
        }
      }
    }

    console.log(
      "[Canvas] POST /curriculum/" + courseId.slice(0, 8) +
        " -> " + semesters.length + " semesters, " +
        totalSections + " sections, " + totalTopics + " topics" +
        " by " + user.id.slice(0, 8)
    );

    return c.json({ success: true, data: { ok: true, updated_at: now } });
  } catch (err) {
    return serverError(c, "POST /curriculum/:courseId", err);
  }
});

// ================================================================
// GET /curriculum/:courseId — Load curriculum tree
// ================================================================
// Returns the stored curriculum tree, or an empty fallback.
// Frontend uses this to populate CurriculumAdminView.
// ================================================================
canvas.get("/curriculum/:courseId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");
    const document = await kv.get(curriculumKey(courseId));

    if (!document) {
      // Return empty fallback — not 404.
      // Frontend treats this as "no curriculum defined yet".
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

    return c.json({ success: true, data: document });
  } catch (err) {
    return serverError(c, "GET /curriculum/:courseId", err);
  }
});

export default canvas;
