// ============================================================
// Axon v4.2 — Server Entry Point
// ============================================================
// Modular Hono router. Each vertical owns a route file:
//   - auth.tsx             (Dev 6) — signup, signin, me, signout
//   - ai-routes.tsx        (Dev 6) — generate, approve, chat, keyword-popup
//   - routes-content.tsx   (Dev 1) — CRUD for all content entities (~47 routes)
//   - routes-reading.tsx   (Dev 2) — reading state, annotations, topics/:id/full
//   - routes-flashcards.tsx(Dev 3) — flashcard CRUD + /due (6 routes)
//   - routes-quiz.tsx      (Dev 4) — quiz CRUD + evaluate (6 routes)
//   - routes-reviews.tsx   (Dev 3→4) — POST /reviews, GET /bkt, GET /fsrs
//   - routes-sessions.tsx  (Dev 3→5) — session CRUD (4 routes)
//   - routes-dashboard.tsx (Dev 5) — progress, smart study, plans, stats (16 routes)
//
// CONSERVED: gemini.tsx (imported by ai-routes), seed.tsx
// ============================================================
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import authRoutes from "./auth.tsx";
import aiRoutes from "./ai-routes.tsx";
import contentRoutes from "./routes-content.tsx";
import readingRoutes from "./routes-reading.tsx";
import flashcardRoutes from "./routes-flashcards.tsx";
import quizRoutes from "./routes-quiz.tsx";
import reviewRoutes from "./routes-reviews.tsx";
import sessionRoutes from "./routes-sessions.tsx";
import dashboardRoutes from "./routes-dashboard.tsx";

const app = new Hono();
const PREFIX = "/make-server-0c4f6a3c";

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// Health check endpoint
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok", version: "4.2", timestamp: new Date().toISOString() });
});

// ── KV Diagnostic endpoint ──────────────────────────────────────────
// Tests kv.set → kv.get → kv.del roundtrip to verify persistence
app.get(`${PREFIX}/diag/kv-test`, async (c) => {
  const testKey = `_diag:kv-test:${Date.now()}`;
  const testVal = { test: true, ts: new Date().toISOString() };
  try {
    await kv.set(testKey, testVal);
    const readBack = await kv.get(testKey);
    await kv.del(testKey);
    const found = readBack !== null && readBack?.test === true;
    console.log(`[Diag] kv-test: set=${true}, get_found=${found}, cleaned=true`);
    return c.json({
      success: true,
      data: {
        set_ok: true,
        get_found: found,
        get_value: readBack,
        cleaned: true,
        prefix: PREFIX,
        table: "kv_store_0c4f6a3c",
      },
    });
  } catch (err: any) {
    console.log(`[Diag] kv-test FAILED: ${err?.message ?? err}`);
    return c.json({
      success: false,
      error: { message: `KV test failed: ${err?.message ?? err}` },
    }, 500);
  }
});

// ── Route list diagnostic ──────────────────────────────────────────
app.get(`${PREFIX}/diag/routes`, (c) => {
  return c.json({
    success: true,
    data: {
      prefix: PREFIX,
      modules: [
        "auth",
        "ai-routes",
        "routes-content",
        "routes-reading",
        "routes-flashcards",
        "routes-quiz",
        "routes-reviews",
        "routes-sessions",
        "routes-dashboard",
      ],
      flashcard_routes: [
        "POST /flashcards", "GET /flashcards", "GET /flashcards/due",
        "GET /flashcards/:id", "PUT /flashcards/:id", "DELETE /flashcards/:id",
      ],
      quiz_routes: [
        "POST /quiz-questions/evaluate",
        "POST /quiz-questions", "GET /quiz-questions",
        "GET /quiz-questions/:id", "PUT /quiz-questions/:id", "DELETE /quiz-questions/:id",
      ],
      review_routes: [
        "POST /reviews", "GET /bkt", "GET /fsrs",
      ],
      session_routes: [
        "POST /sessions", "GET /sessions",
        "GET /sessions/:id", "PUT /sessions/:id/end",
      ],
      dashboard_routes: [
        "GET /stats",
        "GET /daily-activity", "GET /daily-activity/:date",
        "GET /progress/keyword/:keywordId",
        "GET /progress/topic/:topicId",
        "GET /progress/course/:courseId",
        "POST /smart-study/generate",
        "POST /study-plans", "GET /study-plans",
        "GET /study-plans/:id", "PUT /study-plans/:id",
        "DELETE /study-plans/:id",
        "POST /study-plans/:id/recalculate",
        "GET /study-plans/:id/tasks",
        "PUT /study-plan-tasks/:id/complete",
        "POST /sessions/:id/finalize-stats",
      ],
      content_routes: [
        "POST /courses", "GET /courses", "GET /courses/:id", "PUT /courses/:id", "DELETE /courses/:id",
        "POST /semesters", "GET /semesters", "GET /semesters/:id", "PUT /semesters/:id", "DELETE /semesters/:id",
        "POST /sections", "GET /sections", "GET /sections/:id", "PUT /sections/:id", "DELETE /sections/:id",
        "POST /topics", "GET /topics", "GET /topics/:id", "PUT /topics/:id", "DELETE /topics/:id",
        "POST /subtopics", "GET /subtopics", "GET /subtopics/:id", "PUT /subtopics/:id", "DELETE /subtopics/:id",
        "POST /institutions", "GET /institutions/:id", "GET /institutions/:id/members", "POST /institutions/:id/members", "DELETE /institutions/:id/members/:userId",
        "POST /summaries", "GET /summaries", "GET /summaries/:id", "PUT /summaries/:id", "DELETE /summaries/:id",
        "GET /summaries/:id/chunks", "POST /summaries/:id/chunk",
        "POST /keywords", "GET /keywords", "GET /keywords/:id", "PUT /keywords/:id", "DELETE /keywords/:id",
        "POST /connections", "GET /connections", "GET /connections/:id", "DELETE /connections/:id",
        "PUT /content/batch-status",
      ],
    },
  });
});

// Mount auth routes (Dev 6)
app.route(PREFIX, authRoutes);

// Mount AI routes (Dev 6)
app.route(PREFIX, aiRoutes);

// Mount content management routes (Dev 1 — ~47 routes)
app.route(PREFIX, contentRoutes);

// Mount reading/annotation routes (Dev 2 — 7 routes)
app.route(PREFIX, readingRoutes);

// Mount flashcard CRUD routes (Dev 3 — 6 routes)
app.route(PREFIX, flashcardRoutes);

// Mount quiz CRUD + evaluate routes (Dev 4 — 6 routes)
app.route(PREFIX, quizRoutes);

// Mount review cascade + learning state routes (Dev 3→4 — 3 routes)
app.route(PREFIX, reviewRoutes);

// Mount session management routes (Dev 3→5 — 4 routes)
app.route(PREFIX, sessionRoutes);

// Mount dashboard, progress, smart study & plans routes (Dev 5 — 16 routes)
app.route(PREFIX, dashboardRoutes);

Deno.serve(app.fetch);
