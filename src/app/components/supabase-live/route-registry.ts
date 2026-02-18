// ══════════════════════════════════════════════════════════════════════════════
// SUPABASE LIVE MONITOR — Route Registry & Static Data
// Extracted from SupabaseLiveView.tsx (Paso 2/6)
//
// Contains: LIVE_PREFIX, KNOWN_PREFIXES, ROUTE_GROUPS, DEV_DELIVERABLES, OLEADAS
// ══════════════════════════════════════════════════════════════════════════════

import type {
  RouteGroup,
  DevDeliverables,
  OleadaDefinition,
} from "./types";

// ── LIVE PREFIX ──
// Which server prefix is the current deployment target
export const LIVE_PREFIX = "7a20cd7d";

// ══════════════════════════════════════════════════════════════════════════════
// KNOWN PREFIXES — All server instances we can probe
// ══════════════════════════════════════════════════════════════════════════════

export interface KnownPrefix {
  id: string;
  label: string;
  description: string;
}

export const KNOWN_PREFIXES: KnownPrefix[] = [
  { id: "7a20cd7d", label: `GitHub main (repo) ${LIVE_PREFIX === "7a20cd7d" ? "(TARGET)" : ""}`, description: "Servidor LIVE del repo GitHub — index.ts v4.4, 89 endpoints, 11 route modules, KV: kv_store_7a20cd7d" },
  { id: "229c9fbf", label: `Este Figma Make (Monitor) ${LIVE_PREFIX === "229c9fbf" ? "(TARGET)" : ""}`, description: "Dashboard de planificacion / solo 4 rutas diagnosticas" },
  { id: "0ada7954", label: "Figma Make Legacy", description: "Proyecto Figma Make anterior — ya NO es el target" },
];

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE REGISTRY — From api-contract.ts (78 endpoints)
// One probe per route group to verify if the dev implemented the section
// ══════════════════════════════════════════════════════════════════════════════

export const ROUTE_GROUPS: RouteGroup[] = [
  {
    group: "Auth", dev: "Dev 6", probePath: "/auth/me", probeMethod: "GET", section: 1,
    totalRoutes: 4, description: "Signup, signin, signout, me",
    routes: ["POST /auth/signup", "POST /auth/signin", "POST /auth/signout", "GET /auth/me"],
  },
  {
    group: "Institutions", dev: "Dev 1", probePath: "/institutions/test", probeMethod: "GET", section: 2,
    totalRoutes: 5, description: "CRUD instituciones + miembros",
    routes: ["POST /institutions", "GET /institutions/:id", "GET /institutions/:id/members", "POST /institutions/:id/members", "DELETE /institutions/:id/members/:mid"],
  },
  {
    group: "Courses", dev: "Dev 1", probePath: "/courses", probeMethod: "GET", section: 3,
    totalRoutes: 5, description: "CRUD cursos",
    routes: ["POST /courses", "GET /courses", "GET /courses/:id", "PUT /courses/:id", "DELETE /courses/:id"],
  },
  {
    group: "Semesters", dev: "Dev 1", probePath: "/semesters", probeMethod: "GET", section: 4,
    totalRoutes: 4, description: "CRUD semestres",
    routes: ["POST /semesters", "GET /semesters", "PUT /semesters/:id", "DELETE /semesters/:id"],
  },
  {
    group: "Sections", dev: "Dev 1", probePath: "/sections", probeMethod: "GET", section: 4,
    totalRoutes: 4, description: "CRUD secciones",
    routes: ["POST /sections", "GET /sections", "PUT /sections/:id", "DELETE /sections/:id"],
  },
  {
    group: "Topics", dev: "Dev 1", probePath: "/topics", probeMethod: "GET", section: 4,
    totalRoutes: 6, description: "CRUD topics + full view",
    routes: ["POST /topics", "GET /topics", "GET /topics/:id", "PUT /topics/:id", "DELETE /topics/:id", "GET /topics/:id/full"],
  },
  {
    group: "Summaries", dev: "Dev 1+2", probePath: "/summaries", probeMethod: "GET", section: 5,
    totalRoutes: 7, description: "CRUD summaries + chunks",
    routes: ["POST /summaries", "GET /summaries", "GET /summaries/:id", "PUT /summaries/:id", "DELETE /summaries/:id", "GET /summaries/:id/chunks", "POST /summaries/:id/chunk"],
  },
  {
    group: "Keywords", dev: "Dev 1", probePath: "/keywords", probeMethod: "GET", section: 6,
    totalRoutes: 5, description: "CRUD keywords",
    routes: ["POST /keywords", "GET /keywords", "GET /keywords/:id", "PUT /keywords/:id", "DELETE /keywords/:id"],
  },
  {
    group: "SubTopics", dev: "Dev 1", probePath: "/subtopics", probeMethod: "GET", section: 6,
    totalRoutes: 4, description: "CRUD subtopics",
    routes: ["POST /subtopics", "GET /subtopics", "PUT /subtopics/:id", "DELETE /subtopics/:id"],
  },
  {
    group: "Connections", dev: "Dev 1", probePath: "/connections", probeMethod: "GET", section: 6,
    totalRoutes: 3, description: "CRUD connections",
    routes: ["POST /connections", "GET /connections", "DELETE /connections/:id"],
  },
  {
    group: "Flashcards", dev: "Dev 3", probePath: "/flashcards", probeMethod: "GET", section: 7,
    totalRoutes: 6, description: "CRUD flashcards + due",
    routes: ["POST /flashcards", "GET /flashcards", "GET /flashcards/due", "GET /flashcards/:id", "PUT /flashcards/:id", "DELETE /flashcards/:id"],
  },
  {
    group: "Quiz", dev: "Dev 4", probePath: "/quiz-questions", probeMethod: "GET", section: 7,
    totalRoutes: 6, description: "CRUD quiz + evaluate",
    routes: ["POST /quiz-questions", "GET /quiz-questions", "GET /quiz-questions/:id", "PUT /quiz-questions/:id", "DELETE /quiz-questions/:id", "POST /quiz-questions/evaluate"],
  },
  {
    group: "Reviews", dev: "Dev 3+4", probePath: "/reviews", probeMethod: "POST", section: 8,
    totalRoutes: 1, description: "Submit review (BKT+FSRS)",
    routes: ["POST /reviews"],
  },
  {
    group: "Sessions", dev: "Dev 3-5", probePath: "/sessions", probeMethod: "GET", section: 9,
    totalRoutes: 4, description: "CRUD sessions",
    routes: ["POST /sessions", "PUT /sessions/:id/end", "GET /sessions/:id", "GET /sessions"],
  },
  {
    group: "Reading", dev: "Dev 2", probePath: "/reading-state/test-probe", probeMethod: "GET", section: 10,
    totalRoutes: 2, description: "Reading state (PUT + GET)",
    routes: ["PUT /reading-state", "GET /reading-state/:summaryId"],
  },
  {
    group: "Annotations", dev: "Dev 2", probePath: "/annotations", probeMethod: "GET", section: 10,
    totalRoutes: 4, description: "CRUD annotations",
    routes: ["POST /annotations", "GET /annotations", "PUT /annotations/:id", "DELETE /annotations/:id"],
  },
  {
    group: "Progress", dev: "Dev 5", probePath: "/progress/stats", probeMethod: "GET", section: 11,
    totalRoutes: 6, description: "Dashboard progress views",
    routes: ["GET /progress/course/:id", "GET /progress/topic/:id", "GET /progress/keyword/:id", "GET /progress/stats", "GET /progress/daily", "GET /progress/bkt-states"],
  },
  {
    group: "Study Plans", dev: "Dev 5", probePath: "/study-plans", probeMethod: "GET", section: 12,
    totalRoutes: 9, description: "Smart study + plans + tasks",
    routes: ["POST /smart-study/generate", "POST /study-plans", "GET /study-plans", "GET /study-plans/:id", "PUT /study-plans/:id", "DELETE /study-plans/:id", "POST /study-plans/:id/recalculate", "GET /study-plans/:id/tasks", "PUT /study-plan-tasks/:id/complete"],
  },
  {
    group: "AI", dev: "Dev 6", probePath: "/ai/generate", probeMethod: "POST", section: 13,
    totalRoutes: 5, description: "AI generation + chat + popup",
    routes: ["POST /ai/generate", "POST /ai/generate/approve", "POST /ai/chat", "GET /ai/chat/:keywordId", "GET /keyword-popup/:keywordId"],
  },
  {
    group: "Content Batch", dev: "Dev 1", probePath: "/content/batch-status", probeMethod: "PUT", section: 15,
    totalRoutes: 1, description: "Batch status update",
    routes: ["PUT /content/batch-status"],
  },
  {
    group: "3D Models", dev: "Dev 7", probePath: "/models3d", probeMethod: "GET", section: 17,
    totalRoutes: 7, description: "Model3D CRUD + GLB upload + signed URLs",
    routes: ["POST /models3d", "POST /models3d/:id/upload", "POST /models3d/:id/thumbnail", "GET /models3d", "GET /models3d/:id", "PUT /models3d/:id", "DELETE /models3d/:id"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DEV DELIVERABLES — Dev-to-expected-deliverables mapping
// ══════════════════════════════════════════════════════════════════════════════

export const DEV_DELIVERABLES: DevDeliverables[] = [
  {
    dev: "Dev 1", label: "Admin/Content", oleada: "Oleada 2-3",
    kvPrimaries: ["course", "semester", "section", "topic", "summary", "chunk", "kw", "kw-inst", "subtopic", "conn"],
    kvIndices: ["idx:inst-courses", "idx:course-semesters", "idx:semester-sections", "idx:section-topics", "idx:topic-summaries", "idx:summary-chunks", "idx:summary-kw", "idx:kw-summaries", "idx:inst-kw", "idx:kw-subtopics", "idx:kw-conn"],
    routeGroups: ["Institutions", "Courses", "Semesters", "Sections", "Topics", "Summaries", "Keywords", "SubTopics", "Connections", "Content Batch"],
  },
  {
    dev: "Dev 2", label: "Reading/Summaries", oleada: "Oleada 3",
    kvPrimaries: ["reading", "annotation"],
    kvIndices: ["idx:student-annotations", "idx:student-reading"],
    routeGroups: ["Reading", "Annotations"],
  },
  {
    dev: "Dev 3", label: "Flashcards", oleada: "Oleada 3",
    kvPrimaries: ["fc"],
    kvIndices: ["idx:summary-fc", "idx:kw-fc", "idx:student-fc"],
    routeGroups: ["Flashcards"],
  },
  {
    dev: "Dev 4", label: "Quiz", oleada: "Oleada 4",
    kvPrimaries: ["quiz"],
    kvIndices: ["idx:summary-quiz", "idx:kw-quiz", "idx:student-quiz"],
    routeGroups: ["Quiz"],
  },
  {
    dev: "Dev 5", label: "Dashboard/Study", oleada: "Oleada 4",
    kvPrimaries: ["plan", "plan-task", "stats"],
    kvIndices: ["idx:student-plans", "idx:plan-tasks"],
    routeGroups: ["Progress", "Study Plans"],
  },
  {
    dev: "Dev 6", label: "Auth/AI", oleada: "Oleada 1-2",
    kvPrimaries: ["user", "inst", "membership", "chat", "ai-draft"],
    kvIndices: ["idx:inst-members", "idx:user-insts"],
    routeGroups: ["Auth", "AI"],
  },
  {
    dev: "Dev 3-5", label: "Shared (Learning)", oleada: "Oleada 3-4",
    kvPrimaries: ["bkt", "fsrs", "review", "session", "daily"],
    kvIndices: ["idx:student-kw-bkt", "idx:student-bkt", "idx:due", "idx:student-fsrs", "idx:session-reviews", "idx:student-sessions", "idx:student-course-sessions"],
    routeGroups: ["Reviews", "Sessions"],
  },
  {
    dev: "Dev 7", label: "3D Models", oleada: "Oleada 3",
    kvPrimaries: ["model3d"],
    kvIndices: ["idx:summary-model3d", "idx:topic-model3d", "idx:kw-model3d"],
    routeGroups: ["3D Models"],
  },
  {
    dev: "Section 7", label: "Canvas/Curriculum", oleada: "Oleada 4",
    kvPrimaries: ["resumo-blocks", "curriculum"],
    kvIndices: ["idx:course-resumo-blocks"],
    routeGroups: ["Canvas Blocks", "Curriculum"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// OLEADA TRACKING — What should be deployed per wave
// ══════════════════════════════════════════════════════════════════════════════

export const OLEADAS: OleadaDefinition[] = [
  {
    id: 1, name: "Oleada 1", status: "done",
    description: "Auth base — signup, signin, signout, me + user/inst/membership en KV",
    items: [
      { type: "route", key: "Auth", dev: "Dev 6", label: "Auth (signup/signin/signout/me)" },
      { type: "kv-primary", key: "user", dev: "Dev 6", label: "user:{userId}" },
      { type: "kv-primary", key: "inst", dev: "Dev 6", label: "inst:{instId}" },
      { type: "kv-primary", key: "membership", dev: "Dev 6", label: "membership:{instId}:{userId}" },
      { type: "kv-index", key: "idx:inst-members", dev: "Dev 6", label: "idx:inst-members" },
      { type: "kv-index", key: "idx:user-insts", dev: "Dev 6", label: "idx:user-insts" },
    ],
  },
  {
    id: 2, name: "Oleada 2", status: "in-progress",
    description: "Content CRUD completo — Institutions, Courses, Semesters, Sections, Topics, Summaries, Keywords, SubTopics, Connections + Batch Status",
    items: [
      { type: "route", key: "Institutions", dev: "Dev 1", label: "Institutions CRUD" },
      { type: "route", key: "Courses", dev: "Dev 1", label: "Courses CRUD" },
      { type: "route", key: "Semesters", dev: "Dev 1", label: "Semesters CRUD" },
      { type: "route", key: "Sections", dev: "Dev 1", label: "Sections CRUD" },
      { type: "route", key: "Topics", dev: "Dev 1", label: "Topics CRUD + full view" },
      { type: "route", key: "Summaries", dev: "Dev 1+2", label: "Summaries CRUD + chunks" },
      { type: "route", key: "Keywords", dev: "Dev 1", label: "Keywords CRUD" },
      { type: "route", key: "SubTopics", dev: "Dev 1", label: "SubTopics CRUD" },
      { type: "route", key: "Connections", dev: "Dev 1", label: "Connections CRUD" },
      { type: "route", key: "Content Batch", dev: "Dev 1", label: "PUT /content/batch-status" },
      { type: "kv-primary", key: "course", dev: "Dev 1", label: "course:{courseId}" },
      { type: "kv-primary", key: "semester", dev: "Dev 1", label: "semester:{semesterId}" },
      { type: "kv-primary", key: "section", dev: "Dev 1", label: "section:{sectionId}" },
      { type: "kv-primary", key: "topic", dev: "Dev 1", label: "topic:{topicId}" },
      { type: "kv-primary", key: "summary", dev: "Dev 1+2", label: "summary:{summaryId}" },
      { type: "kv-primary", key: "chunk", dev: "Dev 1+2", label: "chunk:{chunkId}" },
      { type: "kv-primary", key: "kw", dev: "Dev 1", label: "kw:{keywordId}" },
      { type: "kv-primary", key: "kw-inst", dev: "Dev 1", label: "kw-inst:{instanceId}" },
      { type: "kv-primary", key: "subtopic", dev: "Dev 1", label: "subtopic:{subtopicId}" },
      { type: "kv-primary", key: "conn", dev: "Dev 1", label: "conn:{connectionId}" },
      { type: "kv-index", key: "idx:inst-courses", dev: "Dev 1", label: "idx:inst-courses" },
      { type: "kv-index", key: "idx:course-semesters", dev: "Dev 1", label: "idx:course-semesters" },
      { type: "kv-index", key: "idx:semester-sections", dev: "Dev 1", label: "idx:semester-sections" },
      { type: "kv-index", key: "idx:section-topics", dev: "Dev 1", label: "idx:section-topics" },
      { type: "kv-index", key: "idx:topic-summaries", dev: "Dev 1+2", label: "idx:topic-summaries" },
      { type: "kv-index", key: "idx:summary-chunks", dev: "Dev 1+2", label: "idx:summary-chunks" },
      { type: "kv-index", key: "idx:summary-kw", dev: "Dev 1", label: "idx:summary-kw" },
      { type: "kv-index", key: "idx:kw-summaries", dev: "Dev 1", label: "idx:kw-summaries" },
      { type: "kv-index", key: "idx:inst-kw", dev: "Dev 1", label: "idx:inst-kw" },
      { type: "kv-index", key: "idx:kw-subtopics", dev: "Dev 1", label: "idx:kw-subtopics" },
      { type: "kv-index", key: "idx:kw-conn", dev: "Dev 1", label: "idx:kw-conn" },
    ],
  },
  {
    id: 3, name: "Oleada 3", status: "in-progress",
    description: "Lectura + Flashcards + Learning engine + 3D Models — Reading state, Annotations, FC CRUD, Reviews, Sessions, Model3D",
    items: [
      { type: "route", key: "Reading", dev: "Dev 2", label: "Reading state (PUT+GET)" },
      { type: "route", key: "Annotations", dev: "Dev 2", label: "Annotations CRUD" },
      { type: "route", key: "Flashcards", dev: "Dev 3", label: "Flashcards CRUD + due" },
      { type: "route", key: "Reviews", dev: "Dev 3+4", label: "POST /reviews (BKT+FSRS)" },
      { type: "route", key: "Sessions", dev: "Dev 3-5", label: "Sessions CRUD" },
      { type: "kv-primary", key: "reading", dev: "Dev 2", label: "reading:{studentId}:{summaryId}" },
      { type: "kv-primary", key: "annotation", dev: "Dev 2", label: "annotation:{annotationId}" },
      { type: "kv-primary", key: "fc", dev: "Dev 3", label: "fc:{cardId}" },
      { type: "kv-primary", key: "bkt", dev: "Dev 3-5", label: "bkt:{studentId}:{subtopicId}" },
      { type: "kv-primary", key: "fsrs", dev: "Dev 3-5", label: "fsrs:{studentId}:{cardId}" },
      { type: "kv-primary", key: "review", dev: "Dev 3-5", label: "review:{reviewId}" },
      { type: "kv-primary", key: "session", dev: "Dev 3-5", label: "session:{sessionId}" },
      { type: "kv-primary", key: "daily", dev: "Dev 3-5", label: "daily:{studentId}:{date}" },
      { type: "kv-index", key: "idx:student-annotations", dev: "Dev 2", label: "idx:student-annotations" },
      { type: "kv-index", key: "idx:student-reading", dev: "Dev 2", label: "idx:student-reading" },
      { type: "kv-index", key: "idx:summary-fc", dev: "Dev 3", label: "idx:summary-fc" },
      { type: "kv-index", key: "idx:kw-fc", dev: "Dev 3", label: "idx:kw-fc" },
      { type: "kv-index", key: "idx:student-fc", dev: "Dev 3", label: "idx:student-fc" },
      { type: "kv-index", key: "idx:student-kw-bkt", dev: "Dev 3-5", label: "idx:student-kw-bkt" },
      { type: "kv-index", key: "idx:student-bkt", dev: "Dev 3-5", label: "idx:student-bkt" },
      { type: "kv-index", key: "idx:due", dev: "Dev 3-5", label: "idx:due" },
      { type: "kv-index", key: "idx:student-fsrs", dev: "Dev 3-5", label: "idx:student-fsrs" },
      { type: "kv-index", key: "idx:session-reviews", dev: "Dev 3-5", label: "idx:session-reviews" },
      { type: "kv-index", key: "idx:student-sessions", dev: "Dev 3-5", label: "idx:student-sessions" },
      { type: "kv-index", key: "idx:student-course-sessions", dev: "Dev 3-5", label: "idx:student-course-sessions" },
      { type: "route", key: "3D Models", dev: "Dev 7", label: "Model3D CRUD + upload + signed URLs (7 rutas)" },
      { type: "kv-primary", key: "model3d", dev: "Dev 7", label: "model3d:{modelId}" },
      { type: "kv-index", key: "idx:summary-model3d", dev: "Dev 7", label: "idx:summary-model3d" },
      { type: "kv-index", key: "idx:topic-model3d", dev: "Dev 7", label: "idx:topic-model3d" },
      { type: "kv-index", key: "idx:kw-model3d", dev: "Dev 7", label: "idx:kw-model3d" },
    ],
  },
  {
    id: 4, name: "Oleada 4", status: "pending",
    description: "Quiz + Dashboard + Study Plans + AI + Canvas Blocks + Curriculum (Section 7)",
    items: [
      { type: "route", key: "Quiz", dev: "Dev 4", label: "Quiz CRUD + evaluate" },
      { type: "route", key: "Progress", dev: "Dev 5", label: "Progress dashboard views" },
      { type: "route", key: "Study Plans", dev: "Dev 5", label: "Study plans + smart study" },
      { type: "route", key: "AI", dev: "Dev 6", label: "AI generate/approve/chat/popup" },
      { type: "kv-primary", key: "quiz", dev: "Dev 4", label: "quiz:{questionId}" },
      { type: "kv-primary", key: "plan", dev: "Dev 5", label: "plan:{planId}" },
      { type: "kv-primary", key: "plan-task", dev: "Dev 5", label: "plan-task:{taskId}" },
      { type: "kv-primary", key: "stats", dev: "Dev 5", label: "stats:{studentId}" },
      { type: "kv-primary", key: "chat", dev: "Dev 6", label: "chat:{studentId}:{keywordId}" },
      { type: "kv-primary", key: "ai-draft", dev: "Dev 6", label: "ai-draft:{summaryId}" },
      { type: "kv-index", key: "idx:summary-quiz", dev: "Dev 4", label: "idx:summary-quiz" },
      { type: "kv-index", key: "idx:kw-quiz", dev: "Dev 4", label: "idx:kw-quiz" },
      { type: "kv-index", key: "idx:student-quiz", dev: "Dev 4", label: "idx:student-quiz" },
      { type: "kv-index", key: "idx:student-plans", dev: "Dev 5", label: "idx:student-plans" },
      { type: "kv-index", key: "idx:plan-tasks", dev: "Dev 5", label: "idx:plan-tasks" },
      // Section 7: Canvas Blocks + Curriculum (commit 8974f4b)
      { type: "route", key: "Canvas Blocks", dev: "Section 7", label: "Canvas Blocks (PUT+GET+GET all)" },
      { type: "route", key: "Curriculum", dev: "Section 7", label: "Curriculum (POST+GET)" },
      { type: "kv-primary", key: "resumo-blocks", dev: "Section 7", label: "resumo-blocks:{courseId}:{topicId}" },
      { type: "kv-primary", key: "curriculum", dev: "Section 7", label: "curriculum:{courseId}" },
      { type: "kv-index", key: "idx:course-resumo-blocks", dev: "Section 7", label: "idx:course-resumo-blocks" },
    ],
  },
];
