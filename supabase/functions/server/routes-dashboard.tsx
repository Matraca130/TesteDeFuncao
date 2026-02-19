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
//
// Agent 3 (PROBE) note: Learning-profile placeholder routes
// should be added as dashboard/learning-profile.tsx and mounted
// in dashboard/index.tsx. This requires Agent 5 coordination
// since dashboard/ is their ownership area.
// ============================================================
export { default } from "./dashboard/index.tsx";
