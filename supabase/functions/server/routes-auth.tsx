// ============================================================
// routes-auth.tsx
// AXON v4.4 — SQL-based auth routes
//
// FIX: Removed ${PREFIX} from route paths. When mounted via
//      app.route(PREFIX, auth) in index.ts, Hono strips the
//      mount prefix automatically. Embedding PREFIX here caused
//      double-prefixing → 404 on all auth endpoints.
//      Now matches the pattern used by routes-institutions-v2.tsx
//      and all other v2 route modules.
//
// Routes: POST /auth/signup, POST /auth/signin,
//         GET /auth/me, POST /auth/signout
// ============================================================
import { Hono } from "npm:hono";
import {
  supabaseAdmin,
  getUserFromToken,
  getEnrichedMemberships,
  createMembership,
} from "./_server-helpers.ts";
import { db, ensureProfile } from "./db.ts";

const auth = new Hono();

// ── POST /auth/signup ───────────────────────────────────
auth.post("/auth/signup", async (c) => {
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

    // Create profile in profiles table
    await ensureProfile({ id: userId, email, name, avatar_url: null });

    const user = {
      id: userId, email, name, avatar_url: null,
      is_super_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let memberships: any[] = [];
    if (instId) {
      // Get institution from SQL table
      const { data: inst } = await db()
        .from("institutions")
        .select("id, name, slug, logo_url, is_active, settings")
        .eq("id", instId)
        .maybeSingle();

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

// ── GET /auth/me ───────────────────────────────────────
auth.get("/auth/me", async (c) => {
  const user = await getUserFromToken(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, 401);
  try {
    // Sync profile on each /me call
    await ensureProfile(user);

    // Get profile from SQL table for platform_role
    const { data: profile } = await db()
      .from("profiles")
      .select("platform_role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    const memberships = await getEnrichedMemberships(user.id);
    console.log(`[Server] /auth/me: ${user.email}, ${memberships.length} memberships`);
    return c.json({
      success: true,
      data: {
        user: {
          ...user,
          platform_role: profile?.platform_role || "user",
          is_super_admin: profile?.platform_role === "platform_admin",
          is_active: profile?.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        memberships,
      },
    });
  } catch (err) {
    console.log("[Server] /auth/me error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── POST /auth/signout ──────────────────────────────────
auth.post("/auth/signout", (c) => c.json({ success: true }));

// ── POST /auth/signin ───────────────────────────────────
auth.post("/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return c.json({ success: false, error: { code: "AUTH_ERROR", message: error.message } }, 401);

    const userId = data.user?.id;
    if (!userId) return c.json({ success: false, error: { code: "SERVER_ERROR", message: "No user ID" } }, 500);

    // Sync profile on sign-in
    await ensureProfile({
      id: userId,
      email: data.user.email || "",
      name: data.user.user_metadata?.name || email.split("@")[0],
      avatar_url: data.user.user_metadata?.avatar_url || null,
    });

    // Get profile for platform_role
    const { data: profile } = await db()
      .from("profiles")
      .select("platform_role, is_active")
      .eq("id", userId)
      .maybeSingle();

    const memberships = await getEnrichedMemberships(userId);
    const user = {
      id: userId,
      email: data.user.email || "",
      name: data.user.user_metadata?.name || email.split("@")[0],
      avatar_url: data.user.user_metadata?.avatar_url || null,
      platform_role: profile?.platform_role || "user",
      is_super_admin: profile?.platform_role === "platform_admin",
      is_active: profile?.is_active ?? true,
      created_at: data.user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return c.json({ success: true, data: { user, access_token: data.session?.access_token || "", memberships } });
  } catch (err) {
    console.log("[Server] /auth/signin error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

export default auth;
