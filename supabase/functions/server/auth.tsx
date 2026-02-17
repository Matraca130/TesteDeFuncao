// ============================================================
// Axon — Auth Routes (Dev 6)
// ============================================================
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const auth = new Hono();

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
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
  } catch (err: any) {
    console.log(`[Auth] Signup error: ${err.message}`);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Signup error: ${err.message}` } },
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
    let memberships: any[] = [];
    try {
      const instIds = await kv.getByPrefix(`idx:user-insts:${data.user.id}:`);
      if (instIds.length > 0) {
        memberships = await kv.mget(
          instIds.map((instId: string) => `membership:${instId}:${data.user.id}`)
        );
        memberships = memberships.filter(Boolean);
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
  } catch (err: any) {
    console.log(`[Auth] Signin error: ${err.message}`);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Signin error: ${err.message}` } },
      500
    );
  }
});

// ────────────────────────────────────────────────────────────
// GET /auth/me — Restore session from token
// ────────────────────────────────────────────────────────────
auth.get("/auth/me", async (c) => {
  try {
    const result = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in result) {
      return c.json(
        { success: false, error: { code: "AUTH_ERROR", message: result.error } },
        401
      );
    }

    const user = await kv.get(`user:${result.userId}`);
    if (!user) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found in KV store" } },
        404
      );
    }

    // Get memberships
    let memberships: any[] = [];
    try {
      const instIds = await kv.getByPrefix(`idx:user-insts:${result.userId}:`);
      if (instIds.length > 0) {
        memberships = await kv.mget(
          instIds.map((instId: string) => `membership:${instId}:${result.userId}`)
        );
        memberships = memberships.filter(Boolean);
      }
    } catch (_e) {}

    return c.json({ success: true, data: { user, memberships } });
  } catch (err: any) {
    console.log(`[Auth] /me error: ${err.message}`);
    return c.json(
      { success: false, error: { code: "SERVER_ERROR", message: `Session restore error: ${err.message}` } },
      500
    );
  }
});

// ────────────────────────────────────────────────────────────
// POST /auth/signout
// ────────────────────────────────────────────────────────────
auth.post("/auth/signout", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split("Bearer ")[1];
    if (token) {
      const supabase = getSupabaseAdmin();
      // Get user to find their ID for logging
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        console.log(`[Auth] User signed out: ${user.email} (${user.id})`);
      }
    }
    return c.json({ success: true, data: { message: "Signed out successfully" } });
  } catch (err: any) {
    console.log(`[Auth] Signout error: ${err.message}`);
    return c.json({ success: true, data: { message: "Signed out" } });
  }
});

export default auth;
