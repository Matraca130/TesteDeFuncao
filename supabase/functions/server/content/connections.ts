// ============================================================
// Axon v4.4 — Content Routes: Connections
// ============================================================
// D31: structural keyword connections, no mastery
//
// POST   /connections
// GET    /connections      ?keyword_id=xxx
// GET    /connections/:id
// DELETE /connections/:id
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  connKey,
  idxKwConn,
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

router.post("/connections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.keyword_a_id || !body.keyword_b_id)
      return validationError(c, "Missing keyword_a_id or keyword_b_id");

    const id = crypto.randomUUID();
    const conn = {
      id,
      keyword_a_id: body.keyword_a_id,
      keyword_b_id: body.keyword_b_id,
      relationship_type: body.relationship_type ?? "related",
      description: body.description ?? null,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };
    await kv.mset(
      [
        connKey(id),
        idxKwConn(body.keyword_a_id, id),
        idxKwConn(body.keyword_b_id, id),
      ],
      [conn, id, id]
    );
    return c.json({ success: true, data: conn }, 201);
  } catch (err) {
    return serverError(c, "POST /connections", err);
  }
});

router.get("/connections", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const kwId = c.req.query("keyword_id");
    if (!kwId)
      return validationError(c, "keyword_id query param required");
    const connIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_CONN + kwId + ":"
    );
    if (!connIds || connIds.length === 0)
      return c.json({ success: true, data: [] });
    const conns = (
      await kv.mget(connIds.map((cId: string) => connKey(cId)))
    ).filter(Boolean);
    return c.json({ success: true, data: conns });
  } catch (err) {
    return serverError(c, "GET /connections", err);
  }
});

router.get("/connections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const conn = await kv.get(connKey(c.req.param("id")));
    if (!conn) return notFound(c, "Connection");
    return c.json({ success: true, data: conn });
  } catch (err) {
    return serverError(c, "GET /connections/:id", err);
  }
});

router.delete("/connections/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const conn = await kv.get(connKey(id));
    if (!conn) return notFound(c, "Connection");
    await kv.mdel([
      connKey(id),
      idxKwConn(conn.keyword_a_id, id),
      idxKwConn(conn.keyword_b_id, id),
    ]);
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /connections/:id", err);
  }
});

export default router;
