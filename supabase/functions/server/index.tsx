// ============================================================
// Axon v4.2 — Hono Server (REWRITE from V1)
// ============================================================
// All V1 routes have been removed. This follows the v4.2 contract.
// Decisions: D5 (no backend-data), D10 (server computes all),
//            D16, D24, D27, D30, D36, D39, D44, D46
// ============================================================

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { seedStudentData } from "./seed.tsx";
import {
  handleChat,
  handleGenerateFlashcards,
  handleGenerateQuiz,
  handleExplain,
} from "./gemini.tsx";
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
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();
const PREFIX = "/make-server-0c4f6a3c";

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ============================================================
// Helpers
// ============================================================

/** Extract and verify authenticated user from Bearer token */
async function getAuthUser(c: any) {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

/** Standard error response: { success: false, error: { code, message } } */
function apiError(
  c: any,
  code: string,
  message: string,
  status: number = 400
) {
  return c.json({ success: false, error: { code, message } }, status);
}

/** Standard success response: { success: true, data: T } */
function apiSuccess(c: any, data: any, status: number = 200) {
  return c.json({ success: true, data }, status);
}

/** Safe mget that handles empty arrays */
async function safeMget(keys: string[]): Promise<any[]> {
  if (keys.length === 0) return [];
  return kv.mget(keys);
}

// ============================================================
// Health & Seed
// ============================================================

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

app.post(`${PREFIX}/seed`, async (c) => {
  try {
    await seedStudentData();
    return apiSuccess(c, { message: "Demo student data seeded successfully" });
  } catch (err) {
    return apiError(c, "SEED_ERROR", `Error seeding data: ${err}`, 500);
  }
});

// ============================================================
// FLASHCARD CRUD
// ============================================================

/**
 * POST /flashcards — Create a flashcard (🔐)
 * D39: Students can create personal flashcards (source='student').
 * D44: Student cards feed BKT with same multiplier.
 * KV: fc:{id} + idx:summary-fc + idx:kw-fc
 */
app.post(`${PREFIX}/flashcards`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user)
      return apiError(c, "AUTH_REQUIRED", "Authentication required", 401);

    const body = await c.req.json();
    const { summary_id, keyword_id, subtopic_id, question, answer, hint, source, tags } =
      body;

    if (!question || !answer) {
      return apiError(
        c,
        "VALIDATION_ERROR",
        "question and answer are required"
      );
    }
    if (!keyword_id) {
      return apiError(c, "VALIDATION_ERROR", "keyword_id is required");
    }

    const cardId = crypto.randomUUID();
    const now = new Date().toISOString();

    const card = {
      id: cardId,
      summary_id: summary_id || null,
      keyword_id,
      subtopic_id: subtopic_id || keyword_id, // D27: fallback
      question,
      answer,
      hint: hint || null,
      source: source || "student", // D39
      created_by: user.id,
      tags: tags || [],
      created_at: now,
      updated_at: now,
    };

    // Persist card + indices atomically
    const keys = [`fc:${cardId}`];
    const values: any[] = [card];

    if (summary_id) {
      keys.push(`idx:summary-fc:${summary_id}:${cardId}`);
      values.push(cardId);
    }
    keys.push(`idx:kw-fc:${keyword_id}:${cardId}`);
    values.push(cardId);

    await kv.mset(keys, values);

    console.log(
      `[Flashcard] Created ${cardId} by ${user.id} (source=${card.source})`
    );
    return apiSuccess(c, card, 201);
  } catch (err) {
    return apiError(
      c,
      "CREATE_ERROR",
      `Error creating flashcard: ${err}`,
      500
    );
  }
});

/**
 * GET /flashcards/due — Due flashcards for review (🔐)
 * Returns cards sorted by most-overdue-first.
 * Uses idx:due:{userId}:{date}:{cardId} index.
 * Query: ?course_id=x&limit=50
 */
app.get(`${PREFIX}/flashcards/due`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user)
      return apiError(c, "AUTH_REQUIRED", "Authentication required", 401);

    const userId = user.id;
    const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);

    // 1. Get all due card IDs from index
    const allDueValues = await kv.getByPrefix(`idx:due:${userId}:`);
    if (!allDueValues || allDueValues.length === 0) {
      return apiSuccess(c, []);
    }

    // 2. Deduplicate card IDs
    const uniqueIds = [...new Set(allDueValues as string[])];

    // 3. Load FSRS states to check actual due dates
    const fsrsKeys = uniqueIds.map((id) => `fsrs:${userId}:${id}`);
    const fsrsStates = await safeMget(fsrsKeys);

    // Build map: card_id -> fsrs_state
    const fsrsMap = new Map<string, any>();
    for (const state of fsrsStates) {
      if (state?.card_id) fsrsMap.set(state.card_id, state);
    }

    // 4. Filter overdue cards (due_at <= now) and compute overdue_days
    const now = new Date();
    const overdueItems = uniqueIds
      .filter((id) => {
        const s = fsrsMap.get(id);
        return s?.due_at && new Date(s.due_at) <= now;
      })
      .map((id) => {
        const s = fsrsMap.get(id)!;
        return {
          card_id: id,
          fsrs_state: s,
          overdue_days: Math.floor(
            (now.getTime() - new Date(s.due_at).getTime()) / 86_400_000
          ),
        };
      })
      .sort((a, b) => b.overdue_days - a.overdue_days); // Most overdue first

    // 5. Load the actual flashcard cards (limited)
    const topItems = overdueItems.slice(0, limit);
    const cardKeys = topItems.map((item) => `fc:${item.card_id}`);
    const cards = await safeMget(cardKeys);

    // Build map: id -> card
    const cardMap = new Map<string, any>();
    for (const card of cards) {
      if (card?.id) cardMap.set(card.id, card);
    }

    // 6. Combine and return
    const result = topItems
      .map((item) => ({
        card: cardMap.get(item.card_id) || null,
        fsrs_state: item.fsrs_state,
        overdue_days: item.overdue_days,
      }))
      .filter((r) => r.card !== null);

    return apiSuccess(c, result);
  } catch (err) {
    return apiError(
      c,
      "DUE_ERROR",
      `Error fetching due flashcards: ${err}`,
      500
    );
  }
});

/**
 * GET /flashcards — List flashcards by filter
 * Query: ?summary_id=x OR ?keyword_id=x
 * Uses idx:summary-fc or idx:kw-fc prefix lookup.
 */
app.get(`${PREFIX}/flashcards`, async (c) => {
  try {
    const summaryId = c.req.query("summary_id");
    const keywordId = c.req.query("keyword_id");

    let cardIds: string[] = [];

    if (summaryId) {
      const results = await kv.getByPrefix(`idx:summary-fc:${summaryId}:`);
      cardIds = (results || []) as string[];
    } else if (keywordId) {
      const results = await kv.getByPrefix(`idx:kw-fc:${keywordId}:`);
      cardIds = (results || []) as string[];
    } else {
      return apiError(
        c,
        "VALIDATION_ERROR",
        "summary_id or keyword_id query parameter is required"
      );
    }

    if (cardIds.length === 0) {
      return apiSuccess(c, []);
    }

    // Deduplicate and load cards
    const uniqueIds = [...new Set(cardIds)];
    const keys = uniqueIds.map((id) => `fc:${id}`);
    const cards = await safeMget(keys);

    return apiSuccess(c, cards.filter(Boolean));
  } catch (err) {
    return apiError(
      c,
      "LIST_ERROR",
      `Error listing flashcards: ${err}`,
      500
    );
  }
});

/**
 * GET /flashcards/:id — Get single flashcard
 * Direct KV lookup: fc:{id}
 */
app.get(`${PREFIX}/flashcards/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const card = await kv.get(`fc:${id}`);
    if (!card) {
      return apiError(c, "NOT_FOUND", `Flashcard ${id} not found`, 404);
    }
    return apiSuccess(c, card);
  } catch (err) {
    return apiError(
      c,
      "GET_ERROR",
      `Error fetching flashcard: ${err}`,
      500
    );
  }
});

/**
 * PUT /flashcards/:id — Update flashcard fields (🔐)
 * Only owner can update student-created cards.
 */
app.put(`${PREFIX}/flashcards/:id`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user)
      return apiError(c, "AUTH_REQUIRED", "Authentication required", 401);

    const id = c.req.param("id");
    const existing = await kv.get(`fc:${id}`);
    if (!existing) {
      return apiError(c, "NOT_FOUND", `Flashcard ${id} not found`, 404);
    }

    // Only owner can update student-created cards
    if (existing.source === "student" && existing.created_by !== user.id) {
      return apiError(
        c,
        "FORBIDDEN",
        "Cannot update another student's flashcard",
        403
      );
    }

    const body = await c.req.json();
    const updatable = ["question", "answer", "hint", "tags"];
    const updated = { ...existing, updated_at: new Date().toISOString() };

    for (const field of updatable) {
      if (body[field] !== undefined) {
        updated[field] = body[field];
      }
    }

    await kv.set(`fc:${id}`, updated);
    return apiSuccess(c, updated);
  } catch (err) {
    return apiError(
      c,
      "UPDATE_ERROR",
      `Error updating flashcard: ${err}`,
      500
    );
  }
});

/**
 * DELETE /flashcards/:id — Delete flashcard + all indices (🔐)
 * Cleans up: fc, idx:summary-fc, idx:kw-fc, fsrs, idx:student-fsrs
 */
app.delete(`${PREFIX}/flashcards/:id`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user)
      return apiError(c, "AUTH_REQUIRED", "Authentication required", 401);

    const id = c.req.param("id");
    const card = await kv.get(`fc:${id}`);
    if (!card) {
      return apiError(c, "NOT_FOUND", `Flashcard ${id} not found`, 404);
    }

    // Only owner can delete student-created cards
    if (card.source === "student" && card.created_by !== user.id) {
      return apiError(
        c,
        "FORBIDDEN",
        "Cannot delete another student's flashcard",
        403
      );
    }

    // Delete card + all known indices
    const keysToDelete = [`fc:${id}`];
    if (card.summary_id) {
      keysToDelete.push(`idx:summary-fc:${card.summary_id}:${id}`);
    }
    keysToDelete.push(`idx:kw-fc:${card.keyword_id}:${id}`);

    // Clean up creator's FSRS state and index
    keysToDelete.push(`fsrs:${user.id}:${id}`);
    keysToDelete.push(`idx:student-fsrs:${user.id}:${id}`);

    await kv.mdel(keysToDelete);

    console.log(`[Flashcard] Deleted ${id} by ${user.id}`);
    return apiSuccess(c, { deleted: true });
  } catch (err) {
    return apiError(
      c,
      "DELETE_ERROR",
      `Error deleting flashcard: ${err}`,
      500
    );
  }
});

// ============================================================
// POST /reviews — THE CRITICAL ENDPOINT
// ============================================================
// D10: Frontend ONLY sends grade. Backend computes EVERYTHING.
// Cascade: GRADE_TO_BKT → updateBKT → calcFSRS → getDisplayMastery
//          → getThreshold → delta → getColorFromDelta → persist
// Writes atomically: BKT + FSRS + ReviewLog + 5 indices
// ============================================================

app.post(`${PREFIX}/reviews`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user)
      return apiError(c, "AUTH_REQUIRED", "Authentication required", 401);
    const userId = user.id;

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

    // ── Validation ─────────────────────────────────────────
    if (
      !session_id ||
      !item_id ||
      !instrument_type ||
      !subtopic_id ||
      !keyword_id
    ) {
      return apiError(
        c,
        "VALIDATION_ERROR",
        "Missing required fields: session_id, item_id, instrument_type, subtopic_id, keyword_id"
      );
    }
    if (!["flashcard", "quiz"].includes(instrument_type)) {
      return apiError(
        c,
        "VALIDATION_ERROR",
        "instrument_type must be 'flashcard' or 'quiz'"
      );
    }

    // 1. Map grade → BKT params
    const bktParams = GRADE_TO_BKT[grade];
    if (!bktParams) {
      return apiError(
        c,
        "VALIDATION_ERROR",
        `Invalid grade value: ${grade}. Must be one of: ${VALID_GRADES.join(", ")}`
      );
    }

    // 2. Read current BKT state (or create initial)
    const bktKey = `bkt:${userId}:${subtopic_id}`;
    let bkt = await kv.get(bktKey);
    if (!bkt) {
      bkt = createInitialBktState(userId, subtopic_id, keyword_id);
    }

    // 3. Update BKT mastery
    const newMastery = updateBKT(
      bkt.p_know,
      bkt.max_mastery,
      bktParams.correct,
      instrument_type as "flashcard" | "quiz",
      bktParams.gradeMult
    );
    const newMaxMastery = Math.max(bkt.max_mastery, newMastery);

    // 4. FSRS (flashcard only — D36)
    let newStability = bkt.stability;
    let fsrsState: any = null;
    let oldDueDate: string | null = null;
    let newDueDate: string | null = null;

    if (instrument_type === "flashcard") {
      const fsrsKey = `fsrs:${userId}:${item_id}`;
      fsrsState = await kv.get(fsrsKey);
      if (!fsrsState) {
        fsrsState = createInitialCardFsrs(userId, item_id);
      }
      oldDueDate = fsrsState.due_at?.split("T")[0] ?? null;

      const firstReview = fsrsState.state === "new";
      if (firstReview) {
        // First review: use initial stability based on grade
        newStability = getInitialS(grade);
        fsrsState.state = "learning";
      } else {
        // Subsequent reviews: full FSRS calculation
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

      // Update FSRS state
      fsrsState.stability = newStability;
      fsrsState.last_review_at = new Date().toISOString();
      // Schedule next review: due_at = now + stability days
      const dueAt = new Date(Date.now() + newStability * 86_400_000);
      fsrsState.due_at = dueAt.toISOString();
      newDueDate = dueAt.toISOString().split("T")[0];
      fsrsState.updated_at = new Date().toISOString();
    }

    // 5. Recompute delta & color
    const kw = await kv.get(`kw:${keyword_id}`);
    const priority = kw?.priority ?? 1;
    // 0 daysSince because we JUST reviewed
    const displayM = getDisplayMastery(newMastery, 0, newStability);
    const threshold = getThreshold(priority);
    const delta = threshold > 0 ? displayM / threshold : 0;
    const colorInfo = getColorFromDelta(delta);
    const colorName =
      delta >= 1.1
        ? "blue"
        : delta >= 1.0
          ? "green"
          : delta >= 0.85
            ? "yellow"
            : delta >= 0.5
              ? "orange"
              : "red";

    // 6. Build updated BKT state
    const now = new Date().toISOString();
    const updatedBkt = {
      ...bkt,
      p_know: newMastery,
      max_mastery: newMaxMastery,
      stability: newStability,
      delta,
      color: colorName,
      exposures: bkt.exposures + 1,
      lapses: grade < 0.35 ? bkt.lapses + 1 : bkt.lapses,
      due_at: fsrsState?.due_at ?? bkt.due_at,
      last_review_at: now,
      updated_at: now,
    };

    // 7. Create review log
    const reviewId = crypto.randomUUID();
    const reviewLog = {
      id: reviewId,
      student_id: userId,
      session_id,
      item_id,
      instrument_type,
      subtopic_id,
      keyword_id,
      grade,
      response_time_ms: response_time_ms ?? null, // D46: saved but unused
      bkt_after: newMastery,
      stability_after:
        instrument_type === "flashcard" ? newStability : null,
      delta_after: delta,
      color_after: colorName,
      created_at: now,
    };

    // 8. Persist EVERYTHING atomically with mset
    const persistKeys: string[] = [
      bktKey,
      `review:${reviewId}`,
      `idx:session-reviews:${session_id}:${reviewId}`,
      `idx:student-kw-bkt:${userId}:${keyword_id}:${subtopic_id}`,
      `idx:student-bkt:${userId}:${subtopic_id}`,
    ];
    const persistValues: any[] = [
      updatedBkt,
      reviewLog,
      reviewId,
      subtopic_id,
      subtopic_id,
    ];

    if (instrument_type === "flashcard" && fsrsState) {
      persistKeys.push(`fsrs:${userId}:${item_id}`);
      persistValues.push(fsrsState);
      persistKeys.push(`idx:student-fsrs:${userId}:${item_id}`);
      persistValues.push(item_id);
      // Due index: add new date entry
      if (newDueDate) {
        persistKeys.push(`idx:due:${userId}:${newDueDate}:${item_id}`);
        persistValues.push(item_id);
      }
    }

    await kv.mset(persistKeys, persistValues);

    // Delete old due entry if date changed
    if (oldDueDate && oldDueDate !== newDueDate) {
      await kv.del(`idx:due:${userId}:${oldDueDate}:${item_id}`);
    }

    // 9. Update session counters
    const session = await kv.get(`session:${session_id}`);
    if (session) {
      session.items_reviewed = (session.items_reviewed || 0) + 1;
      if (!session.keywords_touched) session.keywords_touched = [];
      if (!session.keywords_touched.includes(keyword_id))
        session.keywords_touched.push(keyword_id);
      if (!session.subtopics_touched) session.subtopics_touched = [];
      if (!session.subtopics_touched.includes(subtopic_id))
        session.subtopics_touched.push(subtopic_id);
      await kv.set(`session:${session_id}`, session);
    }

    // 10. Return response
    console.log(
      `[Review] ${userId} reviewed ${item_id} (${instrument_type}) grade=${grade} → mastery=${newMastery.toFixed(3)} delta=${delta.toFixed(3)} color=${colorName}`
    );

    return apiSuccess(c, {
      review_log: reviewLog,
      updated_bkt: updatedBkt,
      updated_card_fsrs: fsrsState,
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
    });
  } catch (err) {
    console.log(`[Review] Error: ${err}`);
    return apiError(
      c,
      "REVIEW_ERROR",
      `Error processing review: ${err}`,
      500
    );
  }
});

// ============================================================
// SESSIONS
// ============================================================

/**
 * POST /sessions — Create a study session (🔐)
 * KV: session:{id} + idx:student-sessions:{userId}:{id}
 */
app.post(`${PREFIX}/sessions`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user)
      return apiError(c, "AUTH_REQUIRED", "Authentication required", 401);

    const body = await c.req.json();
    const { course_id, instrument_type } = body;

    if (!course_id) {
      return apiError(c, "VALIDATION_ERROR", "course_id is required");
    }

    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const session = {
      id: sessionId,
      student_id: user.id,
      course_id,
      instrument_type: instrument_type || "flashcard",
      started_at: now,
      ended_at: null,
      items_reviewed: 0,
      keywords_touched: [] as string[],
      subtopics_touched: [] as string[],
      duration_minutes: null,
      created_at: now,
      updated_at: now,
    };

    // Persist session + student index
    await kv.mset(
      [`session:${sessionId}`, `idx:student-sessions:${user.id}:${sessionId}`],
      [session, sessionId]
    );

    console.log(
      `[Session] Started ${sessionId} for ${user.id} (${instrument_type || "flashcard"})`
    );
    return apiSuccess(c, session, 201);
  } catch (err) {
    return apiError(
      c,
      "SESSION_ERROR",
      `Error creating session: ${err}`,
      500
    );
  }
});

/**
 * PUT /sessions/:id/end — End a study session (🔐)
 * Calculates duration_minutes and aggregates from review logs.
 */
app.put(`${PREFIX}/sessions/:id/end`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user)
      return apiError(c, "AUTH_REQUIRED", "Authentication required", 401);

    const sessionId = c.req.param("id");
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return apiError(
        c,
        "NOT_FOUND",
        `Session ${sessionId} not found`,
        404
      );
    }
    if (session.student_id !== user.id) {
      return apiError(
        c,
        "FORBIDDEN",
        "Cannot end another student's session",
        403
      );
    }

    const now = new Date().toISOString();
    const durationMs = Date.parse(now) - Date.parse(session.started_at);

    session.ended_at = now;
    session.duration_minutes = Math.round(durationMs / 60_000);
    session.updated_at = now;

    // Aggregate stats from reviews in this session
    const reviewIds = await kv.getByPrefix(
      `idx:session-reviews:${sessionId}:`
    );
    session.total_reviews = reviewIds?.length || 0;
    session.unique_keywords = session.keywords_touched?.length || 0;
    session.unique_subtopics = session.subtopics_touched?.length || 0;

    await kv.set(`session:${sessionId}`, session);

    console.log(
      `[Session] Ended ${sessionId}: ${session.duration_minutes}min, ${session.total_reviews} reviews`
    );
    return apiSuccess(c, session);
  } catch (err) {
    return apiError(
      c,
      "SESSION_END_ERROR",
      `Error ending session: ${err}`,
      500
    );
  }
});

// ============================================================
// AI ROUTES (conserved from gemini.tsx)
// ============================================================

app.post(`${PREFIX}/ai/chat`, async (c) => {
  try {
    const { messages, context } = await c.req.json();
    if (!messages || !Array.isArray(messages)) {
      return apiError(c, "VALIDATION_ERROR", "messages array is required");
    }
    const reply = await handleChat(messages, context);
    return apiSuccess(c, { reply });
  } catch (err) {
    return apiError(c, "AI_ERROR", `AI chat error: ${err}`, 500);
  }
});

app.post(`${PREFIX}/ai/flashcards`, async (c) => {
  try {
    const { topic, count, context } = await c.req.json();
    if (!topic) {
      return apiError(c, "VALIDATION_ERROR", "topic is required");
    }
    const flashcards = await handleGenerateFlashcards(
      topic,
      count || 5,
      context
    );
    return apiSuccess(c, { flashcards });
  } catch (err) {
    return apiError(
      c,
      "AI_ERROR",
      `Flashcard generation error: ${err}`,
      500
    );
  }
});

app.post(`${PREFIX}/ai/quiz`, async (c) => {
  try {
    const { topic, count, difficulty } = await c.req.json();
    if (!topic) {
      return apiError(c, "VALIDATION_ERROR", "topic is required");
    }
    const questions = await handleGenerateQuiz(
      topic,
      count || 3,
      difficulty || "intermediate"
    );
    return apiSuccess(c, { questions });
  } catch (err) {
    return apiError(c, "AI_ERROR", `Quiz generation error: ${err}`, 500);
  }
});

app.post(`${PREFIX}/ai/explain`, async (c) => {
  try {
    const { concept, context } = await c.req.json();
    if (!concept) {
      return apiError(c, "VALIDATION_ERROR", "concept is required");
    }
    const explanation = await handleExplain(concept, context);
    return apiSuccess(c, { explanation });
  } catch (err) {
    return apiError(c, "AI_ERROR", `Explain error: ${err}`, 500);
  }
});

// ============================================================
// Server start
// ============================================================

Deno.serve(app.fetch);
