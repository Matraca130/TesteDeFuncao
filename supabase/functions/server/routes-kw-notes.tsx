// ============================================================
// Axon v4.4 — Keyword Notes Routes (Agent 2: SCRIBE)
// A2-01: Student keyword notes CRUD (soft-delete + restore)
// A2-02: Professor keyword notes CRUD (visibility + soft-delete + restore)
//
// DATA SAGRADA: soft-delete only (set deleted_at), NEVER hard delete.
// Every entity has a /restore endpoint.
//
// Endpoints (12 total):
//   Student notes (5):
//     POST   /keywords/:keywordId/student-notes
//     GET    /keywords/:keywordId/student-notes
//     PUT    /keywords/:keywordId/student-notes/:noteId
//     DELETE /keywords/:keywordId/student-notes/:noteId   (soft)
//     POST   /keywords/:keywordId/student-notes/:noteId/restore
//   Professor notes (7):
//     POST   /keywords/:keywordId/prof-notes
//     GET    /keywords/:keywordId/prof-notes              (professor's own)
//     GET    /keywords/:keywordId/prof-notes/visible      (student view)
//     PUT    /keywords/:keywordId/prof-notes/:noteId
//     PUT    /keywords/:keywordId/prof-notes/:noteId/visibility
//     DELETE /keywords/:keywordId/prof-notes/:noteId      (soft)
//     POST   /keywords/:keywordId/prof-notes/:noteId/restore
//
// KV primary keys: kw-student-note:{id}, kw-prof-note:{id}
// KV indices:
//   idx:kw-student-notes:{kwId}:{studentId}:{noteId}
//   idx:kw-prof-notes:{kwId}:{noteId}
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  kwStudentNoteKey,
  kwProfNoteKey,
  kwKey,
  idxKwStudentNotes,
  idxKwProfNotes,
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  getAuthUser,
  notFound,
  validationError,
  serverError,
  unauthorized,
} from "./crud-factory.tsx";

const kwNotes = new Hono();

// ════════════════════════════════════════════════════════════════
// A2-01: Student Keyword Notes — CRUD + soft-delete + restore
// ════════════════════════════════════════════════════════════════

// POST /keywords/:keywordId/student-notes — Create student note
kwNotes.post("/keywords/:keywordId/student-notes", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.param("keywordId");
    const body = await c.req.json();

    if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
      return validationError(c, "content is required and must be a non-empty string");
    }

    // Verify keyword exists
    const keyword = await kv.get(kwKey(kwId));
    if (!keyword) return notFound(c, "Keyword");

    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();
    const note = {
      id: noteId,
      keyword_id: kwId,
      student_id: user.id,
      content: body.content.trim(),
      created_at: now,
      updated_at: now,
    };

    const pk = kwStudentNoteKey(noteId);
    const idx = idxKwStudentNotes(kwId, user.id, noteId);
    await kv.mset([pk, idx], [note, noteId]);

    console.log(`[KwNotes] Student note created: ${noteId} for kw:${kwId} by ${user.id}`);
    return c.json({ success: true, data: note }, 201);
  } catch (err) {
    return serverError(c, "POST /keywords/:keywordId/student-notes", err);
  }
});

// GET /keywords/:keywordId/student-notes — List student's own notes
kwNotes.get("/keywords/:keywordId/student-notes", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.param("keywordId");
    const includeDeleted = c.req.query("include_deleted") === "true";

    const prefix = `${KV_PREFIXES.IDX_KW_STUDENT_NOTES}${kwId}:${user.id}:`;
    const noteIds = await kv.getByPrefix(prefix);

    if (!noteIds || noteIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const notes = (await kv.mget(
      (noteIds as string[]).map((id) => kwStudentNoteKey(id))
    )).filter(Boolean);

    const filtered = includeDeleted
      ? notes
      : notes.filter((n: any) => !n.deleted_at);

    // Sort by created_at desc
    filtered.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, data: filtered });
  } catch (err) {
    return serverError(c, "GET /keywords/:keywordId/student-notes", err);
  }
});

// PUT /keywords/:keywordId/student-notes/:noteId — Update note
kwNotes.put("/keywords/:keywordId/student-notes/:noteId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(kwStudentNoteKey(noteId));
    if (!existing) return notFound(c, "Student note");

    // Ownership check
    if (existing.student_id !== user.id) {
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only edit your own notes" } },
        403
      );
    }

    // Cannot edit soft-deleted notes
    if (existing.deleted_at) {
      return validationError(c, "Cannot edit a deleted note. Restore it first.");
    }

    const body = await c.req.json();
    if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
      return validationError(c, "content is required and must be a non-empty string");
    }

    const updated = {
      ...existing,
      content: body.content.trim(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(kwStudentNoteKey(noteId), updated);
    console.log(`[KwNotes] Student note updated: ${noteId}`);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /keywords/:keywordId/student-notes/:noteId", err);
  }
});

// DELETE /keywords/:keywordId/student-notes/:noteId — Soft delete (DATA SAGRADA)
kwNotes.delete("/keywords/:keywordId/student-notes/:noteId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(kwStudentNoteKey(noteId));
    if (!existing) return notFound(c, "Student note");

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

    await kv.set(kwStudentNoteKey(noteId), softDeleted);
    console.log(`[KwNotes] Student note soft-deleted: ${noteId}`);
    return c.json({ success: true, data: { deleted: true, deleted_at: softDeleted.deleted_at } });
  } catch (err) {
    return serverError(c, "DELETE /keywords/:keywordId/student-notes/:noteId", err);
  }
});

// POST /keywords/:keywordId/student-notes/:noteId/restore — Restore soft-deleted
kwNotes.post("/keywords/:keywordId/student-notes/:noteId/restore", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(kwStudentNoteKey(noteId));
    if (!existing) return notFound(c, "Student note");

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

    await kv.set(kwStudentNoteKey(noteId), restored);
    console.log(`[KwNotes] Student note restored: ${noteId}`);
    return c.json({ success: true, data: restored });
  } catch (err) {
    return serverError(c, "POST /keywords/:keywordId/student-notes/:noteId/restore", err);
  }
});

// ════════════════════════════════════════════════════════════════
// A2-02: Professor Keyword Notes — CRUD + visibility + soft-delete + restore
// ════════════════════════════════════════════════════════════════

// POST /keywords/:keywordId/prof-notes — Create professor note
kwNotes.post("/keywords/:keywordId/prof-notes", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.param("keywordId");
    const body = await c.req.json();

    if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
      return validationError(c, "content is required and must be a non-empty string");
    }

    const keyword = await kv.get(kwKey(kwId));
    if (!keyword) return notFound(c, "Keyword");

    const visibility = body.visibility === "students" ? "students" : "private";
    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();

    const note = {
      id: noteId,
      keyword_id: kwId,
      professor_id: user.id,
      content: body.content.trim(),
      visibility,
      created_at: now,
      updated_at: now,
    };

    const pk = kwProfNoteKey(noteId);
    const idx = idxKwProfNotes(kwId, noteId);
    await kv.mset([pk, idx], [note, noteId]);

    console.log(`[KwNotes] Prof note created: ${noteId} for kw:${kwId} by ${user.id} (${visibility})`);
    return c.json({ success: true, data: note }, 201);
  } catch (err) {
    return serverError(c, "POST /keywords/:keywordId/prof-notes", err);
  }
});

// GET /keywords/:keywordId/prof-notes — List professor's own notes (professor view)
kwNotes.get("/keywords/:keywordId/prof-notes", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.param("keywordId");
    const includeDeleted = c.req.query("include_deleted") === "true";

    const prefix = `${KV_PREFIXES.IDX_KW_PROF_NOTES}${kwId}:`;
    const noteIds = await kv.getByPrefix(prefix);

    if (!noteIds || noteIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const notes = (await kv.mget(
      (noteIds as string[]).map((id) => kwProfNoteKey(id))
    )).filter(Boolean);

    // Professor sees their own notes
    let filtered = notes.filter((n: any) => n.professor_id === user.id);

    if (!includeDeleted) {
      filtered = filtered.filter((n: any) => !n.deleted_at);
    }

    filtered.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, data: filtered });
  } catch (err) {
    return serverError(c, "GET /keywords/:keywordId/prof-notes", err);
  }
});

// GET /keywords/:keywordId/prof-notes/visible — Get visible prof notes (student view)
kwNotes.get("/keywords/:keywordId/prof-notes/visible", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.param("keywordId");

    const prefix = `${KV_PREFIXES.IDX_KW_PROF_NOTES}${kwId}:`;
    const noteIds = await kv.getByPrefix(prefix);

    if (!noteIds || noteIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const notes = (await kv.mget(
      (noteIds as string[]).map((id) => kwProfNoteKey(id))
    )).filter(Boolean);

    // Only notes marked visible to students, not soft-deleted
    const visible = notes.filter(
      (n: any) => n.visibility === "students" && !n.deleted_at
    );

    visible.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, data: visible });
  } catch (err) {
    return serverError(c, "GET /keywords/:keywordId/prof-notes/visible", err);
  }
});

// PUT /keywords/:keywordId/prof-notes/:noteId — Update prof note content/visibility
kwNotes.put("/keywords/:keywordId/prof-notes/:noteId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(kwProfNoteKey(noteId));
    if (!existing) return notFound(c, "Professor note");

    if (existing.professor_id !== user.id) {
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
    if (body.visibility === "private" || body.visibility === "students") {
      updated.visibility = body.visibility;
    }

    await kv.set(kwProfNoteKey(noteId), updated);
    console.log(`[KwNotes] Prof note updated: ${noteId}`);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /keywords/:keywordId/prof-notes/:noteId", err);
  }
});

// PUT /keywords/:keywordId/prof-notes/:noteId/visibility — Toggle visibility only
kwNotes.put("/keywords/:keywordId/prof-notes/:noteId/visibility", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(kwProfNoteKey(noteId));
    if (!existing) return notFound(c, "Professor note");

    if (existing.professor_id !== user.id) {
      return c.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only change visibility of your own notes" } },
        403
      );
    }

    if (existing.deleted_at) {
      return validationError(c, "Cannot change visibility of a deleted note");
    }

    const body = await c.req.json();
    if (body.visibility !== "private" && body.visibility !== "students") {
      return validationError(c, "visibility must be 'private' or 'students'");
    }

    const updated = {
      ...existing,
      visibility: body.visibility,
      updated_at: new Date().toISOString(),
    };

    await kv.set(kwProfNoteKey(noteId), updated);
    console.log(`[KwNotes] Prof note visibility changed: ${noteId} -> ${body.visibility}`);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /keywords/:keywordId/prof-notes/:noteId/visibility", err);
  }
});

// DELETE /keywords/:keywordId/prof-notes/:noteId — Soft delete (DATA SAGRADA)
kwNotes.delete("/keywords/:keywordId/prof-notes/:noteId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(kwProfNoteKey(noteId));
    if (!existing) return notFound(c, "Professor note");

    if (existing.professor_id !== user.id) {
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

    await kv.set(kwProfNoteKey(noteId), softDeleted);
    console.log(`[KwNotes] Prof note soft-deleted: ${noteId}`);
    return c.json({ success: true, data: { deleted: true, deleted_at: softDeleted.deleted_at } });
  } catch (err) {
    return serverError(c, "DELETE /keywords/:keywordId/prof-notes/:noteId", err);
  }
});

// POST /keywords/:keywordId/prof-notes/:noteId/restore — Restore soft-deleted
kwNotes.post("/keywords/:keywordId/prof-notes/:noteId/restore", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const noteId = c.req.param("noteId");

    const existing = await kv.get(kwProfNoteKey(noteId));
    if (!existing) return notFound(c, "Professor note");

    if (existing.professor_id !== user.id) {
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

    await kv.set(kwProfNoteKey(noteId), restored);
    console.log(`[KwNotes] Prof note restored: ${noteId}`);
    return c.json({ success: true, data: restored });
  } catch (err) {
    return serverError(c, "POST /keywords/:keywordId/prof-notes/:noteId/restore", err);
  }
});

export default kwNotes;
