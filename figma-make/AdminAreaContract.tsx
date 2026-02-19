// ============================================================
// Axon v4.4 — ADMIN AREA IMPLEMENTATION CONTRACT
// ============================================================
// Sustituye: LoginContractReference.tsx
// Proposito: Contrato exhaustivo para construir el area
//   administrativa completa sin errores.
// Cubre: Auth fixes, Institution CRUD, Member management,
//   Plan & AccessRule CRUD, AdminScope, Video CRUD, RBAC,
//   Frontend pages, KV patterns, Data shapes.
// Fecha: 2026-02-19
//
// STATUS: DEPRECATED — Reemplazado por Sprint1ExecutionContract
//   Las 6 llamadas kv.mset han sido corregidas a sintaxis (keys[], values[])
//   Banner DEPRECATED agregado al render
// ============================================================
//
// NOTA: Este archivo vive en Figma Make como componente visual.
// Para ver los cambios renderizados, abrir en Figma Make.
// La documentacion canonica para devs esta en guidelines/SPRINT1-EXECUTION.md
//
// CAMBIOS (2026-02-19):
// 1. Banner rojo DEPRECATED al top del componente
// 2. Fix signup mset: kv.mset([keys], [values]) en vez de kv.mset({...})
// 3. Fix POST /institutions mset
// 4. Fix PUT /institutions mset
// 5. Fix POST /plans mset
// 6. Fix POST /plans/:planId/rules mset
// 7. Fix POST /summaries/:summaryId/videos mset
// ============================================================
