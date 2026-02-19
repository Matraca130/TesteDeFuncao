// ============================================================
// dashboard/_helpers.ts
// Shared helpers for Dashboard module
// NeedScore (D10), BKT color, date utils, hierarchy walkers
// ============================================================
import * as kv from "../kv_store.tsx";
import type { SubTopicBktState, BktColor } from "../shared-types.ts";
import {
  bktKey,
  kwKey,
  kwInstKey,
  subtopicKey,
  KV_PREFIXES,
} from "../kv-keys.ts";

// ═══════════════════════════════════════════════════════════
// NeedScore computation (server-side, D10)
// Implemented here because fsrs-engine.ts is PROTECTED.
// Formula: weighted sum of overdue, masteryGap, fragility,
//          coverage gap, and priority.
// ═══════════════════════════════════════════════════════════
export function calculateNeedScore(
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

// ── BKT helpers ─────────────────────────────────────────
export function getColorFromDelta(delta: number): BktColor {
  if (delta >= 1.0) return "green";
  if (delta >= 0.6) return "yellow";
  if (delta >= 0.3) return "orange";
  return "red";
}

// ── Date helpers ────────────────────────────────────────
export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function emptyByColor(): Record<string, number> {
  return { red: 0, orange: 0, yellow: 0, green: 0 };
}

// ── Hierarchy walk helpers ──────────────────────────────

/** Get keyword IDs linked to a specific topic via summaries → keyword instances */
export async function getKeywordIdsForTopic(topicId: string): Promise<string[]> {
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
export async function getTopicIdsForCourse(courseId: string): Promise<string[]> {
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
export async function computeKeywordProgress(
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
