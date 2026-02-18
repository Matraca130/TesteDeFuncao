// ============================================================
// Axon v4.2 — Dev 3: Review & Learning State Routes
// ============================================================
// POST /reviews — THE CRITICAL CASCADE ROUTE
//   GRADE → BKT update → FSRS reviewCard → delta → color → persist
// GET  /bkt     — Query BKT states (by subtopic_id, keyword_id, or all)
// GET  /fsrs    — Query FSRS states (by card_id or all)
//
// Key decisions:
//   D10 — Frontend ONLY sends grade; backend computes everything
//   D16 — Flashcard uses self-evaluation (Again/Hard/Good/Easy)
//   D24 — Sub-topic is the evaluable unit (BKT lives there)
//   D27 — If keyword has no sub-topics, subtopic_id = keyword_id
//   D30 — FLASHCARD_MULTIPLIER = 1.00
//   D36 — Only flashcards have individual FSRS state
//   D44 — Student cards feed BKT with same multiplier
//   D46 — response_time_ms saved but does NOT affect algorithms in v1
//
// ReviewLog contract (activity.ts): only _after fields
//   bkt_after, stability_after, delta_after, color_after
//   NO before/after pairs, NO is_lapse
//
// SubmitReviewRes.feedback: inline object, NOT a named type
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

// Types — import ONLY the ones this file uses
import type {
  SubTopicBktState,
  CardFsrsState,
  ReviewLog,
  BktColor,
} from "./shared-types.ts";

// Keys — canonical kv-keys.ts (ZERO references to kv-keys.tsx)
import {
  bktKey,
  fsrsKey,
  reviewKey,
  sessionKey,
  kwKey,
  idxSessionReviews,
  idxStudentKwBkt,
  idxStudentBkt,
  idxStudentFsrs,
  idxDue,
  KV_PREFIXES,
} from "./kv-keys.ts";

// FSRS engine — ONLY this file needs it
import { reviewCard, createNewCard } from "./fsrs-engine.ts";
import type { FsrsCard } from "./fsrs-engine.ts";

// Shared CRUD helpers
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "./crud-factory.tsx";

const reviews = new Hono();

// ── Helper: error message extractor ────────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── Local BKT helpers (moved from old fsrs-engine) ─────────
// These implement the standard Bayesian Knowledge Tracing
// update equations. They live here because the new fsrs-engine.ts
// is a PURE FSRS scheduler and no longer bundles BKT logic.
// ────────────────────────────────────────────────────────────

function createInitialBktState(
  studentId: string,
  subtopicId: string,
  keywordId: string
): SubTopicBktState {
  return {
    student_id: studentId,
    subtopic_id: subtopicId,
    keyword_id: keywordId,
    p_know: 0,
    p_slip: 0.1,
    p_guess: 0.25,
    p_transit: 0.1,
    stability: 0,
    delta: 0,
    color: "red",
    last_review: "",
    review_count: 0,
  };
}

function updateBktMastery(bkt: SubTopicBktState, isCorrect: boolean): number {
  const pCorrect = isCorrect
    ? bkt.p_know * (1 - bkt.p_slip) + (1 - bkt.p_know) * bkt.p_guess
    : bkt.p_know * bkt.p_slip + (1 - bkt.p_know) * (1 - bkt.p_guess);
  const pKnowGivenObs = isCorrect
    ? (bkt.p_know * (1 - bkt.p_slip)) / pCorrect
    : (bkt.p_know * bkt.p_slip) / pCorrect;
  return pKnowGivenObs + (1 - pKnowGivenObs) * bkt.p_transit;
}

function getColorFromDelta(delta: number): BktColor {
  if (delta >= 1.0) return "green";
  if (delta >= 0.6) return "yellow";
  if (delta >= 0.3) return "orange";
  return "red";
}

// ── Local threshold helper ─────────────────────────────────
// Maps keyword priority (1-5) to a mastery threshold.
// Higher priority keywords require higher mastery to reach green.
// delta = displayMastery / threshold
// ────────────────────────────────────────────────────────────

function getThreshold(priority: number): number {
  // Priority 1 (low) → 0.3 threshold (easy to turn green)
  // Priority 5 (high) → 0.7 threshold (needs deep mastery)
  const thresholds: Record<number, number> = {
    1: 0.3,
    2: 0.4,
    3: 0.5,
    4: 0.6,
    5: 0.7,
  };
  return thresholds[priority] ?? 0.5;
}

// Valid grades for validation
const VALID_GRADES = [1, 2, 3, 4]; // Again=1, Hard=2, Good=3, Easy=4

// ================================================================
// POST /reviews — THE CRITICAL CASCADE ROUTE
// ================================================================
// Implements: grade → isCorrect → updateBktMastery →
//             reviewCard (FSRS) → delta → color → persist with mset
//
// Cascade steps:
//   1. Validate input
//   2. Read/create BKT state
//   3. Update BKT mastery (classic Bayesian update)
//   4. FSRS scheduling (flashcard only — D36)
//   5. Recompute delta & color
//   6. Update BKT state
//   7. Create review log (_after fields only)
//   8. Persist EVERYTHING atomically
//   9. Update session counters
//  10. Return SubmitReviewRes with inline feedback
// ================================================================
reviews.post("/reviews", async (c) => {
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

    // ── 1. Validate required fields ─────────────────────────
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

    if (!VALID_GRADES.includes(grade)) {
      return validationError(
        c,
        `Invalid grade value: ${grade}. Must be one of: ${VALID_GRADES.join(", ")}`
      );
    }

    const userId = user.id;

    // ── 2. Read current BKT state (or create initial) ──────
    const bktKeyStr = bktKey(userId, subtopic_id);
    let bkt: SubTopicBktState = await kv.get(bktKeyStr);
    if (!bkt) {
      bkt = createInitialBktState(userId, subtopic_id, keyword_id);
    }

    // Snapshot before values for feedback response
    const deltaBefore = bkt.delta;
    const colorBefore = bkt.color;

    // ── 3. Update BKT mastery ──────────────────────────────
    // D16: grade 3 (Good) and 4 (Easy) = correct; 1 (Again) and 2 (Hard) = incorrect
    const isCorrect = grade >= 3;
    const newPKnow = updateBktMastery(bkt, isCorrect);

    // ── 4. FSRS scheduling (flashcard only — D36) ──────────
    let fsrsResult: { card: FsrsCard; review_log: any } | null = null;
    let oldDueDate: string | null = null;
    let newDueDate: string | null = null;
    let newStability: number = bkt.stability;

    if (instrument_type === "flashcard") {
      const fsrsKeyStr = fsrsKey(userId, item_id);
      let cardState: FsrsCard = await kv.get(fsrsKeyStr);
      if (!cardState) {
        cardState = createNewCard();
      }
      oldDueDate = cardState.due?.split("T")[0] ?? null;

      // reviewCard handles everything: initial S, subsequent reviews, lapses
      fsrsResult = reviewCard(cardState, grade as 1 | 2 | 3 | 4);
      newStability = fsrsResult.card.stability;
      newDueDate = fsrsResult.card.due.split("T")[0];
    }

    // ── 5. Recompute delta & color ─────────────────────────
    const kwData = await kv.get(kwKey(keyword_id));
    const priority = kwData?.priority ?? 1;
    // daysSince = 0 since we JUST reviewed, so displayMastery = newPKnow
    const displayM = newPKnow;
    const threshold = getThreshold(priority);
    const delta = threshold > 0 ? displayM / threshold : 0;
    const colorName = getColorFromDelta(delta);

    // ── 6. Update BKT state ────────────────────────────────
    const now = new Date().toISOString();
    const updatedBkt: SubTopicBktState = {
      ...bkt,
      p_know: newPKnow,
      stability: newStability,
      delta: delta,
      color: colorName,
      last_review: now,
      review_count: bkt.review_count + 1,
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
      bkt_after: newPKnow,
      stability_after:
        instrument_type === "flashcard" ? newStability : null,
      delta_after: delta,
      color_after: colorName,
      created_at: now,
    };

    // ── 8. Persist EVERYTHING atomically ──────────────────
    const keys: string[] = [
      bktKeyStr,
      reviewKey(reviewId),
      idxSessionReviews(session_id, reviewId),
      idxStudentKwBkt(userId, keyword_id, subtopic_id),
      idxStudentBkt(userId, subtopic_id),
    ];
    const values: any[] = [
      updatedBkt,
      reviewLog,
      reviewId,
      subtopic_id,
      subtopic_id,
    ];

    if (instrument_type === "flashcard" && fsrsResult) {
      // Store CardFsrsState: student_id + card_id + FsrsCard fields
      const cardFsrsState = {
        student_id: userId,
        card_id: item_id,
        ...fsrsResult.card,
      };

      keys.push(fsrsKey(userId, item_id));
      values.push(cardFsrsState);
      keys.push(idxStudentFsrs(userId, item_id));
      values.push(item_id);

      // Due index: add new due entry
      if (newDueDate) {
        keys.push(idxDue(userId, item_id, newDueDate));
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
      await kv.del(idxDue(userId, item_id, oldDueDate));
    }

    // ── 9. Update session counters ─────────────────────────
    const session = await kv.get(sessionKey(session_id));
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
      await kv.set(sessionKey(session_id), session);
    }

    // ── 10. Return response (SubmitReviewRes) ──────────────
    console.log(
      `[Reviews] ${instrument_type} review for ${item_id} by ${userId}: grade=${grade}, mastery=${newPKnow.toFixed(3)}, delta=${delta.toFixed(3)}, color=${colorName}`
    );

    return c.json({
      success: true,
      data: {
        review_log: reviewLog,
        updated_bkt: updatedBkt,
        updated_card_fsrs: fsrsResult
          ? { student_id: userId, card_id: item_id, ...fsrsResult.card }
          : null,
        // feedback is an inline object in SubmitReviewRes, NOT a named type
        feedback: {
          delta_before: deltaBefore,
          delta_after: delta,
          color_before: colorBefore,
          color_after: colorName,
          mastery: newPKnow,
          stability:
            instrument_type === "flashcard" ? newStability : null,
          next_due: fsrsResult?.card.due ?? null,
        },
      },
    });
  } catch (err) {
    return serverError(c, "POST /reviews", err);
  }
});

// ================================================================
// STUDENT LEARNING STATE QUERIES
// ================================================================

// ================================================================
// GET /bkt — Get BKT states for current student
// ================================================================
// Query modes:
//   ?subtopic_id=X → single BKT state
//   ?keyword_id=X  → all BKT states for keyword's subtopics
//   (no params)    → all BKT states for student
// ================================================================
reviews.get("/bkt", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const keywordId = c.req.query("keyword_id");
    const subtopicId = c.req.query("subtopic_id");

    if (subtopicId) {
      const bkt = await kv.get(bktKey(user.id, subtopicId));
      return c.json({ success: true, data: bkt ?? null });
    }

    if (keywordId) {
      const subtopicIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_STUDENT_KW_BKT + user.id + ":" + keywordId + ":"
      );
      if (!subtopicIds || subtopicIds.length === 0) {
        return c.json({ success: true, data: [] });
      }
      const bktStates = await kv.mget(
        (subtopicIds as string[]).map((stId: string) =>
          bktKey(user.id, stId)
        )
      );
      return c.json({
        success: true,
        data: bktStates.filter(Boolean),
      });
    }

    // All BKT states for this student
    const allSubtopicIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_BKT + user.id + ":"
    );
    if (!allSubtopicIds || allSubtopicIds.length === 0) {
      return c.json({ success: true, data: [] });
    }
    const allBkt = await kv.mget(
      (allSubtopicIds as string[]).map((stId: string) =>
        bktKey(user.id, stId)
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

// ================================================================
// GET /fsrs — Get FSRS states for current student
// ================================================================
// Query modes:
//   ?card_id=X  → single FSRS state
//   (no params) → all FSRS states for student
// ================================================================
reviews.get("/fsrs", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const cardId = c.req.query("card_id");

    if (cardId) {
      const fsrs = await kv.get(fsrsKey(user.id, cardId));
      return c.json({ success: true, data: fsrs ?? null });
    }

    const allCardIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_FSRS + user.id + ":"
    );
    if (!allCardIds || allCardIds.length === 0) {
      return c.json({ success: true, data: [] });
    }
    const allFsrs = await kv.mget(
      (allCardIds as string[]).map((cId: string) =>
        fsrsKey(user.id, cId)
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

export default reviews;
