// ============================================================
// Axon — Auth Routes (Dev 6)
// Uses shared getAuthUser from crud-factory.tsx for token validation.
// ============================================================
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { getAuthUser } from "./crud-factory.tsx";

const auth = new Hono();

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Error message extractor (type-safe) ────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ────────────────────────────────────────────────────────────
// POST /auth/signup
// ────────────────────────────────────────────────────────────
auth.post("/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

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
    const user = {
      id: data.user.id,
      email,
      name,
      avatar_url: null,
      is_super_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`user:${data.user.id}`, user);

    // Sign in to get access_token
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      console.log(`[Auth] Auto-signin after signup failed: ${signInErr.message}`);
      // User was created but auto-login failed — still return the user
      return c.json({ success: true, data: { user, access_token: "" } });
    }

    console.log(`[Auth] User signed up successfully: ${email} (${data.user.id})`);
    return c.json({
      success: true,
      data: {
        user,
        access_token: signInData.session?.access_token ?? "",
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

// ────────────────────────────────────────────────────────────
// POST /auth/signin
// ────────────────────────────────────────────────────────────
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
    let user = await kv.get(`user:${data.user.id}`);

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
      await kv.set(`user:${data.user.id}`, user);
    }

    // Get memberships (multi-tenancy D9)
    let memberships: unknown[] = [];
    try {
      const instIds = await kv.getByPrefix(`idx:user-insts:${data.user.id}:`);
      if (instIds.length > 0) {
        memberships = (await kv.mget(
          instIds.map((instId: string) => `membership:${instId}:${data.user.id}`)
        )).filter(Boolean);
      }
    } catch (_e) {
      // No memberships yet, that's OK
    }

    console.log(`[Auth] User signed in: ${email} (${data.user.id})`);
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

// ────────────────────────────────────────────────────────────
// GET /auth/me — Restore session from token
// Uses shared getAuthUser (consolidated auth — no more duplicate helper)
// ────────────────────────────────────────────────────────────
auth.get("/auth/me", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    if (!authUser) {
      return c.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Invalid or missing token" } },
        401
      );
    }

    const user = await kv.get(`user:${authUser.id}`);
    if (!user) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found in KV store" } },
        404
      );
    }

    // Get memberships
    let memberships: unknown[] = [];
    try {
      const instIds = await kv.getByPrefix(`idx:user-insts:${authUser.id}:`);
      if (instIds.length > 0) {
        memberships = (await kv.mget(
          instIds.map((instId: string) => `membership:${instId}:${authUser.id}`)
        )).filter(Boolean);
      }
    } catch (_e) {}

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

// ────────────────────────────────────────────────────────────
// POST /auth/signout
// ────────────────────────────────────────────────────────────
auth.post("/auth/signout", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    if (authUser) {
      console.log(`[Auth] User signed out: ${authUser.email} (${authUser.id})`);
    }
    return c.json({ success: true, data: { message: "Signed out successfully" } });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[Auth] Signout error: ${msg}`);
    return c.json({ success: true, data: { message: "Signed out" } });
  }
});

export default auth;
