// ============================================================
// routes-dashboard.tsx
// Re-exports the modularized dashboard router.
// All logic lives in dashboard/ subfolder:
//   dashboard/_helpers.ts     — NeedScore, BKT, hierarchy walkers
//   dashboard/stats.tsx       — /stats, /daily-activity, /finalize-stats
//   dashboard/progress.tsx    — /progress/keyword|topic|course
//   dashboard/smart-study.tsx — /smart-study/generate
//   dashboard/study-plans.tsx — CRUD plans + recalculate + tasks
//   dashboard/index.tsx       — Composes all sub-routers
// ============================================================
export { default } from "./dashboard/index.tsx";
