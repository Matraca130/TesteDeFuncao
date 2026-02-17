// ============================================================
// Axon v4.2 — Dev 3: Flashcard System Routes
// CRUD for flashcards, POST /reviews (critical cascade),
// GET /flashcards/due (scheduling), and session management.
//
// Key decisions:
//   D10 — Frontend ONLY sends grade; backend computes everything
//   D16 — Flashcard uses self-evaluation (Again/Hard/Good/Easy)
//   D24 — Sub-topic is the evaluable unit (BKT lives there)
//   D27 — If keyword has no sub-topics, subtopic_id = keyword_id
//   D30 — FLASHCARD_MULTIPLIER = 1.00
//   D36 — Only flashcards have individual FSRS state
//   D39 — Students can create personal flashcards (source='student')
//   D44 — Student cards feed BKT with same multiplier
//   D46 — response_time_ms saved but does NOT affect algorithms in v1
//
// FlashcardCard contract (instruments.ts): exactly 12 fields
//   id, summary_id, keyword_id, subtopic_id, institution_id,
//   front, back, image_url, status, source, created_by, created_at
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
import {
  updateBKT,
  calcFSRS,
  getInitialS,
  getR,
  getDisplayMastery,
  getThreshold,
  getColorFromDelta,
  W8_DEFAULT,
  GRADE_TO_BKT,
  VALID_GRADES,
  createInitialBktState,
  createInitialCardFsrs,
} from "./fsrs-engine.ts";

const flashcards = new Hono();

// ── Helper: error message extractor ────────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ================================================================
// FLASHCARD CRUD
// ================================================================

// ── POST /flashcards — Create a flashcard card ─────────────
flashcards.post("/flashcards", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();

    // Validate required fields (contract: front + back)
    if (!body.keyword_id || !body.front || !body.back) {
      return validationError(
        c,
        "Missing required fields: keyword_id, front, back"
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // FlashcardCard: exactly 12 fields per instruments.ts contract
    const card = {
      id,
      summary_id: body.summary_id ?? null,
      keyword_id: body.keyword_id,
      subtopic_id: body.subtopic_id ?? body.keyword_id, // D27
      institution_id: body.institution_id ?? null,
      front: body.front,
      back: body.back,
      image_url: body.image_url ?? null,
      status: body.status ?? "published",
      source: body.source ?? "student", // D39: default student
      created_by: user.id,
      created_at: now,
    };

    // Primary key + indices
    const keys: string[] = [
      KV.flashcard(id),
      KV.IDX.flashcardOfKeyword(body.keyword_id, id),
    ];
    const vals: any[] = [card, id];

    // Optional: link to summary
    if (body.summary_id) {
      keys.push(KV.IDX.flashcardOfSummary(body.summary_id, id));
      vals.push(id);
    }

    await kv.mset(keys, vals);

    console.log(
      `[Flashcards] Created card ${id} for keyword ${body.keyword_id} by ${user.id} (source: ${card.source})`
    );
    return c.json({ success: true, data: card }, 201);
  } catch (err) {
    return serverError(c, "POST /flashcards", err);
  }
});

// ── GET /flashcards — List by summary_id or keyword_id ─────
flashcards.get("/flashcards", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.query("summary_id");
    const keywordId = c.req.query("keyword_id");

    if (summaryId) {
      const cards = await getChildren(
        KV.PREFIX.flashcardsOfSummary(summaryId),
        KV.flashcard
      );
      return c.json({ success: true, data: cards });
    }

    if (keywordId) {
      const cards = await getChildren(
        KV.PREFIX.flashcardsOfKeyword(keywordId),
        KV.flashcard
      );
      return c.json({ success: true, data: cards });
    }

    return validationError(
      c,
      "summary_id or keyword_id query param required"
    );
  } catch (err) {
    return serverError(c, "GET /flashcards", err);
  }
});

// ── GET /flashcards/due — Scheduling: due cards sorted by overdue ──
// IMPORTANT: This route MUST be registered BEFORE /flashcards/:id
// to avoid Hono matching "due" as an :id param.
flashcards.get("/flashcards/due", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const limitParam = c.req.query("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // 1. Get all card IDs from due index
    const allDueCardIds = await kv.getByPrefix(
      KV.PREFIX.dueCardsOfStudent(user.id)
    );

    if (!allDueCardIds || allDueCardIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    // 2. Deduplicate card IDs (old due entries may linger)
    const uniqueCardIds = [...new Set(allDueCardIds as string[])];

    // 3. Load cards + FSRS states in parallel
    const [cards, states] = await Promise.all([
      kv.mget(uniqueCardIds.map((id: string) => KV.flashcard(id))),
      kv.mget(uniqueCardIds.map((id: string) => KV.fsrs(user.id, id))),
    ]);

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    // 4. Build result: only include cards that are actually overdue
    // Response shape: DueFlashcardItem { card, fsrs_state, overdue_days }
    const result: any[] = [];
    for (let i = 0; i < uniqueCardIds.length; i++) {
      const card = cards[i];
      const fsrsState = states[i];

      if (!card || !fsrsState) continue;

      // Only include cards where due_at <= now
      if (fsrsState.due_at) {
        const dueDate = fsrsState.due_at.split("T")[0];
        if (dueDate <= today) {
          const overdueDays = Math.floor(
            (now - Date.parse(fsrsState.due_at)) / 86_400_000
          );
          result.push({
            card,
            fsrs_state: fsrsState, // Contract: "fsrs_state", NOT "fsrs"
            overdue_days: Math.max(0, overdueDays),
          });
        }
      }
    }

    // 5. Sort by most overdue first
    result.sort((a, b) => b.overdue_days - a.overdue_days);

    // 6. Apply limit
    return c.json({ success: true, data: result.slice(0, limit) });
  } catch (err) {
    return serverError(c, "GET /flashcards/due", err);
  }
});

// ── GET /flashcards/:id — Get single card ──────────────────
flashcards.get("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const card = await kv.get(KV.flashcard(c.req.param("id")));
    if (!card) return notFound(c, "Flashcard");
    return c.json({ success: true, data: card });
  } catch (err) {
    return serverError(c, "GET /flashcards/:id", err);
  }
});

// ── PUT /flashcards/:id — Update card fields ───────────────
flashcards.put("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const existing = await kv.get(KV.flashcard(id));
    if (!existing) return notFound(c, "Flashcard");

    // D39: Students can only edit their own cards
    if (
      existing.source === "student" &&
      existing.created_by !== user.id
    ) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot edit another student's flashcard",
          },
        },
        403
      );
    }

    const body = await c.req.json();

    // Whitelist: only these fields are updatable on FlashcardCard
    const UPDATABLE = ["front", "back", "image_url", "status"];
    const updated = { ...existing };
    for (const field of UPDATABLE) {
      if (body[field] !== undefined) {
        updated[field] = body[field];
      }
    }
    // Immutable fields preserved: id, keyword_id, subtopic_id,
    // institution_id, summary_id, source, created_by, created_at

    await kv.set(KV.flashcard(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /flashcards/:id", err);
  }
});

// ── DELETE /flashcards/:id — Delete card + all indices ─────
flashcards.delete("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const card = await kv.get(KV.flashcard(id));
    if (!card) return notFound(c, "Flashcard");

    // D39: Students can only delete their own cards
    if (card.source === "student" && card.created_by !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot delete another student's flashcard",
          },
        },
        403
      );
    }

    const keysToDelete: string[] = [
      KV.flashcard(id),
      KV.IDX.flashcardOfKeyword(card.keyword_id, id),
    ];

    // Remove summary index if linked
    if (card.summary_id) {
      keysToDelete.push(KV.IDX.flashcardOfSummary(card.summary_id, id));
    }

    // Remove FSRS state for deleting user
    // (background job can handle other students' states)
    const fsrsState = await kv.get(KV.fsrs(user.id, id));
    if (fsrsState) {
      keysToDelete.push(KV.fsrs(user.id, id));
      keysToDelete.push(KV.IDX.studentFsrs(user.id, id));
      if (fsrsState.due_at) {
        const dueDate = fsrsState.due_at.split("T")[0];
        keysToDelete.push(KV.IDX.dueCard(user.id, dueDate, id));
      }
    }

    await kv.mdel(keysToDelete);

    console.log(
      `[Flashcards] Deleted card ${id} (keyword: ${card.keyword_id}) by ${user.id}`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /flashcards/:id", err);
  }
});

// ================================================================
// POST /reviews — THE CRITICAL CASCADE ROUTE
// Implements: GRADE_TO_BKT → updateBKT → calcFSRS →
//             getDisplayMastery → getThreshold → delta →
//             getColorFromDelta → persist with mset
//
// ReviewLog contract (activity.ts): only _after fields
//   bkt_after, stability_after, delta_after, color_after
//   NO before/after pairs, NO is_lapse
//
// SubmitReviewRes.feedback: inline object, NOT a named type
// ================================================================

flashcards.post("/reviews", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const {
      session_id,
      item_id,
      instrument_type,
      subtopic_id,
      keyword_id,
      grade,
      response_time_ms,
    } = body;

    // ── Validate required fields ─────────────────────────
    if (
      !session_id ||
      !item_id ||
      !instrument_type ||
      !subtopic_id ||
      !keyword_id ||
      grade === undefined ||
      grade === null
    ) {
      return validationError(
        c,
        "Missing required fields: session_id, item_id, instrument_type, subtopic_id, keyword_id, grade"
      );
    }

    if (!["flashcard", "quiz"].includes(instrument_type)) {
      return validationError(
        c,
        `Invalid instrument_type: ${instrument_type}. Must be 'flashcard' or 'quiz'`
      );
    }

    // ── 1. Map grade → BKT params ────────────────────────
    const bktParams = GRADE_TO_BKT[grade as number];
    if (!bktParams) {
      return validationError(
        c,
        `Invalid grade value: ${grade}. Must be one of: ${VALID_GRADES.join(", ")}`
      );
    }

    const userId = user.id;

    // ── 2. Read current BKT state (or create initial) ──────
    const bktKey = KV.bkt(userId, subtopic_id);
    let bkt = await kv.get(bktKey);
    if (!bkt) {
      bkt = createInitialBktState(userId, subtopic_id, keyword_id);
    }

    // ── 3. Update BKT mastery ──────────────────────────
    const typeMult: "flashcard" | "quiz" =
      instrument_type === "quiz" ? "quiz" : "flashcard";
    const newMastery = updateBKT(
      bkt.p_know,
      bkt.max_mastery,
      bktParams.correct,
      typeMult,
      bktParams.gradeMult
    );
    const newMaxMastery = Math.max(bkt.max_mastery, newMastery);

    // ── 4. FSRS (flashcard only — D36) ───────────────────
    let newStability = bkt.stability;
    let fsrsState: any = null;
    let oldDueDate: string | null = null;
    let newDueDate: string | null = null;

    if (instrument_type === "flashcard") {
      const fsrsKey = KV.fsrs(userId, item_id);
      fsrsState = await kv.get(fsrsKey);
      if (!fsrsState) {
        fsrsState = createInitialCardFsrs(userId, item_id);
      }
      oldDueDate = fsrsState.due_at?.split("T")[0] ?? null;

      const firstReview = fsrsState.state === "new";
      if (firstReview) {
        // First review: use getInitialS based on grade
        newStability = getInitialS(grade);
        fsrsState.state = "learning";
        fsrsState.reps = 1;
      } else {
        // Subsequent reviews: full FSRS computation
        const daysSince = fsrsState.last_review_at
          ? (Date.now() - Date.parse(fsrsState.last_review_at)) / 86_400_000
          : 1;
        const R = getR(daysSince, fsrsState.stability);
        const isRecovering = newMastery < newMaxMastery;
        const result = calcFSRS(
          fsrsState.stability,
          grade,
          R,
          isRecovering,
          W8_DEFAULT
        );
        newStability = result.newS;

        if (result.isLapse) {
          fsrsState.lapses += 1;
          fsrsState.state = "relearning";
        } else {
          fsrsState.reps += 1;
          fsrsState.state = "review";
        }
      }

      fsrsState.stability = newStability;
      fsrsState.last_review_at = new Date().toISOString();

      // Schedule next review: due_at = now + stability days
      const dueAt = new Date(Date.now() + newStability * 86_400_000);
      fsrsState.due_at = dueAt.toISOString();
      newDueDate = dueAt.toISOString().split("T")[0];
      fsrsState.updated_at = new Date().toISOString();
    }

    // ── 5. Recompute delta & color ─────────────────────
    const kwData = await kv.get(KV.keyword(keyword_id));
    const priority = kwData?.priority ?? 1;
    // daysSince = 0 since we JUST reviewed, so displayM = mastery
    const displayM = getDisplayMastery(newMastery, 0, newStability);
    const threshold = getThreshold(priority);
    const delta = threshold > 0 ? displayM / threshold : 0;
    const colorInfo = getColorFromDelta(delta);
    const colorName = colorInfo.color;

    // ── 6. Update BKT state ────────────────────────────
    const now = new Date().toISOString();
    const updatedBkt = {
      ...bkt,
      p_know: newMastery,
      max_mastery: newMaxMastery,
      stability: newStability,
      delta: delta,
      color: colorName,
      exposures: bkt.exposures + 1,
      lapses: grade === 0.00 ? bkt.lapses + 1 : bkt.lapses,
      due_at: fsrsState?.due_at ?? bkt.due_at,
      last_review_at: now,
      updated_at: now,
    };

    // ── 7. Create review log (activity.ts contract: _after only) ──
    const reviewId = crypto.randomUUID();
    const reviewLog = {
      id: reviewId,
      student_id: userId,
      session_id: session_id,
      item_id: item_id,
      instrument_type: instrument_type,
      subtopic_id: subtopic_id,
      keyword_id: keyword_id,
      grade: grade,
      response_time_ms: response_time_ms ?? null, // D46: saved but not used
      bkt_after: newMastery,
      stability_after:
        instrument_type === "flashcard" ? newStability : null,
      delta_after: delta,
      color_after: colorName,
      created_at: now,
    };

    // ── 8. Persist EVERYTHING atomically ──────────────────
    const keys: string[] = [
      bktKey,
      KV.review(reviewId),
      KV.IDX.sessionReview(session_id, reviewId),
      KV.IDX.studentKwBkt(userId, keyword_id, subtopic_id),
      KV.IDX.studentBkt(userId, subtopic_id),
    ];
    const values: any[] = [
      updatedBkt,
      reviewLog,
      reviewId,
      subtopic_id,
      subtopic_id,
    ];

    if (instrument_type === "flashcard" && fsrsState) {
      keys.push(KV.fsrs(userId, item_id));
      values.push(fsrsState);
      keys.push(KV.IDX.studentFsrs(userId, item_id));
      values.push(item_id);

      // Due index: add new due entry
      if (newDueDate) {
        keys.push(KV.IDX.dueCard(userId, newDueDate, item_id));
        values.push(item_id);
      }
    }

    await kv.mset(keys, values);

    // Delete old due entry if date changed (can't be in mset — separate op)
    if (
      instrument_type === "flashcard" &&
      oldDueDate &&
      oldDueDate !== newDueDate
    ) {
      await kv.del(KV.IDX.dueCard(userId, oldDueDate, item_id));
    }

    // ── 9. Update session counters ─────────────────────
    const session = await kv.get(KV.session(session_id));
    if (session) {
      session.items_reviewed = (session.items_reviewed ?? 0) + 1;
      if (
        !session.keywords_touched ||
        !Array.isArray(session.keywords_touched)
      ) {
        session.keywords_touched = [];
      }
      if (!session.keywords_touched.includes(keyword_id)) {
        session.keywords_touched.push(keyword_id);
      }
      if (
        !session.subtopics_touched ||
        !Array.isArray(session.subtopics_touched)
      ) {
        session.subtopics_touched = [];
      }
      if (!session.subtopics_touched.includes(subtopic_id)) {
        session.subtopics_touched.push(subtopic_id);
      }
      session.updated_at = now;
      await kv.set(KV.session(session_id), session);
    }

    // ── 10. Return response (SubmitReviewRes) ───────────────
    console.log(
      `[Reviews] ${instrument_type} review for ${item_id} by ${userId}: grade=${grade}, mastery=${newMastery.toFixed(3)}, delta=${delta.toFixed(3)}, color=${colorName}`
    );

    return c.json({
      success: true,
      data: {
        review_log: reviewLog,
        updated_bkt: updatedBkt,
        updated_card_fsrs: fsrsState,
        // feedback is an inline object in SubmitReviewRes, NOT a named type
        feedback: {
          delta_before: bkt.delta,
          delta_after: delta,
          color_before: bkt.color,
          color_after: colorName,
          mastery: newMastery,
          stability:
            instrument_type === "flashcard" ? newStability : null,
          next_due: fsrsState?.due_at ?? null,
        },
      },
    });
  } catch (err) {
    return serverError(c, "POST /reviews", err);
  }
});

// ================================================================
// SESSION MANAGEMENT
// ================================================================

// ── POST /sessions — Create a study session ────────────────
flashcards.post("/sessions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    if (!body.instrument_type) {
      return validationError(
        c,
        "Missing required field: instrument_type"
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const session = {
      id,
      student_id: user.id,
      instrument_type: body.instrument_type, // 'flashcard' | 'quiz'
      course_id: body.course_id ?? null,
      started_at: now,
      ended_at: null as string | null,
      items_reviewed: 0,
      keywords_touched: [] as string[],
      subtopics_touched: [] as string[],
      avg_grade: null as number | null,
      total_time_ms: null as number | null,
      created_at: now,
      updated_at: now,
    };

    await kv.mset(
      [
        KV.session(id),
        KV.IDX.studentSession(user.id, id),
      ],
      [session, id]
    );

    console.log(
      `[Sessions] Created session ${id} (${body.instrument_type}) for ${user.id}`
    );
    return c.json({ success: true, data: session }, 201);
  } catch (err) {
    return serverError(c, "POST /sessions", err);
  }
});

// ── GET /sessions — List sessions for current user ─────────
flashcards.get("/sessions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const sessionIds = await kv.getByPrefix(
      KV.PREFIX.sessionsOfStudent(user.id)
    );
    if (!sessionIds || sessionIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const sessions = await kv.mget(
      (sessionIds as string[]).map((id: string) => KV.session(id))
    );

    return c.json({
      success: true,
      data: sessions.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /sessions", err);
  }
});

// ── GET /sessions/:id — Get session details ────────────────
flashcards.get("/sessions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const session = await kv.get(KV.session(c.req.param("id")));
    if (!session) return notFound(c, "Session");

    if (session.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot access another student's session",
          },
        },
        403
      );
    }

    return c.json({ success: true, data: session });
  } catch (err) {
    return serverError(c, "GET /sessions/:id", err);
  }
});

// ── PUT /sessions/:id/end — Close session, compute aggregates ──
flashcards.put("/sessions/:id/end", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const session = await kv.get(KV.session(id));
    if (!session) return notFound(c, "Session");

    if (session.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot end another student's session",
          },
        },
        403
      );
    }

    if (session.ended_at) {
      return validationError(c, "Session already ended");
    }

    const now = new Date().toISOString();
    const totalTimeMs = Date.now() - Date.parse(session.started_at);

    // Compute avg_grade from review logs in this session
    let avgGrade: number | null = null;
    const reviewIds = await kv.getByPrefix(
      KV.PREFIX.reviewsOfSession(id)
    );
    if (reviewIds && reviewIds.length > 0) {
      const reviews = await kv.mget(
        (reviewIds as string[]).map((rid: string) => KV.review(rid))
      );
      const validReviews = reviews.filter(Boolean);
      if (validReviews.length > 0) {
        const sumGrades = validReviews.reduce(
          (sum: number, r: any) => sum + (r.grade ?? 0),
          0
        );
        avgGrade = sumGrades / validReviews.length;
      }
    }

    const updatedSession = {
      ...session,
      ended_at: now,
      total_time_ms: totalTimeMs,
      avg_grade: avgGrade,
      updated_at: now,
    };

    await kv.set(KV.session(id), updatedSession);

    console.log(
      `[Sessions] Ended session ${id}: ${session.items_reviewed} items, avg_grade=${avgGrade?.toFixed(2) ?? "N/A"}, ${totalTimeMs}ms`
    );
    return c.json({ success: true, data: updatedSession });
  } catch (err) {
    return serverError(c, "PUT /sessions/:id/end", err);
  }
});

// ================================================================
// STUDENT LEARNING STATE QUERIES
// ================================================================

// ── GET /bkt — Get BKT states for current student ──────────
flashcards.get("/bkt", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const keywordId = c.req.query("keyword_id");
    const subtopicId = c.req.query("subtopic_id");

    if (subtopicId) {
      const bkt = await kv.get(KV.bkt(user.id, subtopicId));
      return c.json({ success: true, data: bkt ?? null });
    }

    if (keywordId) {
      const subtopicIds = await kv.getByPrefix(
        KV.PREFIX.bktOfStudentKw(user.id, keywordId)
      );
      if (!subtopicIds || subtopicIds.length === 0) {
        return c.json({ success: true, data: [] });
      }
      const bktStates = await kv.mget(
        (subtopicIds as string[]).map((stId: string) =>
          KV.bkt(user.id, stId)
        )
      );
      return c.json({
        success: true,
        data: bktStates.filter(Boolean),
      });
    }

    // All BKT states for this student
    const allSubtopicIds = await kv.getByPrefix(
      KV.PREFIX.bktOfStudent(user.id)
    );
    if (!allSubtopicIds || allSubtopicIds.length === 0) {
      return c.json({ success: true, data: [] });
    }
    const allBkt = await kv.mget(
      (allSubtopicIds as string[]).map((stId: string) =>
        KV.bkt(user.id, stId)
      )
    );
    return c.json({
      success: true,
      data: allBkt.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /bkt", err);
  }
});

// ── GET /fsrs — Get FSRS states for current student ────────
flashcards.get("/fsrs", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const cardId = c.req.query("card_id");

    if (cardId) {
      const fsrs = await kv.get(KV.fsrs(user.id, cardId));
      return c.json({ success: true, data: fsrs ?? null });
    }

    const allCardIds = await kv.getByPrefix(
      KV.PREFIX.fsrsOfStudent(user.id)
    );
    if (!allCardIds || allCardIds.length === 0) {
      return c.json({ success: true, data: [] });
    }
    const allFsrs = await kv.mget(
      (allCardIds as string[]).map((cId: string) =>
        KV.fsrs(user.id, cId)
      )
    );
    return c.json({
      success: true,
      data: allFsrs.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /fsrs", err);
  }
});

export default flashcards;
