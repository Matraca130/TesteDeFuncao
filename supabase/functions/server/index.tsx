// ============================================================
// Axon v4.4 — Hono Server Entrypoint
// ============================================================
// Slim entrypoint: middleware + route composition.
// All route logic lives in dedicated modules:
//   routes-auth.tsx         — signup, signin, signout, me
//   routes-institutions.tsx — CRUD institutions + by-slug
//   routes-curriculum.tsx   — courses, semesters, sections, topics
//   routes-content.tsx      — summaries, keywords
//   routes-members.tsx      — members management
//   routes-seed.tsx         — seed demo data
//   routes-dashboard.tsx    — dashboard/progress/smart-study/plans
//
// Shared helpers in:
//   _server-helpers.ts      — K keys, auth, membership utils
//   dashboard/_helpers.ts   — NeedScore, BKT, hierarchy walkers
//
// FIXES PRESERVED:
//   1. ALL key patterns match kv-keys.ts EXACTLY
//   2. membership:${instId}:${userId} (inst-first, NOT user-first)
//   3. Index keys use idx: prefix
//   4. Keyword primary key is kw:${id}
//   5. Triple-write on membership
//   6. Indices store IDs (not full objects)
// ============================================================
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { PREFIX } from "./_server-helpers.ts";

// Route modules
import auth from "./routes-auth.tsx";
import institutions from "./routes-institutions.tsx";
import curriculum from "./routes-curriculum.tsx";
import content from "./routes-content.tsx";
import members from "./routes-members.tsx";
import seed from "./routes-seed.tsx";
import dashboard from "./routes-dashboard.tsx";

const app = new Hono();

// ── Middleware ───────────────────────────────────────────────
app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Health ───────────────────────────────────────────────────
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok", version: "4.4", prefix: PREFIX, keys_aligned: "kv-keys.ts" });
});

// ── Mount route modules ─────────────────────────────────────
app.route("/", auth);
app.route("/", institutions);
app.route("/", curriculum);
app.route("/", content);
app.route("/", members);
app.route("/", seed);
app.route("/", dashboard);

Deno.serve(app.fetch);
