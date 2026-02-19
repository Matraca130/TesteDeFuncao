// ============================================================
// dashboard/study-plans.tsx
// Routes: POST/GET/PUT/DELETE /study-plans, recalculate, tasks
// Decision refs: D18 (create), D19 (recalculate)
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "../kv_store.tsx";
import type {
  SubTopicBktState,
  StudyPlan,
  StudyPlanTask,
} from "../shared-types.ts";
import {
  bktKey,
  kwKey,
  planKey,
  planTaskKey,
  idxStudentPlans,
  idxPlanTasks,
  KV_PREFIXES,
} from "../kv-keys.ts";
import {
  getAuthUser,
  unauthorized,
  notFound,
  validationError,
  serverError,
  mgetOrdered,
} from "../crud-factory.tsx";
import {
  calculateNeedScore,
  getKeywordIdsForTopic,
  getTopicIdsForCourse,
} from "./_helpers.ts";

const studyPlans = new Hono();

// ── Ownership guard (reused across CRUD) ────────────────
async function getPlanIfOwned(c: any, user: any, planId: string) {
  const plan = await kv.get(planKey(planId));
  if (!plan) return { plan: null, error: notFound(c, "StudyPlan") };
  if (plan.student_id !== user.id) {
    return {
      plan: null,
      error: c.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not your plan" } },
        403
      ),
    };
  }
  return { plan, error: null };
}

// ================================================================
// POST /study-plans — Create a study plan (D18)
// Body: { title?, course_id?, target_date?, weekly_hours? }
// weekly_hours: [mon,tue,wed,thu,fri,sat,sun] hours per day
// ================================================================
studyPlans.post("/study-plans", async (c) => {
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
studyPlans.get("/study-plans", async (c) => {
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
studyPlans.get("/study-plans/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const { plan, error } = await getPlanIfOwned(c, user, c.req.param("id"));
    if (error) return error;

    // Get task count summary
    const taskIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_PLAN_TASKS + plan!.id + ":"
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
studyPlans.put("/study-plans/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const { plan, error } = await getPlanIfOwned(c, user, id);
    if (error) return error;

    const body = await c.req.json();
    const updated = {
      ...plan,
      ...body,
      id, // prevent ID overwrite
      student_id: plan!.student_id, // prevent ownership overwrite
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
studyPlans.delete("/study-plans/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const id = c.req.param("id");
    const { plan, error } = await getPlanIfOwned(c, user, id);
    if (error) return error;

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
      const courseIdForIdx = plan!.course_id || "_";
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
// Re-runs NeedScore, generates future tasks based on plan config.
// Deletes existing pending tasks and creates new ones.
// ================================================================
studyPlans.post("/study-plans/:id/recalculate", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const planId = c.req.param("id");
    const { plan, error } = await getPlanIfOwned(c, user, planId);
    if (error) return error;

    // Get current pending tasks to delete
    const existingTaskIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_PLAN_TASKS + planId + ":"
    );
    const keysToDelete: string[] = [];
    if (existingTaskIds.length > 0) {
      // FIX A3: Use mgetOrdered() for positional access (task[i] ↔ taskId[i]).
      // kv.mget() returns rows in arbitrary order, causing wrong task↔ID pairing.
      const existingTasks = await mgetOrdered(
        (existingTaskIds as string[]).map((tid: string) => planTaskKey(tid))
      );
      for (let i = 0; i < existingTaskIds.length; i++) {
        const task = existingTasks[i];
        if (task && task.status !== "completed") {
          const tid = (existingTaskIds as string[])[i];
          const courseIdForIdx = plan!.course_id || "_";
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
    if (plan!.course_id) {
      const topicIds = await getTopicIdsForCourse(plan!.course_id);
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
    const weeklyHours: number[] = (plan as any).weekly_hours ?? [2, 2, 2, 2, 2, 1, 1];
    const today = new Date();
    const targetDate = plan!.target_date
      ? new Date(plan!.target_date + "T23:59:59Z")
      : new Date(today.getTime() + 30 * 86_400_000); // default 30 days

    const newKeys: string[] = [];
    const newValues: unknown[] = [];
    let taskIndex = 0;
    const courseIdForIdx = plan!.course_id || "_";
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
        const kwItem = sortedKws[kwIdx];
        const taskId = crypto.randomUUID();
        const task: StudyPlanTask = {
          id: taskId,
          plan_id: planId,
          title: `Review: ${kwItem.term}`,
          description: `NeedScore: ${kwItem.score.toFixed(3)}`,
          task_type: "review",
          status: "pending",
          target_item_id: kwItem.kwId,
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
    (plan as any).updated_at = new Date().toISOString();
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
// Query: ?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
// Without params returns all tasks.
// ================================================================
studyPlans.get("/study-plans/:id/tasks", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const planId = c.req.param("id");
    const { plan, error } = await getPlanIfOwned(c, user, planId);
    if (error) return error;

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
studyPlans.put("/study-plan-tasks/:id/complete", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const taskId = c.req.param("id");
    const task = await kv.get(planTaskKey(taskId));
    if (!task) return notFound(c, "StudyPlanTask");

    // Verify ownership via plan
    const planData = await kv.get(planKey(task.plan_id));
    if (!planData || planData.student_id !== user.id) {
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

export default studyPlans;
