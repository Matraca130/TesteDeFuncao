// ============================================================
// _server-helpers.ts
// AXON v4.4 — Shared helpers (SQL + KV backward compat)
//
// SQL-based helpers: getEnrichedMemberships, createMembership
// KV key helpers: kept for non-admin routes (content, flashcards, etc.)
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { db, ensureProfile } from "./db.ts";

// ── Canonical KV Key Functions (KEPT for non-admin routes) ──
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

// ── Route prefix (used by routes-auth.tsx) ──────────────────
export const PREFIX = "/make-server-ae4c3d80";

// ── Supabase admin client (legacy — prefer db() from db.ts) ─
export function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ── UUID ────────────────────────────────────────────
export function uuid(): string {
  return crypto.randomUUID();
}

// ── Auth helpers ─────────────────────────────────────
export async function getUserId(c: any): Promise<string | null> {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return null;
    const { data: { user }, error } = await db().auth.getUser(token);
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
    const { data: { user }, error } = await db().auth.getUser(token);
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

// ── SQL-based Membership helpers (replaces KV versions) ─

/**
 * Get all memberships for a user with institution + plan details.
 * Uses SQL join on memberships -> institutions + institution_plans.
 */
export async function getEnrichedMemberships(userId: string): Promise<any[]> {
  const { data, error } = await db()
    .from("memberships")
    .select(`
      id,
      user_id,
      institution_id,
      role,
      institution_plan_id,
      is_active,
      created_at,
      updated_at,
      institution:institutions(
        id, name, slug, logo_url, is_active, settings
      ),
      plan:institution_plans(
        id, name, description, price_cents, billing_cycle, is_default
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.log(`[Server] getEnrichedMemberships SQL error: ${error.message}`);
    return [];
  }
  return data || [];
}

/**
 * Create a membership via SQL INSERT.
 * Also ensures the user has a profile row.
 */
export async function createMembership(
  userId: string,
  instId: string,
  role: string,
  institutionPlanId?: string | null
): Promise<any> {
  // Ensure profile exists
  try {
    const { data: { user } } = await db().auth.admin.getUserById(userId);
    if (user) {
      await ensureProfile({
        id: userId,
        email: user.email || "",
        name: user.user_metadata?.name || user.email?.split("@")[0] || "",
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    }
  } catch (e) {
    console.log(`[Server] ensureProfile warning for ${userId}: ${e}`);
  }

  const { data, error } = await db()
    .from("memberships")
    .insert({
      user_id: userId,
      institution_id: instId,
      role,
      institution_plan_id: institutionPlanId || null,
    })
    .select()
    .single();

  if (error) {
    console.log(`[Server] createMembership SQL error: ${error.message}`);
    throw error;
  }

  console.log(`[Server] Created membership: user=${userId}, inst=${instId}, role=${role}`);
  return data;
}
