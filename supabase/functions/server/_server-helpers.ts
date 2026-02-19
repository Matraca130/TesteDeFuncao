// ============================================================
// _server-helpers.ts
// Shared helpers for the Axon server
// KV key functions, auth utilities, membership management
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

// ── Canonical KV Key Functions (mirrors kv-keys.ts) ─────────
export const K = {
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

// ── Route prefix ────────────────────────────────────────
export const PREFIX = "/make-server-ae4c3d80";

// ── Supabase admin client ───────────────────────────────
export function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ── UUID ───────────────────────────────────────────────
export function uuid(): string {
  return crypto.randomUUID();
}

// ── Auth helpers ───────────────────────────────────────
export async function getUserId(c: any): Promise<string | null> {
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

export async function getUserFromToken(c: any): Promise<{
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
} | null> {
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

// ── Membership helpers ─────────────────────────────────
export async function getEnrichedMemberships(userId: string): Promise<any[]> {
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

export async function createMembership(userId: string, instId: string, role: string): Promise<any> {
  const membershipId = uuid();
  const membership = {
    id: membershipId,
    user_id: userId,
    institution_id: instId,
    role,
    created_at: new Date().toISOString(),
  };
  await kv.set(K.member(instId, userId), membership);
  await kv.set(K.idxInstMembers(instId, userId), userId);
  await kv.set(K.idxUserInsts(userId, instId), instId);
  console.log(`[Server] Created membership: user=${userId}, inst=${instId}, role=${role}`);
  return membership;
}
