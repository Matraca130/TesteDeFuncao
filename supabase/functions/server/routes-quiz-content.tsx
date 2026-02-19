// Axon v4.4 — Hono Routes: QuizQuestion CRUD
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PFX, uid, ts, ok, err } from "./kv-schema.tsx";

const r = new Hono();

r.get("/keywords/:keywordId/quiz-questions", async (c) => {
  try {
    const { keywordId } = c.req.param();
    const all = await kv.getByPrefix(PFX.quizQuestions);
    return c.json(ok(all.filter((q: any) => q.keyword_id === keywordId)));
  } catch (e) { console.log("GET quiz-questions by keyword error:", e); return c.json(err(`${e}`), 500); }
});

r.get("/summaries/:summaryId/quiz-questions", async (c) => {
  try {
    const { summaryId } = c.req.param();
    const all = await kv.getByPrefix(PFX.quizQuestions);
    return c.json(ok(all.filter((q: any) => q.summary_id === summaryId)));
  } catch (e) { console.log("GET quiz-questions by summary error:", e); return c.json(err(`${e}`), 500); }
});

r.get("/quiz-questions/:questionId", async (c) => {
  try {
    const { questionId } = c.req.param();
    const q = await kv.get(K.quizQuestion(questionId));
    return c.json(ok(q ?? null));
  } catch (e) { console.log("GET quiz-question error:", e); return c.json(err(`${e}`), 500); }
});

r.post("/quiz-questions", async (c) => {
  try {
    const body = await c.req.json();
    const id = uid(); const now = ts();
    const question = {
      id, keyword_id: body.keyword_id || '', summary_id: body.summary_id ?? null,
      institution_id: body.institution_id || 'inst-001', question_text: body.question_text || '',
      question_type: body.question_type || 'multiple-choice', options: body.options || [],
      correct_answer: body.correct_answer || '', explanation: body.explanation ?? null,
      difficulty: body.difficulty ?? 2, status: body.status || 'draft',
      source: body.source || 'manual', created_by: body.created_by || 'demo-user',
      created_at: now, updated_at: now,
    };
    await kv.set(K.quizQuestion(id), question);
    return c.json(ok(question), 201);
  } catch (e) { console.log("POST quiz-question error:", e); return c.json(err(`${e}`), 500); }
});

r.put("/quiz-questions/:questionId", async (c) => {
  try {
    const { questionId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(K.quizQuestion(questionId));
    if (!existing) return c.json(err(`QuizQuestion ${questionId} not found`), 404);
    const updated = { ...existing, ...body, updated_at: ts() };
    await kv.set(K.quizQuestion(questionId), updated);
    return c.json(ok(updated));
  } catch (e) { console.log("PUT quiz-question error:", e); return c.json(err(`${e}`), 500); }
});

r.delete("/quiz-questions/:questionId", async (c) => {
  try {
    const { questionId } = c.req.param();
    await kv.del(K.quizQuestion(questionId));
    return c.json(ok(null));
  } catch (e) { console.log("DELETE quiz-question error:", e); return c.json(err(`${e}`), 500); }
});

export default r;
