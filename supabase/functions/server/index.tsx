import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { seedStudentData } from "./seed.tsx";
import {
  handleChat,
  handleGenerateFlashcards,
  handleGenerateQuiz,
  handleExplain,
} from "./gemini.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const PREFIX = "/make-server-0c4f6a3c";

// ============================================================
// Health check
// ============================================================
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ============================================================
// STUDENT PROFILE
// ============================================================

/** GET /student/:id/profile */
app.get(`${PREFIX}/student/:id/profile`, async (c) => {
  try {
    const id = c.req.param("id");
    const profile = await kv.get(`student:${id}:profile`);
    if (!profile) {
      return c.json({ error: `Student profile not found for id: ${id}` }, 404);
    }
    return c.json(profile);
  } catch (err) {
    console.log(`Error fetching student profile: ${err}`);
    return c.json({ error: `Error fetching student profile: ${err}` }, 500);
  }
});

/** PUT /student/:id/profile — Create or update */
app.put(`${PREFIX}/student/:id/profile`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    // Merge with existing if present
    const existing = await kv.get(`student:${id}:profile`);
    const merged = existing ? { ...existing, ...body, id } : { ...body, id };
    await kv.set(`student:${id}:profile`, merged);
    return c.json(merged);
  } catch (err) {
    console.log(`Error updating student profile: ${err}`);
    return c.json({ error: `Error updating student profile: ${err}` }, 500);
  }
});

// ============================================================
// STUDENT STATS
// ============================================================

/** GET /student/:id/stats */
app.get(`${PREFIX}/student/:id/stats`, async (c) => {
  try {
    const id = c.req.param("id");
    const stats = await kv.get(`student:${id}:stats`);
    if (!stats) {
      return c.json({ error: `Student stats not found for id: ${id}` }, 404);
    }
    return c.json(stats);
  } catch (err) {
    console.log(`Error fetching student stats: ${err}`);
    return c.json({ error: `Error fetching student stats: ${err}` }, 500);
  }
});

/** PUT /student/:id/stats */
app.put(`${PREFIX}/student/:id/stats`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`student:${id}:stats`);
    const merged = existing ? { ...existing, ...body } : body;
    await kv.set(`student:${id}:stats`, merged);
    return c.json(merged);
  } catch (err) {
    console.log(`Error updating student stats: ${err}`);
    return c.json({ error: `Error updating student stats: ${err}` }, 500);
  }
});

// ============================================================
// COURSE PROGRESS
// ============================================================

/** GET /student/:id/progress — All courses */
app.get(`${PREFIX}/student/:id/progress`, async (c) => {
  try {
    const id = c.req.param("id");
    const results = await kv.getByPrefix(`student:${id}:course:`);
    return c.json(results);
  } catch (err) {
    console.log(`Error fetching course progress: ${err}`);
    return c.json({ error: `Error fetching course progress: ${err}` }, 500);
  }
});

/** GET /student/:id/progress/:courseId — Single course */
app.get(`${PREFIX}/student/:id/progress/:courseId`, async (c) => {
  try {
    const { id, courseId } = c.req.param();
    const progress = await kv.get(`student:${id}:course:${courseId}`);
    if (!progress) {
      return c.json(
        { error: `Progress not found for student ${id}, course ${courseId}` },
        404
      );
    }
    return c.json(progress);
  } catch (err) {
    console.log(`Error fetching course progress: ${err}`);
    return c.json({ error: `Error fetching course progress: ${err}` }, 500);
  }
});

/** PUT /student/:id/progress/:courseId */
app.put(`${PREFIX}/student/:id/progress/:courseId`, async (c) => {
  try {
    const { id, courseId } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`student:${id}:course:${courseId}`);
    const merged = existing
      ? { ...existing, ...body, courseId }
      : { ...body, courseId };
    await kv.set(`student:${id}:course:${courseId}`, merged);
    return c.json(merged);
  } catch (err) {
    console.log(`Error updating course progress: ${err}`);
    return c.json({ error: `Error updating course progress: ${err}` }, 500);
  }
});

// ============================================================
// STUDY SESSIONS
// ============================================================

/** POST /student/:id/sessions — Log a new session */
app.post(`${PREFIX}/student/:id/sessions`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const sessionId = body.id || `session_${Date.now()}`;
    const session = { ...body, id: sessionId, studentId: id };
    await kv.set(`student:${id}:session:${sessionId}`, session);

    // Also update daily activity
    const today = new Date().toISOString().slice(0, 10);
    const dailyKey = `student:${id}:daily:${today}`;
    const existing = await kv.get(dailyKey);
    const daily = existing || {
      date: today,
      studyMinutes: 0,
      sessionsCount: 0,
      cardsReviewed: 0,
    };
    daily.studyMinutes += body.durationMinutes || 0;
    daily.sessionsCount += 1;
    daily.cardsReviewed += body.cardsReviewed || 0;
    await kv.set(dailyKey, daily);

    return c.json(session, 201);
  } catch (err) {
    console.log(`Error creating study session: ${err}`);
    return c.json({ error: `Error creating study session: ${err}` }, 500);
  }
});

/** GET /student/:id/sessions — Get recent sessions */
app.get(`${PREFIX}/student/:id/sessions`, async (c) => {
  try {
    const id = c.req.param("id");
    const sessions = await kv.getByPrefix(`student:${id}:session:`);
    // Sort by startedAt desc
    sessions.sort(
      (a: any, b: any) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    return c.json(sessions);
  } catch (err) {
    console.log(`Error fetching study sessions: ${err}`);
    return c.json({ error: `Error fetching study sessions: ${err}` }, 500);
  }
});

// ============================================================
// FLASHCARD REVIEWS (Spaced Repetition)
// ============================================================

/** POST /student/:id/reviews — Log card reviews (batch) */
app.post(`${PREFIX}/student/:id/reviews`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json(); // { reviews: FlashcardReview[] }
    const reviews = body.reviews || [body];
    const keys: string[] = [];
    const values: any[] = [];
    for (const review of reviews) {
      const key = `student:${id}:review:${review.courseId}:${review.topicId}:${review.cardId}`;
      keys.push(key);
      values.push({ ...review, studentId: id });
    }
    await kv.mset(keys, values);
    return c.json({ saved: keys.length }, 201);
  } catch (err) {
    console.log(`Error saving flashcard reviews: ${err}`);
    return c.json({ error: `Error saving flashcard reviews: ${err}` }, 500);
  }
});

/** GET /student/:id/reviews — Get all reviews */
app.get(`${PREFIX}/student/:id/reviews`, async (c) => {
  try {
    const id = c.req.param("id");
    const reviews = await kv.getByPrefix(`student:${id}:review:`);
    return c.json(reviews);
  } catch (err) {
    console.log(`Error fetching reviews: ${err}`);
    return c.json({ error: `Error fetching reviews: ${err}` }, 500);
  }
});

/** GET /student/:id/reviews/:courseId — Get reviews for a course */
app.get(`${PREFIX}/student/:id/reviews/:courseId`, async (c) => {
  try {
    const { id, courseId } = c.req.param();
    const reviews = await kv.getByPrefix(
      `student:${id}:review:${courseId}:`
    );
    return c.json(reviews);
  } catch (err) {
    console.log(`Error fetching course reviews: ${err}`);
    return c.json({ error: `Error fetching course reviews: ${err}` }, 500);
  }
});

// ============================================================
// DAILY ACTIVITY (for heatmaps / calendars)
// ============================================================

/** GET /student/:id/activity — All daily activity */
app.get(`${PREFIX}/student/:id/activity`, async (c) => {
  try {
    const id = c.req.param("id");
    const activity = await kv.getByPrefix(`student:${id}:daily:`);
    activity.sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return c.json(activity);
  } catch (err) {
    console.log(`Error fetching daily activity: ${err}`);
    return c.json({ error: `Error fetching daily activity: ${err}` }, 500);
  }
});

// ============================================================
// CONTENT STORAGE (lesson texts, notes, etc.)
// ============================================================

/** PUT /content/:courseId/:key — Store content text */
app.put(`${PREFIX}/content/:courseId/:key`, async (c) => {
  try {
    const { courseId, key } = c.req.param();
    const body = await c.req.json();
    await kv.set(`content:${courseId}:${key}`, body);
    return c.json({ ok: true });
  } catch (err) {
    console.log(`Error storing content: ${err}`);
    return c.json({ error: `Error storing content: ${err}` }, 500);
  }
});

/** GET /content/:courseId/:key — Retrieve content */
app.get(`${PREFIX}/content/:courseId/:key`, async (c) => {
  try {
    const { courseId, key } = c.req.param();
    const content = await kv.get(`content:${courseId}:${key}`);
    if (!content) {
      return c.json({ error: `Content not found: ${courseId}/${key}` }, 404);
    }
    return c.json(content);
  } catch (err) {
    console.log(`Error fetching content: ${err}`);
    return c.json({ error: `Error fetching content: ${err}` }, 500);
  }
});

/** GET /content/:courseId — All content for a course */
app.get(`${PREFIX}/content/:courseId`, async (c) => {
  try {
    const courseId = c.req.param("courseId");
    const items = await kv.getByPrefix(`content:${courseId}:`);
    return c.json(items);
  } catch (err) {
    console.log(`Error fetching course content: ${err}`);
    return c.json({ error: `Error fetching course content: ${err}` }, 500);
  }
});

// ============================================================
// STUDY SUMMARIES (Resumos)
// ============================================================

/** GET /student/:id/summaries — All summaries for a student */
app.get(`${PREFIX}/student/:id/summaries`, async (c) => {
  try {
    const id = c.req.param("id");
    const summaries = await kv.getByPrefix(`student:${id}:summary:`);
    // Sort by updatedAt desc
    summaries.sort(
      (a: any, b: any) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return c.json(summaries);
  } catch (err) {
    console.log(`Error fetching summaries: ${err}`);
    return c.json({ error: `Error fetching summaries: ${err}` }, 500);
  }
});

/** GET /student/:id/summaries/:courseId — All summaries for a course */
app.get(`${PREFIX}/student/:id/summaries/:courseId`, async (c) => {
  try {
    const { id, courseId } = c.req.param();
    const summaries = await kv.getByPrefix(
      `student:${id}:summary:${courseId}:`
    );
    summaries.sort(
      (a: any, b: any) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return c.json(summaries);
  } catch (err) {
    console.log(`Error fetching course summaries: ${err}`);
    return c.json({ error: `Error fetching course summaries: ${err}` }, 500);
  }
});

/** GET /student/:id/summaries/:courseId/:topicId — Single summary */
app.get(`${PREFIX}/student/:id/summaries/:courseId/:topicId`, async (c) => {
  try {
    const { id, courseId, topicId } = c.req.param();
    const summary = await kv.get(
      `student:${id}:summary:${courseId}:${topicId}`
    );
    if (!summary) {
      return c.json(
        { error: `Summary not found for student ${id}, course ${courseId}, topic ${topicId}` },
        404
      );
    }
    return c.json(summary);
  } catch (err) {
    console.log(`Error fetching summary: ${err}`);
    return c.json({ error: `Error fetching summary: ${err}` }, 500);
  }
});

/** PUT /student/:id/summaries/:courseId/:topicId — Create or update */
app.put(`${PREFIX}/student/:id/summaries/:courseId/:topicId`, async (c) => {
  try {
    const { id, courseId, topicId } = c.req.param();
    const body = await c.req.json();
    const key = `student:${id}:summary:${courseId}:${topicId}`;
    const existing = await kv.get(key);
    const now = new Date().toISOString();

    const summary = existing
      ? {
          ...existing,
          ...body,
          studentId: id,
          courseId,
          topicId,
          updatedAt: now,
        }
      : {
          ...body,
          id: `summary_${courseId}_${topicId}`,
          studentId: id,
          courseId,
          topicId,
          createdAt: now,
          updatedAt: now,
          editTimeMinutes: body.editTimeMinutes || 0,
          tags: body.tags || [],
          bookmarked: body.bookmarked || false,
          annotations: body.annotations || [],
        };

    await kv.set(key, summary);
    return c.json(summary);
  } catch (err) {
    console.log(`Error saving summary: ${err}`);
    return c.json({ error: `Error saving summary: ${err}` }, 500);
  }
});

/** DELETE /student/:id/summaries/:courseId/:topicId */
app.delete(`${PREFIX}/student/:id/summaries/:courseId/:topicId`, async (c) => {
  try {
    const { id, courseId, topicId } = c.req.param();
    const key = `student:${id}:summary:${courseId}:${topicId}`;
    await kv.del(key);
    return c.json({ ok: true });
  } catch (err) {
    console.log(`Error deleting summary: ${err}`);
    return c.json({ error: `Error deleting summary: ${err}` }, 500);
  }
});

// ============================================================
// KEYWORDS (Spaced Repetition V2)
// ============================================================

/** GET /student/:id/keywords/:courseId — Get keywords for entire course */
app.get(`${PREFIX}/student/:id/keywords/:courseId`, async (c) => {
  try {
    const { id, courseId } = c.req.param();
    const keywords = await kv.get(`student:${id}:keywords:${courseId}`);
    if (!keywords) {
      return c.json({ keywords: {}, lastUpdated: new Date().toISOString() });
    }
    return c.json(keywords);
  } catch (err) {
    console.log(`Error fetching course keywords: ${err}`);
    return c.json({ error: `Error fetching course keywords: ${err}` }, 500);
  }
});

/** GET /student/:id/keywords/:courseId/:topicId — Get keywords for specific topic */
app.get(`${PREFIX}/student/:id/keywords/:courseId/:topicId`, async (c) => {
  try {
    const { id, courseId, topicId } = c.req.param();
    const keywords = await kv.get(`student:${id}:keywords:${courseId}:${topicId}`);
    if (!keywords) {
      return c.json({ 
        courseId, 
        topicId, 
        keywords: {}, 
        lastUpdated: new Date().toISOString() 
      });
    }
    return c.json(keywords);
  } catch (err) {
    console.log(`Error fetching topic keywords: ${err}`);
    return c.json({ error: `Error fetching topic keywords: ${err}` }, 500);
  }
});

/** PUT /student/:id/keywords/:courseId/:topicId — Save/update keywords for topic */
app.put(`${PREFIX}/student/:id/keywords/:courseId/:topicId`, async (c) => {
  try {
    const { id, courseId, topicId } = c.req.param();
    const body = await c.req.json();
    const key = `student:${id}:keywords:${courseId}:${topicId}`;
    const now = new Date().toISOString();
    
    const data = {
      courseId,
      topicId,
      keywords: body.keywords || {},
      lastUpdated: now,
    };
    
    await kv.set(key, data);
    return c.json(data);
  } catch (err) {
    console.log(`Error saving topic keywords: ${err}`);
    return c.json({ error: `Error saving topic keywords: ${err}` }, 500);
  }
});

/** PUT /student/:id/keywords/:courseId — Save/update keywords for entire course */
app.put(`${PREFIX}/student/:id/keywords/:courseId`, async (c) => {
  try {
    const { id, courseId } = c.req.param();
    const body = await c.req.json();
    const key = `student:${id}:keywords:${courseId}`;
    const now = new Date().toISOString();
    
    const data = {
      courseId,
      keywords: body.keywords || {},
      lastUpdated: now,
    };
    
    await kv.set(key, data);
    return c.json(data);
  } catch (err) {
    console.log(`Error saving course keywords: ${err}`);
    return c.json({ error: `Error saving course keywords: ${err}` }, 500);
  }
});

// ============================================================
// SEED — Populate demo data
// ============================================================

app.post(`${PREFIX}/seed`, async (c) => {
  try {
    await seedStudentData();
    return c.json({ ok: true, message: "Demo student data seeded successfully" });
  } catch (err) {
    console.log(`Error seeding data: ${err}`);
    return c.json({ error: `Error seeding data: ${err}` }, 500);
  }
});

// ============================================================
// GEMINI — AI Integration
// ============================================================

app.post(`${PREFIX}/ai/chat`, async (c) => {
  try {
    const { messages, context } = await c.req.json();
    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "messages array is required" }, 400);
    }
    const reply = await handleChat(messages, context);
    return c.json({ reply });
  } catch (err) {
    console.log(`Error in AI chat: ${err}`);
    return c.json({ error: `AI chat error: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/ai/flashcards`, async (c) => {
  try {
    const { topic, count, context } = await c.req.json();
    if (!topic) {
      return c.json({ error: "topic is required" }, 400);
    }
    const flashcards = await handleGenerateFlashcards(topic, count || 5, context);
    return c.json({ flashcards });
  } catch (err) {
    console.log(`Error generating flashcards: ${err}`);
    return c.json({ error: `Flashcard generation error: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/ai/quiz`, async (c) => {
  try {
    const { topic, count, difficulty } = await c.req.json();
    if (!topic) {
      return c.json({ error: "topic is required" }, 400);
    }
    const questions = await handleGenerateQuiz(topic, count || 3, difficulty || "intermediate");
    return c.json({ questions });
  } catch (err) {
    console.log(`Error generating quiz: ${err}`);
    return c.json({ error: `Quiz generation error: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/ai/explain`, async (c) => {
  try {
    const { concept, context } = await c.req.json();
    if (!concept) {
      return c.json({ error: "concept is required" }, 400);
    }
    const explanation = await handleExplain(concept, context);
    return c.json({ explanation });
  } catch (err) {
    console.log(`Error explaining concept: ${err}`);
    return c.json({ error: `Explain error: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);