// Axon v4.4 — Hono Routes: FlashcardCard CRUD + KeywordSummaryLink
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

// ── FlashcardCard ────────────────────────────────────────────
r.get("/summaries/:summaryId/flashcards", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const all = await kv.getByPrefix(PFX.flashcards);
    return c.json(ok(all.filter((f: any) => f.summary_id === summaryId)));
  } catch (e) { console.log("GET flashcards by summary error:", e); return c.json(err(`${e}`), 500); }
});

r.get("/keywords/:keywordId/flashcards", async (c) => {
  try {
    const { keywordId } = c.req.param();
    const all = await kv.getByPrefix(PFX.flashcards);
    return c.json(ok(all.filter((f: any) => f.keyword_id === keywordId)));
  } catch (e) { console.log("GET flashcards by keyword error:", e); return c.json(err(`${e}`), 500); }
});

r.get("/flashcards/:cardId", async (c) => {
  try {
    const { cardId } = c.req.param();
    const card = await kv.get(K.flashcard(cardId));
    return c.json(ok(card ?? null));
  } catch (e) { console.log("GET flashcard error:", e); return c.json(err(`${e}`), 500); }
});

r.get("/students/:studentId/flashcards", async (c) => {
  try {
    const courseId = c.req.query("course_id");
    const all = await kv.getByPrefix(PFX.flashcards);
    const published = all.filter((f: any) => f.status === 'published');
    return c.json(ok(courseId ? published : published));
  } catch (e) { console.log("GET student flashcards error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/flashcards", async (c) => {
  try {
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const card = {
      id, summary_id: body.summary_id || '', keyword_id: body.keyword_id || '',
      subtopic_id: body.subtopic_id ?? null, institution_id: body.institution_id || 'inst-001',
      front: body.front || '', back: body.back || '', image_url: body.image_url ?? null,
      status: body.status || 'draft', source: body.source || 'manual',
      created_by: body.created_by || 'demo-user', created_at: now,
    };
    await kv.set(K.flashcard(id), card);
    return c.json(ok(card), 201);
  } catch (e) { console.log("POST flashcard error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/flashcards/:cardId", async (c) => {
  try {
    const { cardId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.flashcard(cardId));
    if (!existing) return c.json(err(`FlashcardCard ${cardId} not found`), 404);
    const updated = { ...existing, ...body };
    await kv.set(K.flashcard(cardId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT flashcard error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/flashcards/:cardId", async (c) => {
  try {
    const { cardId } = c.req.param();
    await kv.del(K.flashcard(cardId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE flashcard error:", e); return c.json(err(`${e}`), 500); }
});

// ── KeywordSummaryLink ───────────────────────────────────────
r.get("/summaries/:summaryId/keyword-links", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const all = await kv.getByPrefix(PFX.kwSummaryLinks);
    return c.json(ok(all.filter((l: any) => l.summary_id === summaryId)));
  } catch (e) { console.log("GET kw-summary-links by summary error:", e); return c.json(err(`${e}`), 500); }
});

r.get("/keywords/:keywordId/summary-links", async (c) => {
  try {
    const { keywordId } = c.req.param();
    const all = await kv.getByPrefix(PFX.kwSummaryLinks);
    return c.json(ok(all.filter((l: any) => l.keyword_id === keywordId)));
  } catch (e) { console.log("GET kw-summary-links by keyword error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/keyword-summary-links", async (c) => {
  try {
    const body = await c.req.json();
    const all = await kv.getByPrefix(PFX.kwSummaryLinks);
    const existing = all.find((l: any) => l.keyword_id === body.keyword_id && l.summary_id === body.summary_id);
    if (existing) return c.json(ok(existing));
    const id = uid();
    const link = { id, keyword_id: body.keyword_id, summary_id: body.summary_id, created_at: ts(), created_by: body.created_by };
    await kv.set(K.kwSummaryLink(id), link);
    return c.json(ok(link), 201);
  } catch (e) { console.log("POST kw-summary-link error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/keyword-summary-links/:linkId", async (c) => {
  try {
    const { linkId } = c.req.param();
    await kv.del(K.kwSummaryLink(linkId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE kw-summary-link error:", e); return c.json(err(`${e}`), 500); }
});

export default r;
