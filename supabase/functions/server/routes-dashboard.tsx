// ============================================================
// Axon v4.2 — Dev 5: Dashboard, Progress, Smart Study & Plans
// ============================================================
// 16 routes:
//   GET  /stats                           — Student stats
//   GET  /daily-activity                  — Heatmap data (?from&to)
//   GET  /daily-activity/:date            — Single day activity
//   GET  /progress/keyword/:keywordId     — Keyword progress (D25, D26, D32)
//   GET  /progress/topic/:topicId         — Topic progress
//   GET  /progress/course/:courseId        — Course progress
//   POST /smart-study/generate            — NeedScore-based study items (D35)
//   POST /study-plans                     — Create plan (D18)
//   GET  /study-plans                     — List student's plans
//   GET  /study-plans/:id                 — Get plan detail
//   PUT  /study-plans/:id                 — Update plan
//   DELETE /study-plans/:id               — Delete plan + tasks
//   POST /study-plans/:id/recalculate     — Recalculate plan tasks (D19)
//   GET  /study-plans/:id/tasks           — Get tasks (?date, ?from&to)
//   PUT  /study-plan-tasks/:id/complete   — Mark task done
//   POST /sessions/:id/finalize-stats     — Update daily + stats after session end
//
// Imports:
//   ./kv-keys.ts       — Canonical key generation functions
//   ./shared-types.ts  — Entity type definitions
//   ./crud-factory.tsx — Shared helpers
//   ./kv_store.tsx     — KV CRUD operations
//
// NeedScore is computed SERVER-SIDE (D10). Frontend sends only grade.
// calculateNeedScore implemented here (not in fsrs-engine.ts which is PROTECTED).
//
// Key decisions:
//   D10 — Backend computes all algorithmic state
//   D18 — Student defines constraints, system distributes
//   D19 — Plan is suggestion, progress recalculates
//   D25 — Keyword color = min(delta) of its sub-topics
//   D26 — Unevaluated sub-topic → delta=0 → red
//   D32 — Alert if sub-topic has no quiz coverage
//   D35 — Smart study selects by NeedScore
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import type {
  SubTopicBktState,
  StudyPlan,
  StudyPlanTask,
  StudentStats,
  DailyActivity,
  BktColor,
} from "./shared-types.ts";
import {
  // Primary keys
  bktKey,
  kwKey,
  kwInstKey,
  subtopicKey,
  sessionKey,
  dailyKey,
  statsKey,
  planKey,
  planTaskKey,
  courseKey,
  topicKey,
  // Index keys
  idxStudentBkt,
  idxStudentKwBkt,
  idxStudentPlans,
  idxPlanTasks,
  idxKwSubtopics,
  // Prefixes
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "./crud-factory.tsx";

const dashboard = new Hono();

// ═══════════════════════════════════════════════════════════
// NeedScore computation (server-side, D10)
// Implemented here because fsrs-engine.ts is PROTECTED.
// Formula: weighted sum of overdue, masteryGap, fragility,
//          coverage gap, and priority.
// ═══════════════════════════════════════════════════════════
function calculateNeedScore(
  overdue: number,
  masteryGap: number,
  fragility: number,
  kwCompletion: number,
  priority: number
): number {
  // priority 1 = most important → weight 1.0; priority 5 → weight 0.2
  const priorityWeight = (6 - Math.min(Math.max(priority, 1), 5)) / 5;
  const overdueNorm = Math.min(overdue, 3) / 3;
  const fragilityNorm = Math.min(fragility, 5) / 5;
  const coverageGap = 1 - kwCompletion;

  const score =
    0.35 * overdueNorm +
    0.30 * masteryGap +
    0.15 * fragilityNorm +
    0.10 * coverageGap +
    0.10 * priorityWeight;

  return Math.round(score * 1000) / 1000;
}

// ── BKT helpers (same as routes-reviews.tsx, kept local) ────
function getColorFromDelta(delta: number): BktColor {
  if (delta >= 1.0) return "green";
  if (delta >= 0.6) return "yellow";
  if (delta >= 0.3) return "orange";
  return "red";
}

// ── Date helpers ────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function emptyByColor(): Record<string, number> {
  return { red: 0, orange: 0, yellow: 0, green: 0 };
}

// ── Hierarchy walk helpers ──────────────────────────────────

/** Get keyword IDs linked to a specific topic via summaries → keyword instances */
async function getKeywordIdsForTopic(topicId: string): Promise<string[]> {
  const summaryIds = await kv.getByPrefix(
    KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":"
  );
  const kwIdSet = new Set<string>();
  for (const sumId of summaryIds as string[]) {
    const kwInstIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SUMMARY_KW + sumId + ":"
    );
    if (kwInstIds.length > 0) {
      const kwInsts = await kv.mget(
        (kwInstIds as string[]).map((id: string) => kwInstKey(id))
      );
      for (const inst of kwInsts.filter(Boolean)) {
        if (inst.keyword_id) kwIdSet.add(inst.keyword_id);
      }
    }
  }
  return Array.from(kwIdSet);
}

/** Get all topic IDs for a course (course → semesters → sections → topics) */
async function getTopicIdsForCourse(courseId: string): Promise<string[]> {
  const semIds = await kv.getByPrefix(
    KV_PREFIXES.IDX_COURSE_SEMESTERS + courseId + ":"
  );
  const topicIds: string[] = [];
  for (const semId of semIds as string[]) {
    const secIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":"
    );
    for (const secId of secIds as string[]) {
      const tIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":"
      );
      topicIds.push(...(tIds as string[]));
    }
  }
  return topicIds;
}

/** Compute keyword progress for a student + keyword */
async function computeKeywordProgress(
  userId: string,
  keywordId: string
): Promise<{
  keyword_id: string;
  term: string;
  priority: number;
  min_delta: number;
  color: BktColor;
  has_coverage_gap: boolean;
  subtopics_count: number;
  evaluated_count: number;
  by_color: Record<string, number>;
}> {
  const kw = await kv.get(kwKey(keywordId));
  const term = kw?.term ?? "Unknown";
  const priority = kw?.priority ?? 1;

  // Get subtopics
  const subtopicIds = await kv.getByPrefix(
    KV_PREFIXES.IDX_KW_SUBTOPICS + keywordId + ":"
  );

  if (!subtopicIds || subtopicIds.length === 0) {
    // No subtopics → unevaluated → delta=0 → red (D26)
    return {
      keyword_id: keywordId,
      term,
      priority,
      min_delta: 0,
      color: "red",
      has_coverage_gap: true,
      subtopics_count: 0,
      evaluated_count: 0,
      by_color: { ...emptyByColor(), red: 0 },
    };
  }

  // Get BKT states
  const bktKeys = (subtopicIds as string[]).map((stId) =>
    bktKey(userId, stId)
  );
  const bktStates = await kv.mget(bktKeys);

  // Check quiz coverage (D32)
  const quizIds = await kv.getByPrefix(
    KV_PREFIXES.IDX_KW_QUIZ + keywordId + ":"
  );

  let minDelta = Infinity;
  let evaluatedCount = 0;
  const by_color = emptyByColor();

  for (let i = 0; i < (subtopicIds as string[]).length; i++) {
    const bkt = bktStates[i] as SubTopicBktState | null;
    const delta = bkt ? bkt.delta : 0; // D26: unevaluated → delta=0
    const color: BktColor = bkt ? bkt.color : "red"; // D26: → red
    if (bkt) evaluatedCount++;
    if (delta < minDelta) minDelta = delta;
    by_color[color] = (by_color[color] || 0) + 1;
  }

  if (minDelta === Infinity) minDelta = 0;

  // D25: keyword color = min(delta)
  const kwColor = getColorFromDelta(minDelta);

  // D32: has_coverage_gap if no quizzes exist for this keyword
  const hasCoverageGap =
    (quizIds as string[]).length === 0 &&
    (subtopicIds as string[]).length > 0;

  return {
    keyword_id: keywordId,
    term,
    priority,
    min_delta: Math.round(minDelta * 1000) / 1000,
    color: kwColor,
    has_coverage_gap: hasCoverageGap,
    subtopics_count: (subtopicIds as string[]).length,
    evaluated_count: evaluatedCount,
    by_color,
  };
}

// ================================================================
// GET /stats — Student stats
// ================================================================
dashboard.get("/stats", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const stats = await kv.get(statsKey(user.id));
    if (!stats) {
      const empty: StudentStats = {
        student_id: user.id,
        total_reviews: 0,
        total_correct: 0,
        total_sessions: 0,
        current_streak: 0,
        longest_streak: 0,
        total_time_seconds: 0,
        cards_mastered: 0,
        cards_learning: 0,
        cards_new: 0,
        updated_at: new Date().toISOString(),
      };
      return c.json({ success: true, data: empty });
    }
    return c.json({ success: true, data: stats });
  } catch (err) {
    return serverError(c, "GET /stats", err);
  }
});

// ================================================================
// GET /daily-activity — Heatmap data for date range
// ================================================================
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (max 365 days)
// Returns array of DailyActivity objects (only days with activity)
// ================================================================
dashboard.get("/daily-activity", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const from = c.req.query("from");
    const to = c.req.query("to") || todayStr();

    if (!from) {
      return validationError(c, "Missing required query param: from (YYYY-MM-DD)");
    }

    // Generate date range
    const dates: string[] = [];
    const startDate = new Date(from + "T00:00:00Z");
    const endDate = new Date(to + "T00:00:00Z");

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      dates.push(d.toISOString().split("T")[0]);
    }

    // Cap at 365 days
    const cappedDates = dates.slice(0, 365);

    // Batch fetch
    const keys = cappedDates.map((date) => dailyKey(user.id, date));
    const activities = await kv.mget(keys);

    // Return only non-null entries
    const result = activities.filter(Boolean);

    return c.json({ success: true, data: result });
  } catch (err) {
    return serverError(c, "GET /daily-activity", err);
  }
});

// ================================================================
// GET /daily-activity/:date — Single day activity
// ================================================================
dashboard.get("/daily-activity/:date", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const date = c.req.param("date");
    const activity = await kv.get(dailyKey(user.id, date));

    return c.json({ success: true, data: activity ?? null });
  } catch (err) {
    return serverError(c, "GET /daily-activity/:date", err);
  }
});

// ================================================================
// GET /progress/keyword/:keywordId — Keyword progress
// ================================================================
// D25: keyword color = min(delta) of its sub-topics
// D26: unevaluated sub-topic → delta=0 → red
// D32: has_coverage_gap if no quiz for this keyword
// ================================================================
dashboard.get("/progress/keyword/:keywordId", async (c) => {
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
    const bktKeys = (subtopicIds as string[]).map((stId) =>
      bktKey(user.id, stId)
    );
    const stKeys = (subtopicIds as string[]).map((stId) =>
      subtopicKey(stId)
    );
    const [bktStates, subtopics] = await Promise.all([
      bktKeys.length > 0 ? kv.mget(bktKeys) : [],
      stKeys.length > 0 ? kv.mget(stKeys) : [],
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
// ================================================================
// Aggregates keyword progress for all keywords in the topic.
// ================================================================
dashboard.get("/progress/topic/:topicId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const topicId = c.req.param("topicId");
    const topic = await kv.get(topicKey(topicId));
    if (!topic) return notFound(c, "Topic");

    // Get keyword IDs for this topic
    const kwIds = await getKeywordIdsForTopic(topicId);

    // Compute progress for each keyword
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
// ================================================================
// Full hierarchy walk: course → semesters → sections → topics.
// Returns aggregate stats + per-topic breakdown.
// ================================================================
dashboard.get("/progress/course/:courseId", async (c) => {
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

// ================================================================
// POST /smart-study/generate — Generate smart study items (D35)
// ================================================================
// Body: { instruments: ['flashcard'|'quiz'], max_items?: number,
//         course_id?: string, topic_id?: string }
// Returns: SmartStudyItem[] sorted by NeedScore descending
// ================================================================
dashboard.post("/smart-study/generate", async (c) => {
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

// ================================================================
// POST /study-plans — Create a study plan (D18)
// ================================================================
// Body: { title?, course_id?, target_date?, weekly_hours? }
// weekly_hours: [mon,tue,wed,thu,fri,sat,sun] hours per day
// ================================================================
dashboard.post("/study-plans", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const plan: StudyPlan & {
      weekly_hours?: number[];
      created_by: string;
    } = {
      id,
      student_id: user.id,
      course_id: body.course_id ?? null,
      title: body.title ?? "Study Plan",
      status: "active",
      target_date: body.target_date ?? null,
      weekly_hours: body.weekly_hours ?? [2, 2, 2, 2, 2, 1, 1], // default 12h/week
      created_by: user.id,
      created_at: now,
      updated_at: now,
    };

    await kv.mset(
      [planKey(id), idxStudentPlans(user.id, id)],
      [plan, id]
    );

    console.log(
      `[StudyPlans] Created plan ${id.slice(0, 8)}… for ${user.id.slice(0, 8)}…`
    );
    return c.json({ success: true, data: plan }, 201);
  } catch (err) {
    return serverError(c, "POST /study-plans", err);
  }
});

// ================================================================
// GET /study-plans — List student's plans
// ================================================================
dashboard.get("/study-plans", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const planIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_PLANS + user.id + ":"
    );
    if (!planIds || planIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const plans = await kv.mget(
      (planIds as string[]).map((pid: string) => planKey(pid))
    );

    return c.json({
      success: true,
      data: plans.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /study-plans", err);
  }
});

// ================================================================
// GET /study-plans/:id — Get plan with summary stats
// ================================================================
dashboard.get("/study-plans/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const plan = await kv.get(planKey(id));
    if (!plan) return notFound(c, "StudyPlan");

    if (plan.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot access another student's plan",
          },
        },
        403
      );
    }

    // Get task count summary
    const taskIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_PLAN_TASKS + id + ":"
    );
    let completedCount = 0;
    let pendingCount = 0;
    if (taskIds.length > 0) {
      const tasks = await kv.mget(
        (taskIds as string[]).map((tid: string) => planTaskKey(tid))
      );
      for (const task of tasks.filter(Boolean)) {
        if (task.status === "completed") completedCount++;
        else pendingCount++;
      }
    }

    return c.json({
      success: true,
      data: {
        ...plan,
        task_summary: {
          total: taskIds.length,
          completed: completedCount,
          pending: pendingCount,
        },
      },
    });
  } catch (err) {
    return serverError(c, "GET /study-plans/:id", err);
  }
});

// ================================================================
// PUT /study-plans/:id — Update plan config
// ================================================================
dashboard.put("/study-plans/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const plan = await kv.get(planKey(id));
    if (!plan) return notFound(c, "StudyPlan");

    if (plan.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not your plan" },
        },
        403
      );
    }

    const body = await c.req.json();
    const updated = {
      ...plan,
      ...body,
      id, // prevent ID overwrite
      student_id: plan.student_id, // prevent ownership overwrite
      updated_at: new Date().toISOString(),
    };

    await kv.set(planKey(id), updated);
    return c.json({ success: true, data: updated });
  } catch (err) {
    return serverError(c, "PUT /study-plans/:id", err);
  }
});

// ================================================================
// DELETE /study-plans/:id — Delete plan + all tasks
// ================================================================
dashboard.delete("/study-plans/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const plan = await kv.get(planKey(id));
    if (!plan) return notFound(c, "StudyPlan");

    if (plan.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not your plan" },
        },
        403
      );
    }

    // Collect all task keys + index keys
    const taskIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_PLAN_TASKS + id + ":"
    );

    const keysToDelete: string[] = [
      planKey(id),
      idxStudentPlans(user.id, id),
    ];

    // For each task, delete primary key + index key
    for (const tid of taskIds as string[]) {
      const courseIdForIdx = plan.course_id || "_";
      keysToDelete.push(planTaskKey(tid));
      keysToDelete.push(idxPlanTasks(id, courseIdForIdx, tid));
    }

    await kv.mdel(keysToDelete);

    console.log(
      `[StudyPlans] Deleted plan ${id.slice(0, 8)}… with ${taskIds.length} tasks`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err) {
    return serverError(c, "DELETE /study-plans/:id", err);
  }
});

// ================================================================
// POST /study-plans/:id/recalculate — Recalculate plan tasks (D19)
// ================================================================
// Re-runs NeedScore, generates future tasks based on plan config.
// Deletes existing pending tasks and creates new ones.
// ================================================================
dashboard.post("/study-plans/:id/recalculate", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const planId = c.req.param("id");
    const plan = await kv.get(planKey(planId));
    if (!plan) return notFound(c, "StudyPlan");

    if (plan.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not your plan" },
        },
        403
      );
    }

    // Get current pending tasks to delete
    const existingTaskIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_PLAN_TASKS + planId + ":"
    );
    const keysToDelete: string[] = [];
    if (existingTaskIds.length > 0) {
      const existingTasks = await kv.mget(
        (existingTaskIds as string[]).map((tid: string) => planTaskKey(tid))
      );
      for (let i = 0; i < existingTaskIds.length; i++) {
        const task = existingTasks[i];
        if (task && task.status !== "completed") {
          const tid = (existingTaskIds as string[])[i];
          const courseIdForIdx = plan.course_id || "_";
          keysToDelete.push(planTaskKey(tid));
          keysToDelete.push(idxPlanTasks(planId, courseIdForIdx, tid));
        }
      }
    }
    if (keysToDelete.length > 0) {
      await kv.mdel(keysToDelete);
    }

    // Generate smart study items for the plan's scope
    const allBktIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_BKT + user.id + ":"
    );
    const allBkt =
      allBktIds.length > 0
        ? await kv.mget(
            (allBktIds as string[]).map((stId: string) =>
              bktKey(user.id, stId)
            )
          )
        : [];

    // Filter by course if plan has one
    let filterKwIds: Set<string> | null = null;
    if (plan.course_id) {
      const topicIds = await getTopicIdsForCourse(plan.course_id);
      const kwSet = new Set<string>();
      for (const tid of topicIds) {
        const kwIds = await getKeywordIdsForTopic(tid);
        kwIds.forEach((id) => kwSet.add(id));
      }
      filterKwIds = kwSet;
    }

    // Score keywords by NeedScore
    const kwScores = new Map<
      string,
      { score: number; kwId: string; term: string }
    >();
    for (const bkt of allBkt.filter(Boolean) as SubTopicBktState[]) {
      if (filterKwIds && !filterKwIds.has(bkt.keyword_id)) continue;
      if (kwScores.has(bkt.keyword_id)) continue; // one per keyword

      const kwData = await kv.get(kwKey(bkt.keyword_id));
      if (!kwData) continue;

      const allStIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_SUBTOPICS + bkt.keyword_id + ":"
      );
      const bktForKw = allBkt.filter(
        (b: any) => b && b.keyword_id === bkt.keyword_id
      );
      const kwCompletion =
        allStIds.length > 0 ? bktForKw.length / allStIds.length : 0;

      const daysSince = bkt.last_review
        ? (Date.now() - Date.parse(bkt.last_review)) / 86_400_000
        : 999;
      const stability = Math.max(bkt.stability, 0.1);
      const overdue = Math.max(0, daysSince - stability) / stability;
      const masteryGap = 1 - bkt.delta;
      const fragility = 1 / stability;

      const score = calculateNeedScore(
        overdue,
        masteryGap,
        fragility,
        kwCompletion,
        kwData.priority ?? 1
      );

      kwScores.set(bkt.keyword_id, {
        score,
        kwId: bkt.keyword_id,
        term: kwData.term ?? "Review",
      });
    }

    // Sort by NeedScore descending
    const sortedKws = Array.from(kwScores.values()).sort(
      (a, b) => b.score - a.score
    );

    // Generate tasks: distribute over days based on weekly_hours
    const weeklyHours: number[] = plan.weekly_hours ?? [2, 2, 2, 2, 2, 1, 1];
    const today = new Date();
    const targetDate = plan.target_date
      ? new Date(plan.target_date + "T23:59:59Z")
      : new Date(today.getTime() + 30 * 86_400_000); // default 30 days

    const newKeys: string[] = [];
    const newValues: unknown[] = [];
    let taskIndex = 0;
    const courseIdForIdx = plan.course_id || "_";
    const ITEMS_PER_HOUR = 8; // ~7.5 min per item

    // Walk through days and assign items
    let kwIdx = 0;
    for (
      let d = new Date(today);
      d <= targetDate && kwIdx < sortedKws.length;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      // Map to weekly_hours: [Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6]
      const whIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const hoursToday = weeklyHours[whIndex] ?? 0;
      const itemsToday = Math.floor(hoursToday * ITEMS_PER_HOUR);

      if (itemsToday === 0) continue;

      const dateStr = d.toISOString().split("T")[0];

      for (let i = 0; i < itemsToday && kwIdx < sortedKws.length; i++) {
        const kw = sortedKws[kwIdx];
        const taskId = crypto.randomUUID();
        const task: StudyPlanTask = {
          id: taskId,
          plan_id: planId,
          title: `Review: ${kw.term}`,
          description: `NeedScore: ${kw.score.toFixed(3)}`,
          task_type: "review",
          status: "pending",
          target_item_id: kw.kwId,
          order_index: taskIndex++,
          due_date: dateStr,
        };

        newKeys.push(planTaskKey(taskId));
        newValues.push(task);
        newKeys.push(idxPlanTasks(planId, courseIdForIdx, taskId));
        newValues.push(taskId);

        kwIdx++;
      }
    }

    if (newKeys.length > 0) {
      await kv.mset(newKeys, newValues);
    }

    // Update plan timestamp
    plan.updated_at = new Date().toISOString();
    await kv.set(planKey(planId), plan);

    console.log(
      `[StudyPlans] Recalculated plan ${planId.slice(0, 8)}…: ${taskIndex} tasks generated`
    );

    return c.json({
      success: true,
      data: {
        plan_id: planId,
        tasks_generated: taskIndex,
        keywords_scored: sortedKws.length,
      },
    });
  } catch (err) {
    return serverError(c, "POST /study-plans/:id/recalculate", err);
  }
});

// ================================================================
// GET /study-plans/:id/tasks — Get plan tasks
// ================================================================
// Query: ?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
// Without params returns all tasks.
// ================================================================
dashboard.get("/study-plans/:id/tasks", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const planId = c.req.param("id");
    const plan = await kv.get(planKey(planId));
    if (!plan) return notFound(c, "StudyPlan");

    if (plan.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not your plan" },
        },
        403
      );
    }

    const taskIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_PLAN_TASKS + planId + ":"
    );
    if (!taskIds || taskIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const tasks = await kv.mget(
      (taskIds as string[]).map((tid: string) => planTaskKey(tid))
    );
    let result = tasks.filter(Boolean);

    // Date filtering
    const date = c.req.query("date");
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (date) {
      result = result.filter((t: any) => t.due_date === date);
    } else if (from) {
      const toDate = to || "9999-12-31";
      result = result.filter(
        (t: any) => t.due_date && t.due_date >= from && t.due_date <= toDate
      );
    }

    // Sort by order_index
    result.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));

    return c.json({ success: true, data: result });
  } catch (err) {
    return serverError(c, "GET /study-plans/:id/tasks", err);
  }
});

// ================================================================
// PUT /study-plan-tasks/:id/complete — Mark task done
// ================================================================
dashboard.put("/study-plan-tasks/:id/complete", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const taskId = c.req.param("id");
    const task = await kv.get(planTaskKey(taskId));
    if (!task) return notFound(c, "StudyPlanTask");

    // Verify ownership via plan
    const plan = await kv.get(planKey(task.plan_id));
    if (!plan || plan.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not your task" },
        },
        403
      );
    }

    if (task.status === "completed") {
      return validationError(c, "Task already completed");
    }

    const updatedTask = {
      ...task,
      status: "completed" as const,
      completed_at: new Date().toISOString(),
    };

    await kv.set(planTaskKey(taskId), updatedTask);

    console.log(
      `[StudyPlans] Task ${taskId.slice(0, 8)}… completed in plan ${task.plan_id.slice(0, 8)}…`
    );
    return c.json({ success: true, data: updatedTask });
  } catch (err) {
    return serverError(c, "PUT /study-plan-tasks/:id/complete", err);
  }
});

// ================================================================
// POST /sessions/:id/finalize-stats — Update daily + stats
// ================================================================
// Called after PUT /sessions/:id/end to update:
//   daily:{userId}:{today} — increment study time, sessions, reviews
//   stats:{userId} — recompute totals and streak
// This is a separate endpoint to keep session logic isolated.
// ================================================================
dashboard.post("/sessions/:id/finalize-stats", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const sessionId = c.req.param("id");
    const session = await kv.get(sessionKey(sessionId));
    if (!session) return notFound(c, "Session");

    if (session.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not your session" },
        },
        403
      );
    }

    if (!session.ended_at) {
      return validationError(c, "Session not ended yet. Call PUT /sessions/:id/end first.");
    }

    const today = todayStr();
    const userId = user.id;

    // ── 1. Update DailyActivity ──────────────────────────
    let daily: DailyActivity | null = await kv.get(dailyKey(userId, today));
    if (!daily) {
      daily = {
        student_id: userId,
        date: today,
        reviews_count: 0,
        correct_count: 0,
        time_spent_seconds: 0,
        sessions_count: 0,
        new_cards_seen: 0,
      };
    }

    daily.sessions_count += 1;
    daily.time_spent_seconds += session.duration_seconds ?? 0;
    daily.reviews_count += session.total_reviews ?? 0;
    daily.correct_count += session.correct_reviews ?? 0;

    // ── 2. Update StudentStats ───────────────────────────
    let stats: StudentStats | null = await kv.get(statsKey(userId));
    if (!stats) {
      stats = {
        student_id: userId,
        total_reviews: 0,
        total_correct: 0,
        total_sessions: 0,
        current_streak: 0,
        longest_streak: 0,
        total_time_seconds: 0,
        cards_mastered: 0,
        cards_learning: 0,
        cards_new: 0,
        updated_at: new Date().toISOString(),
      };
    }

    stats.total_sessions += 1;
    stats.total_reviews += session.total_reviews ?? 0;
    stats.total_correct += session.correct_reviews ?? 0;
    stats.total_time_seconds += session.duration_seconds ?? 0;
    stats.last_study_date = today;
    stats.updated_at = new Date().toISOString();

    // ── 3. Compute streak ────────────────────────────────
    // Only update streak on the FIRST session of the day (D2 fix).
    // daily.sessions_count was already incremented above, so
    // sessions_count === 1 means this is the first finalize today.
    if (daily.sessions_count === 1) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const yesterdayActivity = await kv.get(dailyKey(userId, yesterdayStr));

      if (yesterdayActivity && yesterdayActivity.sessions_count > 0) {
        // Continuing streak from yesterday
        stats.current_streak = (stats.current_streak || 0) + 1;
      } else {
        // No activity yesterday — streak resets to 1
        stats.current_streak = 1;
      }

      if (stats.current_streak > (stats.longest_streak || 0)) {
        stats.longest_streak = stats.current_streak;
      }
    }

    // ── 4. Count card states from BKT/FSRS ────────────────
    try {
      const bktIds = await kv.getByPrefix(
        KV_PREFIXES.IDX_STUDENT_BKT + userId + ":"
      );
      if (bktIds.length > 0) {
        const bktStates = await kv.mget(
          (bktIds as string[]).map((stId: string) => bktKey(userId, stId))
        );
        let mastered = 0;
        let learning = 0;
        let newCards = 0;
        for (const bkt of bktStates.filter(Boolean) as SubTopicBktState[]) {
          if (bkt.delta >= 1.0) mastered++;
          else if (bkt.review_count > 0) learning++;
          else newCards++;
        }
        stats.cards_mastered = mastered;
        stats.cards_learning = learning;
        stats.cards_new = newCards;
      }
    } catch (_e) {
      // Non-critical
    }

    // ── 5. Persist ────────────────────────────────────────
    await kv.mset(
      [dailyKey(userId, today), statsKey(userId)],
      [daily, stats]
    );

    console.log(
      `[Dashboard] Finalized stats for session ${sessionId.slice(0, 8)}…: ` +
        `daily(${daily.sessions_count} sessions, ${daily.time_spent_seconds}s), ` +
        `stats(streak=${stats.current_streak})`
    );

    return c.json({
      success: true,
      data: {
        daily,
        stats,
      },
    });
  } catch (err) {
    return serverError(c, "POST /sessions/:id/finalize-stats", err);
  }
});

export default dashboard;
