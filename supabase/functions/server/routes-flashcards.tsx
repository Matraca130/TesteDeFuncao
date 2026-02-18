// ============================================================
// Axon v4.2 — Dev 3: Flashcard CRUD Routes
// ============================================================
// POST /flashcards    — Create a flashcard card (D39: student source)
// GET  /flashcards    — List by summary_id or keyword_id
// GET  /flashcards/due — Scheduling: due cards sorted by overdue
// GET  /flashcards/:id — Get single card
// PUT  /flashcards/:id — Update card fields
// DELETE /flashcards/:id — Delete card + clean all indices
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

// Types — import ONLY the ones this file uses
import type { FlashcardCard, DueFlashcardItem, CardFsrsState } from "./shared-types.ts";

// Keys — canonical kv-keys.ts (ZERO references to kv-keys.tsx)
import {
  fcKey,
  fsrsKey,
  idxKwFc,
  idxSummaryFc,
  idxStudentFsrs,
  idxDue,
  KV_PREFIXES,
} from "./kv-keys.ts";

// Shared CRUD helpers
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  getChildren,
} from "./crud-factory.tsx";

const flashcards = new Hono();

// ── Helper: error message extractor ────────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ================================================================
// FLASHCARD CRUD
// ================================================================

// ================================================================
// POST /flashcards — Create a flashcard card
// ================================================================
// Validates required fields (keyword_id, front, back), builds
// the 12-field FlashcardCard, writes primary key + indices.
// D39: source defaults to 'student' for student-created cards.
// D27: subtopic_id defaults to keyword_id if not provided.
// ================================================================
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
      fcKey(id),
      idxKwFc(body.keyword_id, id),
    ];
    const vals: any[] = [card, id];

    // Optional: link to summary
    if (body.summary_id) {
      keys.push(idxSummaryFc(body.summary_id, id));
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

// ================================================================
// GET /flashcards — List by summary_id or keyword_id
// ================================================================
// Requires one of summary_id or keyword_id as query param.
// Uses getChildren to resolve index → primary keys.
// ================================================================
flashcards.get("/flashcards", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.query("summary_id");
    const keywordId = c.req.query("keyword_id");

    if (summaryId) {
      const cards = await getChildren(
        KV_PREFIXES.IDX_SUMMARY_FC + summaryId + ":",
        fcKey
      );
      return c.json({ success: true, data: cards });
    }

    if (keywordId) {
      const cards = await getChildren(
        KV_PREFIXES.IDX_KW_FC + keywordId + ":",
        fcKey
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

// ================================================================
// GET /flashcards/due — Scheduling: due cards sorted by overdue
// ================================================================
// IMPORTANT: This route MUST be registered BEFORE /flashcards/:id
// to avoid Hono matching "due" as an :id param.
//
// 1. Scan due index for student
// 2. Deduplicate card IDs
// 3. Load cards + FSRS states in parallel
// 4. Filter by due_at <= today
// 5. Sort by most overdue first
// 6. Apply limit
//
// Response shape: DueFlashcardItem { card, fsrs_state, overdue_days }
// ================================================================
flashcards.get("/flashcards/due", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const limitParam = c.req.query("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // 1. Get all card IDs from due index
    const allDueCardIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_DUE + user.id + ":"
    );

    if (!allDueCardIds || allDueCardIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    // 2. Deduplicate card IDs (old due entries may linger)
    const uniqueCardIds = [...new Set(allDueCardIds as string[])];

    // 3. Load cards + FSRS states in parallel
    const [cards, states] = await Promise.all([
      kv.mget(uniqueCardIds.map((id: string) => fcKey(id))),
      kv.mget(uniqueCardIds.map((id: string) => fsrsKey(user.id, id))),
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

      // Only include cards where due <= now
      if (fsrsState.due) {
        const dueDate = fsrsState.due.split("T")[0];
        if (dueDate <= today) {
          const overdueDays = Math.floor(
            (now - Date.parse(fsrsState.due)) / 86_400_000
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

// ================================================================
// GET /flashcards/:id — Get single card
// ================================================================
// Security: student-created cards are private to their creator.
// Non-student cards (ai, manual, imported) are accessible to all.
// ================================================================
flashcards.get("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const card = await kv.get(fcKey(c.req.param("id")));
    if (!card) return notFound(c, "Flashcard");

    // D39: Student-created cards are private to their creator
    if (card.source === "student" && card.created_by !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot access another student's flashcard",
          },
        },
        403
      );
    }

    return c.json({ success: true, data: card });
  } catch (err) {
    return serverError(c, "GET /flashcards/:id", err);
  }
});

// ================================================================
// PUT /flashcards/:id — Update card fields
// ================================================================
// Security: only the creator can edit any card.
// Whitelist: only front, back, image_url, status are updatable.
// Immutable: id, keyword_id, subtopic_id, institution_id,
//            summary_id, source, created_by, created_at
// ================================================================
flashcards.put("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const existing = await kv.get(fcKey(id));
    if (!existing) return notFound(c, "Flashcard");

    // Security: only the original creator can edit a card (D39 generalized)
    if (existing.created_by !== user.id) {
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

    await kv.set(fcKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /flashcards/:id", err);
  }
});

// ================================================================
// DELETE /flashcards/:id — Delete card + all indices
// ================================================================
// Security: only the original creator can delete any card.
// Cleans: primary key, keyword index, summary index (if linked),
//         FSRS state, student-FSRS index, due index entry.
// ================================================================
flashcards.delete("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const card = await kv.get(fcKey(id));
    if (!card) return notFound(c, "Flashcard");

    // Security: only the original creator can delete a card (D39 generalized)
    if (card.created_by !== user.id) {
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
      fcKey(id),
      idxKwFc(card.keyword_id, id),
    ];

    // Remove summary index if linked
    if (card.summary_id) {
      keysToDelete.push(idxSummaryFc(card.summary_id, id));
    }

    // Remove FSRS state for deleting user
    // (background job can handle other students' states)
    const cardFsrs = await kv.get(fsrsKey(user.id, id));
    if (cardFsrs) {
      keysToDelete.push(fsrsKey(user.id, id));
      keysToDelete.push(idxStudentFsrs(user.id, id));
      if (cardFsrs.due) {
        const dueDate = cardFsrs.due.split("T")[0];
        keysToDelete.push(idxDue(user.id, id, dueDate));
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

export default flashcards;
