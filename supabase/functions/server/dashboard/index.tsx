// ============================================================
// dashboard/index.tsx
// Axon v4.2 — Dev 5: Dashboard, Progress, Smart Study & Plans
// ============================================================
// Composes all dashboard sub-routers into a single Hono app.
//
// 16 routes across 4 modules:
//
// [stats.tsx]
//   GET  /stats                           — Student stats
//   GET  /daily-activity                  — Heatmap data (?from&to)
//   GET  /daily-activity/:date            — Single day activity
//   POST /sessions/:id/finalize-stats     — Update daily + stats after session end
//
// [progress.tsx]
//   GET  /progress/keyword/:keywordId     — Keyword progress (D25, D26, D32)
//   GET  /progress/topic/:topicId         — Topic progress
//   GET  /progress/course/:courseId        — Course progress
//
// [smart-study.tsx]
//   POST /smart-study/generate            — NeedScore-based study items (D35)
//
// [study-plans.tsx]
//   POST /study-plans                     — Create plan (D18)
//   GET  /study-plans                     — List student's plans
//   GET  /study-plans/:id                 — Get plan detail
//   PUT  /study-plans/:id                 — Update plan
//   DELETE /study-plans/:id               — Delete plan + tasks
//   POST /study-plans/:id/recalculate     — Recalculate plan tasks (D19)
//   GET  /study-plans/:id/tasks           — Get tasks (?date, ?from&to)
//   PUT  /study-plan-tasks/:id/complete   — Mark task done
//
// Shared helpers in [_helpers.ts]:
//   calculateNeedScore      — NeedScore formula (D10)
//   getColorFromDelta       — BKT color mapping
//   todayStr / emptyByColor — Date & color utilities
//   getKeywordIdsForTopic   — Hierarchy walk: topic → keywords
//   getTopicIdsForCourse    — Hierarchy walk: course → topics
//   computeKeywordProgress  — Full keyword progress computation
//
// Key decisions preserved:
//   D10 — Backend computes all algorithmic state
//   D18 — Student defines constraints, system distributes
//   D19 — Plan is suggestion, progress recalculates
//   D25 — Keyword color = min(delta) of its sub-topics
//   D26 — Unevaluated sub-topic → delta=0 → red
//   D32 — Alert if sub-topic has no quiz coverage
//   D35 — Smart study selects by NeedScore
// ============================================================
import { Hono } from "npm:hono";
import statsRoutes from "./stats.tsx";
import progressRoutes from "./progress.tsx";
import smartStudyRoutes from "./smart-study.tsx";
import studyPlansRoutes from "./study-plans.tsx";

const dashboard = new Hono();

// Mount all sub-routers
dashboard.route("/", statsRoutes);
dashboard.route("/", progressRoutes);
dashboard.route("/", smartStudyRoutes);
dashboard.route("/", studyPlansRoutes);

export default dashboard;
