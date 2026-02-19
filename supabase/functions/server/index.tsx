// ============================================================
// Axon v4.4 — Hono Server (Dev 5 + Dev 6 Integration)
// Backend endpoints for auth, memberships, content CRUD
// All data stored in kv_store with prefixed keys
// Dev 6: Added /auth/me, /auth/signup compat endpoints for
//        updated frontend (AuthContext uses /auth/* paths)
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

// ── Helpers ────────────────────────────────────────────────────
const PREFIX = "/make-server-50277a39";

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function uuid(): string {
  return crypto.randomUUID();
}

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

// Dev 6: Helper to get full user info from token
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

// Dev 6: Helper to get enriched memberships for a user
async function getEnrichedMemberships(userId: string): Promise<any[]> {
  const raw = await kv.getByPrefix(`membership:${userId}:`);
  const memberships = [];
  for (const m of raw) {
    let institution = null;
    if (m.institution_id) {
      institution = await kv.get(`inst:${m.institution_id}`);
    }
    memberships.push({ ...m, institution });
  }
  return memberships;
}

// ── Health ─────────────────────────────────────────────────────
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ── Signup (legacy path — kept for backward compat) ────────────
app.post(`${PREFIX}/signup`, async (c) => {
  try {
    const { email, password, name, institutionId, role } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "Email, password e nome sao obrigatorios" }, 400);
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log("[Server] Signup createUser error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user?.id;
    if (!userId) {
      return c.json({ error: "Erro ao criar usuario - sem ID retornado" }, 500);
    }

    // If institutionId provided, create a membership
    if (institutionId) {
      const membershipId = uuid();
      const memberRole = role || "student";
      await kv.set(`membership:${userId}:${institutionId}`, {
        id: membershipId,
        user_id: userId,
        institution_id: institutionId,
        role: memberRole,
        created_at: new Date().toISOString(),
      });
      console.log(`[Server] Created membership: user=${userId}, inst=${institutionId}, role=${memberRole}`);
    }

    return c.json({ success: true, userId });
  } catch (err) {
    console.log("[Server] Signup unexpected error:", err);
    return c.json({ error: `Erro inesperado no signup: ${err}` }, 500);
  }
});

// ── Dev 6: POST /auth/signup (new format — matches modular server) ──
app.post(`${PREFIX}/auth/signup`, async (c) => {
  try {
    const body = await c.req.json();
    // Accept both field names for compatibility
    const { email, password, name, institution_id, institutionId, role } = body;
    const instId = institution_id || institutionId;

    if (!email || !password || !name) {
      return c.json(
        { success: false, error: { code: "VALIDATION", message: "email, password and name are required" } },
        400
      );
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });

    if (error) {
      console.log(`[Server] /auth/signup error for ${email}: ${error.message}`);
      return c.json(
        { success: false, error: { code: "AUTH_ERROR", message: error.message } },
        400
      );
    }

    const userId = data.user?.id;
    if (!userId) {
      return c.json(
        { success: false, error: { code: "SERVER_ERROR", message: "No user ID returned" } },
        500
      );
    }

    const user = {
      id: userId,
      email,
      name,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

    let memberships: any[] = [];

    if (instId) {
      const inst = await kv.get(`inst:${instId}`);
      const membershipId = uuid();
      const memberRole = role || "student";
      const membership = {
        id: membershipId,
        user_id: userId,
        institution_id: instId,
        role: memberRole,
        created_at: new Date().toISOString(),
      };
      await kv.set(`membership:${userId}:${instId}`, membership);
      memberships = [{ ...membership, institution: inst || null }];
      console.log(`[Server] /auth/signup: created ${memberRole} membership for ${email} in ${instId}`);
    }

    // Sign in to get access_token
    const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({ email, password });

    console.log(`[Server] /auth/signup success for ${email} (${userId})`);
    return c.json({
      success: true,
      data: {
        user,
        access_token: signInData?.session?.access_token || "",
        memberships,
      },
    });
  } catch (err) {
    console.log("[Server] /auth/signup unexpected error:", err);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Signup error: ${err}` } },
      500
    );
  }
});

// ── Memberships (legacy path — kept for backward compat) ──────
app.get(`${PREFIX}/memberships`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) {
    return c.json({ error: "Nao autorizado - falha ao obter usuario" }, 401);
  }

  try {
    const memberships = await getEnrichedMemberships(userId);
    return c.json({ memberships });
  } catch (err) {
    console.log("[Server] Memberships error:", err);
    return c.json({ error: `Erro ao buscar memberships: ${err}` }, 500);
  }
});

// ── Dev 6: GET /auth/me (new format — matches modular server) ──
app.get(`${PREFIX}/auth/me`, async (c) => {
  const user = await getUserFromToken(c);
  if (!user) {
    return c.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      401
    );
  }

  try {
    const memberships = await getEnrichedMemberships(user.id);
    console.log(`[Server] /auth/me: restored session for ${user.email}, ${memberships.length} memberships`);
    return c.json({
      success: true,
      data: { user, memberships },
    });
  } catch (err) {
    console.log("[Server] /auth/me error:", err);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Session restore error: ${err}` } },
      500
    );
  }
});

// ── Institutions ───────────────────────────────────────────────
app.get(`${PREFIX}/institutions`, async (c) => {
  try {
    const institutions = await kv.getByPrefix("inst:");
    // Filter out slug index entries (they're just IDs, not objects)
    const filtered = institutions.filter((i: any) => i && typeof i === "object" && i.id);
    return c.json({ institutions: filtered });
  } catch (err) {
    console.log("[Server] List institutions error:", err);
    return c.json({ error: `Erro ao listar instituicoes: ${err}` }, 500);
  }
});

app.get(`${PREFIX}/institutions/by-slug/:slug`, async (c) => {
  try {
    const slug = c.req.param("slug");

    // Strategy 1: Direct index lookup
    const instId = await kv.get(`inst:slug:${slug}`);
    if (instId) {
      const institution = await kv.get(`inst:${instId}`);
      if (institution) {
        // Dev 6: Return in BOTH formats for frontend compat
        // Frontend reads data.data || data.institution
        return c.json({ success: true, data: institution, institution });
      }
    }

    // Strategy 2: Fallback scan
    const allInsts = await kv.getByPrefix("inst:");
    const institution = allInsts.find((i: any) => i && typeof i === "object" && i.slug === slug);
    if (!institution) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: "Instituicao nao encontrada" } }, 404);
    }

    // Cache for next time
    if ((institution as any).id) {
      try { await kv.set(`inst:slug:${slug}`, (institution as any).id); } catch { /* non-critical */ }
    }

    return c.json({ success: true, data: institution, institution });
  } catch (err) {
    console.log("[Server] Get institution by slug error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `Erro ao buscar instituicao: ${err}` } }, 500);
  }
});

app.post(`${PREFIX}/institutions`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { name, slug, logo_url, plan } = await c.req.json();
    if (!name || !slug) {
      return c.json({ error: "Nome e slug sao obrigatorios" }, 400);
    }

    // Check slug uniqueness
    const existing = await kv.get(`inst:slug:${slug}`);
    if (existing) {
      return c.json({ error: "Slug ja em uso" }, 409);
    }

    const id = uuid();
    const institution = { id, name, slug, logo_url: logo_url || null, plan: plan || "free", created_at: new Date().toISOString() };
    await kv.set(`inst:${id}`, institution);
    await kv.set(`inst:slug:${slug}`, id);

    // Create owner membership for creator
    const membershipId = uuid();
    await kv.set(`membership:${userId}:${id}`, {
      id: membershipId,
      user_id: userId,
      institution_id: id,
      role: "owner",
      created_at: new Date().toISOString(),
    });

    console.log(`[Server] Created institution: ${name} (${slug}), owner=${userId}`);
    return c.json({ institution });
  } catch (err) {
    console.log("[Server] Create institution error:", err);
    return c.json({ error: `Erro ao criar instituicao: ${err}` }, 500);
  }
});

// ── Generic CRUD helpers for content entities ──────────────────
// Key patterns:
//   course:{id}  |  courses:inst:{instId}:{id}
//   semester:{id} | semesters:course:{courseId}:{id}
//   section:{id}  | sections:semester:{semId}:{id}
//   topic:{id}    | topics:section:{secId}:{id}
//   summary:{id}  | summaries:topic:{topicId}:{id}
//   keyword:{id}  | keywords:topic:{topicId}:{id}

// ── Courses ────────────────────────────────────────────────────
app.get(`${PREFIX}/courses`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    // Get user's memberships to determine which institutions they belong to
    const membershipRaw = await kv.getByPrefix(`membership:${userId}:`);
    const instIds = membershipRaw.map((m: any) => m.institution_id).filter(Boolean);

    const allCourses: any[] = [];
    for (const instId of instIds) {
      const courses = await kv.getByPrefix(`courses:inst:${instId}:`);
      allCourses.push(...courses);
    }
    return c.json({ courses: allCourses });
  } catch (err) {
    console.log("[Server] Get courses error:", err);
    return c.json({ error: `Erro ao buscar cursos: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/courses`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { name, description, institution_id } = await c.req.json();
    if (!name || !institution_id) {
      return c.json({ error: "Nome e institution_id sao obrigatorios" }, 400);
    }
    const id = uuid();
    const course = { id, name, description: description || "", institution_id, created_at: new Date().toISOString() };
    await kv.set(`course:${id}`, course);
    await kv.set(`courses:inst:${institution_id}:${id}`, course);
    console.log(`[Server] Created course: ${name} in inst ${institution_id}`);
    return c.json({ course });
  } catch (err) {
    console.log("[Server] Create course error:", err);
    return c.json({ error: `Erro ao criar curso: ${err}` }, 500);
  }
});

app.delete(`${PREFIX}/courses/:id`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const id = c.req.param("id");
    const course = await kv.get(`course:${id}`);
    if (!course) return c.json({ error: "Curso nao encontrado" }, 404);
    await kv.del(`course:${id}`);
    await kv.del(`courses:inst:${course.institution_id}:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Erro ao deletar curso: ${err}` }, 500);
  }
});

// ── Semesters ──────────────────────────────────────────────────
app.get(`${PREFIX}/semesters`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const membershipRaw = await kv.getByPrefix(`membership:${userId}:`);
    const instIds = membershipRaw.map((m: any) => m.institution_id).filter(Boolean);

    const allCourses: any[] = [];
    for (const instId of instIds) {
      const courses = await kv.getByPrefix(`courses:inst:${instId}:`);
      allCourses.push(...courses);
    }

    const allSemesters: any[] = [];
    for (const course of allCourses) {
      const semesters = await kv.getByPrefix(`semesters:course:${course.id}:`);
      allSemesters.push(...semesters);
    }
    return c.json({ semesters: allSemesters });
  } catch (err) {
    console.log("[Server] Get semesters error:", err);
    return c.json({ error: `Erro ao buscar semestres: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/semesters`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { name, course_id } = await c.req.json();
    if (!name || !course_id) {
      return c.json({ error: "Nome e course_id sao obrigatorios" }, 400);
    }
    const id = uuid();
    const semester = { id, name, course_id, created_at: new Date().toISOString() };
    await kv.set(`semester:${id}`, semester);
    await kv.set(`semesters:course:${course_id}:${id}`, semester);
    return c.json({ semester });
  } catch (err) {
    return c.json({ error: `Erro ao criar semestre: ${err}` }, 500);
  }
});

// ── Sections ───────────────────────────────────────────────────
app.get(`${PREFIX}/sections`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const membershipRaw = await kv.getByPrefix(`membership:${userId}:`);
    const instIds = membershipRaw.map((m: any) => m.institution_id).filter(Boolean);

    const allCourses: any[] = [];
    for (const instId of instIds) {
      const courses = await kv.getByPrefix(`courses:inst:${instId}:`);
      allCourses.push(...courses);
    }

    const allSemesters: any[] = [];
    for (const course of allCourses) {
      const semesters = await kv.getByPrefix(`semesters:course:${course.id}:`);
      allSemesters.push(...semesters);
    }

    const allSections: any[] = [];
    for (const sem of allSemesters) {
      const sections = await kv.getByPrefix(`sections:semester:${sem.id}:`);
      allSections.push(...sections);
    }
    return c.json({ sections: allSections });
  } catch (err) {
    return c.json({ error: `Erro ao buscar secoes: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/sections`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { name, semester_id } = await c.req.json();
    if (!name || !semester_id) {
      return c.json({ error: "Nome e semester_id sao obrigatorios" }, 400);
    }
    const id = uuid();
    const section = { id, name, semester_id, created_at: new Date().toISOString() };
    await kv.set(`section:${id}`, section);
    await kv.set(`sections:semester:${semester_id}:${id}`, section);
    return c.json({ section });
  } catch (err) {
    return c.json({ error: `Erro ao criar secao: ${err}` }, 500);
  }
});

// ── Topics ─────────────────────────────────────────────────────
app.get(`${PREFIX}/topics`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const membershipRaw = await kv.getByPrefix(`membership:${userId}:`);
    const instIds = membershipRaw.map((m: any) => m.institution_id).filter(Boolean);

    const allCourses: any[] = [];
    for (const instId of instIds) {
      allCourses.push(...(await kv.getByPrefix(`courses:inst:${instId}:`)));
    }

    const allSemesters: any[] = [];
    for (const course of allCourses) {
      allSemesters.push(...(await kv.getByPrefix(`semesters:course:${course.id}:`)));
    }

    const allSections: any[] = [];
    for (const sem of allSemesters) {
      allSections.push(...(await kv.getByPrefix(`sections:semester:${sem.id}:`)));
    }

    const allTopics: any[] = [];
    for (const sec of allSections) {
      allTopics.push(...(await kv.getByPrefix(`topics:section:${sec.id}:`)));
    }
    return c.json({ topics: allTopics });
  } catch (err) {
    return c.json({ error: `Erro ao buscar topicos: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/topics`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { name, section_id } = await c.req.json();
    if (!name || !section_id) {
      return c.json({ error: "Nome e section_id sao obrigatorios" }, 400);
    }
    const id = uuid();
    const topic = { id, name, section_id, created_at: new Date().toISOString() };
    await kv.set(`topic:${id}`, topic);
    await kv.set(`topics:section:${section_id}:${id}`, topic);
    return c.json({ topic });
  } catch (err) {
    return c.json({ error: `Erro ao criar topico: ${err}` }, 500);
  }
});

// ── Summaries ──────────────────────────────────────────────────
app.get(`${PREFIX}/summaries`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const membershipRaw = await kv.getByPrefix(`membership:${userId}:`);
    const instIds = membershipRaw.map((m: any) => m.institution_id).filter(Boolean);

    const allCourses: any[] = [];
    for (const instId of instIds) {
      allCourses.push(...(await kv.getByPrefix(`courses:inst:${instId}:`)));
    }
    const allSemesters: any[] = [];
    for (const course of allCourses) {
      allSemesters.push(...(await kv.getByPrefix(`semesters:course:${course.id}:`)));
    }
    const allSections: any[] = [];
    for (const sem of allSemesters) {
      allSections.push(...(await kv.getByPrefix(`sections:semester:${sem.id}:`)));
    }
    const allTopics: any[] = [];
    for (const sec of allSections) {
      allTopics.push(...(await kv.getByPrefix(`topics:section:${sec.id}:`)));
    }

    const allSummaries: any[] = [];
    for (const topic of allTopics) {
      allSummaries.push(...(await kv.getByPrefix(`summaries:topic:${topic.id}:`)));
    }
    return c.json({ summaries: allSummaries });
  } catch (err) {
    return c.json({ error: `Erro ao buscar resumos: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/summaries`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { title, content, topic_id, status } = await c.req.json();
    if (!title || !content || !topic_id) {
      return c.json({ error: "Titulo, conteudo e topic_id sao obrigatorios" }, 400);
    }
    const id = uuid();
    const summary = {
      id, title, content, topic_id,
      status: status || "draft",
      author_id: userId,
      created_at: new Date().toISOString(),
    };
    await kv.set(`summary:${id}`, summary);
    await kv.set(`summaries:topic:${topic_id}:${id}`, summary);
    return c.json({ summary });
  } catch (err) {
    return c.json({ error: `Erro ao criar resumo: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/summaries/:id/status`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    if (!["draft", "pending", "approved", "rejected"].includes(status)) {
      return c.json({ error: "Status invalido" }, 400);
    }
    const summary = await kv.get(`summary:${id}`);
    if (!summary) return c.json({ error: "Resumo nao encontrado" }, 404);

    const updated = { ...summary, status, updated_at: new Date().toISOString() };
    await kv.set(`summary:${id}`, updated);
    await kv.set(`summaries:topic:${summary.topic_id}:${id}`, updated);
    return c.json({ summary: updated });
  } catch (err) {
    return c.json({ error: `Erro ao atualizar status: ${err}` }, 500);
  }
});

// ── Keywords ───────────────────────────────────────────────────
app.get(`${PREFIX}/keywords`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const membershipRaw = await kv.getByPrefix(`membership:${userId}:`);
    const instIds = membershipRaw.map((m: any) => m.institution_id).filter(Boolean);

    const allCourses: any[] = [];
    for (const instId of instIds) {
      allCourses.push(...(await kv.getByPrefix(`courses:inst:${instId}:`)));
    }
    const allSemesters: any[] = [];
    for (const course of allCourses) {
      allSemesters.push(...(await kv.getByPrefix(`semesters:course:${course.id}:`)));
    }
    const allSections: any[] = [];
    for (const sem of allSemesters) {
      allSections.push(...(await kv.getByPrefix(`sections:semester:${sem.id}:`)));
    }
    const allTopics: any[] = [];
    for (const sec of allSections) {
      allTopics.push(...(await kv.getByPrefix(`topics:section:${sec.id}:`)));
    }

    const allKeywords: any[] = [];
    for (const topic of allTopics) {
      allKeywords.push(...(await kv.getByPrefix(`keywords:topic:${topic.id}:`)));
    }
    return c.json({ keywords: allKeywords });
  } catch (err) {
    return c.json({ error: `Erro ao buscar palavras-chave: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/keywords`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { term, definition, topic_id } = await c.req.json();
    if (!term || !topic_id) {
      return c.json({ error: "Termo e topic_id sao obrigatorios" }, 400);
    }
    const id = uuid();
    const keyword = { id, term, definition: definition || "", topic_id, created_at: new Date().toISOString() };
    await kv.set(`keyword:${id}`, keyword);
    await kv.set(`keywords:topic:${topic_id}:${id}`, keyword);
    return c.json({ keyword });
  } catch (err) {
    return c.json({ error: `Erro ao criar palavra-chave: ${err}` }, 500);
  }
});

// ── Members management ─────────────────────────────────────────
app.get(`${PREFIX}/members/:institutionId`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const instId = c.req.param("institutionId");
    // Get all memberships (we search by prefix pattern)
    // Since memberships are keyed as membership:{userId}:{instId},
    // we need a different approach. We'll use a secondary index.
    const members = await kv.getByPrefix(`members:inst:${instId}:`);
    return c.json({ members });
  } catch (err) {
    return c.json({ error: `Erro ao buscar membros: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/members`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    const { user_id, institution_id, role } = await c.req.json();
    if (!user_id || !institution_id || !role) {
      return c.json({ error: "user_id, institution_id e role sao obrigatorios" }, 400);
    }

    const membershipId = uuid();
    const membership = {
      id: membershipId,
      user_id,
      institution_id,
      role,
      created_at: new Date().toISOString(),
    };
    await kv.set(`membership:${user_id}:${institution_id}`, membership);
    // Also store in members index for institution lookup
    await kv.set(`members:inst:${institution_id}:${user_id}`, membership);
    return c.json({ membership });
  } catch (err) {
    return c.json({ error: `Erro ao adicionar membro: ${err}` }, 500);
  }
});

// ── Seed data endpoint (for development) ───────────────────────
app.post(`${PREFIX}/seed`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Nao autorizado" }, 401);

  try {
    // Create a demo institution
    const instId = uuid();
    const institution = {
      id: instId,
      name: "Faculdade de Medicina Demo",
      slug: "medicina-demo",
      logo_url: null,
      plan: "premium",
      created_at: new Date().toISOString(),
    };
    await kv.set(`inst:${instId}`, institution);
    await kv.set(`inst:slug:medicina-demo`, instId);

    // Owner membership
    const memId = uuid();
    const membership = {
      id: memId,
      user_id: userId,
      institution_id: instId,
      role: "owner",
      created_at: new Date().toISOString(),
    };
    await kv.set(`membership:${userId}:${instId}`, membership);
    await kv.set(`members:inst:${instId}:${userId}`, membership);

    // Course
    const courseId = uuid();
    const course = { id: courseId, name: "Medicina Geral", description: "Curso de medicina geral", institution_id: instId, created_at: new Date().toISOString() };
    await kv.set(`course:${courseId}`, course);
    await kv.set(`courses:inst:${instId}:${courseId}`, course);

    // Semesters
    const sem1Id = uuid();
    const sem1 = { id: sem1Id, name: "1o Semestre", course_id: courseId, created_at: new Date().toISOString() };
    await kv.set(`semester:${sem1Id}`, sem1);
    await kv.set(`semesters:course:${courseId}:${sem1Id}`, sem1);

    const sem2Id = uuid();
    const sem2 = { id: sem2Id, name: "2o Semestre", course_id: courseId, created_at: new Date().toISOString() };
    await kv.set(`semester:${sem2Id}`, sem2);
    await kv.set(`semesters:course:${courseId}:${sem2Id}`, sem2);

    // Section
    const secId = uuid();
    const section = { id: secId, name: "Anatomia Humana", semester_id: sem1Id, created_at: new Date().toISOString() };
    await kv.set(`section:${secId}`, section);
    await kv.set(`sections:semester:${sem1Id}:${secId}`, section);

    // Topics
    const topicIds = [];
    const topicNames = ["Sistema Cardiovascular", "Sistema Respiratorio", "Sistema Nervoso"];
    for (const tName of topicNames) {
      const tId = uuid();
      topicIds.push(tId);
      const topic = { id: tId, name: tName, section_id: secId, created_at: new Date().toISOString() };
      await kv.set(`topic:${tId}`, topic);
      await kv.set(`topics:section:${secId}:${tId}`, topic);
    }

    // Summaries
    const summaryData = [
      { title: "Anatomia do Coracao", content: "O coracao e um orgao muscular oco, localizado no mediastino medio...", topic_id: topicIds[0], status: "approved" },
      { title: "Ciclo Cardiaco", content: "O ciclo cardiaco consiste em duas fases principais: sistole e diastole...", topic_id: topicIds[0], status: "pending" },
      { title: "Pulmoes e Trocas Gasosas", content: "Os pulmoes sao orgaos esponjosos responsaveis pela hematose...", topic_id: topicIds[1], status: "draft" },
    ];
    for (const sd of summaryData) {
      const sId = uuid();
      const summary = { id: sId, ...sd, author_id: userId, created_at: new Date().toISOString() };
      await kv.set(`summary:${sId}`, summary);
      await kv.set(`summaries:topic:${sd.topic_id}:${sId}`, summary);
    }

    // Keywords
    const keywordData = [
      { term: "Sistole", definition: "Fase de contracao do coracao", topic_id: topicIds[0] },
      { term: "Diastole", definition: "Fase de relaxamento do coracao", topic_id: topicIds[0] },
      { term: "Hematose", definition: "Troca gasosa nos alveolos pulmonares", topic_id: topicIds[1] },
      { term: "Sinapse", definition: "Juncao entre dois neuronios", topic_id: topicIds[2] },
    ];
    for (const kd of keywordData) {
      const kId = uuid();
      const keyword = { id: kId, ...kd, created_at: new Date().toISOString() };
      await kv.set(`keyword:${kId}`, keyword);
      await kv.set(`keywords:topic:${kd.topic_id}:${kId}`, keyword);
    }

    console.log("[Server] Seed data created successfully");
    return c.json({ success: true, institution });
  } catch (err) {
    console.log("[Server] Seed error:", err);
    return c.json({ error: `Erro ao criar seed: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
