import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
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
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok", version: "4.4", agent: "NEXUS" });
});

// ── Mount AI Feedback Routes (A7-01 to A7-05) ──
app.route(PREFIX, aiFeedback);

Deno.serve(app.fetch);
