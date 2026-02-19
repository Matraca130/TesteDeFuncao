// ============================================================
// dashboard/stats.tsx
// Routes: GET /stats, GET /daily-activity, GET /daily-activity/:date,
//         POST /sessions/:id/finalize-stats
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import type {
  SubTopicBktState,
  StudentStats,
  DailyActivity,
} from "../shared-types.ts";
import {
  bktKey,
  sessionKey,
  dailyKey,
  statsKey,
  KV_PREFIXES,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "../crud-factory.tsx";
import { todayStr } from "./_helpers.ts";

const stats = new Hono();

// ================================================================
// GET /stats — Student stats
// ================================================================
stats.get("/stats", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const data = await kv.get(statsKey(user.id));
    if (!data) {
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
    return c.json({ success: true, data });
  } catch (err) {
    return serverError(c, "GET /stats", err);
  }
});

// ================================================================
// GET /daily-activity — Heatmap data for date range
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (max 365 days)
// Returns array of DailyActivity objects (only days with activity)
// ================================================================
stats.get("/daily-activity", async (c) => {
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
stats.get("/daily-activity/:date", async (c) => {
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
// POST /sessions/:id/finalize-stats — Update daily + stats
// Called after PUT /sessions/:id/end to update:
//   daily:{userId}:{today} — increment study time, sessions, reviews
//   stats:{userId} — recompute totals and streak
// This is a separate endpoint to keep session logic isolated.
// ================================================================
stats.post("/sessions/:id/finalize-stats", async (c) => {
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

    // ── 1. Update DailyActivity ──────────────────────
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

    // ── 2. Update StudentStats ───────────────────────
    let studentStats: StudentStats | null = await kv.get(statsKey(userId));
    if (!studentStats) {
      studentStats = {
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

    studentStats.total_sessions += 1;
    studentStats.total_reviews += session.total_reviews ?? 0;
    studentStats.total_correct += session.correct_reviews ?? 0;
    studentStats.total_time_seconds += session.duration_seconds ?? 0;
    studentStats.last_study_date = today;
    studentStats.updated_at = new Date().toISOString();

    // ── 3. Compute streak ────────────────────────────
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
        studentStats.current_streak = (studentStats.current_streak || 0) + 1;
      } else {
        // No activity yesterday — streak resets to 1
        studentStats.current_streak = 1;
      }

      if (studentStats.current_streak > (studentStats.longest_streak || 0)) {
        studentStats.longest_streak = studentStats.current_streak;
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
        studentStats.cards_mastered = mastered;
        studentStats.cards_learning = learning;
        studentStats.cards_new = newCards;
      }
    } catch (_e) {
      // Non-critical
    }

    // ── 5. Persist ────────────────────────────────────
    await kv.mset(
      [dailyKey(userId, today), statsKey(userId)],
      [daily, studentStats]
    );

    console.log(
      `[Dashboard] Finalized stats for session ${sessionId.slice(0, 8)}…: ` +
        `daily(${daily.sessions_count} sessions, ${daily.time_spent_seconds}s), ` +
        `stats(streak=${studentStats.current_streak})`
    );

    return c.json({
      success: true,
      data: { daily, stats: studentStats },
    });
  } catch (err) {
    return serverError(c, "POST /sessions/:id/finalize-stats", err);
  }
});

export default stats;
