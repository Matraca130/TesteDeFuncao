import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
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

// ── Supabase clients ──
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getUserClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// ── Helper: extract token ──
function getToken(c: any): string | null {
  const auth = c.req.header("Authorization");
  if (!auth) return null;
  return auth.replace("Bearer ", "");
}

// ── Helper: get authenticated user ──
async function getAuthUser(token: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// ============================================================
// Health check
// ============================================================
app.get("/make-server-34549f59/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================================
// AUTH: Sign In
// ============================================================
app.post("/make-server-34549f59/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, error: { message: "Email and password required" } }, 400);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.log(`[Auth] signin error for ${email}: ${error.message}`);
      return c.json({ success: false, error: { message: error.message } }, 401);
    }
    return c.json({
      success: true,
      data: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user_id: data.user?.id,
      },
    });
  } catch (err) {
    console.log(`[Auth] signin unexpected error: ${err}`);
    return c.json({ success: false, error: { message: `Signin error: ${err}` } }, 500);
  }
});

// ============================================================
// AUTH: Sign Up
// ============================================================
app.post("/make-server-34549f59/auth/signup", async (c) => {
  try {
    const { email, password, name, institution_id } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, error: { message: "Email and password required" } }, 400);
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email },
      // Automatically confirm since email server not configured
      email_confirm: true,
    });
    if (error) {
      console.log(`[Auth] signup error: ${error.message}`);
      return c.json({ success: false, error: { message: error.message } }, 400);
    }
    // Auto sign-in after signup
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
    if (signInError) {
      return c.json({
        success: true,
        data: { user_id: data.user?.id, message: "User created, please sign in manually" },
      });
    }
    return c.json({
      success: true,
      data: {
        access_token: signInData.session?.access_token,
        user_id: data.user?.id,
      },
    });
  } catch (err) {
    console.log(`[Auth] signup unexpected error: ${err}`);
    return c.json({ success: false, error: { message: `Signup error: ${err}` } }, 500);
  }
});

// ============================================================
// AUTH: Sign Out
// ============================================================
app.post("/make-server-34549f59/auth/signout", async (c) => {
  try {
    const token = getToken(c);
    if (token && token !== supabaseAnonKey) {
      const supabase = getUserClient(token);
      await supabase.auth.signOut();
    }
    return c.json({ success: true });
  } catch (err) {
    console.log(`[Auth] signout error: ${err}`);
    return c.json({ success: true }); // Don't block signout
  }
});

// ============================================================
// AUTH: Get current user profile + memberships (/auth/me)
// ============================================================
app.get("/make-server-34549f59/auth/me", async (c) => {
  try {
    const token = getToken(c);
    if (!token || token === supabaseAnonKey) {
      return c.json({ success: false, error: { message: "No valid auth token" } }, 401);
    }

    const authUser = await getAuthUser(token);
    if (!authUser) {
      return c.json({ success: false, error: { message: "Invalid or expired token" } }, 401);
    }

    const supabase = getServiceClient();

    // Get profile from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    // Get memberships with institution data
    const { data: memberships } = await supabase
      .from("memberships")
      .select("id, user_id, institution_id, role, created_at, institutions(id, name, slug, logo_url)")
      .eq("user_id", authUser.id);

    // Determine if platform owner (super admin)
    const isSuperAdmin = profile?.platform_role === "platform_admin" || profile?.is_super_admin === true;

    const user = {
      id: authUser.id,
      email: authUser.email || "",
      name: profile?.full_name || authUser.user_metadata?.name || authUser.email || "",
      avatar_url: profile?.avatar_url || null,
      is_super_admin: isSuperAdmin,
    };

    // Transform memberships to include institution at top level
    const transformedMemberships = (memberships || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      institution_id: m.institution_id,
      role: m.role,
      created_at: m.created_at,
      institution: m.institutions || { id: m.institution_id, name: m.institution_id, slug: "" },
    }));

    console.log(`[Auth] /me success for ${user.email} | super_admin=${isSuperAdmin} | memberships=${transformedMemberships.length}`);

    return c.json({
      success: true,
      data: {
        user,
        memberships: transformedMemberships,
      },
    });
  } catch (err) {
    console.log(`[Auth] /me unexpected error: ${err}`);
    return c.json({ success: false, error: { message: `Profile fetch error: ${err}` } }, 500);
  }
});

// ============================================================
// INSTITUTIONS: List all (for platform owner / super_admin)
// ============================================================
app.get("/make-server-34549f59/institutions", async (c) => {
  try {
    const token = getToken(c);
    if (!token || token === supabaseAnonKey) {
      return c.json({ success: false, error: { message: "Auth required" } }, 401);
    }

    const authUser = await getAuthUser(token);
    if (!authUser) {
      return c.json({ success: false, error: { message: "Invalid token" } }, 401);
    }

    const supabase = getServiceClient();

    // Verify user is super_admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("platform_role, is_super_admin")
      .eq("id", authUser.id)
      .single();

    const isSuperAdmin = profile?.platform_role === "platform_admin" || profile?.is_super_admin === true;
    if (!isSuperAdmin) {
      return c.json({ success: false, error: { message: "Only platform owners can list all institutions" } }, 403);
    }

    // Fetch ALL institutions
    const { data: institutions, error } = await supabase
      .from("institutions")
      .select("id, name, slug, logo_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(`[Institutions] list error: ${error.message}`);
      return c.json({ success: false, error: { message: error.message } }, 500);
    }

    console.log(`[Institutions] listed ${institutions?.length || 0} institutions for owner ${authUser.id}`);

    return c.json({ success: true, data: institutions || [] });
  } catch (err) {
    console.log(`[Institutions] list unexpected error: ${err}`);
    return c.json({ success: false, error: { message: `List error: ${err}` } }, 500);
  }
});

// ============================================================
// INSTITUTIONS: Dashboard stats for one institution
// ============================================================
app.get("/make-server-34549f59/institutions/:id/dashboard-stats", async (c) => {
  try {
    const instId = c.req.param("id");
    const token = getToken(c);
    if (!token || token === supabaseAnonKey) {
      return c.json({ success: false, error: { message: "Auth required" } }, 401);
    }

    const authUser = await getAuthUser(token);
    if (!authUser) {
      return c.json({ success: false, error: { message: "Invalid token" } }, 401);
    }

    const supabase = getServiceClient();

    // Get institution
    const { data: institution } = await supabase
      .from("institutions")
      .select("id, name, slug")
      .eq("id", instId)
      .single();

    if (!institution) {
      return c.json({
        success: true,
        data: {
          institutionName: "Unknown",
          hasInstitution: false,
          totalMembers: 0,
          totalPlans: 0,
          activeStudents: 0,
          pendingInvites: 0,
          membersByRole: {},
        },
      });
    }

    // Count members by role
    const { data: members } = await supabase
      .from("memberships")
      .select("role")
      .eq("institution_id", instId);

    const membersByRole: Record<string, number> = {};
    (members || []).forEach((m: any) => {
      membersByRole[m.role] = (membersByRole[m.role] || 0) + 1;
    });

    // Count plans
    const { count: planCount } = await supabase
      .from("institution_plans")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", instId);

    return c.json({
      success: true,
      data: {
        institutionName: institution.name,
        hasInstitution: true,
        totalMembers: members?.length || 0,
        totalPlans: planCount || 0,
        activeStudents: membersByRole["student"] || 0,
        pendingInvites: 0,
        membersByRole,
      },
    });
  } catch (err) {
    console.log(`[Stats] dashboard-stats error: ${err}`);
    return c.json({ success: false, error: { message: `Stats error: ${err}` } }, 500);
  }
});

// ============================================================
// INSTITUTIONS: Find by slug
// ============================================================
app.get("/make-server-34549f59/institutions/by-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, slug, logo_url")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return c.json({ success: false, error: { message: "Institution not found" } }, 404);
    }

    return c.json({ success: true, data });
  } catch (err) {
    console.log(`[Institutions] by-slug error: ${err}`);
    return c.json({ success: false, error: { message: `Slug lookup error: ${err}` } }, 500);
  }
});

Deno.serve(app.fetch);
