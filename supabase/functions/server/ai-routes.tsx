// ============================================================
// Axon — AI Routes (Dev 6)
// D29: Batch generation, D20: Approval flow,
// D43: Keyword-contextualized chat, D42: Keyword popup
//
// Agent 2 (SCRIBE) extension:
//   GET /keyword-popup/:keywordId now includes:
//     - professor_notes (visible to students)
//     - student_notes_count
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUserIdFromToken } from "./auth.tsx";
import { kwProfNoteKey, kwStudentNoteKey, KV_PREFIXES } from "./kv-keys.ts";

const ai = new Hono();

// ── Gemini helper ────────────────────────────────────────────
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

function getApiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  return key;
}

async function callGemini(
  messages: { role: string; parts: { text: string }[] }[],
  systemInstruction?: string,
  temperature = 0.7,
  maxTokens = 4096,
  jsonMode = false
): Promise<string> {
  const apiKey = getApiKey();
  const body: Record<string, unknown> = {
    contents: messages,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP: 0.95,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const model of MODELS) {
      const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
      if (res.status === 429 || res.status === 404) continue;
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 15000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Gemini API rate limit exceeded. Try again later.");
}

// ── Error message extractor (type-safe) ──────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

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
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
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
      keywords: (parsed.keywords || []).map((kw: Record<string, unknown>) => ({
        ...kw,
        id: crypto.randomUUID(),
        status: "pending",
        subtopics: (Array.isArray(kw.subtopics) ? kw.subtopics : []).map((st: Record<string, unknown>) => ({
          ...st,
          id: crypto.randomUUID(),
          status: "pending",
        })),
      })),
      flashcards: (parsed.flashcards || []).map((fc: Record<string, unknown>) => ({
        ...fc,
        id: crypto.randomUUID(),
        status: "pending",
      })),
      quiz_questions: (parsed.quiz_questions || []).map((q: Record<string, unknown>) => ({
        ...q,
        id: crypto.randomUUID(),
        status: "pending",
      })),
      suggested_connections: (parsed.suggested_connections || []).map((conn: Record<string, unknown>) => ({
        ...conn,
        id: crypto.randomUUID(),
        status: "pending",
      })),
    };

    await kv.set(`ai-draft:${draftId}`, draft);

    console.log(`[AI] Draft saved: ${draftId} — ${draft.keywords.length} keywords, ${draft.flashcards.length} flashcards, ${draft.quiz_questions.length} quiz questions`);

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

    const draft = await kv.get(`ai-draft:${draft_id}`);
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

    // Process keywords & subtopics
    const termToId: Record<string, string> = {};
    for (const kw of draft.keywords) {
      if (approvedKwIds.has(kw.id)) {
        const kwId = kw.id;
        termToId[kw.term] = kwId;
        kvKeys.push(`kw:${kwId}`);
        kvValues.push({
          id: kwId,
          term: kw.term,
          definition: kw.definition,
          priority: kw.priority,
          course_id: draft.course_id,
          source: "ai_generated",
          status: "published",
          created_at: new Date().toISOString(),
        });
        stats.keywords++;

        // Index: keyword by course
        if (draft.course_id) {
          kvKeys.push(`idx:course-kw:${draft.course_id}:${kwId}`);
          kvValues.push(kwId);
        }

        // Subtopics
        for (const st of kw.subtopics || []) {
          const stId = st.id;
          kvKeys.push(`subtopic:${stId}`);
          kvValues.push({
            id: stId,
            keyword_id: kwId,
            title: st.title,
            description: st.description,
            source: "ai_generated",
            status: "published",
            created_at: new Date().toISOString(),
          });
          kvKeys.push(`idx:kw-subtopics:${kwId}:${stId}`);
          kvValues.push(stId);
          stats.subtopics++;
        }
      }
    }

    // Process flashcards
    for (const fc of draft.flashcards) {
      if (approvedFcIds.has(fc.id)) {
        const kwId = termToId[fc.keyword_term] || null;
        kvKeys.push(`fc:${fc.id}`);
        kvValues.push({
          id: fc.id,
          front: fc.front,
          back: fc.back,
          keyword_id: kwId,
          keyword_term: fc.keyword_term,
          subtopic_title: fc.subtopic_title,
          course_id: draft.course_id,
          source: "ai_generated",
          status: "published",
          created_at: new Date().toISOString(),
        });
        if (kwId) {
          kvKeys.push(`idx:kw-fc:${kwId}:${fc.id}`);
          kvValues.push(fc.id);
        }
        stats.flashcards++;
      }
    }

    // Process quiz questions — FIXED: quiz:{id} not quiz-q:{id}
    for (const q of draft.quiz_questions) {
      if (approvedQIds.has(q.id)) {
        const kwId = termToId[q.keyword_term] || null;
        kvKeys.push(`quiz:${q.id}`);
        kvValues.push({
          id: q.id,
          quiz_type: q.quiz_type,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          keyword_id: kwId,
          keyword_term: q.keyword_term,
          course_id: draft.course_id,
          source: "ai_generated",
          status: "published",
          created_at: new Date().toISOString(),
        });
        if (kwId) {
          kvKeys.push(`idx:kw-quiz:${kwId}:${q.id}`);
          kvValues.push(q.id);
        }
        stats.quiz_questions++;
      }
    }

    // Process connections
    for (const conn of draft.suggested_connections) {
      if (approvedConnIds.has(conn.id)) {
        const aId = termToId[conn.keyword_a_term];
        const bId = termToId[conn.keyword_b_term];
        if (aId && bId) {
          kvKeys.push(`conn:${conn.id}`);
          kvValues.push({
            id: conn.id,
            keyword_a_id: aId,
            keyword_b_id: bId,
            label: conn.label,
            created_at: new Date().toISOString(),
          });
          kvKeys.push(`idx:kw-conn:${aId}:${conn.id}`);
          kvValues.push(conn.id);
          kvKeys.push(`idx:kw-conn:${bId}:${conn.id}`);
          kvValues.push(conn.id);
          stats.connections++;
        }
      }
    }

    // Batch write all approved entities
    if (kvKeys.length > 0) {
      await kv.mset(kvKeys, kvValues);
    }

    // Update draft status
    draft.status = "processed";
    draft.processed_at = new Date().toISOString();
    draft.processed_by = authResult.userId;
    await kv.set(`ai-draft:${draft_id}`, draft);

    console.log(`[AI] Draft ${draft_id} approved: ${JSON.stringify(stats)}`);
    return c.json({ success: true, data: { stats, draft_id } });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[AI] Approve error: ${msg}`);
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
    console.log(`[AI] Drafts list error: ${msg}`);
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

    // Build system context
    let systemPrompt = `You are Axon AI, an elite medical tutor. 
Respond in Portuguese (pt-BR). Use precise medical terminology.
Format with markdown. Be concise but thorough (max 300 words).`;

    // If keyword_id provided, load keyword context (D43)
    if (keyword_id) {
      try {
        const kw = await kv.get(`kw:${keyword_id}`);
        if (kw) {
          systemPrompt += `\n\nYou are helping the student understand the keyword: "${kw.term}".
Definition: ${kw.definition}`;

          // Load subtopics
          const stIds = await kv.getByPrefix(`idx:kw-subtopics:${keyword_id}:`);
          if (stIds.length > 0) {
            const subtopics = await kv.mget(stIds.map((id: string) => `subtopic:${id}`));
            const stTitles = subtopics.filter(Boolean).map((st: Record<string, string>) => st.title);
            if (stTitles.length > 0) {
              systemPrompt += `\nSub-topics: ${stTitles.join(", ")}`;
            }
          }

          // Load BKT states for context
          try {
            const bktStates = await kv.getByPrefix(`idx:student-kw-bkt:${userId}:${keyword_id}:`);
            if (bktStates.length > 0) {
              systemPrompt += `\nStudent's current mastery data: ${JSON.stringify(bktStates)}`;
            }
          } catch (_e) {}
        }
      } catch (_e) {
        // Keyword context not available, continue without it
      }
    }

    // Additional context from frontend
    if (context) {
      if (context.courseName) systemPrompt += `\nCourse: ${context.courseName}`;
      if (context.topicTitle) systemPrompt += `\nTopic: ${context.topicTitle}`;
    }

    // Load/create chat history
    const chatKey = keyword_id ? `chat:${userId}:${keyword_id}` : `chat:${userId}:general`;
    let history = await kv.get(chatKey);
    if (!history) {
      history = {
        student_id: userId,
        keyword_id: keyword_id || null,
        messages: [],
        last_message_at: "",
      };
    }

    // Add user message
    const userMsg = { role: "user", content: message, timestamp: new Date().toISOString() };
    history.messages.push(userMsg);

    // Build Gemini messages from history (last 20 messages for context window)
    const recentMsgs = history.messages.slice(-20);
    const geminiMessages = recentMsgs.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Call Gemini
    const reply = await callGemini(geminiMessages, systemPrompt, 0.7, 2048);

    // Add assistant response
    const assistantMsg = { role: "assistant", content: reply, timestamp: new Date().toISOString() };
    history.messages.push(assistantMsg);
    history.last_message_at = assistantMsg.timestamp;

    // Save updated history
    await kv.set(chatKey, history);

    return c.json({ success: true, data: { reply, history } });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[AI] Chat error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Chat error: ${msg}` } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// GET /keyword-popup/:keywordId — Hub assembly (D42)
// Extended by Agent 2 (SCRIBE): +professor_notes, +student_notes_count
// ────────────────────────────────────────────────────────────
ai.get("/keyword-popup/:keywordId", async (c) => {
  try {
    const kwId = c.req.param("keywordId");
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;

    // 1. Get keyword
    const keyword = await kv.get(`kw:${kwId}`);
    if (!keyword) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: `Keyword ${kwId} not found` } }, 404);
    }

    // 2. Get subtopics
    let subtopics: Record<string, unknown>[] = [];
    let subtopicStates: unknown[] = [];
    try {
      const stIds = await kv.getByPrefix(`idx:kw-subtopics:${kwId}:`);
      if (stIds.length > 0) {
        subtopics = (await kv.mget(stIds.map((id: string) => `subtopic:${id}`))).filter(Boolean);
        // Get BKT states for each subtopic
        subtopicStates = await kv.mget(stIds.map((id: string) => `bkt:${userId}:${id}`));
      }
    } catch (_e) {}

    // 3. Get connections + related keywords
    const relatedKeywords: { keyword: unknown; connection_label: string }[] = [];
    try {
      const connIds = await kv.getByPrefix(`idx:kw-conn:${kwId}:`);
      if (connIds.length > 0) {
        const connections = (await kv.mget(connIds.map((id: string) => `conn:${id}`))).filter(Boolean);
        for (const conn of connections) {
          const otherId = conn.keyword_a_id === kwId ? conn.keyword_b_id : conn.keyword_a_id;
          const otherKw = await kv.get(`kw:${otherId}`);
          if (otherKw) {
            relatedKeywords.push({ keyword: otherKw, connection_label: conn.label });
          }
        }
      }
    } catch (_e) {}

    // 4. Get chat history
    let chatHistory = null;
    try {
      chatHistory = await kv.get(`chat:${userId}:${kwId}`);
    } catch (_e) {}

    // 5. Count flashcards and quiz questions
    let flashcardCount = 0;
    let quizCount = 0;
    try {
      const fcIds = await kv.getByPrefix(`idx:kw-fc:${kwId}:`);
      flashcardCount = fcIds.length;
    } catch (_e) {}
    try {
      const qIds = await kv.getByPrefix(`idx:kw-quiz:${kwId}:`);
      quizCount = qIds.length;
    } catch (_e) {}

    // 6. Get professor notes visible to students (Agent 2 — SCRIBE)
    let professorNotes: unknown[] = [];
    try {
      const profNoteIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_KW_PROF_NOTES}${kwId}:`);
      if (profNoteIds.length > 0) {
        const allProfNotes = (await kv.mget(
          (profNoteIds as string[]).map((id: string) => kwProfNoteKey(id))
        )).filter(Boolean);
        professorNotes = allProfNotes.filter(
          (n: any) => n.visibility === "students" && !n.deleted_at
        );
      }
    } catch (_e) {}

    // 7. Count student's own notes on this keyword (Agent 2 — SCRIBE)
    let studentNotesCount = 0;
    try {
      const studentNoteIds = await kv.getByPrefix(
        `${KV_PREFIXES.IDX_KW_STUDENT_NOTES}${kwId}:${userId}:`
      );
      if (studentNoteIds.length > 0) {
        const studentNotes = (await kv.mget(
          (studentNoteIds as string[]).map((id: string) => kwStudentNoteKey(id))
        )).filter(Boolean);
        studentNotesCount = studentNotes.filter((n: any) => !n.deleted_at).length;
      }
    } catch (_e) {}

    return c.json({
      success: true,
      data: {
        keyword,
        subtopics,
        subtopic_states: subtopicStates,
        related_keywords: relatedKeywords,
        chat_history: chatHistory,
        flashcard_count: flashcardCount,
        quiz_count: quizCount,
        professor_notes: professorNotes,
        student_notes_count: studentNotesCount,
      },
    });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[AI] Keyword popup error: ${msg}`);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: msg } }, 500);
  }
});

export default ai;
