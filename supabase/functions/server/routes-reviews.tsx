// ============================================================
// Axon v4.2 — Dev 3→4: Review Cascade & Learning State Routes
// ============================================================
// 3 routes:
//   POST /reviews   — THE critical cascade (BKT → FSRS → log)
//   GET  /bkt       — BKT states for current student
//   GET  /fsrs      — FSRS states for current student
//
// Imports:
//   ./kv-keys.ts       — Canonical key generation functions
//   ./shared-types.ts   — Entity type definitions
//   ./fsrs-engine.ts   — reviewCard(), createNewCard() (PROTECTED)
//   ./crud-factory.tsx  — Shared helpers
//   ./kv_store.tsx      — KV CRUD operations
//
// BKT helpers are LOCAL to this file (not in fsrs-engine).
//
// Key decisions:
//   D10 — Frontend ONLY sends grade; backend computes everything
//   D16 — Flashcard uses self-evaluation (Again/Hard/Good/Easy)
//   D24 — Sub-topic is the evaluable unit (BKT lives there)
//   D27 — If keyword has no sub-topics, subtopic_id = keyword_id
//   D30 — FLASHCARD_MULTIPLIER = 1.00
//   D36 — Only flashcards have individual FSRS state
//   D44 — Student cards feed BKT with same multiplier
//   D46 — response_time_ms saved but does NOT affect algorithms
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import type {
  SubTopicBktState,
  CardFsrsState,
  ReviewLog,
  BktColor,
  FsrsGrade,
  InstrumentType,
} from "./shared-types.ts";
import {
  bktKey,
  fsrsKey,
  reviewKey,
  sessionKey,
  kwKey,
  idxSessionReviews,
  idxStudentKwBkt,
  idxStudentBkt,
  idxDue,
  idxStudentFsrs,
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  reviewCard,
  createNewCard,
} from "./fsrs-engine.ts";
import type { FsrsCard } from "./fsrs-engine.ts";
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

// ════════════════════════════════════════════════════════════
// LOCAL BKT HELPERS (not in fsrs-engine — kept here for
// isolation; BKT is independent of FSRS scheduling)
// ════════════════════════════════════════════════════════════

// ── Default BKT parameters ─────────────────────────────────
const BKT_DEFAULTS = {
  p_know: 0.1,
  p_slip: 0.1,
  p_guess: 0.25,
  p_transit: 0.1,
};

// ── Create initial BKT state for a subtopic ────────────────
function createInitialBktState(
  studentId: string,
  subtopicId: string,
  keywordId: string
): SubTopicBktState {
  return {
    student_id: studentId,
    subtopic_id: subtopicId,
    keyword_id: keywordId,
    p_know: BKT_DEFAULTS.p_know,
    p_slip: BKT_DEFAULTS.p_slip,
    p_guess: BKT_DEFAULTS.p_guess,
    p_transit: BKT_DEFAULTS.p_transit,
    stability: 0,
    delta: 0,
    color: "red" as BktColor,
    last_review: "",
    review_count: 0,
  };
}

// ── Classic BKT Bayesian update ────────────────────────────
// Returns new p_know after observing correct/incorrect.
function updateBktMastery(
  pKnow: number,
  pSlip: number,
  pGuess: number,
  pTransit: number,
  correct: boolean
): number {
  let pKnowGivenEvidence: number;
  if (correct) {
    // P(K | correct) = P(K)*(1-P(slip)) / [P(K)*(1-P(slip)) + (1-P(K))*P(guess)]
    const numerator = pKnow * (1 - pSlip);
    const denominator = numerator + (1 - pKnow) * pGuess;
    pKnowGivenEvidence = denominator > 0 ? numerator / denominator : pKnow;
  } else {
    // P(K | wrong) = P(K)*P(slip) / [P(K)*P(slip) + (1-P(K))*(1-P(guess))]
    const numerator = pKnow * pSlip;
    const denominator = numerator + (1 - pKnow) * (1 - pGuess);
    pKnowGivenEvidence = denominator > 0 ? numerator / denominator : pKnow;
  }
  // Apply learning transition
  const newPKnow = pKnowGivenEvidence + (1 - pKnowGivenEvidence) * pTransit;
  return Math.max(0, Math.min(1, newPKnow));
}

// ── Delta → BktColor mapping ──────────────────────────────
function getColorFromDelta(delta: number): BktColor {
  if (delta >= 1.0) return "green";
  if (delta >= 0.6) return "yellow";
  if (delta >= 0.3) return "orange";
  return "red";
}

// ── Priority → mastery threshold ──────────────────────────
function getThreshold(priority: number): number {
  switch (priority) {
    case 0: return 0.95; // critical
    case 1: return 0.90; // high
    case 2: return 0.80; // medium
    case 3: return 0.65; // low
    default: return 0.80;
  }
}

// Valid grade values (FSRS: 1=Again, 2=Hard, 3=Good, 4=Easy)
const VALID_GRADES = [1, 2, 3, 4];

// ================================================================
// POST /reviews — THE CRITICAL CASCADE ROUTE
// ================================================================
// Flow: validate → BKT read → FSRS compute (via reviewCard) →
//       BKT update → delta+color → review log → persist mset →
//       session counters
//
// Body: { session_id, item_id, instrument_type, subtopic_id,
//         keyword_id, grade (1-4), response_time_ms? }
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

    if (!VALID_GRADES.includes(grade)) {
      return validationError(
        c,
        `Invalid grade value: ${grade}. Must be one of: ${VALID_GRADES.join(", ")}`
      );
    }

    const userId = user.id;
    const now = new Date().toISOString();
    const correct = grade >= 3; // Good(3) or Easy(4) = correct

    // ── 1. Read current BKT state (or create initial) ──────
    const bktK = bktKey(userId, subtopic_id);
    let bkt: SubTopicBktState = await kv.get(bktK);
    if (!bkt) {
      bkt = createInitialBktState(userId, subtopic_id, keyword_id);
    }
    const colorBefore = bkt.color;

    // ── 2. FSRS (flashcard only — D36) ───────────────────
    let fsrsState: CardFsrsState | null = null;
    let oldDueDate: string | null = null;
    let newDueDate: string | null = null;

    if (instrument_type === "flashcard") {
      // Read existing FSRS state or create new card
      const existingFsrs = await kv.get(fsrsKey(userId, item_id));
      let card: FsrsCard;

      if (existingFsrs) {
        oldDueDate = existingFsrs.due?.split("T")[0] ?? null;
        // Extract FsrsCard fields from stored state
        card = {
          due: existingFsrs.due ?? new Date().toISOString(),
          stability: existingFsrs.stability ?? 0,
          difficulty: existingFsrs.difficulty ?? 0,
          elapsed_days: existingFsrs.elapsed_days ?? 0,
          scheduled_days: existingFsrs.scheduled_days ?? 0,
          reps: existingFsrs.reps ?? 0,
          lapses: existingFsrs.lapses ?? 0,
          state: existingFsrs.state ?? 0,
          last_review: existingFsrs.last_review ?? "",
        };
      } else {
        card = createNewCard();
      }

      // Call canonical FSRS engine — single function handles
      // new cards, learning, review, and relearning
      const result = reviewCard(card, grade as FsrsGrade);

      // Map result to CardFsrsState for storage
      fsrsState = {
        student_id: userId,
        card_id: item_id,
        ...result.card,
      } as CardFsrsState;

      newDueDate = result.card.due.split("T")[0];
    }

    // ── 3. Update BKT mastery ──────────────────────────
    const newPKnow = updateBktMastery(
      bkt.p_know,
      bkt.p_slip,
      bkt.p_guess,
      bkt.p_transit,
      correct
    );

    // ── 4. Compute delta & color ─────────────────────
    const kwData = await kv.get(kwKey(keyword_id));
    const priority = kwData?.priority ?? 1;
    const threshold = getThreshold(priority);
    const newStability = fsrsState ? fsrsState.stability : bkt.stability;
    const delta = threshold > 0 ? newPKnow / threshold : 0;
    const colorAfter = getColorFromDelta(delta);

    // ── 5. Update BKT state ────────────────────────────
    const updatedBkt: SubTopicBktState = {
      ...bkt,
      p_know: newPKnow,
      stability: newStability,
      delta,
      color: colorAfter,
      last_review: now,
      review_count: bkt.review_count + 1,
    };

    // ── 6. Create review log ───────────────────────────
    const reviewId = crypto.randomUUID();
    const reviewLog: ReviewLog = {
      id: reviewId,
      student_id: userId,
      session_id,
      item_id,
      instrument_type: instrument_type as InstrumentType,
      grade: grade as FsrsGrade,
      response_time_ms: response_time_ms ?? undefined,
      color_before: colorBefore,
      color_after: colorAfter,
      created_at: now,
    };

    // ── 7. Persist EVERYTHING atomically ──────────────────
    const keys: string[] = [
      bktK,
      reviewKey(reviewId),
      idxSessionReviews(session_id, reviewId),
      idxStudentKwBkt(userId, keyword_id, subtopic_id),
      idxStudentBkt(userId, subtopic_id),
    ];
    const values: unknown[] = [
      updatedBkt,
      reviewLog,
      reviewId,
      subtopic_id,
      subtopic_id,
    ];

    if (instrument_type === "flashcard" && fsrsState) {
      keys.push(fsrsKey(userId, item_id));
      values.push(fsrsState);
      keys.push(idxStudentFsrs(userId, item_id));
      values.push(item_id);

      // Due index: add new due entry
      if (newDueDate) {
        keys.push(idxDue(userId, item_id, newDueDate));
        values.push(item_id);
      }
    }

    await kv.mset(keys, values);

    // Delete old due entry if date changed (separate op, can't be in mset)
    if (
      instrument_type === "flashcard" &&
      oldDueDate &&
      oldDueDate !== newDueDate
    ) {
      try {
        await kv.del(idxDue(userId, item_id, oldDueDate));
      } catch (_e) {
        // Non-critical: old due entry cleanup
      }
    }

    // ── 8. Update session counters ─────────────────────
    try {
      const session = await kv.get(sessionKey(session_id));
      if (session) {
        session.total_reviews = (session.total_reviews ?? 0) + 1;
        if (correct) {
          session.correct_reviews = (session.correct_reviews ?? 0) + 1;
        }
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
    } catch (_e) {
      // Non-critical: session counter update
      console.log(`[Reviews] Warning: failed to update session ${session_id.slice(0, 8)}… counters`);
    }

    // ── 9. Return response ─────────────────────────────
    console.log(
      `[Reviews] ${instrument_type} review: item=${item_id.slice(0, 8)}… by=${userId.slice(0, 8)}… ` +
        `grade=${grade} mastery=${newPKnow.toFixed(3)} delta=${delta.toFixed(3)} color=${colorAfter}`
    );

    return c.json({
      success: true,
      data: {
        review_log: reviewLog,
        updated_bkt: updatedBkt,
        updated_card_fsrs: fsrsState,
        feedback: {
          delta_before: bkt.delta,
          delta_after: delta,
          color_before: colorBefore,
          color_after: colorAfter,
          mastery: newPKnow,
          stability:
            instrument_type === "flashcard" ? newStability : null,
          next_due: fsrsState?.due ?? null,
        },
      },
    });
  } catch (err) {
    return serverError(c, "POST /reviews", err);
  }
});

// ================================================================
// GET /bkt — Get BKT states for current student
// ================================================================
// Query params:
//   ?subtopic_id=X  → single BKT state
//   ?keyword_id=X   → all subtopic BKTs for that keyword
//   (none)          → all BKT states for the student
// ================================================================
reviews.get("/bkt", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const keywordId = c.req.query("keyword_id");
    const subtopicId = c.req.query("subtopic_id");

    if (subtopicId) {
      const bkt: SubTopicBktState | null = await kv.get(
        bktKey(user.id, subtopicId)
      );
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
// Query params:
//   ?card_id=X  → single FSRS state
//   (none)      → all FSRS states for the student
// ================================================================
reviews.get("/fsrs", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const cardId = c.req.query("card_id");

    if (cardId) {
      const fsrs: CardFsrsState | null = await kv.get(
        fsrsKey(user.id, cardId)
      );
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
