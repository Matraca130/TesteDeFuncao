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

// Helper: error message extractor
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// POST /flashcards — Create a flashcard card
flashcards.post("/flashcards", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();

    if (!body.keyword_id || !body.front || !body.back) {
      return validationError(c, "Missing required fields: keyword_id, front, back");
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
      status: body.status ?? "approved",
      source: body.source ?? "student", // D39: default student
      created_by: user.id,
      created_at: now,
    };

    const keys: string[] = [fcKey(id), idxKwFc(body.keyword_id, id)];
    const vals: any[] = [card, id];

    if (body.summary_id) {
      keys.push(idxSummaryFc(body.summary_id, id));
      vals.push(id);
    }

    await kv.mset(keys, vals);
    console.log(`[Flashcards] Created card ${id} for keyword ${body.keyword_id} by ${user.id} (source: ${card.source})`);
    return c.json({ success: true, data: card }, 201);
  } catch (err) {
    return serverError(c, "POST /flashcards", err);
  }
});

// GET /flashcards — List by summary_id or keyword_id
flashcards.get("/flashcards", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.query("summary_id");
    const keywordId = c.req.query("keyword_id");

    if (summaryId) {
      const cards = await getChildren(KV_PREFIXES.IDX_SUMMARY_FC + summaryId + ":", fcKey);
      return c.json({ success: true, data: cards });
    }
    if (keywordId) {
      const cards = await getChildren(KV_PREFIXES.IDX_KW_FC + keywordId + ":", fcKey);
      return c.json({ success: true, data: cards });
    }
    return validationError(c, "summary_id or keyword_id query param required");
  } catch (err) {
    return serverError(c, "GET /flashcards", err);
  }
});

// GET /flashcards/due — Due cards sorted by overdue
// MUST be registered BEFORE /flashcards/:id
flashcards.get("/flashcards/due", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const limitParam = c.req.query("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const allDueCardIds = await kv.getByPrefix(KV_PREFIXES.IDX_DUE + user.id + ":");
    if (!allDueCardIds || allDueCardIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const uniqueCardIds = [...new Set(allDueCardIds as string[])];
    const [cards, states] = await Promise.all([
      kv.mget(uniqueCardIds.map((id: string) => fcKey(id))),
      kv.mget(uniqueCardIds.map((id: string) => fsrsKey(user.id, id))),
    ]);

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];
    const result: any[] = [];

    for (let i = 0; i < uniqueCardIds.length; i++) {
      const card = cards[i];
      const fsrsState = states[i];
      if (!card || !fsrsState) continue;
      if (fsrsState.due) {
        const dueDate = fsrsState.due.split("T")[0];
        if (dueDate <= today) {
          const overdueDays = Math.floor((now - Date.parse(fsrsState.due)) / 86_400_000);
          result.push({ card, fsrs_state: fsrsState, overdue_days: Math.max(0, overdueDays) });
        }
      }
    }

    result.sort((a, b) => b.overdue_days - a.overdue_days);
    return c.json({ success: true, data: result.slice(0, limit) });
  } catch (err) {
    return serverError(c, "GET /flashcards/due", err);
  }
});

// GET /flashcards/:id
flashcards.get("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const card = await kv.get(fcKey(c.req.param("id")));
    if (!card) return notFound(c, "Flashcard");
    if (card.source === "student" && card.created_by !== user.id) {
      return c.json({ success: false, error: { code: "FORBIDDEN", message: "Cannot access another student's flashcard" } }, 403);
    }
    return c.json({ success: true, data: card });
  } catch (err) {
    return serverError(c, "GET /flashcards/:id", err);
  }
});

// PUT /flashcards/:id
flashcards.put("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(fcKey(id));
    if (!existing) return notFound(c, "Flashcard");
    if (existing.created_by !== user.id) {
      return c.json({ success: false, error: { code: "FORBIDDEN", message: "Cannot edit another student's flashcard" } }, 403);
    }
    const body = await c.req.json();
    const UPDATABLE = ["front", "back", "image_url", "status"];
    const updated = { ...existing };
    for (const field of UPDATABLE) {
      if (body[field] !== undefined) updated[field] = body[field];
    }
    await kv.set(fcKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /flashcards/:id", err);
  }
});

// DELETE /flashcards/:id
flashcards.delete("/flashcards/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const card = await kv.get(fcKey(id));
    if (!card) return notFound(c, "Flashcard");
    if (card.created_by !== user.id) {
      return c.json({ success: false, error: { code: "FORBIDDEN", message: "Cannot delete another student's flashcard" } }, 403);
    }
    const keysToDelete: string[] = [fcKey(id), idxKwFc(card.keyword_id, id)];
    if (card.summary_id) keysToDelete.push(idxSummaryFc(card.summary_id, id));
    const cardFsrs = await kv.get(fsrsKey(user.id, id));
    if (cardFsrs) {
      keysToDelete.push(fsrsKey(user.id, id));
      keysToDelete.push(idxStudentFsrs(user.id, id));
      if (cardFsrs.due) keysToDelete.push(idxDue(user.id, id, cardFsrs.due.split("T")[0]));
    }
    await kv.mdel(keysToDelete);
    console.log(`[Flashcards] Deleted card ${id} (keyword: ${card.keyword_id}) by ${user.id}`);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /flashcards/:id", err);
  }
});

export default flashcards;
