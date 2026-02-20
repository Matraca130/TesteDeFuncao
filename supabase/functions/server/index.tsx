// ============================================================
// Axon v4.4 — Hono Server: Figma Make entrypoint (MERGED)
// Mounts Agent 4 domain routes (~100 endpoints) + Agent 7 AI routes (5 endpoints)
// PREFIX must match the Figma Make environment deployment
// ============================================================
// Axon v4.4 — Hono Server: Main entrypoint
// ~100 endpoints across 8 route modules, backed by KV store
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
  return c.json({ status: "ok", version: "4.4-p5", routes: "~105", agents: "A4+A7" });
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
// Health check endpoint
app.get("/make-server-6e4db60a/health", (c) => {
  return c.json({ status: "ok", version: "4.4-p4", routes: "~100" });
});

// Mount domain route groups under the server prefix
app.route("/make-server-6e4db60a", studentRoutes);
app.route("/make-server-6e4db60a", sacredRoutes);
app.route("/make-server-6e4db60a", contentRoutes);
app.route("/make-server-6e4db60a", miscRoutes);
app.route("/make-server-6e4db60a", flashcardRoutes);
app.route("/make-server-6e4db60a", quizContentRoutes);
app.route("/make-server-6e4db60a", studyPlanRoutes);
app.route("/make-server-6e4db60a", smartStudyRoutes);

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
