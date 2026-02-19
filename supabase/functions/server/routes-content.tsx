// ============================================================
// Axon v4.4 — Dev 1: Content Management Routes (Orchestrator)
// ============================================================
// This file is a thin orchestrator that imports and re-exports
// all content sub-routers. Each entity group lives in its own
// file under ./content/ for readability and maintainability.
//
// Sub-modules:
//   content/_helpers.ts      — shared auth, errors, getChildren
//   content/institutions.ts  — Institution CRUD + members + slug
//   content/courses.ts       — Course CRUD with cascade delete
//   content/semesters.ts     — Semester CRUD with cascade delete
//   content/sections.ts      — Section CRUD with cascade delete
//   content/topics.ts        — Topic CRUD with cascade delete
//   content/summaries.ts     — Summary CRUD + chunks
//   content/keywords.ts      — Keyword CRUD with cascade delete
//   content/subtopics.ts     — SubTopic CRUD
//   content/connections.ts   — Connection CRUD
//   content/batch.ts         — Batch content approval (D20)
//
// CRUD for: Institution, Membership, Course, Semester, Section,
//           Topic, Summary, Chunk, Keyword, SubTopic, Connection
// + Batch content approval (D20)
// ============================================================
import { Hono } from "npm:hono";

// Sub-routers
import institutions from "./content/institutions.ts";
import courses from "./content/courses.ts";
import semesters from "./content/semesters.ts";
import sections from "./content/sections.ts";
import topics from "./content/topics.ts";
import summaries from "./content/summaries.ts";
import keywords from "./content/keywords.ts";
import subtopics from "./content/subtopics.ts";
import connections from "./content/connections.ts";
import batch from "./content/batch.ts";

const content = new Hono();

// Mount all sub-routers on the same path prefix ("/")
// Each sub-router defines its own paths (e.g. /institutions, /courses, etc.)
content.route("/", institutions);
content.route("/", courses);
content.route("/", semesters);
content.route("/", sections);
content.route("/", topics);
content.route("/", summaries);
content.route("/", keywords);
content.route("/", subtopics);
content.route("/", connections);
content.route("/", batch);

export default content;
