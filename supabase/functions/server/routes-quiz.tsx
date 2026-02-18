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
import type { QuizQuestion, QuizOption } from "./shared-types.ts";

// Keys — canonical kv-keys.ts (ZERO references to kv-keys.tsx)
import {
  quizKey,
  idxSummaryQuiz,
  idxKwQuiz,
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
// MUST be registered BEFORE /quiz-questions/:id to avoid Hono
// matching "evaluate" as an :id param.
//
// Input:  { question_id, student_answer }
// Output: { correct, grade, correct_answer, explanation }
//
// D16: System-evaluated. The system determines if correct.
// Grade: correct → 0.65 (GRADE_GOOD), incorrect → 0.00 (GRADE_AGAIN)
//
// Frontend flow after evaluate:
//   1. Show correct/incorrect + explanation
//   2. Call POST /reviews with grade: correct ? 3 : 1 (FsrsGrade)
//   3. POST /reviews returns updated_card_fsrs = null (D36)
// ================================================================
quiz.post("/quiz-questions/evaluate", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const { question_id, student_answer } = body;

    // Validate required fields
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
        // student_answer is the option label (e.g. "A", "B", "C", "D")
        // Case-insensitive comparison (Bug 6 fix)
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
        // student_answer is "true" or "false" (string)
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
        // Case-insensitive + accepted_variations
        correct = matchesAnswer(
          student_answer,
          question.correct_answer ?? "",
          question.accepted_variations
        );
        correctAnswer = question.correct_answer ?? "";
        break;
      }

      case "open": {
        // Open (write-in): case-insensitive + accepted_variations
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

    // EvaluateQuizRes: exactly 4 fields
    return c.json({
      success: true,
      data: {
        correct,
        grade: correct ? 0.65 : 0.0, // GRADE_GOOD or GRADE_AGAIN
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
// Validates required fields (keyword_id, question, quiz_type).
// D39: source defaults to 'student' for student-created questions.
// D27: subtopic_id defaults to keyword_id if not provided.
// ================================================================
quiz.post("/quiz-questions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();

    // Validate required fields
    if (!body.keyword_id || !body.question || !body.quiz_type) {
      return validationError(
        c,
        "Missing required fields: keyword_id, question, quiz_type"
      );
    }

    // Validate quiz_type
    if (!VALID_QUIZ_TYPES.includes(body.quiz_type)) {
      return validationError(
        c,
        `Invalid quiz_type: ${body.quiz_type}. Must be one of: ${VALID_QUIZ_TYPES.join(", ")}`
      );
    }

    // For mcq, require options with at least one correct
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

    // For fill_blank, true_false, open — require correct_answer
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

    // QuizQuestion entity — matches shared-types.ts + subtopic_id (D27)
    // + accepted_variations (for fill_blank and open types)
    const questionEntity: Record<string, any> = {
      id,
      summary_id: body.summary_id ?? null,
      keyword_id: body.keyword_id,
      subtopic_id: body.subtopic_id ?? body.keyword_id, // D27
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

    // Primary key + indices
    const keys: string[] = [
      quizKey(id),
      idxKwQuiz(body.keyword_id, id),
    ];
    const vals: any[] = [questionEntity, id];

    // Optional: link to summary
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
// Requires one of summary_id or keyword_id as query param.
// Uses getChildren to resolve index → primary keys.
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
// NOTE: No IDOR check here. Unlike flashcards which have a
// "source" field to distinguish student-private vs shared cards,
// quiz questions don't have an equivalent field. All quiz
// questions are accessible to authenticated users.
// If student-private quiz questions become a requirement,
// add a "source" field to QuizQuestion and mirror the
// flashcard IDOR pattern.
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
// Security: Only the creator can edit (D39). Consistent with
// flashcard PUT IDOR pattern using strict `created_by !== user.id`.
//
// Whitelist: question, options, correct_answer, accepted_variations,
//            explanation, status, difficulty_tier
// Immutable: id, keyword_id, subtopic_id, summary_id,
//            quiz_type, created_by, created_at
// ================================================================
quiz.put("/quiz-questions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const existing = await kv.get(quizKey(id));
    if (!existing) return notFound(c, "Quiz question");

    // D39: Only the creator can edit. Strict check — consistent
    // with flashcard PUT IDOR (no bypass when created_by is null).
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

    // Whitelist: only these fields are updatable
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
    // Immutable: id, keyword_id, subtopic_id, summary_id,
    // quiz_type, created_by, created_at

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
// Security: Only the creator can delete (D39). Strict check —
// consistent with flashcard DELETE IDOR.
// Cleans: primary key, keyword index, summary index (if linked).
// Quiz has NO FSRS state (D36), so no FSRS cleanup needed.
// ================================================================
quiz.delete("/quiz-questions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const question = await kv.get(quizKey(id));
    if (!question) return notFound(c, "Quiz question");

    // D39: Only the creator can delete. Strict check — consistent
    // with flashcard DELETE IDOR (no bypass when created_by is null).
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

    // Remove summary index if linked
    if (question.summary_id) {
      keysToDelete.push(idxSummaryQuiz(question.summary_id, id));
    }

    // Quiz has NO FSRS state (D36) — no FSRS cleanup needed
    // (unlike flashcards which need fsrsKey, idxStudentFsrs, idxDue cleanup)

    await kv.mdel(keysToDelete);

    console.log(
      `[Quiz] Deleted question ${id} (keyword: ${question.keyword_id}) by ${user.id}`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /quiz-questions/:id", err);
  }
});

export default quiz;
