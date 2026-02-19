// ============================================================
// Axon v4.4 — Content Routes: Batch Content Approval
// ============================================================
// D20: Bulk status update for keywords, subtopics, summaries
//
// PUT /content/batch-status
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import {
  kwKey,
  subtopicKey,
  summaryKey,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  validationError,
  serverError,
} from "./_helpers.ts";

const router = new Hono();

router.put("/content/batch-status", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const items = body.items;
    if (!items || !Array.isArray(items) || items.length === 0)
      return validationError(c, "Missing items array");

    const validStatuses = ["draft", "published", "rejected"];
    const entityKeyFns: Record<string, (id: string) => string> = {
      keyword: kwKey,
      subtopic: subtopicKey,
      summary: summaryKey,
    };

    const results: any[] = [];
    const keysToWrite: string[] = [];
    const valsToWrite: any[] = [];

    for (const item of items) {
      const { entity_type, id, new_status } = item;

      if (!entity_type || !id || !new_status)
        return validationError(
          c,
          "Invalid item: missing entity_type, id, or new_status"
        );
      if (!validStatuses.includes(new_status))
        return validationError(
          c,
          `Invalid status: ${new_status}. Must be one of: ${validStatuses.join(", ")}`
        );

      const keyFn = entityKeyFns[entity_type];
      if (!keyFn)
        return validationError(
          c,
          `Unsupported entity_type: ${entity_type}`
        );

      const existing = await kv.get(keyFn(id));
      if (!existing) {
        results.push({ id, entity_type, success: false, reason: "not found" });
        continue;
      }

      const updated = {
        ...existing,
        status: new_status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewer_note: body.reviewer_note || null,
      };

      keysToWrite.push(keyFn(id));
      valsToWrite.push(updated);
      results.push({ id, entity_type, success: true, new_status });
    }

    if (keysToWrite.length > 0) {
      await kv.mset(keysToWrite, valsToWrite);
    }

    console.log(
      `[Content] PUT /content/batch-status: processed ${results.length} items`
    );
    return c.json({
      success: true,
      data: {
        processed: results.length,
        approved: results.filter(
          (r) => r.success && r.new_status === "published"
        ).length,
        rejected: results.filter(
          (r) => r.success && r.new_status === "rejected"
        ).length,
        errors: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (err) {
    return serverError(c, "PUT /content/batch-status", err);
  }
});

export default router;
