// ============================================================
// Axon v4.2 — Server Entry Point
// ============================================================
// Modular Hono router. Each vertical owns a route file:
//   - auth.tsx        (Dev 6) — signup, signin, me, signout
//   - ai-routes.tsx   (Dev 6) — generate, approve, chat, keyword-popup
//   - routes-content  (Dev 1) — CRUD for all content entities (~47 routes)
//   - routes-reading  (Dev 2) — reading state, annotations, topics/:id/full
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

// ── KV Diagnostic endpoint ──────────────────────────────────
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
        table: "kv_store_8cb6316a",
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

// ── Route list diagnostic ──────────────────────────────────
app.get(`${PREFIX}/diag/routes`, (c) => {
  return c.json({
    success: true,
    data: {
      prefix: PREFIX,
      modules: ["auth", "ai-routes", "routes-content", "routes-reading"],
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

Deno.serve(app.fetch);