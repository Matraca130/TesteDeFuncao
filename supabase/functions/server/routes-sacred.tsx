// Axon v4.4 — Hono Routes: SACRED entities (soft-delete only!)
// KwStudentNote, KwProfNote, VideoNote, TextAnnotation
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

// ══════════════════════════════════════════════════════════
// KwStudentNote — student keyword notes (SACRED: soft-delete)
// ══════════════════════════════════════════════════════════
r.get("/keywords/:keywordId/student-notes", async (c) => {
  try {
    const { keywordId } = c.req.param();
    const studentId = c.req.query("student_id") || "";
    const all = await kv.getByPrefix(PFX.kwStudentNotes);
    const filtered = all.filter((n: any) =>
      n.keyword_id === keywordId && n.student_id === studentId && !n.deleted_at
    );
    return c.json(ok(filtered));
  } catch (e) { console.log("GET kw-student-notes error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/keywords/:keywordId/student-notes", async (c) => {
  try {
    const { keywordId } = c.req.param();
    const body = await c.req.json();
    const id = uid();
    const now = ts();
    const note = {
      id, keyword_id: keywordId, student_id: body.student_id || "",
      content: body.content || "", created_at: now, updated_at: now, deleted_at: null,
    };
    await kv.set(K.kwStudentNote(id), note);
    return c.json(ok(note), 201);
  } catch (e) { console.log("POST kw-student-note error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/student-notes/:noteId", async (c) => {
  try {
    const { noteId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.kwStudentNote(noteId));
    if (!existing) return c.json(err(`KwStudentNote ${noteId} not found`), 404);
    if (existing.deleted_at) return c.json(err(`KwStudentNote ${noteId} is deleted`), 410);
    const updated = { ...existing, content: body.content, updated_at: ts() };
    await kv.set(K.kwStudentNote(noteId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT student-note error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/student-notes/:noteId/soft-delete", async (c) => {
  try {
    const { noteId } = c.req.param();
    const existing = await kv.get(K.kwStudentNote(noteId));
    if (!existing) return c.json(err(`KwStudentNote ${noteId} not found`), 404);
    if (existing.deleted_at) return c.json(err(`KwStudentNote ${noteId} already deleted`), 410);
    const now = ts();
    const updated = { ...existing, deleted_at: now, updated_at: now };
    await kv.set(K.kwStudentNote(noteId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH soft-delete kw-student-note error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/student-notes/:noteId/restore", async (c) => {
  try {
    const { noteId } = c.req.param();
    const existing = await kv.get(K.kwStudentNote(noteId));
    if (!existing) return c.json(err(`KwStudentNote ${noteId} not found`), 404);
    if (!existing.deleted_at) return c.json(err(`KwStudentNote ${noteId} is not deleted`), 400);
    const updated = { ...existing, deleted_at: null, updated_at: ts() };
    await kv.set(K.kwStudentNote(noteId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH restore kw-student-note error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// KwProfNote — professor keyword notes (read-only for students)
// ══════════════════════════════════════════════════════════
r.get("/keywords/:keywordId/prof-notes", async (c) => {
  try {
    const { keywordId } = c.req.param();
    const all = await kv.getByPrefix(PFX.kwProfNotes);
    const filtered = all.filter((n: any) =>
      n.keyword_id === keywordId && n.visibility === "visible"
    );
    return c.json(ok(filtered));
  } catch (e) { console.log("GET kw-prof-notes error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// VideoNote — student video notes (SACRED: soft-delete)
// ══════════════════════════════════════════════════════════
r.get("/videos/:videoId/notes", async (c) => {
  try {
    const { videoId } = c.req.param();
    const studentId = c.req.query("student_id") || "";
    const all = await kv.getByPrefix(PFX.videoNotes);
    const filtered = all.filter((n: any) =>
      n.video_id === videoId && n.student_id === studentId && !n.deleted_at
    );
    return c.json(ok(filtered));
  } catch (e) { console.log("GET video-notes error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/videos/:videoId/notes", async (c) => {
  try {
    const { videoId } = c.req.param();
    const body = await c.req.json();
    const id = uid();
    const now = ts();
    const note = {
      id, video_id: videoId, student_id: body.student_id || "",
      content: body.content || "", timestamp_ms: body.timestamp_ms ?? null,
      created_at: now, updated_at: now, deleted_at: null,
    };
    await kv.set(K.videoNote(id), note);
    return c.json(ok(note), 201);
  } catch (e) { console.log("POST video-note error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/video-notes/:noteId", async (c) => {
  try {
    const { noteId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.videoNote(noteId));
    if (!existing) return c.json(err(`VideoNote ${noteId} not found`), 404);
    if (existing.deleted_at) return c.json(err(`VideoNote ${noteId} is deleted`), 410);
    const updated = { ...existing, content: body.content, updated_at: ts() };
    await kv.set(K.videoNote(noteId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT video-note error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/video-notes/:noteId/soft-delete", async (c) => {
  try {
    const { noteId } = c.req.param();
    const existing = await kv.get(K.videoNote(noteId));
    if (!existing) return c.json(err(`VideoNote ${noteId} not found`), 404);
    if (existing.deleted_at) return c.json(err(`VideoNote ${noteId} already deleted`), 410);
    const now = ts();
    const updated = { ...existing, deleted_at: now, updated_at: now };
    await kv.set(K.videoNote(noteId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH soft-delete video-note error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/video-notes/:noteId/restore", async (c) => {
  try {
    const { noteId } = c.req.param();
    const existing = await kv.get(K.videoNote(noteId));
    if (!existing) return c.json(err(`VideoNote ${noteId} not found`), 404);
    if (!existing.deleted_at) return c.json(err(`VideoNote ${noteId} is not deleted`), 400);
    const updated = { ...existing, deleted_at: null, updated_at: ts() };
    await kv.set(K.videoNote(noteId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH restore video-note error:", e); return c.json(err(`${e}`), 500); }
});

// ══════════════════════════════════════════════════════════
// TextAnnotation — summary text annotations (SACRED: soft-delete)
// ══════════════════════════════════════════════════════════
r.get("/summaries/:summaryId/annotations", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const studentId = c.req.query("student_id") || "";
    const all = await kv.getByPrefix(PFX.textAnnotations);
    const filtered = all.filter((a: any) =>
      a.summary_id === summaryId && a.student_id === studentId && !a.deleted_at
    );
    return c.json(ok(filtered));
  } catch (e) { console.log("GET text-annotations error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/summaries/:summaryId/annotations", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const body = await c.req.json();
    const id = uid();
    const now = ts();
    const annotation = {
      id, summary_id: summaryId, student_id: body.student_id || "",
      original_text: body.original_text || "", display_text: body.display_text || body.original_text || "",
      color: body.color || "yellow", note: body.note || "",
      type: body.type || "highlight", bot_reply: body.bot_reply || undefined,
      created_at: now, updated_at: now, deleted_at: null,
    };
    await kv.set(K.textAnnotation(id), annotation);
    return c.json(ok(annotation), 201);
  } catch (e) { console.log("POST text-annotation error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/annotations/:annotationId", async (c) => {
  try {
    const { annotationId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.textAnnotation(annotationId));
    if (!existing) return c.json(err(`TextAnnotation ${annotationId} not found`), 404);
    if (existing.deleted_at) return c.json(err(`TextAnnotation ${annotationId} is deleted`), 410);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.textAnnotation(annotationId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT text-annotation error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/annotations/:annotationId/soft-delete", async (c) => {
  try {
    const { annotationId } = c.req.param();
    const existing = await kv.get(K.textAnnotation(annotationId));
    if (!existing) return c.json(err(`TextAnnotation ${annotationId} not found`), 404);
    if (existing.deleted_at) return c.json(err(`TextAnnotation ${annotationId} already deleted`), 410);
    const now = ts();
    const updated = { ...existing, deleted_at: now, updated_at: now };
    await kv.set(K.textAnnotation(annotationId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH soft-delete text-annotation error:", e); return c.json(err(`${e}`), 500); }
});

r.patch("/annotations/:annotationId/restore", async (c) => {
  try {
    const { annotationId } = c.req.param();
    const existing = await kv.get(K.textAnnotation(annotationId));
    if (!existing) return c.json(err(`TextAnnotation ${annotationId} not found`), 404);
    if (!existing.deleted_at) return c.json(err(`TextAnnotation ${annotationId} is not deleted`), 400);
    const updated = { ...existing, deleted_at: null, updated_at: ts() };
    await kv.set(K.textAnnotation(annotationId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PATCH restore text-annotation error:", e); return c.json(err(`${e}`), 500); }
});

export default r;
