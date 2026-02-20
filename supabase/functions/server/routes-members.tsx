// ============================================================
// routes-members.tsx
// FIX: Removed ${PREFIX} from paths — the prefix is applied
// by app.route(PREFIX, members) in index.ts.
// ADDED: PATCH /role, PATCH /suspend, DELETE endpoints
// Routes:
//   GET    /members/:institutionId
//   POST   /members
//   PATCH  /members/:memberId/role
//   PATCH  /members/:memberId/suspend
//   DELETE /members/:memberId
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, getUserId, createMembership } from "./_server-helpers.ts";

const members = new Hono();

// ── GET /members/:institutionId ─────────────────────────
members.get("/members/:institutionId", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instId = c.req.param("institutionId");
    const memberUserIds = await kv.getByPrefix(`${K.PFX.IDX_INST_MEMBERS}${instId}:`);
    const membersList: any[] = [];
    for (const mUserId of memberUserIds) {
      if (typeof mUserId !== "string") continue;
      const membership = await kv.get(K.member(instId, mUserId));
      if (membership) {
        // Enrich with user profile info if available
        const userProfile = await kv.get(K.user(mUserId));
        membersList.push({
          ...membership,
          name: (userProfile as any)?.name || (membership as any)?.name || null,
          email: (userProfile as any)?.email || (membership as any)?.email || null,
          avatar_url: (userProfile as any)?.avatar_url || null,
          status: (membership as any)?.status || 'active',
        });
      }
    }
    return c.json({ success: true, data: membersList });
  } catch (err) {
    console.log(`[Members] GET error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── POST /members ──────────────────────────────────────
members.post("/members", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { user_id, institution_id, role, email, name } = await c.req.json();
    if (!institution_id || !role) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "institution_id and role required" } }, 400);
    }
    // If user_id is provided, create membership directly
    // If email is provided (invite flow), store invite
    const targetUserId = user_id || `invited-${Date.now()}`;
    const membership = await createMembership(targetUserId, institution_id, role);
    // Store additional invite info
    const enriched = {
      ...membership,
      email: email || null,
      name: name || null,
      status: user_id ? 'active' : 'invited',
    };
    await kv.set(K.member(institution_id, targetUserId), enriched);
    console.log(`[Members] Created membership: user=${targetUserId}, inst=${institution_id}, role=${role}`);
    return c.json({ success: true, data: enriched });
  } catch (err) {
    console.log(`[Members] POST error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── PATCH /members/:memberId/role ──────────────────────
members.patch("/members/:memberId/role", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const memberId = c.req.param("memberId");
    const { role, institution_id } = await c.req.json();
    if (!role) return c.json({ success: false, error: { code: "VALIDATION", message: "role required" } }, 400);

    // Find the membership by scanning institution members
    // memberId here is the membership record ID
    if (institution_id) {
      const memberUserIds = await kv.getByPrefix(`${K.PFX.IDX_INST_MEMBERS}${institution_id}:`);
      for (const mUserId of memberUserIds) {
        if (typeof mUserId !== "string") continue;
        const membership = await kv.get(K.member(institution_id, mUserId));
        if (membership && (membership as any).id === memberId) {
          const updated = { ...(membership as any), role, updated_at: new Date().toISOString() };
          await kv.set(K.member(institution_id, mUserId), updated);
          console.log(`[Members] Updated role: member=${memberId}, role=${role}`);
          return c.json({ success: true, data: updated });
        }
      }
    }
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Member not found" } }, 404);
  } catch (err) {
    console.log(`[Members] PATCH role error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── PATCH /members/:memberId/suspend ───────────────────
members.patch("/members/:memberId/suspend", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const memberId = c.req.param("memberId");
    const body = await c.req.json().catch(() => ({}));
    const institution_id = (body as any)?.institution_id;

    if (institution_id) {
      const memberUserIds = await kv.getByPrefix(`${K.PFX.IDX_INST_MEMBERS}${institution_id}:`);
      for (const mUserId of memberUserIds) {
        if (typeof mUserId !== "string") continue;
        const membership = await kv.get(K.member(institution_id, mUserId));
        if (membership && (membership as any).id === memberId) {
          const updated = { ...(membership as any), status: 'suspended', updated_at: new Date().toISOString() };
          await kv.set(K.member(institution_id, mUserId), updated);
          console.log(`[Members] Suspended member: ${memberId}`);
          return c.json({ success: true, data: updated });
        }
      }
    }
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Member not found" } }, 404);
  } catch (err) {
    console.log(`[Members] PATCH suspend error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── DELETE /members/:memberId ──────────────────────────
members.delete("/members/:memberId", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const memberId = c.req.param("memberId");
    const institution_id = c.req.query("institution_id");

    if (institution_id) {
      const memberUserIds = await kv.getByPrefix(`${K.PFX.IDX_INST_MEMBERS}${institution_id}:`);
      for (const mUserId of memberUserIds) {
        if (typeof mUserId !== "string") continue;
        const membership = await kv.get(K.member(institution_id, mUserId));
        if (membership && (membership as any).id === memberId) {
          // Remove membership and indexes
          await kv.del(K.member(institution_id, mUserId));
          await kv.del(K.idxInstMembers(institution_id, mUserId)).catch(() => {});
          await kv.del(K.idxUserInsts(mUserId, institution_id)).catch(() => {});
          console.log(`[Members] Removed member: ${memberId} from inst ${institution_id}`);
          return c.json({ success: true, data: { id: memberId, deleted: true } });
        }
      }
    }
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Member not found" } }, 404);
  } catch (err) {
    console.log(`[Members] DELETE error:`, err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

export default members;
