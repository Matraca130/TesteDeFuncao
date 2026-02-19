// Axon v4.4 — Hono Server: Main entrypoint
// 72 endpoints across 4 route modules, backed by KV store
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

import studentRoutes from "./routes-student.tsx";
import sacredRoutes from "./routes-sacred.tsx";
import contentRoutes from "./routes-content.tsx";
import miscRoutes from "./routes-misc.tsx";
import { seedContentAndSacred } from "./seed-all.tsx";
import { ok, err } from "./kv-schema.tsx";

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

// Health check endpoint
app.get("/make-server-6e4db60a/health", (c) => {
  return c.json({ status: "ok", version: "4.4", routes: 72 });
});

// Mount domain route groups under the server prefix
app.route("/make-server-6e4db60a", studentRoutes);
app.route("/make-server-6e4db60a", sacredRoutes);
app.route("/make-server-6e4db60a", contentRoutes);
app.route("/make-server-6e4db60a", miscRoutes);

// Override seed to also seed content + sacred + misc
app.post("/make-server-6e4db60a/seed-all", async (c) => {
  try {
    // First seed student data via the student routes seed
    const studentRes = await app.request(
      new Request("http://localhost/make-server-6e4db60a/seed", { method: "POST" }),
    );
    const studentData = await studentRes.json();

    // Then seed content + sacred + misc
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
