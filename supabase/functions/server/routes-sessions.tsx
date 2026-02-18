// ============================================================
// Axon v4.2 — Dev 3→5: Study Session Routes
// ============================================================
// 4 routes: POST, GET, GET/:id, PUT/:id/end
//
// Imports:
//   ./kv-keys.ts       — Canonical key generation functions
//   ./shared-types.ts   — Entity type definitions
//   ./crud-factory.tsx  — Shared helpers
//   ./kv_store.tsx      — KV CRUD operations
//
// KV Keys:
//   session:{id}                                          → StudySession
//   review:{id}                                           → ReviewLog
//   idx:student-sessions:{sId}:{courseId}:{sessionId}     → sessionId
//   idx:session-reviews:{sessionId}:{reviewId}            → reviewId
//
// Note: idxStudentSessions uses "_" when course_id is null.
// Decisions: D10, D46
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import type {
  StudySession,
  ReviewLog,
} from "./shared-types.ts";
import {
  sessionKey,
  reviewKey,
  idxStudentSessions,
  idxSessionReviews,
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "./crud-factory.tsx";

const sessions = new Hono();

// ================================================================
// POST /sessions — Create a study session
// ================================================================
sessions.post("/sessions", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    if (!body.session_type) {
      return validationError(
        c,
        "Missing required field: session_type"
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const courseId = body.course_id ?? null;

    const session: StudySession & {
      keywords_touched: string[];
      subtopics_touched: string[];
      created_at: string;
      updated_at: string;
    } = {
      id,
      student_id: user.id,
      session_type: body.session_type,
      course_id: courseId,
      started_at: now,
      ended_at: undefined,
      total_reviews: 0,
      correct_reviews: 0,
      duration_seconds: undefined,
      keywords_touched: [],
      subtopics_touched: [],
      created_at: now,
      updated_at: now,
    };

    await kv.mset(
      [
        sessionKey(id),
        idxStudentSessions(user.id, courseId || "_", id),
      ],
      [session, id]
    );

    console.log(
      `[Sessions] Created session ${id.slice(0, 8)}… (${body.session_type}) for ${user.id.slice(0, 8)}…`
    );
    return c.json({ success: true, data: session }, 201);
  } catch (err) {
    return serverError(c, "POST /sessions", err);
  }
});

// ================================================================
// GET /sessions — List sessions for current user
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

    const sessionsList = await kv.mget(
      (sessionIds as string[]).map((id: string) => sessionKey(id))
    );

    return c.json({
      success: true,
      data: sessionsList.filter(Boolean),
    });
  } catch (err) {
    return serverError(c, "GET /sessions", err);
  }
});

// ================================================================
// GET /sessions/:id — Get session details
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
    const durationSeconds = Math.round(
      (Date.now() - Date.parse(session.started_at)) / 1000
    );

    let avgGrade: number | null = null;
    const reviewIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SESSION_REVIEWS + id + ":"
    );
    if (reviewIds && reviewIds.length > 0) {
      const reviewsList = await kv.mget(
        (reviewIds as string[]).map((rid: string) => reviewKey(rid))
      );
      const validReviews = reviewsList.filter(Boolean);
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
      duration_seconds: durationSeconds,
      avg_grade: avgGrade,
      updated_at: now,
    };

    await kv.set(sessionKey(id), updatedSession);

    console.log(
      `[Sessions] Ended session ${id.slice(0, 8)}…: ${session.total_reviews ?? 0} reviews, ` +
        `avg_grade=${avgGrade?.toFixed(2) ?? "N/A"}, ${durationSeconds}s`
    );
    return c.json({ success: true, data: updatedSession });
  } catch (err) {
    return serverError(c, "PUT /sessions/:id/end", err);
  }
});

export default sessions;
