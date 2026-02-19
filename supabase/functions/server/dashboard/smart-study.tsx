// ============================================================
// dashboard/smart-study.tsx
// Route: POST /smart-study/generate
// NeedScore-based study item selection (D35)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import type { SubTopicBktState, BktColor } from "../shared-types.ts";
import {
  bktKey,
  kwKey,
  KV_PREFIXES,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  validationError,
  serverError,
} from "../crud-factory.tsx";
import {
  calculateNeedScore,
  getKeywordIdsForTopic,
  getTopicIdsForCourse,
} from "./_helpers.ts";

const smartStudy = new Hono();

// ================================================================
// POST /smart-study/generate — Generate smart study items (D35)
// Body: { instruments: ['flashcard'|'quiz'], max_items?: number,
//         course_id?: string, topic_id?: string }
// Returns: SmartStudyItem[] sorted by NeedScore descending
// ================================================================
smartStudy.post("/smart-study/generate", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const instruments: string[] = body.instruments ?? ["flashcard", "quiz"];
    const maxItems = body.max_items ?? 20;
    const courseId = body.course_id ?? null;
    const topicId = body.topic_id ?? null;

    if (!Array.isArray(instruments) || instruments.length === 0) {
      return validationError(
        c,
        "instruments must be a non-empty array of 'flashcard' and/or 'quiz'"
      );
    }

    // Optional filter: get keyword IDs for course/topic
    let filterKwIds: Set<string> | null = null;
    if (topicId) {
      const kwIds = await getKeywordIdsForTopic(topicId);
      filterKwIds = new Set(kwIds);
    } else if (courseId) {
      const topicIds = await getTopicIdsForCourse(courseId);
      const allKwIds = new Set<string>();
      for (const tid of topicIds) {
        const kwIds = await getKeywordIdsForTopic(tid);
        kwIds.forEach((id) => allKwIds.add(id));
      }
      filterKwIds = allKwIds;
    }

    // Get all BKT states for this student
    const allSubtopicIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_BKT + user.id + ":"
    );
    const allBktStates =
      allSubtopicIds.length > 0
        ? await kv.mget(
            (allSubtopicIds as string[]).map((stId: string) =>
              bktKey(user.id, stId)
            )
          )
        : [];

    // Group BKT states by keyword_id
    const bktByKeyword = new Map<string, SubTopicBktState[]>();
    for (const bkt of allBktStates.filter(Boolean) as SubTopicBktState[]) {
      if (filterKwIds && !filterKwIds.has(bkt.keyword_id)) continue;
      const list = bktByKeyword.get(bkt.keyword_id) || [];
      list.push(bkt);
      bktByKeyword.set(bkt.keyword_id, list);
    }

    // Compute NeedScore for each keyword's items
    const scoredItems: Array<{
      item_id: string;
      instrument_type: string;
      need_score: number;
      subtopic_id: string;
      keyword_id: string;
      current_delta: number;
      current_color: BktColor;
    }> = [];

    for (const [kwId, bktList] of bktByKeyword.entries()) {
      // Get keyword for priority
      const kwData = await kv.get(kwKey(kwId));
      if (!kwData) continue;

      // Get all subtopics for this keyword (for completion ratio)
      const allStIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":"
      );
      const kwCompletion =
        allStIds.length > 0 ? bktList.length / allStIds.length : 0;

      // Compute NeedScore from the worst subtopic
      let worstBkt = bktList[0];
      for (const bkt of bktList) {
        if (bkt.delta < worstBkt.delta) worstBkt = bkt;
      }

      const daysSince = worstBkt.last_review
        ? (Date.now() - Date.parse(worstBkt.last_review)) / 86_400_000
        : 999;
      const stability = Math.max(worstBkt.stability, 0.1);
      const overdue = Math.max(0, daysSince - stability) / stability;
      const masteryGap = 1 - worstBkt.delta;
      const fragility = 1 / stability;

      const score = calculateNeedScore(
        overdue,
        masteryGap,
        fragility,
        kwCompletion,
        kwData.priority ?? 1
      );

      // Find available items for this keyword
      if (instruments.includes("flashcard")) {
        const cardIds = await kv.getByPrefix(
          KV_PREFIXES.IDX_KW_FC + kwId + ":"
        );
        for (const cardId of cardIds as string[]) {
          scoredItems.push({
            item_id: cardId,
            instrument_type: "flashcard",
            need_score: score,
            subtopic_id: worstBkt.subtopic_id,
            keyword_id: kwId,
            current_delta: worstBkt.delta,
            current_color: worstBkt.color,
          });
        }
      }

      if (instruments.includes("quiz")) {
        const quizIds = await kv.getByPrefix(
          KV_PREFIXES.IDX_KW_QUIZ + kwId + ":"
        );
        for (const qId of quizIds as string[]) {
          scoredItems.push({
            item_id: qId,
            instrument_type: "quiz",
            need_score: score,
            subtopic_id: worstBkt.subtopic_id,
            keyword_id: kwId,
            current_delta: worstBkt.delta,
            current_color: worstBkt.color,
          });
        }
      }
    }

    // Sort by NeedScore descending, take top N
    scoredItems.sort((a, b) => b.need_score - a.need_score);
    const topItems = scoredItems.slice(0, maxItems);

    console.log(
      `[SmartStudy] Generated ${topItems.length} items for ${user.id.slice(0, 8)}… ` +
        `(${scoredItems.length} total scored, instruments=${instruments.join(",")})`
    );

    return c.json({ success: true, data: topItems });
  } catch (err) {
    return serverError(c, "POST /smart-study/generate", err);
  }
});

export default smartStudy;
