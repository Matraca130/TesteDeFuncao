// ============================================================
// Axon v4.4 — Video Notes Routes (Agent 2: SCRIBE)
// A2-04: Timestamped video notes CRUD (soft-delete + restore)
//
// DATA SAGRADA: soft-delete only (set deleted_at), NEVER hard delete.
// Every entity has a /restore endpoint.
//
// Endpoints (6 total):
//   POST   /videos/:videoId/notes
//   GET    /videos/:videoId/notes
//   GET    /videos/:videoId/notes/:noteId
//   PUT    /videos/:videoId/notes/:noteId
//   DELETE /videos/:videoId/notes/:noteId           (soft)
//   POST   /videos/:videoId/notes/:noteId/restore
//
// KV primary key: video-note:{id}
// KV index: idx:video-notes:{videoId}:{studentId}:{noteId}
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  videoNoteKey,
  idxVideoNotes,
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  getAuthUser,
  notFound,
  validationError,
  serverError,
  unauthorized,
} from "./crud-factory.tsx";

const videoNotes = new Hono();

// POST /videos/:videoId/notes — Create timestamped note
videoNotes.post("/videos/:videoId/notes", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const videoId = c.req.param("videoId");
    const body = await c.req.json();

    if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
      return validationError(c, "content is required and must be a non-empty string");
    }
    if (body.timestamp_ms === undefined || typeof body.timestamp_ms !== "number" || body.timestamp_ms < 0) {
      return validationError(c, "timestamp_ms is required and must be a non-negative number");
    }

    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();
    const note = {
      id: noteId,
      video_id: videoId,
      student_id: user.id,
      timestamp_ms: body.timestamp_ms,
      content: body.content.trim(),
      created_at: now,
      updated_at: now,
    };

    const pk = videoNoteKey(noteId);
    const idx = idxVideoNotes(videoId, user.id, noteId);
    await kv.mset([pk, idx], [note, noteId]);

    console.log(`[VideoNotes] Note created: ${noteId} for video:${videoId} at ${body.timestamp_ms}ms by ${user.id}`);
    return c.json({ success: true, data: note }, 201);
  } catch (err) {
    return serverError(c, "POST /videos/:videoId/notes", err);
  }
});

// GET /videos/:videoId/notes — List student's notes for a video
videoNotes.get("/videos/:videoId/notes", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const videoId = c.req.param("videoId");
    const includeDeleted = c.req.query("include_deleted") === "true";

    const prefix = `${KV_PREFIXES.IDX_VIDEO_NOTES}${videoId}:${user.id}:`;
    const noteIds = await kv.getByPrefix(prefix);

    if (!noteIds || noteIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const notes = (await kv.mget(
      (noteIds as string[]).map((id) => videoNoteKey(id))
    )).filter(Boolean);

    const filtered = includeDeleted
      ? notes
      : notes.filter((n: any) => !n.deleted_at);

    // Sort by timestamp_ms asc (chronological in video)
    filtered.sort((a: any, b: any) => a.timestamp_ms - b.timestamp_ms);

    return c.json({ success: true, data: filtered });
  } catch (err) {
    return serverError(c, "GET /videos/:videoId/notes", err);
  }
});

// GET /videos/:videoId/notes/:noteId — Get single note
videoNotes.get("/videos/:videoId/notes/:noteId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const note = await kv.get(videoNoteKey(noteId));
    if (!note) return notFound(c, "Video note");

    if (note.student_id !== user.id) {
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only view your own notes" } },
        403
      );
    }

    return c.json({ success: true, data: note });
  } catch (err) {
    return serverError(c, "GET /videos/:videoId/notes/:noteId", err);
  }
});

// PUT /videos/:videoId/notes/:noteId — Update note
videoNotes.put("/videos/:videoId/notes/:noteId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(videoNoteKey(noteId));
    if (!existing) return notFound(c, "Video note");

    if (existing.student_id !== user.id) {
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only edit your own notes" } },
        403
      );
    }

    if (existing.deleted_at) {
      return validationError(c, "Cannot edit a deleted note. Restore it first.");
    }

    const body = await c.req.json();
    const updated: any = { ...existing, updated_at: new Date().toISOString() };

    if (body.content && typeof body.content === "string" && body.content.trim() !== "") {
      updated.content = body.content.trim();
    }
    if (typeof body.timestamp_ms === "number" && body.timestamp_ms >= 0) {
      updated.timestamp_ms = body.timestamp_ms;
    }

    await kv.set(videoNoteKey(noteId), updated);
    console.log(`[VideoNotes] Note updated: ${noteId}`);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /videos/:videoId/notes/:noteId", err);
  }
});

// DELETE /videos/:videoId/notes/:noteId — Soft delete (DATA SAGRADA)
videoNotes.delete("/videos/:videoId/notes/:noteId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(videoNoteKey(noteId));
    if (!existing) return notFound(c, "Video note");

    if (existing.student_id !== user.id) {
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only delete your own notes" } },
        403
      );
    }

    if (existing.deleted_at) {
      return validationError(c, "Note is already deleted");
    }

    const softDeleted = {
      ...existing,
      deleted_at: new Date().toISOString(),
    };

    await kv.set(videoNoteKey(noteId), softDeleted);
    console.log(`[VideoNotes] Note soft-deleted: ${noteId}`);
    return c.json({ success: true, data: { deleted: true, deleted_at: softDeleted.deleted_at } });
  } catch (err) {
    return serverError(c, "DELETE /videos/:videoId/notes/:noteId", err);
  }
});

// POST /videos/:videoId/notes/:noteId/restore — Restore soft-deleted
videoNotes.post("/videos/:videoId/notes/:noteId/restore", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(videoNoteKey(noteId));
    if (!existing) return notFound(c, "Video note");

    if (existing.student_id !== user.id) {
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only restore your own notes" } },
        403
      );
    }

    if (!existing.deleted_at) {
      return validationError(c, "Note is not deleted");
    }

    const restored = { ...existing };
    delete restored.deleted_at;
    restored.updated_at = new Date().toISOString();

    await kv.set(videoNoteKey(noteId), restored);
    console.log(`[VideoNotes] Note restored: ${noteId}`);
    return c.json({ success: true, data: restored });
  } catch (err) {
    return serverError(c, "POST /videos/:videoId/notes/:noteId/restore", err);
  }
});

export default videoNotes;
