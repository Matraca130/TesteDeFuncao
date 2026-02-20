// ============================================================
// Axon v4.4 — Hono Server: Figma Make entrypoint (UNIFIED)
// Mounts ALL route modules under ONE prefix.
// Agent 4 domain routes + Agent 7 AI routes + Agent 1 ATLAS routes
// ============================================================
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

// Agent 4 — Domain route modules
import studentRoutes from "./routes-student.tsx";
import sacredRoutes from "./routes-sacred.tsx";
import contentRoutes from "./routes-content.tsx";
import miscRoutes from "./routes-misc.tsx";
import flashcardRoutes from "./routes-flashcards.tsx";
import quizContentRoutes from "./routes-quiz-content.tsx";
import studyPlanRoutes from "./routes-study-plans.tsx";
import smartStudyRoutes from "./routes-smart-study.tsx";
import { seedContentAndSacred } from "./seed-all.tsx";
import { ok, err } from "./kv-schema.tsx";

// Agent 7 — AI Feedback routes
import aiFeedback from "./ai-feedback-routes.tsx";

// Agent 1 — ATLAS routes (Plans + AdminScopes)
import plansRoutes from "./routes-plans.tsx";
import adminScopesRoutes from "./routes-admin-scopes.tsx";

const PREFIX = "/make-server-722e576f";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check
app.get(`${PREFIX}/health`, (c) => {
  return c.json({
    status: "ok",
    version: "4.4-p5-unified",
    routes: "~120",
    agents: "A1+A4+A7",
    modules: [
      "student", "sacred", "content", "misc", "flashcards",
      "quizContent", "studyPlans", "smartStudy", "aiFeedback",
      "plans", "adminScopes", "seed",
    ],
  });
});

// ── Agent 4: Domain route modules ──
app.route(PREFIX, studentRoutes);
app.route(PREFIX, sacredRoutes);
app.route(PREFIX, contentRoutes);
app.route(PREFIX, miscRoutes);
app.route(PREFIX, flashcardRoutes);
app.route(PREFIX, quizContentRoutes);
app.route(PREFIX, studyPlanRoutes);
app.route(PREFIX, smartStudyRoutes);

// ── Agent 7: AI Feedback routes (A7-01 to A7-05) ──
app.route(PREFIX, aiFeedback);

// ── Agent 1: ATLAS routes (Plans + AdminScopes) ──
app.route(PREFIX, plansRoutes);
app.route(PREFIX, adminScopesRoutes);

// ── Seed: Full database seed (student + content + sacred + misc + P3) ──
app.post(`${PREFIX}/seed-all`, async (c) => {
  try {
    const studentRes = await app.request(
      new Request(`http://localhost${PREFIX}/seed`, { method: "POST" }),
    );
    const studentData = await studentRes.json();
    const miscCount = await seedContentAndSacred();

    return c.json(ok({
      student_keys: studentData?.data?.seeded ?? 0,
      content_sacred_misc_keys: miscCount,
      total: (studentData?.data?.seeded ?? 0) + miscCount,
    }));
  } catch (e) {
    console.log("POST seed-all error:", e);
    return c.json(err(`Full seed failed: ${e}`), 500);
  }
});

Deno.serve(app.fetch);
