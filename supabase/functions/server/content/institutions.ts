// ============================================================
// Axon v4.4 — Content Routes: Institutions + Members
// ============================================================
// POST   /institutions               (T1.1 + T1.2)
// GET    /institutions/by-slug/:slug  (T1.4: public)
// GET    /institutions/:id
// GET    /institutions/:id/members
// POST   /institutions/:id/members
// DELETE /institutions/:id/members/:userId
// GET    /users/:userId/institutions
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  instKey,
  memberKey,
  idxInstMembers,
  idxUserInsts,
  idxSlugInst,
  KV_PREFIXES,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "./_helpers.ts";

const router = new Hono();

// POST /institutions (T1.1 + T1.2: fix membership + slug)
router.post("/institutions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const { name, slug, logo_url } = await c.req.json();
    if (!name) return validationError(c, "Missing required field: name");

    if (!slug || !/^[a-z0-9-]{3,50}$/.test(slug)) {
      return validationError(
        c,
        "Invalid slug: must be 3-50 chars, lowercase alphanumeric and hyphens only"
      );
    }

    const existingSlug = await kv.get(idxSlugInst(slug));
    if (existingSlug) {
      return c.json(
        { success: false, error: { code: "CONFLICT", message: "Slug already taken" } },
        409
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const inst = {
      id,
      name,
      slug,
      logo_url: logo_url || null,
      created_at: now,
      updated_at: now,
      created_by: user.id,
    };
    await kv.set(instKey(id), inst);
    await kv.set(idxSlugInst(slug), id);

    // T1.1: Auto-add creator as OWNER
    const membershipId = crypto.randomUUID();
    const membership = {
      id: membershipId,
      user_id: user.id,
      institution_id: id,
      role: "owner",
      plan_id: null,
      created_at: now,
    };
    await kv.mset(
      [
        memberKey(id, user.id),
        idxUserInsts(user.id, id),
        idxInstMembers(id, user.id),
      ],
      [membership, id, user.id]
    );

    console.log(
      `[Content] POST /institutions: created '${name}' (${id}) with slug '${slug}', owner: ${user.id}`
    );
    return c.json({ success: true, data: inst }, 201);
  } catch (err) {
    return serverError(c, "POST /institutions", err);
  }
});

// GET /institutions/by-slug/:slug (T1.4: public endpoint)
router.get("/institutions/by-slug/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const instId = await kv.get(idxSlugInst(slug));
    if (!instId) {
      console.log(`[Content] by-slug: institution not found for slug '${slug}'`);
      return c.json({ success: false, error: { message: "Institution not found" } }, 404);
    }
    const inst = await kv.get(instKey(instId as string));
    if (!inst) {
      console.log(`[Content] by-slug: institution data missing for id '${instId}', slug '${slug}'`);
      return c.json({ success: false, error: { message: "Institution not found" } }, 404);
    }
    return c.json({
      success: true,
      data: {
        id: (inst as any).id,
        name: (inst as any).name,
        slug: (inst as any).slug,
        logo_url: (inst as any).logo_url || null,
      },
    });
  } catch (err: any) {
    console.log(`[Content] by-slug error: ${err?.message}`);
    return c.json({ success: false, error: { message: err?.message } }, 500);
  }
});

// GET /institutions/:id
router.get("/institutions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const inst = await kv.get(instKey(c.req.param("id")));
    if (!inst) return notFound(c, "Institution");
    return c.json({ success: true, data: inst });
  } catch (err) {
    return serverError(c, "GET /institutions/:id", err);
  }
});

// GET /institutions/:id/members
router.get("/institutions/:id/members", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.param("id");
    const userIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_INST_MEMBERS + instId + ":"
    );
    if (!userIds || userIds.length === 0)
      return c.json({ success: true, data: [] });
    const memberships = await kv.mget(
      userIds.map((uid: string) => memberKey(instId, uid))
    );
    return c.json({ success: true, data: memberships.filter(Boolean) });
  } catch (err) {
    return serverError(c, "GET /institutions/:id/members", err);
  }
});

// POST /institutions/:id/members
router.post("/institutions/:id/members", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.param("id");
    const body = await c.req.json();
    if (!body.user_id || !body.role)
      return validationError(c, "Missing user_id or role");

    const membership = {
      id: crypto.randomUUID(),
      institution_id: instId,
      user_id: body.user_id,
      role: body.role,
      plan_id: null,
      created_at: new Date().toISOString(),
    };
    await kv.mset(
      [
        memberKey(instId, body.user_id),
        idxInstMembers(instId, body.user_id),
        idxUserInsts(body.user_id, instId),
      ],
      [membership, body.user_id, instId]
    );
    console.log(
      `[Content] POST /institutions/${instId}/members: added user ${body.user_id} as ${body.role}`
    );
    return c.json({ success: true, data: membership }, 201);
  } catch (err) {
    return serverError(c, "POST /institutions/:id/members", err);
  }
});

// DELETE /institutions/:id/members/:userId
router.delete("/institutions/:id/members/:userId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const instId = c.req.param("id");
    const userId = c.req.param("userId");
    await kv.mdel([
      memberKey(instId, userId),
      idxInstMembers(instId, userId),
      idxUserInsts(userId, instId),
    ]);
    console.log(
      `[Content] DELETE member: removed user ${userId} from institution ${instId}`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE member", err);
  }
});

// GET /users/:userId/institutions
router.get("/users/:userId/institutions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const userId = c.req.param("userId");
    const instIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_USER_INSTS + userId + ":"
    );
    if (!instIds || instIds.length === 0)
      return c.json({ success: true, data: [] });
    const institutions = await kv.mget(
      instIds.map((id: string) => instKey(id))
    );
    return c.json({ success: true, data: institutions.filter(Boolean) });
  } catch (err) {
    return serverError(c, "GET /users/:userId/institutions", err);
  }
});

export default router;
