// ============================================================
// Axon v4.2 — Dev 3: Session Management Routes
// ============================================================
// POST /sessions      — Create a study session
// GET  /sessions      — List sessions for current user
// GET  /sessions/:id  — Get session details (with ownership check)
// PUT  /sessions/:id/end — Close session, compute aggregates
//
// Key decisions:
//   D10 — Frontend ONLY sends grade; backend computes everything
//   D46 — response_time_ms saved but does NOT affect algorithms in v1
//
// StudySession fields managed here:
//   id, student_id, instrument_type, course_id, started_at,
//   ended_at, items_reviewed, keywords_touched, subtopics_touched,
//   avg_grade, total_time_ms, created_at, updated_at
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

// Types — import ONLY the ones this file uses
import type { StudySession } from "./shared-types.ts";

// Keys — canonical kv-keys.ts (ZERO references to kv-keys.tsx)
import {
  sessionKey,
  reviewKey,
  idxStudentSessions,
  KV_PREFIXES,
} from "./kv-keys.ts";

// Shared CRUD helpers
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "./crud-factory.tsx";

const sessions = new Hono();

// ── Helper: error message extractor ────────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ================================================================
// SESSION MANAGEMENT
// ================================================================

// ================================================================
// POST /sessions — Create a study session
// ================================================================
// Required: instrument_type ('flashcard' | 'quiz')
// Optional: course_id
// Initializes counters to 0/empty, writes primary key + index.
// ================================================================
sessions.post("/sessions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    if (!body.instrument_type) {
      return validationError(
        c,
        "Missing required field: instrument_type"
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const courseId = body.course_id || "_";

    const session = {
      id,
      student_id: user.id,
      instrument_type: body.instrument_type, // 'flashcard' | 'quiz'
      course_id: body.course_id ?? null,
      started_at: now,
      ended_at: null as string | null,
      items_reviewed: 0,
      keywords_touched: [] as string[],
      subtopics_touched: [] as string[],
      avg_grade: null as number | null,
      total_time_ms: null as number | null,
      created_at: now,
      updated_at: now,
    };

    await kv.mset(
      [
        sessionKey(id),
        idxStudentSessions(user.id, courseId, id),
      ],
      [session, id]
    );

    console.log(
      `[Sessions] Created session ${id} (${body.instrument_type}) for ${user.id}`
    );
    return c.json({ success: true, data: session }, 201);
  } catch (err) {
    return serverError(c, "POST /sessions", err);
  }
});

// ================================================================
// GET /sessions — List sessions for current user
// ================================================================
// Returns all sessions owned by the authenticated student.
// Uses prefix scan on student-sessions index.
// ================================================================
sessions.get("/sessions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const sessionIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_STUDENT_SESSIONS + user.id + ":"
    );
    if (!sessionIds || sessionIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const allSessions = await kv.mget(
      (sessionIds as string[]).map((id: string) => sessionKey(id))
    );

    return c.json({
      success: true,
      data: allSessions.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /sessions", err);
  }
});

// ================================================================
// GET /sessions/:id — Get session details
// ================================================================
// Ownership check: student can only access their own sessions.
// Returns 403 FORBIDDEN if session belongs to another student.
// ================================================================
sessions.get("/sessions/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const session = await kv.get(sessionKey(c.req.param("id")));
    if (!session) return notFound(c, "Session");

    if (session.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot access another student's session",
          },
        },
        403
      );
    }

    return c.json({ success: true, data: session });
  } catch (err) {
    return serverError(c, "GET /sessions/:id", err);
  }
});

// ================================================================
// PUT /sessions/:id/end — Close session, compute aggregates
// ================================================================
// Ownership check: student can only end their own sessions.
// Computes: ended_at, total_time_ms, avg_grade (from review logs).
// Returns 400 if session already ended.
// ================================================================
sessions.put("/sessions/:id/end", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const session = await kv.get(sessionKey(id));
    if (!session) return notFound(c, "Session");

    if (session.student_id !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot end another student's session",
          },
        },
        403
      );
    }

    if (session.ended_at) {
      return validationError(c, "Session already ended");
    }

    const now = new Date().toISOString();
    const totalTimeMs = Date.now() - Date.parse(session.started_at);

    // Compute avg_grade from review logs in this session
    let avgGrade: number | null = null;
    const reviewIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SESSION_REVIEWS + id + ":"
    );
    if (reviewIds && reviewIds.length > 0) {
      const reviewLogs = await kv.mget(
        (reviewIds as string[]).map((rid: string) => reviewKey(rid))
      );
      const validReviews = reviewLogs.filter(Boolean);
      if (validReviews.length > 0) {
        const sumGrades = validReviews.reduce(
          (sum: number, r: any) => sum + (r.grade ?? 0),
          0
        );
        avgGrade = sumGrades / validReviews.length;
      }
    }

    const updatedSession = {
      ...session,
      ended_at: now,
      total_time_ms: totalTimeMs,
      avg_grade: avgGrade,
      updated_at: now,
    };

    await kv.set(sessionKey(id), updatedSession);

    console.log(
      `[Sessions] Ended session ${id}: ${session.items_reviewed} items, avg_grade=${avgGrade?.toFixed(2) ?? "N/A"}, ${totalTimeMs}ms`
    );
    return c.json({ success: true, data: updatedSession });
  } catch (err) {
    return serverError(c, "PUT /sessions/:id/end", err);
  }
});

export default sessions;
