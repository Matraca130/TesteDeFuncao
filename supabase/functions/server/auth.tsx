// ============================================================
// Axon — Auth Routes (Dev 6 + Dev 1 fixes)
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

const auth = new Hono();

// ── Error message extractor (type-safe) ─────────────────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Helper: extract userId from Authorization header */
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
    const { email, password, name, institution_id } = body;

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

    if (institution_id) {
      const inst = await kv.get(instKey(institution_id));
      if (!inst) {
        console.log(`[Auth] Signup: institution not found for id ${institution_id}`);
        return c.json(
          { success: false, error: { code: "NOT_FOUND", message: "Institution not found" } },
          404
        );
      }

      const membership = {
        id: crypto.randomUUID(),
        user_id: data.user.id,
        institution_id,
        role: "student",
        plan_id: null,
        created_at: now,
      };

      // Save with the 3 mandatory KV keys (R5)
      await kv.mset(
        [
          memberKey(institution_id, data.user.id),
          idxUserInsts(data.user.id, institution_id),
          idxInstMembers(institution_id, data.user.id),
        ],
        [membership, institution_id, data.user.id]
      );

      memberships = [membership];
      console.log(`[Auth] Signup: created student membership for ${email} in institution ${institution_id}`);
    }

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

    console.log(`[Auth] Signup success for ${email} (${data.user.id}), institution: ${institution_id || "none"}`);
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
// GET /auth/me — Restore session from token
// ────────────────────────────────────────────────────────────────
auth.get("/auth/me", async (c) => {
  try {
    const result = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in result) {
      return c.json(
        { success: false, error: { code: "AUTH_ERROR", message: result.error } },
        401
      );
    }

    const user = await kv.get(userKey(result.userId));
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
        KV_PREFIXES.IDX_USER_INSTS + result.userId + ":"
      );
      if (instIds.length > 0) {
        memberships = (await kv.mget(
          instIds.map((instId: string) => memberKey(instId, result.userId))
        )).filter(Boolean);
      }
    } catch (_e) {}

    console.log(`[Auth] /me restored session for user ${result.userId}`);
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
