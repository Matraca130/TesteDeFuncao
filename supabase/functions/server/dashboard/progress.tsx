// ============================================================
// dashboard/progress.tsx
// Routes: GET /progress/keyword/:keywordId
//         GET /progress/topic/:topicId
//         GET /progress/course/:courseId
// Decision refs: D25, D26, D32
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import type { SubTopicBktState, BktColor } from "../shared-types.ts";
import {
  bktKey,
  kwKey,
  subtopicKey,
  courseKey,
  topicKey,
  KV_PREFIXES,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  serverError,
  mgetOrdered,
} from "../crud-factory.tsx";
import {
  getColorFromDelta,
  emptyByColor,
  getKeywordIdsForTopic,
  getTopicIdsForCourse,
  computeKeywordProgress,
} from "./_helpers.ts";

const progress = new Hono();

// ================================================================
// GET /progress/keyword/:keywordId — Keyword progress
// D25: keyword color = min(delta) of its sub-topics
// D26: unevaluated sub-topic → delta=0 → red
// D32: has_coverage_gap if no quiz for this keyword
// ================================================================
progress.get("/progress/keyword/:keywordId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const keywordId = c.req.param("keywordId");
    const kw = await kv.get(kwKey(keywordId));
    if (!kw) return notFound(c, "Keyword");

    // Get subtopics
    const subtopicIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_SUBTOPICS + keywordId + ":"
    );

    // Get BKT states + subtopic entities
    // FIX A2: Use mgetOrdered() instead of kv.mget() for positional access.
    // kv.mget() uses Supabase .in() which returns rows in arbitrary order
    // and omits missing keys — causing wrong subtopic↔BKT pairing when
    // accessed by index (bktStates[i], subtopics[i]).
    const bktKeys = (subtopicIds as string[]).map((stId) =>
      bktKey(user.id, stId)
    );
    const stKeys = (subtopicIds as string[]).map((stId) =>
      subtopicKey(stId)
    );
    const [bktStates, subtopics] = await Promise.all([
      bktKeys.length > 0 ? mgetOrdered(bktKeys) : [],
      stKeys.length > 0 ? mgetOrdered(stKeys) : [],
    ]);

    // Check quiz coverage (D32)
    const quizIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_KW_QUIZ + keywordId + ":"
    );

    // Build subtopic-level progress
    const subtopicProgress = (subtopicIds as string[]).map(
      (stId: string, i: number) => {
        const bkt = bktStates[i] as SubTopicBktState | null;
        const st = subtopics[i];
        const delta = bkt ? bkt.delta : 0;
        const color: BktColor = bkt ? bkt.color : "red";
        return {
          subtopic_id: stId,
          title: st?.title ?? "Unknown",
          delta: Math.round(delta * 1000) / 1000,
          color,
          evaluated: !!bkt,
          p_know: bkt ? Math.round(bkt.p_know * 1000) / 1000 : 0,
          review_count: bkt?.review_count ?? 0,
          last_review: bkt?.last_review ?? null,
        };
      }
    );

    // D25: keyword color = min(delta)
    const deltas = subtopicProgress.map((s) => s.delta);
    const minDelta = deltas.length > 0 ? Math.min(...deltas) : 0;
    const kwColor = getColorFromDelta(minDelta);

    // D32
    const hasCoverageGap =
      (quizIds as string[]).length === 0 &&
      (subtopicIds as string[]).length > 0;

    const by_color = emptyByColor();
    for (const sp of subtopicProgress) {
      by_color[sp.color] = (by_color[sp.color] || 0) + 1;
    }

    return c.json({
      success: true,
      data: {
        keyword_id: keywordId,
        term: kw.term,
        priority: kw.priority,
        min_delta: Math.round(minDelta * 1000) / 1000,
        color: kwColor,
        has_coverage_gap: hasCoverageGap,
        subtopics_count: (subtopicIds as string[]).length,
        evaluated_count: subtopicProgress.filter((s) => s.evaluated).length,
        by_color,
        subtopics: subtopicProgress,
      },
    });
  } catch (err) {
    return serverError(c, "GET /progress/keyword/:keywordId", err);
  }
});

// ================================================================
// GET /progress/topic/:topicId — Topic progress
// Aggregates keyword progress for all keywords in the topic.
// ================================================================
progress.get("/progress/topic/:topicId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const topicId = c.req.param("topicId");
    const topic = await kv.get(topicKey(topicId));
    if (!topic) return notFound(c, "Topic");

    const kwIds = await getKeywordIdsForTopic(topicId);

    const keywordResults = await Promise.all(
      kwIds.map((kwId) => computeKeywordProgress(user.id, kwId))
    );

    // Aggregate
    const by_color = emptyByColor();
    let totalSubtopics = 0;
    let totalEvaluated = 0;
    let deltaSum = 0;
    let hasCoverageGap = false;

    for (const kwp of keywordResults) {
      totalSubtopics += kwp.subtopics_count;
      totalEvaluated += kwp.evaluated_count;
      deltaSum += kwp.min_delta;
      if (kwp.has_coverage_gap) hasCoverageGap = true;
      for (const [color, count] of Object.entries(kwp.by_color)) {
        by_color[color] = (by_color[color] || 0) + count;
      }
    }

    const avgDelta =
      keywordResults.length > 0
        ? Math.round((deltaSum / keywordResults.length) * 1000) / 1000
        : 0;

    return c.json({
      success: true,
      data: {
        topic_id: topicId,
        name: topic.name,
        keywords_count: kwIds.length,
        total_subtopics: totalSubtopics,
        evaluated_subtopics: totalEvaluated,
        avg_delta: avgDelta,
        has_coverage_gap: hasCoverageGap,
        by_color,
        keywords: keywordResults,
      },
    });
  } catch (err) {
    return serverError(c, "GET /progress/topic/:topicId", err);
  }
});

// ================================================================
// GET /progress/course/:courseId — Course progress
// Full hierarchy walk: course → semesters → sections → topics.
// Returns aggregate stats + per-topic breakdown.
// ================================================================
progress.get("/progress/course/:courseId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const courseId = c.req.param("courseId");
    const course = await kv.get(courseKey(courseId));
    if (!course) return notFound(c, "Course");

    // Walk hierarchy to get all topic IDs
    const topicIds = await getTopicIdsForCourse(courseId);

    // Fetch topic entities
    const topics =
      topicIds.length > 0
        ? await kv.mget(topicIds.map((tid) => topicKey(tid)))
        : [];

    // For each topic, get keyword IDs and compute progress
    const topicSummaries = [];
    const courseByColor = emptyByColor();
    let courseTotalKw = 0;
    let courseTotalSt = 0;
    let courseEvalSt = 0;
    let courseDeltaSum = 0;
    let courseHasCoverageGap = false;

    for (let t = 0; t < topicIds.length; t++) {
      const tid = topicIds[t];
      const topicEntity = topics[t];
      const kwIds = await getKeywordIdsForTopic(tid);
      const kwResults = await Promise.all(
        kwIds.map((kwId) => computeKeywordProgress(user.id, kwId))
      );

      const topicByColor = emptyByColor();
      let topicSt = 0;
      let topicEval = 0;
      let topicDeltaSum = 0;
      let topicCovGap = false;

      for (const kwp of kwResults) {
        topicSt += kwp.subtopics_count;
        topicEval += kwp.evaluated_count;
        topicDeltaSum += kwp.min_delta;
        if (kwp.has_coverage_gap) topicCovGap = true;
        for (const [color, count] of Object.entries(kwp.by_color)) {
          topicByColor[color] = (topicByColor[color] || 0) + count;
          courseByColor[color] = (courseByColor[color] || 0) + count;
        }
      }

      courseTotalKw += kwIds.length;
      courseTotalSt += topicSt;
      courseEvalSt += topicEval;
      courseDeltaSum += topicDeltaSum;
      if (topicCovGap) courseHasCoverageGap = true;

      topicSummaries.push({
        topic_id: tid,
        name: topicEntity?.name ?? "Unknown",
        keywords_count: kwIds.length,
        total_subtopics: topicSt,
        evaluated_subtopics: topicEval,
        avg_delta:
          kwResults.length > 0
            ? Math.round((topicDeltaSum / kwResults.length) * 1000) / 1000
            : 0,
        has_coverage_gap: topicCovGap,
        by_color: topicByColor,
      });
    }

    const courseAvgDelta =
      courseTotalKw > 0
        ? Math.round((courseDeltaSum / courseTotalKw) * 1000) / 1000
        : 0;

    return c.json({
      success: true,
      data: {
        course_id: courseId,
        name: course.name,
        total_topics: topicIds.length,
        total_keywords: courseTotalKw,
        total_subtopics: courseTotalSt,
        evaluated_subtopics: courseEvalSt,
        avg_delta: courseAvgDelta,
        has_coverage_gap: courseHasCoverageGap,
        by_color: courseByColor,
        topics: topicSummaries,
      },
    });
  } catch (err) {
    return serverError(c, "GET /progress/course/:courseId", err);
  }
});

export default progress;
