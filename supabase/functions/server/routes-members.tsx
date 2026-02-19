// ============================================================
// routes-members.tsx
// Routes: GET /members/:institutionId, POST /members
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PREFIX, getUserId, createMembership } from "./_server-helpers.ts";

const members = new Hono();

// ── GET /members/:institutionId ─────────────────────────
members.get(`${PREFIX}/members/:institutionId`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const instId = c.req.param("institutionId");
    const memberUserIds = await kv.getByPrefix(`${K.PFX.IDX_INST_MEMBERS}${instId}:`);
    const membersList: any[] = [];
    for (const mUserId of memberUserIds) {
      if (typeof mUserId !== "string") continue;
      const membership = await kv.get(K.member(instId, mUserId));
      if (membership) membersList.push(membership);
    }
    return c.json({ success: true, data: membersList, members: membersList });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

// ── POST /members ──────────────────────────────────────
members.post(`${PREFIX}/members`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    const { user_id, institution_id, role } = await c.req.json();
    if (!user_id || !institution_id || !role) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "user_id, institution_id, role required" } }, 400);
    }
    const membership = await createMembership(user_id, institution_id, role);
    return c.json({ success: true, data: membership });
  } catch (err) {
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `${err}` } }, 500);
  }
});

export default members;
