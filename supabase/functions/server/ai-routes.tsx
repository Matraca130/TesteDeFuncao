// ============================================================
// Axon — AI Routes (Dev 6)
// D29: Batch generation, D20: Approval flow,
// D43: Keyword-contextualized chat, D42: Keyword popup
//
// Agent 2 (SCRIBE) extension:
//   GET /keyword-popup/:keywordId now includes:
//     - professor_notes (visible to students)
//     - student_notes_count
//
// Modular split (Agent 7 — NEXUS):
//   Shared helpers → ai-helpers.tsx
//   A7-01..A7-05  → ai-feedback-routes.tsx (mounted below)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUserIdFromToken } from "./auth.tsx";
import { kwProfNoteKey, kwStudentNoteKey, KV_PREFIXES } from "./kv-keys.ts";
import { callGemini, errMsg, parseGeminiJson } from "./ai-helpers.tsx";
import aiFeedback from "./ai-feedback-routes.tsx";

const ai = new Hono();

// ────────────────────────────────────────────────────────────
// POST /ai/generate — Batch content generation (D29)
// ────────────────────────────────────────────────────────────
ai.post("/ai/generate", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;

    const body = await c.req.json();
    const { summary_id, content, course_id } = body;

    if (!content) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "content is required" } }, 400);
    }

    const prompt = `You are an expert medical education content generator.
Given this study summary for a medical course, generate:
1. Keywords (important medical terms with definitions)
2. Sub-topics for each keyword (specific aspects to study)
3. Flashcards (front=question, back=answer) tagged to keywords
4. Quiz questions (multiple_choice, write_in, fill_blank) tagged to keywords
5. Suggested connections between keywords

Return as JSON with this exact structure:
{
  "keywords": [{ "term": "...", "definition": "...", "priority": 0, "subtopics": [{ "title": "...", "description": "..." }] }],
  "flashcards": [{ "front": "...", "back": "...", "keyword_term": "...", "subtopic_title": "..." }],
  "quiz_questions": [{ "quiz_type": "multiple_choice", "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": 0, "explanation": "..." }],
  "suggested_connections": [{ "keyword_a_term": "...", "keyword_b_term": "...", "label": "..." }]
}

Priority levels: 0=critical, 1=high, 2=medium, 3=low
Respond in the SAME language as the summary content.

Summary content:
${content}`;

    console.log(`[AI] Generating content for summary: ${summary_id || "ad-hoc"}, user: ${userId}`);

    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      undefined,
      0.6,
      8192,
      true
    );

    let parsed;
    try {
      parsed = parseGeminiJson(result);
    } catch (parseErr: unknown) {
      const msg = errMsg(parseErr);
      console.log(`[AI] Failed to parse Gemini response: ${msg}`);
      return c.json({
        success: false,
        error: { code: "AI_PARSE_ERROR", message: `Failed to parse AI response: ${msg}` },
      }, 500);
    }

    // Store as draft (D20)
    const draftId = summary_id || crypto.randomUUID();
    const draft = {
      id: draftId,
      course_id: course_id || null,
      summary_id: summary_id || null,
      generated_by: userId,
      generated_at: new Date().toISOString(),
      status: "pending_review",
      keywords: ((parsed.keywords as any[]) || []).map((kw: Record<string, unknown>) => ({
        ...kw,
        id: crypto.randomUUID(),
        status: "pending",
        subtopics: (Array.isArray(kw.subtopics) ? kw.subtopics : []).map((st: Record<string, unknown>) => ({
          ...st,
          id: crypto.randomUUID(),
          status: "pending",
        })),
      })),
      flashcards: ((parsed.flashcards as any[]) || []).map((fc: Record<string, unknown>) => ({
        ...fc,
        id: crypto.randomUUID(),
        status: "pending",
      })),
      quiz_questions: ((parsed.quiz_questions as any[]) || []).map((q: Record<string, unknown>) => ({
        ...q,
        id: crypto.randomUUID(),
        status: "pending",
      })),
      suggested_connections: ((parsed.suggested_connections as any[]) || []).map((conn: Record<string, unknown>) => ({
        ...conn,
        id: crypto.randomUUID(),
        status: "pending",
      })),
    };

    await kv.set(`ai-draft:${draftId}`, draft);

    console.log(`[AI] Draft saved: ${draftId} — ${draft.keywords.length} kw, ${draft.flashcards.length} fc, ${draft.quiz_questions.length} quiz`);

    return c.json({ success: true, data: draft });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[AI] Generate error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `AI generation error: ${msg}` } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// POST /ai/generate/approve — Professor approves/rejects (D20)
// ────────────────────────────────────────────────────────────
ai.post("/ai/generate/approve", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }

    const body = await c.req.json();
    const { draft_id, approved_keyword_ids, approved_flashcard_ids, approved_quiz_ids, approved_connection_ids } = body;

    if (!draft_id) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "draft_id is required" } }, 400);
    }

    const draft = await kv.get(`ai-draft:${draft_id}`) as any;
    if (!draft) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: `Draft ${draft_id} not found` } }, 404);
    }

    const approvedKwIds = new Set(approved_keyword_ids || []);
    const approvedFcIds = new Set(approved_flashcard_ids || []);
    const approvedQIds = new Set(approved_quiz_ids || []);
    const approvedConnIds = new Set(approved_connection_ids || []);

    const kvKeys: string[] = [];
    const kvValues: unknown[] = [];
    const stats = { keywords: 0, subtopics: 0, flashcards: 0, quiz_questions: 0, connections: 0 };

    const termToId: Record<string, string> = {};
    for (const kw of draft.keywords) {
      if (approvedKwIds.has(kw.id)) {
        termToId[kw.term] = kw.id;
        kvKeys.push(`kw:${kw.id}`);
        kvValues.push({
          id: kw.id, term: kw.term, definition: kw.definition, priority: kw.priority,
          course_id: draft.course_id, source: "ai_generated", status: "published",
          created_at: new Date().toISOString(),
        });
        stats.keywords++;
        if (draft.course_id) {
          kvKeys.push(`idx:course-kw:${draft.course_id}:${kw.id}`);
          kvValues.push(kw.id);
        }
        for (const st of kw.subtopics || []) {
          kvKeys.push(`subtopic:${st.id}`);
          kvValues.push({
            id: st.id, keyword_id: kw.id, title: st.title, description: st.description,
            source: "ai_generated", status: "published", created_at: new Date().toISOString(),
          });
          kvKeys.push(`idx:kw-subtopics:${kw.id}:${st.id}`);
          kvValues.push(st.id);
          stats.subtopics++;
        }
      }
    }

    for (const fc of draft.flashcards) {
      if (approvedFcIds.has(fc.id)) {
        const kwId = termToId[fc.keyword_term] || null;
        kvKeys.push(`fc:${fc.id}`);
        kvValues.push({
          id: fc.id, front: fc.front, back: fc.back, keyword_id: kwId,
          keyword_term: fc.keyword_term, subtopic_title: fc.subtopic_title,
          course_id: draft.course_id, source: "ai_generated", status: "published",
          created_at: new Date().toISOString(),
        });
        if (kwId) { kvKeys.push(`idx:kw-fc:${kwId}:${fc.id}`); kvValues.push(fc.id); }
        stats.flashcards++;
      }
    }

    for (const q of draft.quiz_questions) {
      if (approvedQIds.has(q.id)) {
        const kwId = termToId[q.keyword_term] || null;
        kvKeys.push(`quiz:${q.id}`);
        kvValues.push({
          id: q.id, quiz_type: q.quiz_type, question: q.question, options: q.options,
          correct_answer: q.correct_answer, explanation: q.explanation,
          keyword_id: kwId, keyword_term: q.keyword_term, course_id: draft.course_id,
          source: "ai_generated", status: "published", created_at: new Date().toISOString(),
        });
        if (kwId) { kvKeys.push(`idx:kw-quiz:${kwId}:${q.id}`); kvValues.push(q.id); }
        stats.quiz_questions++;
      }
    }

    for (const conn of draft.suggested_connections) {
      if (approvedConnIds.has(conn.id)) {
        const aId = termToId[conn.keyword_a_term];
        const bId = termToId[conn.keyword_b_term];
        if (aId && bId) {
          kvKeys.push(`conn:${conn.id}`);
          kvValues.push({ id: conn.id, keyword_a_id: aId, keyword_b_id: bId, label: conn.label, created_at: new Date().toISOString() });
          kvKeys.push(`idx:kw-conn:${aId}:${conn.id}`); kvValues.push(conn.id);
          kvKeys.push(`idx:kw-conn:${bId}:${conn.id}`); kvValues.push(conn.id);
          stats.connections++;
        }
      }
    }

    if (kvKeys.length > 0) await kv.mset(kvKeys, kvValues);

    draft.status = "processed";
    draft.processed_at = new Date().toISOString();
    draft.processed_by = authResult.userId;
    await kv.set(`ai-draft:${draft_id}`, draft);

    console.log(`[AI] Draft ${draft_id} approved: ${JSON.stringify(stats)}`);
    return c.json({ success: true, data: { stats, draft_id } });
  } catch (err: unknown) {
    const msg = errMsg(err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `Approval error: ${msg}` } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// GET /ai/drafts — List pending drafts
// ────────────────────────────────────────────────────────────
ai.get("/ai/drafts", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const drafts = await kv.getByPrefix("ai-draft:");
    return c.json({ success: true, data: drafts || [] });
  } catch (err: unknown) {
    const msg = errMsg(err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: msg } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// POST /ai/chat — Keyword-contextualized chat (D43)
// ────────────────────────────────────────────────────────────
ai.post("/ai/chat", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;

    const body = await c.req.json();
    const { keyword_id, message, context } = body;

    if (!message) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "message is required" } }, 400);
    }

    let systemPrompt = `You are Axon AI, an elite medical tutor.
Respond in Portuguese (pt-BR). Use precise medical terminology.
Format with markdown. Be concise but thorough (max 300 words).`;

    if (keyword_id) {
      try {
        const kwData = await kv.get(`kw:${keyword_id}`);
        if (kwData) {
          systemPrompt += `\n\nKeyword: "${(kwData as any).term}". Definition: ${(kwData as any).definition}`;
          const stIds = await kv.getByPrefix(`idx:kw-subtopics:${keyword_id}:`);
          if (stIds.length > 0) {
            const subtopics = await kv.mget(stIds.map((id: string) => `subtopic:${id}`));
            const titles = subtopics.filter(Boolean).map((st: any) => st.title);
            if (titles.length > 0) systemPrompt += `\nSub-topics: ${titles.join(", ")}`;
          }
          try {
            const bktStates = await kv.getByPrefix(`idx:student-kw-bkt:${userId}:${keyword_id}:`);
            if (bktStates.length > 0) systemPrompt += `\nMastery data: ${JSON.stringify(bktStates)}`;
          } catch (_e) {}
        }
      } catch (_e) {}
    }

    if (context) {
      if (context.courseName) systemPrompt += `\nCourse: ${context.courseName}`;
      if (context.topicTitle) systemPrompt += `\nTopic: ${context.topicTitle}`;
    }

    const chatCacheKey = keyword_id ? `chat:${userId}:${keyword_id}` : `chat:${userId}:general`;
    let history = await kv.get(chatCacheKey) as any;
    if (!history) {
      history = { student_id: userId, keyword_id: keyword_id || null, messages: [], last_message_at: "" };
    }

    history.messages.push({ role: "user", content: message, timestamp: new Date().toISOString() });

    const recentMsgs = history.messages.slice(-20);
    const geminiMessages = recentMsgs.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const reply = await callGemini(geminiMessages, systemPrompt, 0.7, 2048);

    const assistantMsg = { role: "assistant", content: reply, timestamp: new Date().toISOString() };
    history.messages.push(assistantMsg);
    history.last_message_at = assistantMsg.timestamp;
    await kv.set(chatCacheKey, history);

    return c.json({ success: true, data: { reply, history } });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[AI] Chat error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Chat error: ${msg}` } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// GET /keyword-popup/:keywordId — Hub assembly (D42)
// Extended by Agent 2 (SCRIBE)
// ────────────────────────────────────────────────────────────
ai.get("/keyword-popup/:keywordId", async (c) => {
  try {
    const kwId = c.req.param("keywordId");
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;

    const keyword = await kv.get(`kw:${kwId}`);
    if (!keyword) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: `Keyword ${kwId} not found` } }, 404);
    }

    let subtopics: any[] = [];
    let subtopicStates: unknown[] = [];
    try {
      const stIds = await kv.getByPrefix(`idx:kw-subtopics:${kwId}:`);
      if (stIds.length > 0) {
        subtopics = (await kv.mget(stIds.map((id: string) => `subtopic:${id}`))).filter(Boolean);
        subtopicStates = await kv.mget(stIds.map((id: string) => `bkt:${userId}:${id}`));
      }
    } catch (_e) {}

    const relatedKeywords: { keyword: unknown; connection_label: string }[] = [];
    try {
      const connIds = await kv.getByPrefix(`idx:kw-conn:${kwId}:`);
      if (connIds.length > 0) {
        const conns = (await kv.mget(connIds.map((id: string) => `conn:${id}`))).filter(Boolean) as any[];
        for (const conn of conns) {
          const otherId = conn.keyword_a_id === kwId ? conn.keyword_b_id : conn.keyword_a_id;
          const otherKw = await kv.get(`kw:${otherId}`);
          if (otherKw) relatedKeywords.push({ keyword: otherKw, connection_label: conn.label });
        }
      }
    } catch (_e) {}

    let chatHistory = null;
    try { chatHistory = await kv.get(`chat:${userId}:${kwId}`); } catch (_e) {}

    let flashcardCount = 0;
    let quizCount = 0;
    try { flashcardCount = (await kv.getByPrefix(`idx:kw-fc:${kwId}:`)).length; } catch (_e) {}
    try { quizCount = (await kv.getByPrefix(`idx:kw-quiz:${kwId}:`)).length; } catch (_e) {}

    let professorNotes: unknown[] = [];
    try {
      const profNoteIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_KW_PROF_NOTES}${kwId}:`);
      if (profNoteIds.length > 0) {
        const allPN = (await kv.mget((profNoteIds as string[]).map((id: string) => kwProfNoteKey(id)))).filter(Boolean);
        professorNotes = allPN.filter((n: any) => n.visibility === "students" && !n.deleted_at);
      }
    } catch (_e) {}

    let studentNotesCount = 0;
    try {
      const snIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_KW_STUDENT_NOTES}${kwId}:${userId}:`);
      if (snIds.length > 0) {
        const sn = (await kv.mget((snIds as string[]).map((id: string) => kwStudentNoteKey(id)))).filter(Boolean);
        studentNotesCount = sn.filter((n: any) => !n.deleted_at).length;
      }
    } catch (_e) {}

    return c.json({
      success: true,
      data: {
        keyword, subtopics, subtopic_states: subtopicStates, related_keywords: relatedKeywords,
        chat_history: chatHistory, flashcard_count: flashcardCount, quiz_count: quizCount,
        professor_notes: professorNotes, student_notes_count: studentNotesCount,
      },
    });
  } catch (err: unknown) {
    const msg = errMsg(err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: msg } }, 500);
  }
});

// ════════════════════════════════════════════════════════════
// Mount Agent 7 (NEXUS) AI Feedback sub-router
// Endpoints: A7-01..A7-05 (quiz-feedback, flashcard-feedback,
//   summary-diagnostic, learning-profile, learning-profile/regenerate)
// ════════════════════════════════════════════════════════════
ai.route("/", aiFeedback);

export default ai;
