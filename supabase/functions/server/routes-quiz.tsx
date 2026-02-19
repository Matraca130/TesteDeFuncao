// ============================================================
// Axon v4.2 — Dev 4: Quiz Question CRUD + Evaluate Routes
// ============================================================
// POST /quiz-questions/evaluate — System-evaluate student answer (D16)
// POST /quiz-questions           — Create a quiz question
// GET  /quiz-questions           — List by summary_id or keyword_id
// GET  /quiz-questions/:id       — Get single question
// PUT  /quiz-questions/:id       — Update question fields
// DELETE /quiz-questions/:id     — Delete question + clean indices
//
// ── Agent 3 (PROBE) additions for v4.4: ──
// POST /quiz-attempts            — Save immutable quiz attempt
// GET  /quiz-attempts            — List attempts by student+keyword
// POST /quiz-bundles             — Create quiz session bundle
// GET  /quiz-bundles             — List bundles by student
// SIGNAL: QUIZ_PERSISTENCE_DONE, QUIZ_BUNDLES_DONE
//
// Key decisions:
//   D16 — Quiz is system-evaluated (the system compares answer)
//   D30 — QUIZ_MULTIPLIER = 0.70 (less weight than flashcard)
//   D36 — Quiz does NOT have individual FSRS state in v1
//   D37 — Adding FSRS to quiz is a future improvement
//   D15 — Quizzes appear inline and in dedicated sessions
//   D39 — Students can create personal quiz questions
//   D27 — If keyword has no sub-topics, subtopic_id = keyword_id
//
// Evaluate output: { correct, grade, correct_answer, explanation }
//   grade: correct → 0.65 (GRADE_GOOD), incorrect → 0.00 (GRADE_AGAIN)
//   When calling POST /reviews: frontend maps 0.65→3 (Good), 0.00→1 (Again)
//   POST /reviews returns updated_card_fsrs = null for quiz (D36)
//
// QuizQuestion types (shared-types.ts QuizType):
//   mcq        — Multiple choice: options[] with is_correct flag
//   true_false — True/false: correct_answer is "true" or "false"
//   fill_blank — Fill in the blank: correct_answer + accepted_variations
//   open       — Open/write-in: correct_answer + accepted_variations
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

// Types — import ONLY the ones this file uses
import type { QuizQuestion, QuizOption, QuizAttempt, QuizBundle } from "./shared-types.ts";

// Keys — canonical kv-keys.ts (ZERO references to kv-keys.tsx)
import {
  quizKey,
  idxSummaryQuiz,
  idxKwQuiz,
  KV_PREFIXES,
  // Agent 3 additions
  quizAttemptKey,
  quizBundleKey,
  idxStudentAttempts,
  idxKwAttempts,
  idxStudentBundles,
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

const quiz = new Hono();

// Valid quiz types for validation
const VALID_QUIZ_TYPES = ["mcq", "true_false", "fill_blank", "open"];

// ── Helper: check text match with accepted_variations ──────
function matchesAnswer(
  studentAnswer: string,
  correctAnswer: string,
  acceptedVariations?: string[]
): boolean {
  const normalized = String(studentAnswer).toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase().trim();

  if (normalized === normalizedCorrect) return true;

  // Check accepted_variations (case-insensitive, trimmed)
  if (acceptedVariations && Array.isArray(acceptedVariations)) {
    return acceptedVariations.some(
      (v: string) => v.toLowerCase().trim() === normalized
    );
  }

  return false;
}

// ================================================================
// POST /quiz-questions/evaluate — System-evaluate student answer
// ================================================================
quiz.post("/quiz-questions/evaluate", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const { question_id, student_answer } = body;

    if (
      !question_id ||
      student_answer === undefined ||
      student_answer === null
    ) {
      return validationError(
        c,
        "Missing required fields: question_id, student_answer"
      );
    }

    const question: any = await kv.get(quizKey(question_id));
    if (!question) {
      return notFound(c, "Quiz question");
    }

    let correct = false;
    let correctAnswer = "";

    switch (question.quiz_type) {
      case "mcq": {
        const options = (question.options ?? []) as QuizOption[];
        const correctOpt = options.find((o) => o.is_correct);
        correct =
          String(student_answer).toLowerCase().trim() ===
          (correctOpt?.label ?? "").toLowerCase().trim();
        correctAnswer = correctOpt
          ? `${correctOpt.label}: ${correctOpt.text}`
          : "";
        break;
      }

      case "true_false": {
        const normalized = String(student_answer).toLowerCase().trim();
        const normalizedCorrect = (
          question.correct_answer ?? ""
        )
          .toLowerCase()
          .trim();
        correct = normalized === normalizedCorrect;
        correctAnswer = question.correct_answer ?? "";
        break;
      }

      case "fill_blank": {
        correct = matchesAnswer(
          student_answer,
          question.correct_answer ?? "",
          question.accepted_variations
        );
        correctAnswer = question.correct_answer ?? "";
        break;
      }

      case "open": {
        correct = matchesAnswer(
          student_answer,
          question.correct_answer ?? "",
          question.accepted_variations
        );
        correctAnswer = question.correct_answer ?? "";
        break;
      }

      default: {
        return validationError(
          c,
          `Unknown quiz_type: ${question.quiz_type}`
        );
      }
    }

    console.log(
      `[Quiz] Evaluate: question=${question_id}, type=${question.quiz_type}, correct=${correct}, user=${user.id}`
    );

    return c.json({
      success: true,
      data: {
        correct,
        grade: correct ? 0.65 : 0.0,
        correct_answer: correctAnswer,
        explanation: question.explanation ?? null,
      },
    });
  } catch (err) {
    return serverError(c, "POST /quiz-questions/evaluate", err);
  }
});

// ================================================================
// POST /quiz-questions — Create a quiz question
// ================================================================
quiz.post("/quiz-questions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();

    if (!body.keyword_id || !body.question || !body.quiz_type) {
      return validationError(
        c,
        "Missing required fields: keyword_id, question, quiz_type"
      );
    }

    if (!VALID_QUIZ_TYPES.includes(body.quiz_type)) {
      return validationError(
        c,
        `Invalid quiz_type: ${body.quiz_type}. Must be one of: ${VALID_QUIZ_TYPES.join(", ")}`
      );
    }

    if (body.quiz_type === "mcq") {
      if (
        !body.options ||
        !Array.isArray(body.options) ||
        body.options.length < 2
      ) {
        return validationError(
          c,
          "MCQ questions require at least 2 options"
        );
      }
      const hasCorrect = body.options.some((o: any) => o.is_correct);
      if (!hasCorrect) {
        return validationError(
          c,
          "MCQ questions require at least one correct option"
        );
      }
    }

    if (
      ["fill_blank", "true_false", "open"].includes(body.quiz_type) &&
      !body.correct_answer
    ) {
      return validationError(
        c,
        `${body.quiz_type} questions require correct_answer`
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const questionEntity: Record<string, any> = {
      id,
      summary_id: body.summary_id ?? null,
      keyword_id: body.keyword_id,
      subtopic_id: body.subtopic_id ?? body.keyword_id,
      question: body.question,
      quiz_type: body.quiz_type,
      status: body.status ?? "active",
      options: body.options ?? null,
      correct_answer: body.correct_answer ?? null,
      accepted_variations: body.accepted_variations ?? null,
      explanation: body.explanation ?? null,
      difficulty_tier: body.difficulty_tier ?? null,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    };

    const keys: string[] = [
      quizKey(id),
      idxKwQuiz(body.keyword_id, id),
    ];
    const vals: any[] = [questionEntity, id];

    if (body.summary_id) {
      keys.push(idxSummaryQuiz(body.summary_id, id));
      vals.push(id);
    }

    await kv.mset(keys, vals);

    console.log(
      `[Quiz] Created question ${id} (${body.quiz_type}) for keyword ${body.keyword_id} by ${user.id}`
    );
    return c.json({ success: true, data: questionEntity }, 201);
  } catch (err) {
    return serverError(c, "POST /quiz-questions", err);
  }
});

// ================================================================
// GET /quiz-questions — List by summary_id or keyword_id
// ================================================================
quiz.get("/quiz-questions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.query("summary_id");
    const keywordId = c.req.query("keyword_id");

    if (summaryId) {
      const questions = await getChildren(
        KV_PREFIXES.IDX_SUMMARY_QUIZ + summaryId + ":",
        quizKey
      );
      return c.json({ success: true, data: questions });
    }

    if (keywordId) {
      const questions = await getChildren(
        KV_PREFIXES.IDX_KW_QUIZ + keywordId + ":",
        quizKey
      );
      return c.json({ success: true, data: questions });
    }

    return validationError(
      c,
      "summary_id or keyword_id query param required"
    );
  } catch (err) {
    return serverError(c, "GET /quiz-questions", err);
  }
});

// ================================================================
// GET /quiz-questions/:id — Get single question
// ================================================================
quiz.get("/quiz-questions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const question = await kv.get(quizKey(c.req.param("id")));
    if (!question) return notFound(c, "Quiz question");
    return c.json({ success: true, data: question });
  } catch (err) {
    return serverError(c, "GET /quiz-questions/:id", err);
  }
});

// ================================================================
// PUT /quiz-questions/:id — Update question fields
// ================================================================
quiz.put("/quiz-questions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const existing = await kv.get(quizKey(id));
    if (!existing) return notFound(c, "Quiz question");

    if (existing.created_by !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot edit another user's quiz question",
          },
        },
        403
      );
    }

    const body = await c.req.json();

    const UPDATABLE = [
      "question",
      "options",
      "correct_answer",
      "accepted_variations",
      "explanation",
      "status",
      "difficulty_tier",
    ];
    const updated = { ...existing };
    for (const field of UPDATABLE) {
      if (body[field] !== undefined) {
        updated[field] = body[field];
      }
    }
    updated.updated_at = new Date().toISOString();

    await kv.set(quizKey(id), updated);

    console.log(`[Quiz] Updated question ${id} by ${user.id}`);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /quiz-questions/:id", err);
  }
});

// ================================================================
// DELETE /quiz-questions/:id — Delete question + clean all indices
// ================================================================
quiz.delete("/quiz-questions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const question = await kv.get(quizKey(id));
    if (!question) return notFound(c, "Quiz question");

    if (question.created_by !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot delete another user's quiz question",
          },
        },
        403
      );
    }

    const keysToDelete: string[] = [
      quizKey(id),
      idxKwQuiz(question.keyword_id, id),
    ];

    if (question.summary_id) {
      keysToDelete.push(idxSummaryQuiz(question.summary_id, id));
    }

    await kv.mdel(keysToDelete);

    console.log(
      `[Quiz] Deleted question ${id} (keyword: ${question.keyword_id}) by ${user.id}`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /quiz-questions/:id", err);
  }
});

// ════════════════════════════════════════════════════════════════
// Agent 3 (PROBE) — Quiz Attempt Persistence (v4.4)
// SIGNAL: QUIZ_PERSISTENCE_DONE
//
// QuizAttempts are IMMUTABLE — no PUT or DELETE.
// Stored at quiz-attempt:{id}, indexed by student and keyword.
// ════════════════════════════════════════════════════════════════

// ================================================================
// POST /quiz-attempts — Save an immutable quiz attempt
// ================================================================
quiz.post("/quiz-attempts", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();

    if (!body.question_id || !body.keyword_id || body.correct === undefined) {
      return validationError(
        c,
        "Missing required fields: question_id, keyword_id, correct"
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const attempt: QuizAttempt = {
      id,
      student_id: user.id,
      session_id: body.session_id ?? undefined,
      question_id: body.question_id,
      keyword_id: body.keyword_id,
      quiz_type: body.quiz_type ?? "mcq",
      student_answer: String(body.student_answer ?? ""),
      correct: Boolean(body.correct),
      grade: body.correct ? 0.65 : 0.0,
      response_time_ms: body.response_time_ms ?? 0,
      difficulty_tier: body.difficulty_tier ?? undefined,
      created_at: now,
    };

    const keys: string[] = [
      quizAttemptKey(id),
      idxStudentAttempts(user.id, id),
      idxKwAttempts(body.keyword_id, id),
    ];
    const vals: any[] = [attempt, id, id];

    await kv.mset(keys, vals);

    console.log(
      `[Quiz] Attempt saved: ${id.slice(0, 8)}… q=${body.question_id.slice(0, 8)}… ` +
        `correct=${attempt.correct} student=${user.id.slice(0, 8)}…`
    );

    return c.json({ success: true, data: attempt }, 201);
  } catch (err) {
    return serverError(c, "POST /quiz-attempts", err);
  }
});

// ================================================================
// GET /quiz-attempts — List attempts by student (+ optional keyword_id)
// ================================================================
quiz.get("/quiz-attempts", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const keywordId = c.req.query("keyword_id");

    if (keywordId) {
      const attemptIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_ATTEMPTS + keywordId + ":"
      );
      if (!attemptIds || attemptIds.length === 0) {
        return c.json({ success: true, data: [] });
      }
      const attempts = await kv.mget(
        attemptIds.map((id: string) => quizAttemptKey(id))
      );
      const filtered = attempts.filter(
        (a: any) => a && a.student_id === user.id
      );
      return c.json({ success: true, data: filtered });
    }

    const attemptIds: string[] = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_ATTEMPTS + user.id + ":"
    );
    if (!attemptIds || attemptIds.length === 0) {
      return c.json({ success: true, data: [] });
    }
    const attempts = await kv.mget(
      attemptIds.map((id: string) => quizAttemptKey(id))
    );
    return c.json({
      success: true,
      data: attempts.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /quiz-attempts", err);
  }
});

// ════════════════════════════════════════════════════════════════
// Agent 3 (PROBE) — Quiz Bundle Persistence (v4.4)
// SIGNAL: QUIZ_BUNDLES_DONE
// ════════════════════════════════════════════════════════════════

// ================================================================
// POST /quiz-bundles — Create a quiz session bundle
// ================================================================
quiz.post("/quiz-bundles", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();

    if (!body.session_id || !body.attempt_ids || !Array.isArray(body.attempt_ids)) {
      return validationError(
        c,
        "Missing required fields: session_id, attempt_ids[]"
      );
    }

    if (body.attempt_ids.length === 0) {
      return validationError(c, "attempt_ids must not be empty");
    }

    const attempts = await kv.mget(
      body.attempt_ids.map((id: string) => quizAttemptKey(id))
    );
    const validAttempts = attempts.filter(
      (a: any) => a && a.student_id === user.id
    );

    if (validAttempts.length === 0) {
      return validationError(c, "No valid attempts found for this student");
    }

    const byType: Record<string, { total: number; correct: number }> = {};
    const byKeyword: Record<string, { total: number; correct: number }> = {};
    let totalTime = 0;

    for (const a of validAttempts) {
      if (!byType[a.quiz_type]) byType[a.quiz_type] = { total: 0, correct: 0 };
      byType[a.quiz_type].total++;
      if (a.correct) byType[a.quiz_type].correct++;

      if (!byKeyword[a.keyword_id]) byKeyword[a.keyword_id] = { total: 0, correct: 0 };
      byKeyword[a.keyword_id].total++;
      if (a.correct) byKeyword[a.keyword_id].correct++;

      totalTime += a.response_time_ms || 0;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const bundle: QuizBundle = {
      id,
      student_id: user.id,
      session_id: body.session_id,
      summary_id: body.summary_id ?? undefined,
      attempt_ids: validAttempts.map((a: any) => a.id),
      stats: {
        total: validAttempts.length,
        correct: validAttempts.filter((a: any) => a.correct).length,
        by_type: byType,
        by_keyword: byKeyword,
        avg_time_ms: validAttempts.length > 0 ? Math.round(totalTime / validAttempts.length) : 0,
      },
      created_at: now,
    };

    const keys: string[] = [
      quizBundleKey(id),
      idxStudentBundles(user.id, id),
    ];
    const vals: any[] = [bundle, id];

    await kv.mset(keys, vals);

    console.log(
      `[Quiz] Bundle created: ${id.slice(0, 8)}… session=${body.session_id.slice(0, 8)}… ` +
        `${bundle.stats.correct}/${bundle.stats.total} correct, student=${user.id.slice(0, 8)}…`
    );

    return c.json({ success: true, data: bundle }, 201);
  } catch (err) {
    return serverError(c, "POST /quiz-bundles", err);
  }
});

// ================================================================
// GET /quiz-bundles — List bundles for authenticated student
// ================================================================
quiz.get("/quiz-bundles", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const bundleIds: string[] = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_BUNDLES + user.id + ":"
    );

    if (!bundleIds || bundleIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const bundles = await kv.mget(
      bundleIds.map((id: string) => quizBundleKey(id))
    );

    return c.json({
      success: true,
      data: bundles.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /quiz-bundles", err);
  }
});

export default quiz;
