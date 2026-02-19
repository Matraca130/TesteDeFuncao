// ============================================================
// Axon — Auth Routes (Dev 6 + Dev 1 fixes + Dev 2 RBAC)
// Dev 6 Integration: Added enrichMembershipsWithInstitution()
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  userKey,
  memberKey,
  instKey,
  idxUserInsts,
  idxInstMembers,
  KV_PREFIXES,
} from "./kv-keys.ts";
import { getSupabaseAdmin } from "./crud-factory.tsx";
import { requireAuth } from "./middleware-rbac.ts";

const auth = new Hono();

// ── Error message extractor (type-safe) ─────────────────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── Dev 6: Enrich memberships with full institution data ────────────────
// SelectInstitutionPage and PostLoginRouter need membership.institution
// to display names and route by role correctly.
async function enrichMembershipsWithInstitution(memberships: any[]): Promise<any[]> {
  if (memberships.length === 0) return memberships;
  try {
    const uniqueInstIds = [...new Set(
      memberships.map((m: any) => m.institution_id).filter(Boolean)
    )];
    if (uniqueInstIds.length === 0) return memberships;

    const instMap = new Map<string, any>();
    for (const id of uniqueInstIds) {
      const inst = await kv.get(instKey(id));
      if (inst) instMap.set(id, inst);
    }

    return memberships.map((m: any) => ({
      ...m,
      institution: instMap.get(m.institution_id) || null,
    }));
  } catch {
    console.log("[Auth] Warning: Failed to enrich memberships with institution data");
    return memberships;
  }
}

/** Helper: extract userId from Authorization header
 *  NOTE: Kept exported for backward compatibility — other files may use it.
 *  GET /auth/me now uses requireAuth() middleware instead.
 */
export async function getUserIdFromToken(
  authHeader: string | undefined
): Promise<{ userId: string } | { error: string }> {
  const token = authHeader?.split("Bearer ")[1];
  if (!token) return { error: "Missing Authorization header" };

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return { error: `Invalid token: ${error?.message || "user not found"}` };
  return { userId: user.id };
}

// ────────────────────────────────────────────────────────────────
// POST /auth/signup
// Accepts optional institution_id to auto-create membership
// ────────────────────────────────────────────────────────────────
auth.post("/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    // FIX Dev 6: Accept both institution_id and institutionId for compat
    const { email, password, name, institution_id, institutionId } = body;
    const instId = institution_id || institutionId;

    if (!email || !password || !name) {
      return c.json(
        { success: false, error: { code: "VALIDATION", message: "email, password and name are required" } },
        400
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm email since email server not configured
      email_confirm: true,
    });

    if (error) {
      console.log(`[Auth] Signup failed for ${email}: ${error.message}`);
      return c.json(
        { success: false, error: { code: "AUTH_ERROR", message: `Signup failed: ${error.message}` } },
        400
      );
    }

    // Create User entity in KV
    const now = new Date().toISOString();
    const user = {
      id: data.user.id,
      email,
      name,
      avatar_url: null,
      is_super_admin: false,
      created_at: now,
      updated_at: now,
    };
    await kv.set(userKey(data.user.id), user);

    // If institution_id provided, create membership as student (T1.5)
    let memberships: any[] = [];

    if (instId) {
      const inst = await kv.get(instKey(instId));
      if (!inst) {
        console.log(`[Auth] Signup: institution not found for id ${instId}`);
        return c.json(
          { success: false, error: { code: "NOT_FOUND", message: "Institution not found" } },
          404
        );
      }

      const membership = {
        id: crypto.randomUUID(),
        user_id: data.user.id,
        institution_id: instId,
        role: "student",
        plan_id: null,
        created_at: now,
      };

      // Save with the 3 mandatory KV keys (R5)
      await kv.mset(
        [
          memberKey(instId, data.user.id),
          idxUserInsts(data.user.id, instId),
          idxInstMembers(instId, data.user.id),
        ],
        [membership, instId, data.user.id]
      );

      memberships = [membership];
      console.log(`[Auth] Signup: created student membership for ${email} in institution ${instId}`);
    }

    // Enrich memberships with institution data (Dev 6)
    memberships = await enrichMembershipsWithInstitution(memberships);

    // Sign in to get access_token
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      console.log(`[Auth] Auto-signin after signup failed for ${email}: ${signInErr.message}`);
      // User was created but auto-login failed — still return the user
      return c.json({ success: true, data: { user, access_token: "", memberships } });
    }

    console.log(`[Auth] Signup success for ${email} (${data.user.id}), institution: ${instId || "none"}`);
    return c.json({
      success: true,
      data: {
        user,
        access_token: signInData.session?.access_token ?? "",
        memberships,
      },
    });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[Auth] Signup error: ${msg}`);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Signup error: ${msg}` } },
      500
    );
  }
});

// ────────────────────────────────────────────────────────────────
// POST /auth/signin
// ────────────────────────────────────────────────────────────────
auth.post("/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(
        { success: false, error: { code: "VALIDATION", message: "email and password are required" } },
        400
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.log(`[Auth] Signin failed for ${email}: ${error.message}`);
      return c.json(
        { success: false, error: { code: "AUTH_ERROR", message: `Sign in failed: ${error.message}` } },
        401
      );
    }

    // Get user from KV
    let user = await kv.get(userKey(data.user.id));

    // If user doesn't exist in KV yet (e.g. pre-existing Supabase user), create it
    if (!user) {
      user = {
        id: data.user.id,
        email,
        name: data.user.user_metadata?.name || email.split("@")[0],
        avatar_url: null,
        is_super_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await kv.set(userKey(data.user.id), user);
    }

    // Get memberships (multi-tenancy D9)
    let memberships: unknown[] = [];
    try {
      const instIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_USER_INSTS + data.user.id + ":"
      );
      if (instIds.length > 0) {
        memberships = (await kv.mget(
          instIds.map((instId: string) => memberKey(instId, data.user.id))
        )).filter(Boolean);
      }
    } catch (_e) {
      // No memberships yet, that's OK
    }

    // Enrich memberships with institution data (Dev 6)
    memberships = await enrichMembershipsWithInstitution(memberships);

    console.log(`[Auth] Signin success for ${email} (${data.user.id}), memberships: ${memberships.length}`);
    return c.json({
      success: true,
      data: {
        user,
        access_token: data.session.access_token,
        memberships,
      },
    });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[Auth] Signin error: ${msg}`);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Signin error: ${msg}` } },
      500
    );
  }
});

// ────────────────────────────────────────────────────────────────
// GET /auth/me — Restore session from token (uses requireAuth middleware)
// ────────────────────────────────────────────────────────────────
auth.get("/auth/me", requireAuth(), async (c) => {
  try {
    const userId = c.get("userId"); // ← puesto por requireAuth()

    const user = await kv.get(userKey(userId));
    if (!user) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found in KV store" } },
        404
      );
    }

    // Get memberships
    let memberships: unknown[] = [];
    try {
      const instIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_USER_INSTS + userId + ":"
      );
      if (instIds.length > 0) {
        memberships = (await kv.mget(
          instIds.map((instId: string) => memberKey(instId, userId))
        )).filter(Boolean);
      }
    } catch (_e) {}

    // Enrich memberships with institution data (Dev 6)
    memberships = await enrichMembershipsWithInstitution(memberships);

    console.log(`[Auth] /me restored session for user ${userId}, memberships: ${memberships.length}`);
    return c.json({ success: true, data: { user, memberships } });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[Auth] /me error: ${msg}`);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Session restore error: ${msg}` } },
      500
    );
  }
});

// ────────────────────────────────────────────────────────────────
// POST /auth/signout
// ────────────────────────────────────────────────────────────────
auth.post("/auth/signout", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split("Bearer ")[1];
    if (token) {
      const supabase = getSupabaseAdmin();
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        console.log(`[Auth] User signed out: ${user.email} (${user.id})`);
      }
    }
    return c.json({ success: true, data: { message: "Signed out successfully" } });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[Auth] Signout error: ${msg}`);
    return c.json({ success: true, data: { message: "Signed out" } });
  }
});

export default auth;
