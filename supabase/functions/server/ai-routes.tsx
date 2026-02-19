// ============================================================
// Axon — AI Routes (Dev 6 + Agent 7 NEXUS)
// D29: Batch generation, D20: Approval flow,
// D43: Keyword-contextualized chat, D42: Keyword popup
// A7-01..A7-05: AI Feedback endpoints (Agent 7 — NEXUS)
//
// Agent 2 (SCRIBE) extension:
//   GET /keyword-popup/:keywordId now includes:
//     - professor_notes (visible to students)
//     - student_notes_count
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUserIdFromToken } from "./auth.tsx";
import {
  kwProfNoteKey, kwStudentNoteKey, KV_PREFIXES,
  // Agent 7 — P3 imports
  quizBundleKey, quizAttemptKey, learningProfileKey,
  bktKey, statsKey, dailyKey,
  summaryKey, kwKey, fcKey, quizKey, fsrsKey,
} from "./kv-keys.ts";

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

// ── JSON parser helper (robust) ──────────────────────────────
function parseGeminiJson(raw: string): Record<string, unknown> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");
  return JSON.parse(jsonMatch[0]);
}

// ── BKT color helpers (server-side mirror) ───────────────────
function getBktLabel(pKnow: number): string {
  if (pKnow < 0.25) return "Nao domina";
  if (pKnow < 0.5) return "Em progresso";
  if (pKnow < 0.75) return "Quase domina";
  return "Domina";
}
function getBktColor(pKnow: number): string {
  if (pKnow < 0.25) return "#ef4444";
  if (pKnow < 0.5) return "#f97316";
  if (pKnow < 0.75) return "#eab308";
  return "#22c55e";
}
function getBktStatus(pKnow: number): string {
  if (pKnow < 0.25) return "precisa_atencao";
  if (pKnow < 0.5) return "em_progresso";
  if (pKnow < 0.75) return "em_progresso";
  return "dominado";
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
// Agent 7 (NEXUS) — P3 AI Feedback Endpoints (A7-01 to A7-05)
// ════════════════════════════════════════════════════════════

const AI_FEEDBACK_SYSTEM = `Voce e Axon AI, um tutor especialista em educacao medica.
Responda SEMPRE em portugues brasileiro (pt-BR).
Seja encorajador mas honesto. Use linguagem acessivel.
Retorne APENAS JSON valido, sem markdown ou texto extra.`;

// ────────────────────────────────────────────────────────────
// A7-01: POST /ai/quiz-feedback
// Input: { bundle_id: string }
// Reads QuizBundle + QuizAttempts (immutable), calls Gemini.
// ────────────────────────────────────────────────────────────
ai.post("/ai/quiz-feedback", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json();
    const { bundle_id } = body;

    if (!bundle_id) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "bundle_id e obrigatorio" } }, 400);
    }

    // 1. Read quiz bundle (immutable)
    const bundle = await kv.get(quizBundleKey(bundle_id)) as any;
    if (!bundle) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: `QuizBundle ${bundle_id} nao encontrado` } }, 404);
    }

    // 2. Read quiz attempts for this student
    const attemptIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_ATTEMPTS}${userId}:`);
    let attempts: any[] = [];
    if (attemptIds.length > 0) {
      const allAttempts = (await kv.mget(
        (attemptIds as string[]).map((id: string) => quizAttemptKey(id))
      )).filter(Boolean);
      attempts = allAttempts.filter((a: any) =>
        a.courseId === bundle.course_id || a.topicId === bundle.topic_id
      );
    }

    // 3. Read quiz questions for context
    let quizQuestions: any[] = [];
    if (bundle.question_ids && bundle.question_ids.length > 0) {
      quizQuestions = (await kv.mget(
        bundle.question_ids.map((id: string) => quizKey(id))
      )).filter(Boolean);
    }

    // 4. Build context
    const latest = attempts.length > 0
      ? attempts.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
      : null;

    const totalQ = latest?.totalQuestions || bundle.total_questions || quizQuestions.length || 0;
    const correct = latest?.correctAnswers || 0;
    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    const timeSpent = latest?.timeSeconds || 0;

    const perQ = (latest?.answers || []).map((ans: any, i: number) => {
      const q = quizQuestions.find((qq: any) => qq.id === ans.questionId) || quizQuestions[i];
      return {
        question: q?.question || `Pergunta ${i + 1}`,
        student_answer: String(ans.userAnswer),
        correct: ans.correct,
        correct_answer: q?.correct_answer != null ? (q.options?.[q.correct_answer] || String(q.correct_answer)) : "N/A",
        explanation_hint: q?.explanation || "",
      };
    });

    const prompt = `Analise este resultado de quiz e gere feedback detalhado.

Dados: ${totalQ} perguntas, ${correct} acertos, ${totalQ - correct} erros, ${accuracy}% acuracia, ${timeSpent}s
${perQ.length > 0 ? `\nDetalhes:\n${JSON.stringify(perQ, null, 2)}` : ""}

Retorne JSON:
{
  "bundle_id": "${bundle_id}",
  "summary": { "total_questions": ${totalQ}, "correct": ${correct}, "incorrect": ${totalQ - correct}, "accuracy": ${accuracy}, "time_spent_seconds": ${timeSpent} },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string", "string", "string"],
  "per_question_feedback": [{ "question_id": "string", "question_text": "string", "was_correct": true, "student_answer": "string", "correct_answer": "string", "ai_explanation": "string" }],
  "study_strategy": "string",
  "encouragement": "string"
}`;

    console.log(`[A7-01] Quiz feedback: bundle=${bundle_id}, user=${userId}, accuracy=${accuracy}%`);

    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      AI_FEEDBACK_SYSTEM, 0.7, 6144, true
    );

    return c.json({ success: true, data: parseGeminiJson(result) });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-01] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar feedback: ${msg}` } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// A7-02: POST /ai/flashcard-feedback
// Input: { period_days?: number } (default 7)
// Reads FSRS states + daily activity, calls Gemini.
// ────────────────────────────────────────────────────────────
ai.post("/ai/flashcard-feedback", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json();
    const periodDays = body.period_days || 7;
    const now = new Date();

    // 1. Read all FSRS states
    const fsrsIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_FSRS}${userId}:`);
    let fsrsStates: any[] = [];
    if (fsrsIds.length > 0) {
      fsrsStates = (await kv.mget(
        (fsrsIds as string[]).map((id: string) => fsrsKey(userId, id))
      )).filter(Boolean);
    }

    // 2. Read daily activity
    const dailyKeys: string[] = [];
    for (let d = 0; d < periodDays; d++) {
      const date = new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
      dailyKeys.push(dailyKey(userId, date));
    }
    const dailyData = (await kv.mget(dailyKeys)).filter(Boolean);

    // 3. Stats
    const totalReviewed = fsrsStates.length;
    const mastered = fsrsStates.filter((s: any) => s.state === "review" && s.stability > 10).length;
    const struggling = fsrsStates.filter((s: any) => s.lapses >= 2).length;
    const retentionRate = totalReviewed > 0 ? Math.round((mastered / totalReviewed) * 100) : 0;
    const avgInterval = fsrsStates.length > 0
      ? Math.round((fsrsStates.reduce((sum: number, s: any) => sum + (s.stability || 0), 0) / fsrsStates.length) * 10) / 10
      : 0;

    // 4. Struggling cards (top 5)
    const topStruggling = fsrsStates
      .filter((s: any) => s.lapses >= 2)
      .sort((a: any, b: any) => b.lapses - a.lapses)
      .slice(0, 5);

    let strugglingWithFronts: any[] = [];
    if (topStruggling.length > 0) {
      const cardData = await kv.mget(topStruggling.map((s: any) => fcKey(s.card_id)));
      strugglingWithFronts = topStruggling.map((s: any, i: number) => ({
        flashcard_id: s.card_id,
        front: (cardData[i] as any)?.front || "Card sem texto",
        times_failed: s.lapses,
      }));
    }

    // 5. Streak
    let streakDays = 0;
    for (let d = 0; d < periodDays; d++) {
      const date = new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
      const day = dailyData.find((dd: any) => dd.date === date);
      if (day && (day as any).cardsReviewed > 0) streakDays++;
      else if (d > 0) break;
    }

    const prompt = `Analise o desempenho em flashcards nos ultimos ${periodDays} dias.

Cards revisados: ${totalReviewed}, dominados: ${mastered}, dificuldade: ${struggling}
Retencao: ${retentionRate}%, intervalo medio: ${avgInterval} dias, racha: ${streakDays} dias
${strugglingWithFronts.length > 0 ? `Cards dificeis:\n${JSON.stringify(strugglingWithFronts)}` : ""}

Retorne JSON:
{
  "period": { "days": ${periodDays} },
  "stats": { "cards_reviewed": ${totalReviewed}, "cards_mastered": ${mastered}, "cards_struggling": ${struggling}, "retention_rate": ${retentionRate}, "average_interval_days": ${avgInterval}, "streak_days": ${streakDays} },
  "struggling_cards": [{ "flashcard_id": "string", "front": "string", "times_failed": 0, "ai_tip": "dica mnemonica" }],
  "strengths": ["string"],
  "improvements": ["string"],
  "ai_study_tips": ["string", "string", "string", "string"],
  "next_session_recommendation": "string"
}`;

    console.log(`[A7-02] Flashcard feedback: user=${userId}, period=${periodDays}d`);

    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      AI_FEEDBACK_SYSTEM, 0.7, 6144, true
    );

    return c.json({ success: true, data: parseGeminiJson(result) });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-02] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar feedback: ${msg}` } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// A7-03: POST /ai/summary-diagnostic
// Input: { summary_id: string }
// Reads keywords + BKT states + quiz/flashcard performance.
// ────────────────────────────────────────────────────────────
ai.post("/ai/summary-diagnostic", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json();
    const { summary_id } = body;

    if (!summary_id) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "summary_id e obrigatorio" } }, 400);
    }

    // 1. Read summary
    const summary = await kv.get(summaryKey(summary_id)) as any;
    if (!summary) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: `Summary ${summary_id} nao encontrado` } }, 404);
    }

    // 2. Read keywords
    let keywords: any[] = [];
    const kwInstIds = await kv.getByPrefix(`idx:summary-kw:${summary_id}:`);
    if (kwInstIds.length > 0) {
      const kwInstData = (await kv.mget(
        (kwInstIds as string[]).map((id: string) => `kw-inst:${id}`)
      )).filter(Boolean);
      const kwIds = kwInstData.map((ki: any) => ki.keyword_id || ki.id).filter(Boolean);
      if (kwIds.length > 0) {
        keywords = (await kv.mget(kwIds.map((id: string) => kwKey(id)))).filter(Boolean);
      }
    }
    if (keywords.length === 0 && summary.institution_id) {
      const instKwIds = await kv.getByPrefix(`idx:inst-kw:${summary.institution_id}:`);
      if (instKwIds.length > 0) {
        keywords = (await kv.mget(
          (instKwIds as string[]).slice(0, 20).map((id: string) => kwKey(id))
        )).filter(Boolean);
      }
    }

    // 3. BKT states per keyword
    const kwBreakdown: any[] = [];
    for (const kw of keywords) {
      const stIds = await kv.getByPrefix(`idx:kw-subtopics:${kw.id}:`);
      let avgP = 0.5;
      if (stIds.length > 0) {
        const bktS = (await kv.mget(
          (stIds as string[]).map((stId: string) => bktKey(userId, stId))
        )).filter(Boolean);
        if (bktS.length > 0) {
          avgP = bktS.reduce((s: number, b: any) => s + (b.p_know || 0), 0) / bktS.length;
        }
      }
      kwBreakdown.push({
        keyword_id: kw.id, term: kw.term,
        p_know: Math.round(avgP * 100) / 100,
        bkt_color: getBktColor(avgP),
        status: getBktStatus(avgP),
      });
    }

    const overallMastery = kwBreakdown.length > 0
      ? Math.round((kwBreakdown.reduce((s: number, k: any) => s + k.p_know, 0) / kwBreakdown.length) * 100)
      : 50;

    // 4. Quiz performance
    const attemptIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_ATTEMPTS}${userId}:`);
    let quizAttempts: any[] = [];
    if (attemptIds.length > 0) {
      const all = (await kv.mget((attemptIds as string[]).map((id: string) => quizAttemptKey(id)))).filter(Boolean);
      quizAttempts = all.filter((a: any) => a.topicId === summary.topic_id);
    }
    const avgAccuracy = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((s: number, a: any) => s + (a.score || 0), 0) / quizAttempts.length)
      : 0;

    // 5. Flashcard performance
    let fcCount = 0;
    let fcMastered = 0;
    for (const kw of keywords) {
      const fcIds = await kv.getByPrefix(`idx:kw-fc:${kw.id}:`);
      fcCount += fcIds.length;
      if (fcIds.length > 0) {
        const states = (await kv.mget((fcIds as string[]).map((id: string) => fsrsKey(userId, id)))).filter(Boolean);
        fcMastered += states.filter((s: any) => s.state === "review" && s.stability > 10).length;
      }
    }

    // 6. Call Gemini
    const prompt = `Analise o dominio sobre "${summary.title || summary_id}".

Dominio: ${overallMastery}%
Keywords (${kwBreakdown.length}):
${kwBreakdown.map((k: any) => `- ${k.term}: p_know=${k.p_know} (${getBktLabel(k.p_know)})`).join("\n")}
Quizzes: ${quizAttempts.length} tentativas, ${avgAccuracy}% media
Flashcards: ${fcCount} total, ${fcMastered} dominados

Retorne JSON:
{
  "ai_analysis": {
    "overall_assessment": "string",
    "key_strengths": ["string"],
    "gaps": ["string"],
    "recommended_actions": ["string", "string", "string", "string"],
    "estimated_time_to_mastery": "string"
  },
  "study_plan_suggestion": {
    "priority_keywords": ["string"],
    "recommended_order": ["string"],
    "daily_goal_minutes": 30
  }
}`;

    console.log(`[A7-03] Summary diagnostic: summary=${summary_id}, mastery=${overallMastery}%`);

    const aiResult = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      AI_FEEDBACK_SYSTEM, 0.7, 4096, true
    );
    const aiParsed = parseGeminiJson(aiResult);

    const sorted = [...kwBreakdown].sort((a: any, b: any) => b.p_know - a.p_know);
    const diagnostic = {
      summary_id,
      summary_title: summary.title || summary_id,
      overall_mastery: overallMastery,
      bkt_level: overallMastery >= 75 ? "green" : overallMastery >= 50 ? "yellow" : overallMastery >= 25 ? "orange" : "red",
      keywords_breakdown: kwBreakdown,
      quiz_performance: {
        total_attempts: quizAttempts.length,
        average_accuracy: avgAccuracy,
        best_topic: sorted[0]?.term || "N/A",
        worst_topic: sorted[sorted.length - 1]?.term || "N/A",
      },
      flashcard_performance: {
        total_reviews: fcCount,
        retention_rate: fcCount > 0 ? Math.round((fcMastered / fcCount) * 100) : 0,
        mastered_count: fcMastered,
      },
      ai_analysis: aiParsed.ai_analysis || {},
      study_plan_suggestion: aiParsed.study_plan_suggestion || {},
    };

    return c.json({ success: true, data: diagnostic });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-03] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar diagnostico: ${msg}` } }, 500);
  }
});

// ────────────────────────────────────────────────────────────
// A7-04 / A7-05: Learning Profile (with KV cache 24h TTL)
// ────────────────────────────────────────────────────────────
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

async function buildLearningProfile(userId: string): Promise<any> {
  const studentStats = await kv.get(statsKey(userId)) as any;

  // BKT states
  const bktIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_BKT}${userId}:`);
  let bktStates: any[] = [];
  if (bktIds.length > 0) {
    bktStates = (await kv.mget((bktIds as string[]).map((id: string) => bktKey(userId, id)))).filter(Boolean);
  }

  const kwMastered = bktStates.filter((s: any) => s.p_know >= 0.75).length;
  const kwInProgress = bktStates.filter((s: any) => s.p_know >= 0.25 && s.p_know < 0.75).length;
  const kwWeak = bktStates.filter((s: any) => s.p_know < 0.25).length;
  const totalKw = bktStates.length;
  const overallAccuracy = totalKw > 0
    ? Math.round((bktStates.reduce((s: number, b: any) => s + (b.p_know || 0), 0) / totalKw) * 100)
    : 0;

  // Quiz count
  const attemptIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_ATTEMPTS}${userId}:`);
  const quizCount = attemptIds.length;

  // Flashcard count
  const fsrsIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_FSRS}${userId}:`);
  const fcReviewed = fsrsIds.length;

  // Weekly progress (last 6 weeks)
  const now = new Date();
  const weeks: any[] = [];
  for (let w = 5; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
    let weekHours = 0;
    let weekAccuracy = 0;
    let dayCount = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart.getTime() + d * 86400000).toISOString().split("T")[0];
      const day = await kv.get(dailyKey(userId, date)) as any;
      if (day) {
        weekHours += (day.studyMinutes || 0) / 60;
        if (day.retentionPercent) { weekAccuracy += day.retentionPercent; dayCount++; }
      }
    }
    weeks.push({
      week: `Sem ${6 - w}`,
      keywords_mastered: Math.round(kwMastered * ((6 - w) / 6)),
      accuracy: dayCount > 0 ? Math.round(weekAccuracy / dayCount) : overallAccuracy,
      hours_studied: Math.round(weekHours * 10) / 10,
    });
  }

  // Streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  for (let d = 0; d < 60; d++) {
    const date = new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
    const day = await kv.get(dailyKey(userId, date)) as any;
    if (day && day.studyMinutes > 0) {
      tempStreak++;
      if (d === 0 || currentStreak > 0) currentStreak = tempStreak;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
      if (d === 0) currentStreak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const totalStudyHours = studentStats?.totalStudyMinutes
    ? Math.round(studentStats.totalStudyMinutes / 60)
    : weeks.reduce((s: number, w: any) => s + w.hours_studied, 0);

  const globalStats = {
    total_study_hours: totalStudyHours,
    total_quizzes_completed: quizCount,
    total_flashcards_reviewed: fcReviewed,
    total_keywords_studied: totalKw,
    keywords_mastered: kwMastered,
    keywords_in_progress: kwInProgress,
    keywords_weak: kwWeak,
    overall_accuracy: overallAccuracy,
    current_streak_days: currentStreak,
    longest_streak_days: longestStreak,
    study_consistency: totalStudyHours > 0 ? Math.min(Math.round((currentStreak / 7) * 100), 100) : 0,
  };

  const prompt = `Analise os dados deste estudante e gere um perfil de aprendizagem.

Estatisticas:\n${JSON.stringify(globalStats, null, 2)}
Timeline:\n${JSON.stringify(weeks, null, 2)}

Retorne JSON:
{
  "ai_profile": {
    "learning_style": "string",
    "strongest_areas": ["string"],
    "weakest_areas": ["string"],
    "study_pattern": "string",
    "personality_insight": "string"
  },
  "ai_recommendations": {
    "immediate_actions": ["string", "string", "string"],
    "weekly_goals": ["string", "string", "string"],
    "long_term_strategy": "string",
    "recommended_study_time": "string",
    "focus_keywords": ["string", "string", "string"]
  },
  "motivation": {
    "message": "string",
    "achievement_highlight": "string",
    "next_milestone": "string"
  }
}`;

  console.log(`[A7-04] Building profile for user=${userId}`);

  const result = await callGemini(
    [{ role: "user", parts: [{ text: prompt }] }],
    AI_FEEDBACK_SYSTEM, 0.7, 6144, true
  );
  const aiParsed = parseGeminiJson(result);

  const profile = {
    student_id: userId,
    generated_at: new Date().toISOString(),
    cached: false,
    global_stats: globalStats,
    ai_profile: aiParsed.ai_profile || {},
    ai_recommendations: aiParsed.ai_recommendations || {},
    progress_timeline: weeks,
    motivation: aiParsed.motivation || {},
  };

  await kv.set(learningProfileKey(userId), profile);
  console.log(`[A7-04] Profile cached for user=${userId}`);
  return profile;
}

// A7-04: POST /ai/learning-profile (with cache)
ai.post("/ai/learning-profile", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json().catch(() => ({}));
    const force = body.force === true;

    if (!force) {
      const cached = await kv.get(learningProfileKey(userId)) as any;
      if (cached && cached.generated_at) {
        const age = Date.now() - new Date(cached.generated_at).getTime();
        if (age < PROFILE_TTL_MS) {
          console.log(`[A7-04] Returning cached profile (age=${Math.round(age / 60000)}min)`);
          return c.json({ success: true, data: { ...cached, cached: true } });
        }
      }
    }

    const profile = await buildLearningProfile(userId);
    return c.json({ success: true, data: profile });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-04] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar perfil: ${msg}` } }, 500);
  }
});

// A7-05: POST /ai/learning-profile/regenerate (force bypass cache)
ai.post("/ai/learning-profile/regenerate", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    console.log(`[A7-05] Force regenerating profile for user=${authResult.userId}`);
    const profile = await buildLearningProfile(authResult.userId);
    return c.json({ success: true, data: profile });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-05] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao regenerar perfil: ${msg}` } }, 500);
  }
});

export default ai;
