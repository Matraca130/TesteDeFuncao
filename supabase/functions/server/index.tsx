import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import authRoutes from "./auth.tsx";
import aiRoutes from "./ai-routes.tsx";
import contentRoutes from "./routes-content.tsx";
import flashcardRoutes from "./routes-flashcards.tsx";

const app = new Hono();
const PREFIX = "/make-server-0c4f6a3c";

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
  return c.json({ status: "ok" });
});

// Mount auth routes
app.route(PREFIX, authRoutes);

// Mount AI routes
app.route(PREFIX, aiRoutes);

// Mount content management routes (Dev 1 — ~47 routes)
app.route(PREFIX, contentRoutes);

// Mount flashcard, review, and session routes (Dev 3 — 14 routes)
app.route(PREFIX, flashcardRoutes);

Deno.serve(app.fetch);
