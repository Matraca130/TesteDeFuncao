// ============================================================
// Axon v4.4 — Hono Server (FIXED: KV keys aligned with kv-keys.ts)
// ============================================================
//
// FIXES APPLIED:
//   1. ALL key patterns now match kv-keys.ts EXACTLY
//   2. membership:${instId}:${userId} (inst-first, NOT user-first)
//   3. Index keys use idx: prefix (idx:inst-courses, idx:slug-inst, etc.)
//   4. Keyword primary key is kw:${id} (NOT keyword:${id})
//   5. Triple-write on membership: primary + idx:inst-members + idx:user-insts
//   6. Indices store IDs (not full objects) matching production behavior
// ============================================================
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

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

// ── Canonical KV Key Functions (mirrors kv-keys.ts) ─────────
const K = {
  user: (id: string) => `user:${id}`,
  inst: (id: string) => `inst:${id}`,
  member: (instId: string, userId: string) => `membership:${instId}:${userId}`,
  course: (id: string) => `course:${id}`,
  semester: (id: string) => `semester:${id}`,
  section: (id: string) => `section:${id}`,
  topic: (id: string) => `topic:${id}`,
  summary: (id: string) => `summary:${id}`,
  kw: (id: string) => `kw:${id}`,
  idxSlugInst: (slug: string) => `idx:slug-inst:${slug}`,
  idxInstMembers: (instId: string, userId: string) => `idx:inst-members:${instId}:${userId}`,
  idxUserInsts: (userId: string, instId: string) => `idx:user-insts:${userId}:${instId}`,
  idxInstCourses: (instId: string, courseId: string) => `idx:inst-courses:${instId}:${courseId}`,
  idxCourseSemesters: (courseId: string, semId: string) => `idx:course-semesters:${courseId}:${semId}`,
  idxSemesterSections: (semId: string, secId: string) => `idx:semester-sections:${semId}:${secId}`,
  idxSectionTopics: (secId: string, topicId: string) => `idx:section-topics:${secId}:${topicId}`,
  idxTopicSummaries: (topicId: string, summaryId: string) => `idx:topic-summaries:${topicId}:${summaryId}`,
  idxInstKw: (instId: string, kwId: string) => `idx:inst-kw:${instId}:${kwId}`,
  PFX: {
    INST: "inst:",
    IDX_USER_INSTS: "idx:user-insts:",
    IDX_INST_MEMBERS: "idx:inst-members:",
    IDX_INST_COURSES: "idx:inst-courses:",
    IDX_COURSE_SEMESTERS: "idx:course-semesters:",
    IDX_SEMESTER_SECTIONS: "idx:semester-sections:",
    IDX_SECTION_TOPICS: "idx:section-topics:",
    IDX_TOPIC_SUMMARIES: "idx:topic-summaries:",
    IDX_INST_KW: "idx:inst-kw:",
  },
};

// ── Helpers ────────────────────────────────────────────────────────
const PREFIX = "/make-server-ae4c3d80";

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function uuid(): string { return crypto.randomUUID(); }

async function getUserId(c: any): Promise<string | null> {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return null;
    const sb = supabaseAdmin();
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user?.id) return null;
    return user.id;
  } catch (err) {
    console.log("[Server] getUserId error:", err);
    return null;
  }
}

async function getUserFromToken(c: any): Promise<{ id: string; email: string; name: string; avatar_url: string | null } | null> {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return null;
    const sb = supabaseAdmin();
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user?.id) return null;
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.email?.split("@")[0] || "",
      avatar_url: user.user_metadata?.avatar_url || null,
    };
  } catch (err) {
    console.log("[Server] getUserFromToken error:", err);
    return null;
  }
}

async function getEnrichedMemberships(userId: string): Promise<any[]> {
  const idxEntries = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
  const memberships = [];
  for (const instId of idxEntries) {
    if (typeof instId !== "string") continue;
    const m = await kv.get(K.member(instId, userId));
    if (!m) continue;
    const institution = await kv.get(K.inst(instId));
    memberships.push({ ...m, institution: institution || null });
  }
  return memberships;
}

async function createMembership(userId: string, instId: string, role: string): Promise<any> {
  const membershipId = uuid();
  const membership = {
    id: membershipId, user_id: userId, institution_id: instId,
    role, created_at: new Date().toISOString(),
  };
  await kv.set(K.member(instId, userId), membership);
  await kv.set(K.idxInstMembers(instId, userId), userId);
  await kv.set(K.idxUserInsts(userId, instId), instId);
  console.log(`[Server] Created membership: user=${userId}, inst=${instId}, role=${role}`);
  return membership;
}

// ── Health ───────────────────────────────────────────────────────
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok", version: "4.4", prefix: PREFIX, keys_aligned: "kv-keys.ts" });
});

// ── POST /auth/signup ─────────────────────────────────────────
app.post(`${PREFIX}/auth/signup`, async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, institution_id, institutionId, role } = body;
    const instId = institution_id || institutionId;
    if (!email || !password || !name) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "email, password and name are required" } }, 400);
    }
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.admin.createUser({
      email, password, user_metadata: { name }, email_confirm: true,
    });
    if (error) {
      console.log(`[Server] /auth/signup error for ${email}: ${error.message}`);
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: error.message } }, 400);
    }
    const userId = data.user?.id;
    if (!userId) return c.json({ success: false, error: { code: "SERVER_ERROR", message: "No user ID returned" } }, 500);
    const user = { id: userId, email, name, avatar_url: null, is_super_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    let memberships: any[] = [];
    if (instId) {
      const inst = await kv.get(K.inst(instId));
      const memberRole = role || "student";
      const membership = await createMembership(userId, instId, memberRole);
      memberships = [{ ...membership, institution: inst || null }];
    }
    const { data: signInData } = await sb.auth.signInWithPassword({ email, password });
    console.log(`[Server] /auth/signup success for ${email} (${userId})`);
    return c.json({ success: true, data: { user, access_token: signInData?.session?.access_token || "", memberships } });
  } catch (err) {
    console.log("[Server] /auth/signup unexpected error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `Signup error: ${err}` } }, 500);
  }
});

// ── GET /auth/me ────────────────────────────────────────────
app.get(`${PREFIX}/auth/me`, async (c) => {
  const user = await getUserFromToken(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, 401);
  try {
    const memberships = await getEnrichedMemberships(user.id);
    console.log(`[Server] /auth/me: ${user.email}, ${memberships.length} memberships`);
    return c.json({ success: true, data: { user: { ...user, is_super_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, memberships } });
  } catch (err) {
    console.log("[Server] /auth/me error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

app.post(`${PREFIX}/auth/signout`, (c) => c.json({ success: true }));

app.post(`${PREFIX}/auth/signin`, async (c) => {
  try {
    const { email, password } = await c.req.json();
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return c.json({ success: false, error: { code: "AUTH_ERROR", message: error.message } }, 401);
    const userId = data.user?.id;
    if (!userId) return c.json({ success: false, error: { code: "SERVER_ERROR", message: "No user ID" } }, 500);
    const memberships = await getEnrichedMemberships(userId);
    const user = { id: userId, email: data.user.email || "", name: data.user.user_metadata?.name || email.split("@")[0], avatar_url: data.user.user_metadata?.avatar_url || null, is_super_admin: false, created_at: data.user.created_at || new Date().toISOString(), updated_at: new Date().toISOString() };
    return c.json({ success: true, data: { user, access_token: data.session?.access_token || "", memberships } });
  } catch (err) {
    console.log("[Server] /auth/signin error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── Institutions ───────────────────────────────────────────
app.get(`${PREFIX}/institutions`, async (c) => {
  try {
    const institutions = await kv.getByPrefix(K.PFX.INST);
    const filtered = institutions.filter((i: any) => i && typeof i === "object" && i.id);
    return c.json({ success: true, data: filtered });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.get(`${PREFIX}/institutions/by-slug/:slug`, async (c) => {
  try {
    const slug = c.req.param("slug");
    const instId = await kv.get(K.idxSlugInst(slug));
    if (instId && typeof instId === "string") {
      const institution = await kv.get(K.inst(instId));
      if (institution) return c.json({ success: true, data: institution });
    }
    const allInsts = await kv.getByPrefix(K.PFX.INST);
    const institution = allInsts.find((i: any) => i && typeof i === "object" && i.slug === slug);
    if (!institution) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Instituicao nao encontrada" } }, 404);
    if ((institution as any).id) { try { await kv.set(K.idxSlugInst(slug), (institution as any).id); } catch {} }
    return c.json({ success: true, data: institution });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/institutions`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, slug, logo_url, plan } = await c.req.json();
    if (!name || !slug) return c.json({ success: false, error: { code: "VALIDATION", message: "name and slug required" } }, 400);
    const existing = await kv.get(K.idxSlugInst(slug));
    if (existing) return c.json({ success: false, error: { code: "CONFLICT", message: "Slug already in use" } }, 409);
    const id = uuid();
    const institution = { id, name, slug, logo_url: logo_url || null, plan: plan || "free", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await kv.set(K.inst(id), institution);
    await kv.set(K.idxSlugInst(slug), id);
    await createMembership(userId, id, "owner");
    console.log(`[Server] Created institution: ${name} (${slug}), owner=${userId}`);
    return c.json({ success: true, data: institution });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Courses ────────────────────────────────────────────────
app.get(`${PREFIX}/courses`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const allCourses: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const courseIds = await kv.getByPrefix(`${K.PFX.IDX_INST_COURSES}${instId}:`);
      for (const courseId of courseIds) {
        if (typeof courseId !== "string") continue;
        const course = await kv.get(K.course(courseId));
        if (course) allCourses.push(course);
      }
    }
    return c.json({ success: true, data: allCourses, courses: allCourses });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/courses`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, description, institution_id, color } = await c.req.json();
    if (!name || !institution_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and institution_id required" } }, 400);
    const id = uuid();
    const course = { id, name, description: description || "", institution_id, color: color || "#0ea5e9", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await kv.set(K.course(id), course);
    await kv.set(K.idxInstCourses(institution_id, id), id);
    return c.json({ success: true, data: course, course });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.delete(`${PREFIX}/courses/:id`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const id = c.req.param("id");
    const course: any = await kv.get(K.course(id));
    if (!course) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Course not found" } }, 404);
    await kv.del(K.course(id));
    await kv.del(K.idxInstCourses(course.institution_id, id));
    return c.json({ success: true });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Semesters ──────────────────────────────────────────────
app.get(`${PREFIX}/semesters`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const all: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const courseIds = await kv.getByPrefix(`${K.PFX.IDX_INST_COURSES}${instId}:`);
      for (const courseId of courseIds) {
        if (typeof courseId !== "string") continue;
        const semIds = await kv.getByPrefix(`${K.PFX.IDX_COURSE_SEMESTERS}${courseId}:`);
        for (const semId of semIds) {
          if (typeof semId !== "string") continue;
          const sem = await kv.get(K.semester(semId));
          if (sem) all.push(sem);
        }
      }
    }
    return c.json({ success: true, data: all, semesters: all });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/semesters`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, course_id, order_index } = await c.req.json();
    if (!name || !course_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and course_id required" } }, 400);
    const id = uuid();
    const semester = { id, name, course_id, order_index: order_index || 0, created_at: new Date().toISOString() };
    await kv.set(K.semester(id), semester);
    await kv.set(K.idxCourseSemesters(course_id, id), id);
    return c.json({ success: true, data: semester, semester });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Sections ───────────────────────────────────────────────
app.get(`${PREFIX}/sections`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const all: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const courseIds = await kv.getByPrefix(`${K.PFX.IDX_INST_COURSES}${instId}:`);
      for (const courseId of courseIds) {
        if (typeof courseId !== "string") continue;
        const semIds = await kv.getByPrefix(`${K.PFX.IDX_COURSE_SEMESTERS}${courseId}:`);
        for (const semId of semIds) {
          if (typeof semId !== "string") continue;
          const secIds = await kv.getByPrefix(`${K.PFX.IDX_SEMESTER_SECTIONS}${semId}:`);
          for (const secId of secIds) {
            if (typeof secId !== "string") continue;
            const sec = await kv.get(K.section(secId));
            if (sec) all.push(sec);
          }
        }
      }
    }
    return c.json({ success: true, data: all, sections: all });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/sections`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, semester_id, order_index } = await c.req.json();
    if (!name || !semester_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and semester_id required" } }, 400);
    const id = uuid();
    const section = { id, name, semester_id, order_index: order_index || 0, created_at: new Date().toISOString() };
    await kv.set(K.section(id), section);
    await kv.set(K.idxSemesterSections(semester_id, id), id);
    return c.json({ success: true, data: section, section });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Topics ─────────────────────────────────────────────────
app.get(`${PREFIX}/topics`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const all: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const courseIds = await kv.getByPrefix(`${K.PFX.IDX_INST_COURSES}${instId}:`);
      for (const courseId of courseIds) {
        if (typeof courseId !== "string") continue;
        const semIds = await kv.getByPrefix(`${K.PFX.IDX_COURSE_SEMESTERS}${courseId}:`);
        for (const semId of semIds) {
          if (typeof semId !== "string") continue;
          const secIds = await kv.getByPrefix(`${K.PFX.IDX_SEMESTER_SECTIONS}${semId}:`);
          for (const secId of secIds) {
            if (typeof secId !== "string") continue;
            const topicIds = await kv.getByPrefix(`${K.PFX.IDX_SECTION_TOPICS}${secId}:`);
            for (const topicId of topicIds) {
              if (typeof topicId !== "string") continue;
              const topic = await kv.get(K.topic(topicId));
              if (topic) all.push(topic);
            }
          }
        }
      }
    }
    return c.json({ success: true, data: all, topics: all });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/topics`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { name, section_id, order_index } = await c.req.json();
    if (!name || !section_id) return c.json({ success: false, error: { code: "VALIDATION", message: "name and section_id required" } }, 400);
    const id = uuid();
    const topic = { id, name, section_id, order_index: order_index || 0, created_at: new Date().toISOString() };
    await kv.set(K.topic(id), topic);
    await kv.set(K.idxSectionTopics(section_id, id), id);
    return c.json({ success: true, data: topic, topic });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Summaries ──────────────────────────────────────────────
app.get(`${PREFIX}/summaries`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const all: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const courseIds = await kv.getByPrefix(`${K.PFX.IDX_INST_COURSES}${instId}:`);
      for (const courseId of courseIds) {
        if (typeof courseId !== "string") continue;
        const semIds = await kv.getByPrefix(`${K.PFX.IDX_COURSE_SEMESTERS}${courseId}:`);
        for (const semId of semIds) {
          if (typeof semId !== "string") continue;
          const secIds = await kv.getByPrefix(`${K.PFX.IDX_SEMESTER_SECTIONS}${semId}:`);
          for (const secId of secIds) {
            if (typeof secId !== "string") continue;
            const topicIds = await kv.getByPrefix(`${K.PFX.IDX_SECTION_TOPICS}${secId}:`);
            for (const topicId of topicIds) {
              if (typeof topicId !== "string") continue;
              const sumIds = await kv.getByPrefix(`${K.PFX.IDX_TOPIC_SUMMARIES}${topicId}:`);
              for (const sumId of sumIds) {
                if (typeof sumId !== "string") continue;
                const summary = await kv.get(K.summary(sumId));
                if (summary) all.push(summary);
              }
            }
          }
        }
      }
    }
    return c.json({ success: true, data: all, summaries: all });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/summaries`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { title, content, topic_id, status } = await c.req.json();
    if (!title || !content || !topic_id) return c.json({ success: false, error: { code: "VALIDATION", message: "title, content, topic_id required" } }, 400);
    const id = uuid();
    const summary = { id, title, content, content_markdown: content, topic_id, status: status || "draft", author_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await kv.set(K.summary(id), summary);
    await kv.set(K.idxTopicSummaries(topic_id, id), id);
    return c.json({ success: true, data: summary, summary });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.put(`${PREFIX}/summaries/:id/status`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const summary: any = await kv.get(K.summary(id));
    if (!summary) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Summary not found" } }, 404);
    const updated = { ...summary, status, updated_at: new Date().toISOString() };
    await kv.set(K.summary(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Keywords ───────────────────────────────────────────────
app.get(`${PREFIX}/keywords`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instIds = await kv.getByPrefix(`${K.PFX.IDX_USER_INSTS}${userId}:`);
    const all: any[] = [];
    for (const instId of instIds) {
      if (typeof instId !== "string") continue;
      const kwIds = await kv.getByPrefix(`${K.PFX.IDX_INST_KW}${instId}:`);
      for (const kwId of kwIds) {
        if (typeof kwId !== "string") continue;
        const keyword = await kv.get(K.kw(kwId));
        if (keyword) all.push(keyword);
      }
    }
    return c.json({ success: true, data: all, keywords: all });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/keywords`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { term, definition, topic_id, institution_id } = await c.req.json();
    if (!term) return c.json({ success: false, error: { code: "VALIDATION", message: "term is required" } }, 400);
    const id = uuid();
    const keyword = { id, term, definition: definition || "", topic_id: topic_id || null, institution_id: institution_id || null, priority: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await kv.set(K.kw(id), keyword);
    if (institution_id) await kv.set(K.idxInstKw(institution_id, id), id);
    return c.json({ success: true, data: keyword, keyword });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Members management ─────────────────────────────────────
app.get(`${PREFIX}/members/:institutionId`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instId = c.req.param("institutionId");
    const memberUserIds = await kv.getByPrefix(`${K.PFX.IDX_INST_MEMBERS}${instId}:`);
    const members: any[] = [];
    for (const mUserId of memberUserIds) {
      if (typeof mUserId !== "string") continue;
      const membership = await kv.get(K.member(instId, mUserId));
      if (membership) members.push(membership);
    }
    return c.json({ success: true, data: members, members });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

app.post(`${PREFIX}/members`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { user_id, institution_id, role } = await c.req.json();
    if (!user_id || !institution_id || !role) return c.json({ success: false, error: { code: "VALIDATION", message: "user_id, institution_id, role required" } }, 400);
    const membership = await createMembership(user_id, institution_id, role);
    return c.json({ success: true, data: membership });
  } catch (err) { return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500); }
});

// ── Seed ───────────────────────────────────────────────────
app.post(`${PREFIX}/seed`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instId = uuid();
    const institution = { id: instId, name: "Faculdade de Medicina Demo", slug: "medicina-demo", logo_url: null, plan: "premium", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await kv.set(K.inst(instId), institution);
    await kv.set(K.idxSlugInst("medicina-demo"), instId);
    await createMembership(userId, instId, "owner");
    const courseId = uuid();
    const course = { id: courseId, name: "Medicina Geral", description: "Curso de medicina geral", institution_id: instId, color: "#0ea5e9", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await kv.set(K.course(courseId), course);
    await kv.set(K.idxInstCourses(instId, courseId), courseId);
    const sem1Id = uuid();
    await kv.set(K.semester(sem1Id), { id: sem1Id, name: "1o Semestre", course_id: courseId, order_index: 0, created_at: new Date().toISOString() });
    await kv.set(K.idxCourseSemesters(courseId, sem1Id), sem1Id);
    const secId = uuid();
    await kv.set(K.section(secId), { id: secId, name: "Anatomia Humana", semester_id: sem1Id, order_index: 0, created_at: new Date().toISOString() });
    await kv.set(K.idxSemesterSections(sem1Id, secId), secId);
    const topicNames = ["Sistema Cardiovascular", "Sistema Respiratorio", "Sistema Nervoso"];
    const topicIds: string[] = [];
    for (let i = 0; i < topicNames.length; i++) {
      const tId = uuid();
      topicIds.push(tId);
      await kv.set(K.topic(tId), { id: tId, name: topicNames[i], section_id: secId, order_index: i, created_at: new Date().toISOString() });
      await kv.set(K.idxSectionTopics(secId, tId), tId);
    }
    const summaryData = [
      { title: "Anatomia do Coracao", content: "O coracao e um orgao muscular oco...", topic_id: topicIds[0], status: "approved" },
      { title: "Ciclo Cardiaco", content: "Sistole e diastole...", topic_id: topicIds[0], status: "pending" },
      { title: "Pulmoes e Trocas Gasosas", content: "Hematose nos alveolos...", topic_id: topicIds[1], status: "draft" },
    ];
    for (const sd of summaryData) {
      const sId = uuid();
      await kv.set(K.summary(sId), { id: sId, ...sd, content_markdown: sd.content, author_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      await kv.set(K.idxTopicSummaries(sd.topic_id, sId), sId);
    }
    const kwData = [{ term: "Sistole", def: "Contracao" }, { term: "Diastole", def: "Relaxamento" }, { term: "Hematose", def: "Troca gasosa" }, { term: "Sinapse", def: "Juncao neuronal" }];
    for (const kd of kwData) {
      const kId = uuid();
      await kv.set(K.kw(kId), { id: kId, term: kd.term, definition: kd.def, institution_id: instId, priority: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      await kv.set(K.idxInstKw(instId, kId), kId);
    }
    console.log("[Server] Seed data created with CANONICAL key patterns");
    return c.json({ success: true, data: institution });
  } catch (err) {
    console.log("[Server] Seed error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `Seed error: ${err}` } }, 500);
  }
});

Deno.serve(app.fetch);
