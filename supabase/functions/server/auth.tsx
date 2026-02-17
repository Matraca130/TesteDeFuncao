// ============================================================
// Axon v4.2 — Auth Routes (Dev 6 stub)
// ============================================================
// Placeholder until Dev 6 delivers full auth routes.
// Exports an empty Hono instance so index.tsx compiles.
// ============================================================
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { getAuthUser, unauthorized, serverError, validationError } from "./crud-factory.tsx";

const auth = new Hono();

// POST /signup — Create a new user
auth.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.email || !body.password) {
      return validationError(c, "email and password are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      user_metadata: { name: body.name ?? "" },
      // Automatically confirm — no email server configured
      email_confirm: true,
    });

    if (error) {
      console.log(`[Auth] Signup error: ${error.message}`);
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: error.message } }, 400);
    }

    console.log(`[Auth] User created: ${data.user.id.slice(0, 8)}…`);
    return c.json({ success: true, data: { user_id: data.user.id } }, 201);
  } catch (err) {
    return serverError(c, "POST /signup", err);
  }
});

// GET /me — Get current authenticated user info
auth.get("/me", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? "",
      },
    });
  } catch (err) {
    return serverError(c, "GET /me", err);
  }
});

export default auth;
