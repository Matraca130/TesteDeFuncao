// ============================================================
// Axon v4.2 — Server Entry Point (REWRITE from V1)
// ============================================================
// Modular Hono router. Each vertical owns a route file:
//   - auth.tsx           (Dev 6) — signup, signin, me, signout
//   - ai-routes.tsx      (Dev 6) — generate, approve, chat, keyword-popup
//   - routes-content     (Dev 1) — CRUD for all content entities (~47 routes)
//   - routes-reading     (Dev 2) — reading state, annotations, topics/:id/full
//   - routes-flashcards  (Dev 3) — flashcard CRUD, reviews, sessions, BKT/FSRS
//
// CONSERVED: gemini.tsx (imported by ai-routes), seed.tsx, fsrs-engine.ts
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

const app = new Hono();
const PREFIX = "/make-server-099e81c5";

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

// Mount auth routes (Dev 6)
app.route(PREFIX, authRoutes);

// Mount AI routes (Dev 6)
app.route(PREFIX, aiRoutes);

// Mount content management routes (Dev 1 — ~47 routes)
app.route(PREFIX, contentRoutes);

// Mount reading/annotation routes (Dev 2 — 7 routes)
app.route(PREFIX, readingRoutes);

// Mount flashcard/review/session routes (Dev 3 — 13 routes)
app.route(PREFIX, flashcardRoutes);

Deno.serve(app.fetch);
