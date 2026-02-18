// ============================================================
// Axon v4.2 — Dev 3: Flashcard CRUD Routes
// ============================================================
// 6 routes: POST, GET, GET/due, GET/:id, PUT/:id, DELETE/:id
//
// Imports:
//   ./kv-keys.ts       — Canonical key generation functions
//   ./shared-types.ts   — Entity type definitions
//   ./crud-factory.tsx  — Shared helpers (auth, errors, children)
//   ./kv_store.tsx      — KV CRUD operations
//
// KV Keys:
//   fc:{id}                              → FlashcardCard
//   fsrs:{studentId}:{cardId}             → CardFsrsState
//   idx:kw-fc:{kwId}:{fcId}               → fcId
//   idx:summary-fc:{sumId}:{fcId}         → fcId
//   idx:due:{studentId}:{cardId}:{date}   → cardId
//   idx:student-fsrs:{sId}:{cId}          → cardId
//
// Decisions: D16, D27, D30, D36, D39, D44
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import type {
  FlashcardCard,
  CardFsrsState,
} from "./shared-types.ts";
import {
  fcKey,
  fsrsKey,
  idxKwFc,
  idxSummaryFc,
  idxDue,
  idxStudentFsrs,
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  getChildren,
} from "./crud-factory.tsx";

const flashcards = new Hono();

// ================================================================
// POST /flashcards — Create a flashcard card
// ================================================================
// Body: { keyword_id, front, back, summary_id?, subtopic_id?,
//         institution_id?, image_url?, status?, source? }
// FlashcardCard: fields per contract + operational extras.
// D39: default source='manual', D27: subtopic fallback = keyword
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

    const card = {
      id,
      summary_id: body.summary_id ?? null,
      keyword_id: body.keyword_id,
      subtopic_id: body.subtopic_id ?? body.keyword_id, // D27
      institution_id: body.institution_id ?? null,
      front: body.front,
      back: body.back,
      image_url: body.image_url ?? null,
      status: body.status ?? "active",  // Bug 3 fix: was "published"
      source: body.source ?? "manual",  // Bug 4 fix: was "student"
      created_by: user.id,
      created_at: now,
      updated_at: now,                  // Bug 5 fix: was missing
    };

    // Primary key + indices
    const keys: string[] = [
      fcKey(id),
      idxKwFc(body.keyword_id, id),
    ];
    const vals: unknown[] = [card, id];

    // Optional: link to summary
    if (body.summary_id) {
      keys.push(idxSummaryFc(body.summary_id, id));
      vals.push(id);
    }

    await kv.mset(keys, vals);

    console.log(
      `[Flashcards] Created card ${id.slice(0, 8)}… kw=${body.keyword_id.slice(0, 8)}… by=${user.id.slice(0, 8)}… source=${card.source}`
    );
    return c.json({ success: true, data: card }, 201);
  } catch (err) {
    return serverError(c, "POST /flashcards", err);
  }
});

// ================================================================
// GET /flashcards — List by summary_id or keyword_id
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
// Uses canonical field `due` (not legacy `due_at`).
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
    const result: { card: any; fsrs_state: any; overdue_days: number }[] = [];
    for (let i = 0; i < uniqueCardIds.length; i++) {
      const card = cards[i];
      const fsrsState = states[i] as CardFsrsState | null;

      if (!card || !fsrsState) continue;

      // Canonical field: "due" (not "due_at")
      if (fsrsState.due) {
        const dueDate = fsrsState.due.split("T")[0];
        if (dueDate <= today) {
          const overdueDays = Math.floor(
            (now - Date.parse(fsrsState.due)) / 86_400_000
          );
          result.push({
            card,
            fsrs_state: fsrsState,
            overdue_days: Math.max(0, overdueDays),
          });
        }
      }
    }

    // 5. Sort by most overdue first
    result.sort((a, b) => b.overdue_days - a.overdue_days);

    // 6. Apply limit
    console.log(
      `[Flashcards] /due for ${user.id.slice(0, 8)}…: ${result.length} due (limit=${limit})`
    );
    return c.json({ success: true, data: result.slice(0, limit) });
  } catch (err) {
    return serverError(c, "GET /flashcards/due", err);
  }
});

// ================================================================
// GET /flashcards/:id — Get single card
// ================================================================
flashcards.get("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const card = await kv.get(fcKey(c.req.param("id")));
    if (!card) return notFound(c, "Flashcard");
    return c.json({ success: true, data: card });
  } catch (err) {
    return serverError(c, "GET /flashcards/:id", err);
  }
});

// ================================================================
// PUT /flashcards/:id — Update card fields
// ================================================================
// D39: Students can only edit their own cards.
// Whitelist: front, back, image_url, status.
// Immutable: id, keyword_id, subtopic_id, institution_id,
//            summary_id, source, created_by, created_at.
// ================================================================
flashcards.put("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const existing = await kv.get(fcKey(id));
    if (!existing) return notFound(c, "Flashcard");

    // D39: Students can only edit their own cards
    if (
      existing.source === "manual" &&
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
    updated.updated_at = new Date().toISOString(); // Bug 5 fix: was missing

    await kv.set(fcKey(id), updated);

    console.log(
      `[Flashcards] Updated card ${id.slice(0, 8)}… by=${user.id.slice(0, 8)}…`
    );
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /flashcards/:id", err);
  }
});

// ================================================================
// DELETE /flashcards/:id — Delete card + all indices
// ================================================================
// D39: Students can only delete their own cards.
// Cleans up: primary, kw index, summary index, FSRS, due index.
// ================================================================
flashcards.delete("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const card = await kv.get(fcKey(id));
    if (!card) return notFound(c, "Flashcard");

    // D39: Students can only delete their own cards
    if (card.source === "manual" && card.created_by !== user.id) {
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
    const fsrsState: CardFsrsState | null = await kv.get(
      fsrsKey(user.id, id)
    );
    if (fsrsState) {
      keysToDelete.push(fsrsKey(user.id, id));
      keysToDelete.push(idxStudentFsrs(user.id, id));
      // Canonical field: "due" (not legacy "due_at")
      if (fsrsState.due) {
        const dueDate = fsrsState.due.split("T")[0];
        keysToDelete.push(idxDue(user.id, id, dueDate));
      }
    }

    await kv.mdel(keysToDelete);

    console.log(
      `[Flashcards] Deleted card ${id.slice(0, 8)}… kw=${card.keyword_id.slice(0, 8)}… by=${user.id.slice(0, 8)}…`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /flashcards/:id", err);
  }
});

export default flashcards;
