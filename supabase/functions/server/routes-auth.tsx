// ============================================================
// routes-auth.tsx
// Routes: POST /auth/signup, POST /auth/signin,
//         GET /auth/me, POST /auth/signout
// ============================================================
import { Hono } from "npm:hono";
import {
  K,
  PREFIX,
  supabaseAdmin,
  getUserFromToken,
  getEnrichedMemberships,
  createMembership,
  uuid,
} from "./_server-helpers.ts";

const auth = new Hono();

// ── POST /auth/signup ───────────────────────────────────
auth.post(`${PREFIX}/auth/signup`, async (c) => {
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

    const user = {
      id: userId, email, name, avatar_url: null,
      is_super_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let memberships: any[] = [];
    if (instId) {
      const { default: kv } = await import("./kv_store.tsx");
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

// ── GET /auth/me ───────────────────────────────────────
auth.get(`${PREFIX}/auth/me`, async (c) => {
  const user = await getUserFromToken(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, 401);
  try {
    const memberships = await getEnrichedMemberships(user.id);
    console.log(`[Server] /auth/me: ${user.email}, ${memberships.length} memberships`);
    return c.json({
      success: true,
      data: {
        user: { ...user, is_super_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        memberships,
      },
    });
  } catch (err) {
    console.log("[Server] /auth/me error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── POST /auth/signout ──────────────────────────────────
auth.post(`${PREFIX}/auth/signout`, (c) => c.json({ success: true }));

// ── POST /auth/signin ───────────────────────────────────
auth.post(`${PREFIX}/auth/signin`, async (c) => {
  try {
    const { email, password } = await c.req.json();
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return c.json({ success: false, error: { code: "AUTH_ERROR", message: error.message } }, 401);

    const userId = data.user?.id;
    if (!userId) return c.json({ success: false, error: { code: "SERVER_ERROR", message: "No user ID" } }, 500);

    const memberships = await getEnrichedMemberships(userId);
    const user = {
      id: userId,
      email: data.user.email || "",
      name: data.user.user_metadata?.name || email.split("@")[0],
      avatar_url: data.user.user_metadata?.avatar_url || null,
      is_super_admin: false,
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
