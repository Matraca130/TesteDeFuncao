// ============================================================
// Axon v4.2 — Dev 2: Summary / Reading Experience Routes
// ============================================================
// 6 routes: reading-state CRUD, annotations CRUD
// 1 shared route: GET /topics/:topicId/full
//
// KV Keys used:
//   reading:{studentId}:{summaryId}  → SummaryReadingState
//   annotation:{id}                  → SummaryAnnotation
//   idx:student-reading:{sId}:{sumId}            → summaryId
//   idx:student-annotations:{sId}:{sumId}:{annId} → annotationId
//
// Decisions: D13 (published only), D34 (PostSummaryChoice),
//            D38 (student reads only), D15 (inline quiz placeholder)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { KV } from "./kv-keys.tsx";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  getChildren,
} from "./crud-factory.tsx";

const reading = new Hono();

// ── Valid highlight colors (D34 HighlightColor enum) ──────
const VALID_HIGHLIGHT_COLORS = ["yellow", "blue", "green", "pink"] as const;

// ================================================================
// PUT /reading-state — Upsert reading progress
// ================================================================
// Auto-saves from frontend every ~30s.
// reading_time_seconds is ADDITIVE (accumulated).
// completed flips to true once and stays true.
// ================================================================
reading.put("/reading-state", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = user.id;

    const body = await c.req.json();
    if (!body.summary_id) {
      return validationError(c, "summary_id is required");
    }

    const key = KV.readingState(userId, body.summary_id);
    const existing = await kv.get(key);

    const state = {
      student_id: userId,
      summary_id: body.summary_id,
      scroll_position: body.scroll_position ?? existing?.scroll_position ?? 0,
      // Additive: frontend sends delta seconds since last save
      reading_time_seconds:
        (existing?.reading_time_seconds ?? 0) +
        (body.reading_time_seconds ?? 0),
      // Once completed, stays completed
      completed: body.completed || existing?.completed || false,
      last_read_at: new Date().toISOString(),
    };

    // Write primary + index atomically
    await kv.mset(
      [key, KV.IDX.readingOfStudent(userId, body.summary_id)],
      [state, body.summary_id]
    );

    console.log(
      `[Reading] State saved: student=${userId.slice(0, 8)}… summary=${body.summary_id.slice(0, 8)}… ` +
        `scroll=${state.scroll_position} time=${state.reading_time_seconds}s completed=${state.completed}`
    );

    return c.json({ success: true, data: state });
  } catch (err) {
    return serverError(c, "PUT /reading-state", err);
  }
});

// ================================================================
// GET /reading-state/:summaryId — Get reading state for a summary
// ================================================================
// Returns null (not 404) if no state exists yet — frontend
// treats null as "never started reading".
// ================================================================
reading.get("/reading-state/:summaryId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.param("summaryId");
    const state = await kv.get(KV.readingState(user.id, summaryId));

    return c.json({ success: true, data: state || null });
  } catch (err) {
    return serverError(c, "GET /reading-state/:summaryId", err);
  }
});

// ================================================================
// POST /annotations — Create a new highlight/annotation
// ================================================================
// Body: { summary_id, selected_text, note?, color?, start_offset?, end_offset? }
// Color defaults to "yellow" if not provided or invalid.
// ================================================================
reading.post("/annotations", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = user.id;

    const body = await c.req.json();
    if (!body.summary_id || !body.selected_text) {
      return validationError(
        c,
        "summary_id and selected_text are required"
      );
    }

    // Validate color — default to yellow
    const color = VALID_HIGHLIGHT_COLORS.includes(body.color)
      ? body.color
      : "yellow";

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const annotation = {
      id,
      student_id: userId,
      summary_id: body.summary_id,
      selected_text: body.selected_text,
      note: body.note ?? "",
      color,
      start_offset: body.start_offset ?? null,
      end_offset: body.end_offset ?? null,
      created_at: now,
      updated_at: now,
    };

    // Write primary + index
    await kv.mset(
      [
        KV.annotation(id),
        KV.IDX.annotationOfStudent(userId, body.summary_id, id),
      ],
      [annotation, id]
    );

    console.log(
      `[Reading] Annotation created: ${id.slice(0, 8)}… color=${color} ` +
        `student=${userId.slice(0, 8)}… summary=${body.summary_id.slice(0, 8)}…`
    );

    return c.json({ success: true, data: annotation }, 201);
  } catch (err) {
    return serverError(c, "POST /annotations", err);
  }
});

// ================================================================
// GET /annotations?summary_id=X — List annotations for a summary
// ================================================================
// Returns all annotations the authenticated student has on
// the given summary. Empty array if none.
// ================================================================
reading.get("/annotations", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.query("summary_id");
    if (!summaryId) {
      return validationError(c, "summary_id query param required");
    }

    // getByPrefix returns VALUES (annotation IDs stored in index)
    const annotationIds = await kv.getByPrefix(
      KV.PREFIX.annotationsOfStudentSummary(user.id, summaryId)
    );

    if (!annotationIds || annotationIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    // Fetch annotation objects by primary key
    const annotations = await kv.mget(
      annotationIds.map((id: string) => KV.annotation(id))
    );

    return c.json({
      success: true,
      data: annotations.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /annotations", err);
  }
});

// ================================================================
// PUT /annotations/:id — Update an annotation (note, color)
// ================================================================
// Only the owning student can update. Cannot change summary_id
// or selected_text (immutable after creation).
// ================================================================
reading.put("/annotations/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const existing = await kv.get(KV.annotation(id));
    if (!existing) return notFound(c, "Annotation");

    // Ownership check
    if (existing.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only edit your own annotations",
          },
        },
        403
      );
    }

    const body = await c.req.json();

    const updated = {
      ...existing,
      // Mutable fields only
      note: body.note !== undefined ? body.note : existing.note,
      color:
        body.color && VALID_HIGHLIGHT_COLORS.includes(body.color)
          ? body.color
          : existing.color,
      updated_at: new Date().toISOString(),
    };

    await kv.set(KV.annotation(id), updated);

    console.log(
      `[Reading] Annotation updated: ${id.slice(0, 8)}… color=${updated.color}`
    );

    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /annotations/:id", err);
  }
});

// ================================================================
// DELETE /annotations/:id — Delete an annotation
// ================================================================
// Removes primary key + index entry. Only owner can delete.
// ================================================================
reading.delete("/annotations/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const annotation = await kv.get(KV.annotation(id));
    if (!annotation) return notFound(c, "Annotation");

    // Ownership check
    if (annotation.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only delete your own annotations",
          },
        },
        403
      );
    }

    // Delete primary + index
    await kv.mdel([
      KV.annotation(id),
      KV.IDX.annotationOfStudent(
        annotation.student_id,
        annotation.summary_id,
        id
      ),
    ]);

    console.log(
      `[Reading] Annotation deleted: ${id.slice(0, 8)}… summary=${annotation.summary_id.slice(0, 8)}…`
    );

    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /annotations/:id", err);
  }
});

// ================================================================
// GET /topics/:topicId/full — Full topic payload (shared w/ Dev 5)
// ================================================================
// Returns EVERYTHING the student needs for a topic in one call:
//   topic, summaries (D13: published only), keywords + subtopics,
//   flashcards, quiz questions, reading states, BKT states,
//   annotations.
//
// This is the "hot path" — called when a student opens a topic.
// ================================================================
reading.get("/topics/:topicId/full", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = user.id;
    const topicId = c.req.param("topicId");

    // ── 1. Topic ──────────────────────────────────────────
    const topic = await kv.get(KV.topic(topicId));
    if (!topic) return notFound(c, "Topic");

    // ── 2. Summaries ──────────────────────────────────────
    const summaryIds: string[] = await kv.getByPrefix(
      KV.PREFIX.summariesOfTopic(topicId)
    );

    let summaries: any[] = [];
    if (summaryIds.length > 0) {
      const raw = await kv.mget(
        summaryIds.map((id: string) => KV.summary(id))
      );
      // D13: Only published summaries are visible to students
      summaries = raw.filter(
        (s: any) => s && s.status === "published"
      );
    }

    // IDs of published summaries (used for subsequent lookups)
    const pubSummaryIds = summaries.map((s: any) => s.id);

    // ── 3. Keywords (from all published summaries) ────────
    const allKeywords: any[] = [];
    const seenKwIds = new Set<string>();

    for (const sumId of pubSummaryIds) {
      const kwIds: string[] = await kv.getByPrefix(
        KV.PREFIX.keywordsOfSummary(sumId)
      );
      for (const kwId of kwIds) {
        if (seenKwIds.has(kwId)) continue;
        seenKwIds.add(kwId);

        const kw = await kv.get(KV.keyword(kwId));
        if (!kw) continue;

        // Subtopics for this keyword
        const stIds: string[] = await kv.getByPrefix(
          KV.PREFIX.subtopicsOfKeyword(kwId)
        );
        let subtopics: any[] = [];
        if (stIds.length > 0) {
          subtopics = (
            await kv.mget(stIds.map((id: string) => KV.subtopic(id)))
          ).filter(Boolean);
        }

        allKeywords.push({ ...kw, subtopics });
      }
    }

    // ── 4. Flashcards (from all keywords in this topic) ───
    const allFlashcards: any[] = [];
    for (const kw of allKeywords) {
      const fcIds: string[] = await kv.getByPrefix(
        KV.PREFIX.flashcardsOfKeyword(kw.id)
      );
      if (fcIds.length > 0) {
        const fcs = (
          await kv.mget(fcIds.map((id: string) => KV.flashcard(id)))
        ).filter(Boolean);
        allFlashcards.push(...fcs);
      }
    }

    // ── 5. Quiz Questions (from all keywords) ─────────────
    const allQuizQuestions: any[] = [];
    for (const kw of allKeywords) {
      const qIds: string[] = await kv.getByPrefix(
        KV.PREFIX.quizOfKeyword(kw.id)
      );
      if (qIds.length > 0) {
        const qs = (
          await kv.mget(qIds.map((id: string) => KV.quizQuestion(id)))
        ).filter(Boolean);
        allQuizQuestions.push(...qs);
      }
    }

    // ── 6. Reading states (this student, all summaries) ───
    const readingStates: any[] = [];
    for (const sumId of pubSummaryIds) {
      const rs = await kv.get(KV.readingState(userId, sumId));
      if (rs) readingStates.push(rs);
    }

    // ── 7. BKT states (this student, all subtopics) ───────
    // Key pattern: bkt:{studentId}:{subtopicId}
    const bktStates: any[] = [];
    for (const kw of allKeywords) {
      for (const st of kw.subtopics || []) {
        const bkt = await kv.get(`bkt:${userId}:${st.id}`);
        if (bkt) bktStates.push(bkt);
      }
    }

    // ── 8. Card FSRS states (this student, all flashcards)
    // Key pattern: card-fsrs:{studentId}:{cardId}
    const cardFsrsStates: any[] = [];
    for (const fc of allFlashcards) {
      const fsrs = await kv.get(`card-fsrs:${userId}:${fc.id}`);
      if (fsrs) cardFsrsStates.push(fsrs);
    }

    // ── 9. Annotations (this student, all published summaries)
    const allAnnotations: any[] = [];
    for (const sumId of pubSummaryIds) {
      const annIds: string[] = await kv.getByPrefix(
        KV.PREFIX.annotationsOfStudentSummary(userId, sumId)
      );
      if (annIds.length > 0) {
        const anns = (
          await kv.mget(annIds.map((id: string) => KV.annotation(id)))
        ).filter(Boolean);
        allAnnotations.push(...anns);
      }
    }

    console.log(
      `[Reading] /topics/${topicId.slice(0, 8)}…/full — ` +
        `${summaries.length} summaries, ${allKeywords.length} keywords, ` +
        `${allFlashcards.length} flashcards, ${allQuizQuestions.length} quiz, ` +
        `${readingStates.length} reading states, ${bktStates.length} BKT, ` +
        `${allAnnotations.length} annotations`
    );

    return c.json({
      success: true,
      data: {
        topic,
        summaries,
        keywords: allKeywords,
        flashcards: allFlashcards,
        quiz_questions: allQuizQuestions,
        reading_states: readingStates,
        bkt_states: bktStates,
        card_fsrs_states: cardFsrsStates,
        annotations: allAnnotations,
      },
    });
  } catch (err) {
    return serverError(c, "GET /topics/:topicId/full", err);
  }
});

export default reading;
