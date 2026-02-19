// ============================================================
// Axon v4.4 — Content Routes: Keywords
// ============================================================
// D7: global within institution
// D4: auto-create KeywordInstance
// D31: cascade delete subtopics + connections
//
// POST   /keywords
// GET    /keywords         ?institution_id=xxx | ?summary_id=xxx
// GET    /keywords/:id     (full: + subtopics, connections, summary links)
// PUT    /keywords/:id
// DELETE /keywords/:id     (cascade: subtopics + connections + links)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  kwKey,
  kwInstKey,
  subtopicKey,
  connKey,
  idxInstKw,
  idxSummaryKw,
  idxKwSummaries,
  idxKwSubtopics,
  idxKwConn,
  KV_PREFIXES,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  getChildren,
} from "./_helpers.ts";

const router = new Hono();

router.post("/keywords", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const body = await c.req.json();
    if (!body.institution_id || !body.term)
      return validationError(c, "Missing institution_id or term");

    const id = crypto.randomUUID();
    const keyword = {
      id,
      institution_id: body.institution_id,
      term: body.term,
      definition: body.definition ?? null,
      priority: body.priority ?? 0,
      status: body.status || "draft",
      summary_ids: body.summary_ids || [],
      created_at: new Date().toISOString(),
      created_by: user.id,
    };

    const keys: string[] = [kwKey(id), idxInstKw(body.institution_id, id)];
    const vals: any[] = [keyword, id];

    // Link keyword to summaries (D4)
    if (body.summary_ids && Array.isArray(body.summary_ids)) {
      for (const sId of body.summary_ids) {
        keys.push(idxSummaryKw(sId, id));
        vals.push(id);
        keys.push(idxKwSummaries(id, sId));
        vals.push(sId);
      }
    }

    // Auto-create KeywordInstance if summary_id provided (D4)
    if (body.summary_id) {
      const instId = crypto.randomUUID();
      const instance = {
        id: instId,
        keyword_id: id,
        summary_id: body.summary_id,
        chunk_id: body.chunk_id ?? null,
        start_offset: body.start_offset ?? null,
        end_offset: body.end_offset ?? null,
        created_at: new Date().toISOString(),
      };
      keys.push(kwInstKey(instId));
      vals.push(instance);
    }

    await kv.mset(keys, vals);
    console.log(`[Content] POST /keywords: created '${body.term}' (${id})`);
    return c.json({ success: true, data: keyword }, 201);
  } catch (err) {
    return serverError(c, "POST /keywords", err);
  }
});

// GET /keywords?institution_id=xxx OR ?summary_id=xxx
router.get("/keywords", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const instId = c.req.query("institution_id");
    const summaryId = c.req.query("summary_id");

    if (summaryId) {
      const keywords = await getChildren(
        KV_PREFIXES.IDX_SUMMARY_KW + summaryId + ":",
        kwKey
      );
      return c.json({ success: true, data: keywords });
    }

    if (instId) {
      const keywords = await getChildren(
        KV_PREFIXES.IDX_INST_KW + instId + ":",
        kwKey
      );
      return c.json({ success: true, data: keywords });
    }

    return validationError(
      c,
      "institution_id or summary_id query param required"
    );
  } catch (err) {
    return serverError(c, "GET /keywords", err);
  }
});

// GET /keywords/:id — full keyword with subtopics, connections, links
router.get("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const keyword = await kv.get(kwKey(id));
    if (!keyword) return notFound(c, "Keyword");

    const subtopics = await getChildren(
      KV_PREFIXES.IDX_KW_SUBTOPICS + id + ":",
      subtopicKey
    );
    const connIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_CONN + id + ":"
    );
    let connections: any[] = [];
    if (connIds.length > 0) {
      connections = (
        await kv.mget(connIds.map((cId: string) => connKey(cId)))
      ).filter(Boolean);
    }
    const summaryIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_SUMMARIES + id + ":"
    );

    return c.json({
      success: true,
      data: {
        ...keyword,
        subtopics,
        connections,
        linked_summary_ids: summaryIds,
      },
    });
  } catch (err) {
    return serverError(c, "GET /keywords/:id", err);
  }
});

router.put("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const existing = await kv.get(kwKey(id));
    if (!existing) return notFound(c, "Keyword");
    const body = await c.req.json();
    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };
    await kv.set(kwKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /keywords/:id", err);
  }
});

// DELETE with cascade: subtopics + connections + summary links (D31)
router.delete("/keywords/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);
    const id = c.req.param("id");
    const kw = await kv.get(kwKey(id));
    if (!kw) return notFound(c, "Keyword");

    const stIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_SUBTOPICS + id + ":"
    );
    const connIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_CONN + id + ":"
    );
    const summaryIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_SUMMARIES + id + ":"
    );

    const keysToDelete: string[] = [
      kwKey(id),
      idxInstKw(kw.institution_id, id),
      // SubTopics
      ...stIds.map((stId: string) => subtopicKey(stId)),
      ...stIds.map((stId: string) => idxKwSubtopics(id, stId)),
      // Connections (this side)
      ...connIds.map((cId: string) => connKey(cId)),
      ...connIds.map((cId: string) => idxKwConn(id, cId)),
      // Summary links
      ...summaryIds.map((sId: string) => idxKwSummaries(id, sId)),
      ...summaryIds.map((sId: string) => idxSummaryKw(sId, id)),
    ];

    // Also remove reverse connection indices
    for (const cId of connIds) {
      const conn = await kv.get(connKey(cId));
      if (conn) {
        const otherId =
          conn.keyword_a_id === id ? conn.keyword_b_id : conn.keyword_a_id;
        keysToDelete.push(idxKwConn(otherId, cId));
      }
    }

    await kv.mdel(keysToDelete);
    console.log(
      `[Content] DELETE /keywords/${id}: cascade deleted ${keysToDelete.length} keys`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /keywords/:id", err);
  }
});

export default router;
