// ============================================================
// Axon v4.2 — Dev 2: Summary / Reading Experience Routes
// ============================================================
// 6 routes: reading-state CRUD, annotations CRUD
// 1 shared route: GET /topics/:topicId/full
//
// ── Agent 3 (PROBE) addition for v4.4: ──
// GET /diagnostics/summary/:summaryId — Consolidated diagnostic
//
// KV Keys used:
//   reading:{studentId}:{summaryId}  → SummaryReadingState
//   annotation:{id}                  → SummaryAnnotation
//   idx:student-reading:{sId}:{sumId}            → summaryId
//   idx:student-annotations:{sId}:{sumId}:{annId} → annotationId
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import type {
  SummaryReadingState,
  SummaryAnnotation,
  HighlightColor,
} from "./shared-types.ts";
import {
  readingKey,
  annotationKey,
  idxStudentReading,
  idxStudentAnnotations,
  topicKey,
  summaryKey,
  kwKey,
  subtopicKey,
  fcKey,
  quizKey,
  fsrsKey,
  KV_PREFIXES,
  // Agent 3: for diagnostics
  quizAttemptKey,
} from "./kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  getChildren,
} from "./crud-factory.tsx";

const reading = new Hono();

const VALID_HIGHLIGHT_COLORS: HighlightColor[] = [
  "yellow", "green", "blue", "pink", "purple",
];

// ================================================================
// PUT /reading-state — Upsert reading progress
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

    const key = readingKey(userId, body.summary_id);
    const existing: SummaryReadingState | null = await kv.get(key);

    const state: SummaryReadingState = {
      student_id: userId,
      summary_id: body.summary_id,
      scroll_position: body.scroll_position ?? existing?.scroll_position ?? 0,
      reading_time_seconds:
        (existing?.reading_time_seconds ?? 0) +
        (body.reading_time_seconds ?? 0),
      completed: body.completed || existing?.completed || false,
      furthest_chunk_index:
        body.furthest_chunk_index ?? existing?.furthest_chunk_index ?? undefined,
      last_read_at: new Date().toISOString(),
    };

    await kv.mset(
      [key, idxStudentReading(userId, body.summary_id)],
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
// GET /reading-state/:summaryId
// ================================================================
reading.get("/reading-state/:summaryId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.param("summaryId");
    const state: SummaryReadingState | null = await kv.get(
      readingKey(user.id, summaryId)
    );

    return c.json({ success: true, data: state || null });
  } catch (err) {
    return serverError(c, "GET /reading-state/:summaryId", err);
  }
});

// ================================================================
// POST /annotations — Create a new highlight/annotation
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

    const highlight_color: HighlightColor = VALID_HIGHLIGHT_COLORS.includes(
      body.highlight_color
    )
      ? body.highlight_color
      : "yellow";

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const annotation: SummaryAnnotation = {
      id,
      student_id: userId,
      summary_id: body.summary_id,
      chunk_id: body.chunk_id ?? undefined,
      selected_text: body.selected_text,
      note: body.note ?? "",
      highlight_color,
      start_offset: body.start_offset ?? 0,
      end_offset: body.end_offset ?? 0,
      created_at: now,
      updated_at: now,
    };

    await kv.mset(
      [
        annotationKey(id),
        idxStudentAnnotations(userId, body.summary_id, id),
      ],
      [annotation, id]
    );

    console.log(
      `[Reading] Annotation created: ${id.slice(0, 8)}… color=${highlight_color} ` +
        `student=${userId.slice(0, 8)}… summary=${body.summary_id.slice(0, 8)}…`
    );

    return c.json({ success: true, data: annotation }, 201);
  } catch (err) {
    return serverError(c, "POST /annotations", err);
  }
});

// ================================================================
// GET /annotations?summary_id=X
// ================================================================
reading.get("/annotations", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.query("summary_id");
    if (!summaryId) {
      return validationError(c, "summary_id query param required");
    }

    const annotationIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_ANNOTATIONS + user.id + ":" + summaryId + ":"
    );

    if (!annotationIds || annotationIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const annotations = await kv.mget(
      annotationIds.map((id: string) => annotationKey(id))
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
// PUT /annotations/:id
// ================================================================
reading.put("/annotations/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const existing: SummaryAnnotation | null = await kv.get(annotationKey(id));
    if (!existing) return notFound(c, "Annotation");

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

    const updated: SummaryAnnotation = {
      ...existing,
      note: body.note !== undefined ? body.note : existing.note,
      highlight_color:
        body.highlight_color &&
        VALID_HIGHLIGHT_COLORS.includes(body.highlight_color)
          ? body.highlight_color
          : existing.highlight_color,
      updated_at: new Date().toISOString(),
    };

    await kv.set(annotationKey(id), updated);

    console.log(
      `[Reading] Annotation updated: ${id.slice(0, 8)}… color=${updated.highlight_color}`
    );

    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /annotations/:id", err);
  }
});

// ================================================================
// DELETE /annotations/:id
// ================================================================
reading.delete("/annotations/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const annotation: SummaryAnnotation | null = await kv.get(annotationKey(id));
    if (!annotation) return notFound(c, "Annotation");

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

    await kv.mdel([
      annotationKey(id),
      idxStudentAnnotations(
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
// GET /topics/:topicId/full — Full topic payload
// ================================================================
reading.get("/topics/:topicId/full", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = user.id;
    const topicId = c.req.param("topicId");

    const topic = await kv.get(topicKey(topicId));
    if (!topic) return notFound(c, "Topic");

    const summaryIds: string[] = await kv.getByPrefix(
      KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":"
    );

    let summaries: any[] = [];
    if (summaryIds.length > 0) {
      const raw = await kv.mget(
        summaryIds.map((id: string) => summaryKey(id))
      );
      summaries = raw.filter(
        (s: any) => s && s.status === "published"
      );
    }

    const pubSummaryIds = summaries.map((s: any) => s.id);

    const allKeywords: any[] = [];
    const seenKwIds = new Set<string>();

    for (const sumId of pubSummaryIds) {
      const kwIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_SUMMARY_KW + sumId + ":"
      );
      for (const kwId of kwIds) {
        if (seenKwIds.has(kwId)) continue;
        seenKwIds.add(kwId);

        const kw = await kv.get(kwKey(kwId));
        if (!kw) continue;

        const stIds: string[] = await kv.getByPrefix(
          KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":"
        );
        let subtopics: any[] = [];
        if (stIds.length > 0) {
          subtopics = (
            await kv.mget(stIds.map((id: string) => subtopicKey(id)))
          ).filter(Boolean);
        }

        allKeywords.push({ ...kw, subtopics });
      }
    }

    const allFlashcards: any[] = [];
    for (const kw of allKeywords) {
      const fcIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_FC + kw.id + ":"
      );
      if (fcIds.length > 0) {
        const fcs = (
          await kv.mget(fcIds.map((id: string) => fcKey(id)))
        ).filter(Boolean);
        allFlashcards.push(...fcs);
      }
    }

    const allQuizQuestions: any[] = [];
    for (const kw of allKeywords) {
      const qIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_QUIZ + kw.id + ":"
      );
      if (qIds.length > 0) {
        const qs = (
          await kv.mget(qIds.map((id: string) => quizKey(id)))
        ).filter(Boolean);
        allQuizQuestions.push(...qs);
      }
    }

    const readingStates: SummaryReadingState[] = [];
    for (const sumId of pubSummaryIds) {
      const rs = await kv.get(readingKey(userId, sumId));
      if (rs) readingStates.push(rs);
    }

    const bktStates: any[] = [];
    for (const kw of allKeywords) {
      for (const st of kw.subtopics || []) {
        const bkt = await kv.get(`bkt:${userId}:${st.id}`);
        if (bkt) bktStates.push(bkt);
      }
    }

    const cardFsrsStates: any[] = [];
    for (const fc of allFlashcards) {
      const fsrs = await kv.get(fsrsKey(userId, fc.id));
      if (fsrs) cardFsrsStates.push(fsrs);
    }

    const allAnnotations: SummaryAnnotation[] = [];
    for (const sumId of pubSummaryIds) {
      const annIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_STUDENT_ANNOTATIONS + userId + ":" + sumId + ":"
      );
      if (annIds.length > 0) {
        const anns = (
          await kv.mget(annIds.map((id: string) => annotationKey(id)))
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

// ════════════════════════════════════════════════════════════════
// Agent 3 (PROBE) — Consolidated Summary Diagnostic (v4.4)
// GET /diagnostics/summary/:summaryId
// ════════════════════════════════════════════════════════════════
reading.get("/diagnostics/summary/:summaryId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = user.id;
    const summaryId = c.req.param("summaryId");

    const summary = await kv.get(summaryKey(summaryId));
    if (!summary) return notFound(c, "Summary");

    const readingState: SummaryReadingState | null = await kv.get(
      readingKey(userId, summaryId)
    );

    const annotationIds: string[] = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_ANNOTATIONS + userId + ":" + summaryId + ":"
    );

    const kwIds: string[] = await kv.getByPrefix(
      KV_PREFIXES.IDX_SUMMARY_KW + summaryId + ":"
    );

    let totalPKnow = 0;
    let bktCount = 0;
    const keywordDetails: any[] = [];

    for (const kwId of kwIds) {
      const kw = await kv.get(kwKey(kwId));
      if (!kw) continue;

      const stIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":"
      );

      let kwPKnow = 0;
      let kwBktCount = 0;

      for (const stId of stIds) {
        const bkt = await kv.get(`bkt:${userId}:${stId}`);
        if (bkt) {
          totalPKnow += bkt.p_know;
          bktCount++;
          kwPKnow += bkt.p_know;
          kwBktCount++;
        }
      }

      keywordDetails.push({
        keyword_id: kwId,
        term: kw.term,
        avg_p_know: kwBktCount > 0 ? kwPKnow / kwBktCount : 0,
        subtopic_count: stIds.length,
        evaluated_count: kwBktCount,
      });
    }

    let totalQuizAttempts = 0;
    let correctQuizAttempts = 0;

    for (const kwId of kwIds) {
      const attemptIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_ATTEMPTS + kwId + ":"
      );
      for (const aId of attemptIds) {
        const attempt = await kv.get(quizAttemptKey(aId));
        if (attempt && attempt.student_id === userId) {
          totalQuizAttempts++;
          if (attempt.correct) correctQuizAttempts++;
        }
      }
    }

    let totalRetention = 0;
    let fsrsCount = 0;

    for (const kwId of kwIds) {
      const fcIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_FC + kwId + ":"
      );
      for (const fcId of fcIds) {
        const fsrs = await kv.get(fsrsKey(userId, fcId));
        if (fsrs) {
          totalRetention += fsrs.stability > 0 ? Math.min(fsrs.stability / 30, 1) : 0;
          fsrsCount++;
        }
      }
    }

    const diagnostic = {
      summary_id: summaryId,
      student_id: userId,
      reading: {
        time_seconds: readingState?.reading_time_seconds ?? 0,
        scroll_position: readingState?.scroll_position ?? 0,
        completed: readingState?.completed ?? false,
      },
      annotations: {
        count: annotationIds.length,
      },
      keywords: {
        total: kwIds.length,
        avg_mastery: bktCount > 0 ? +(totalPKnow / bktCount).toFixed(3) : 0,
        details: keywordDetails,
      },
      quiz: {
        total_attempts: totalQuizAttempts,
        correct_attempts: correctQuizAttempts,
        score_avg: totalQuizAttempts > 0
          ? +(correctQuizAttempts / totalQuizAttempts).toFixed(3)
          : 0,
      },
      flashcards: {
        cards_with_fsrs: fsrsCount,
        avg_retention: fsrsCount > 0
          ? +(totalRetention / fsrsCount).toFixed(3)
          : 0,
      },
      generated_at: new Date().toISOString(),
    };

    console.log(
      `[Reading] Diagnostic: summary=${summaryId.slice(0, 8)}… student=${userId.slice(0, 8)}… ` +
        `kw=${kwIds.length} quiz=${totalQuizAttempts} fc_fsrs=${fsrsCount}`
    );

    return c.json({ success: true, data: diagnostic });
  } catch (err) {
    return serverError(c, "GET /diagnostics/summary/:summaryId", err);
  }
});

export default reading;
