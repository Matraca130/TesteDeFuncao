// ============================================================
// Axon v4.4 — Server Entry Point (COMPLETE)
// Mounts ALL 11 route modules + inline seed endpoint.
// Prefix: /make-server-7a20cd7d
// Deploy: 2026-02-18T15:40Z — CI trigger for config.toml fix
//
// Route modules (89 endpoints total):
//   auth         — signup, signin, me, signout (4)
//   content      — institutions, courses, semesters, sections,
//                   topics, summaries, chunks, keywords,
//                   subtopics, connections, batch-status (~35)
//   canvas       — resumo-blocks CRUD, curriculum CRUD (5)
//   dashboard    — stats, daily-activity, progress, smart-study,
//                   study-plans, finalize-stats (16)
//   flashcards   — CRUD + /due (6)
//   quiz         — CRUD + /evaluate (6)
//   reading      — reading-state, annotations, topics/:id/full (7)
//   reviews      — CRUD + BKT update (varies)
//   sessions     — CRUD (varies)
//   model3d      — upload, CRUD, thumbnail (7)
//   ai           — generate, approve, drafts, chat, keyword-popup (5)
// ============================================================
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

// Route modules
import auth from "./auth.tsx";
import content from "./routes-content.tsx";
import canvas from "./routes-canvas.tsx";
import dashboard from "./routes-dashboard.tsx";
import flashcards from "./routes-flashcards.tsx";
import quiz from "./routes-quiz.tsx";
import reading from "./routes-reading.tsx";
import reviews from "./routes-reviews.tsx";
import sessions from "./routes-sessions.tsx";
import model3d from "./routes-model3d.tsx";
import ai from "./ai-routes.tsx";

// KV key functions (for inline seed)
import { fcKey, fsrsKey, kwKey, idxKwFc, idxDue, idxStudentFsrs } from "./kv-keys.ts";
import { createNewCard } from "./fsrs-engine.ts";

const app = new Hono();
const PREFIX = "/make-server-7a20cd7d";

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Health check ─────────────────────────────────────────────
app.get(`${PREFIX}/health`, (c) => {
  return c.json({
    status: "ok",
    version: "4.4",
    routes: [
      "auth", "content", "canvas", "dashboard", "flashcards",
      "quiz", "reading", "reviews", "sessions",
      "model3d", "ai", "seed",
    ],
  });
});

// ── Mount all route modules ──────────────────────────────────
app.route(PREFIX, auth);
app.route(PREFIX, content);
app.route(PREFIX, canvas);
app.route(PREFIX, dashboard);
app.route(PREFIX, flashcards);
app.route(PREFIX, quiz);
app.route(PREFIX, reading);
app.route(PREFIX, reviews);
app.route(PREFIX, sessions);
app.route(PREFIX, model3d);
app.route(PREFIX, ai);

// ── Inline seed (FSRS flashcards — complements seed.tsx) ─────
app.post(`${PREFIX}/seed`, async (c) => {
  try {
    const studentId = c.req.query("student_id") || "dev-user-001";
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const SEED_CARDS = [
      { id: "fc-001", summary_id: "sum-fisio-001", keyword_id: "kw-sna", subtopic_id: "st-simpatico", institution_id: "inst-faculdade-xyz", front: "Qual neurotransmissor e liberado nas terminacoes pos-ganglionares do sistema nervoso simpatico?", back: "Noradrenalina (norepinefrina). A excecao sao as glandulas sudoriparas ecrinas, que usam acetilcolina.", image_url: "https://images.unsplash.com/photo-1768726455785-8c1b4a153f47?w=1080", status: "approved", source: "professor", created_by: "prof-001", created_at: now },
      { id: "fc-002", summary_id: "sum-fisio-001", keyword_id: "kw-sna", subtopic_id: "st-parasimpatico", institution_id: "inst-faculdade-xyz", front: "Quais sao os efeitos do sistema parassimpatico sobre o coracao?", back: "Bradicardia, diminuicao da velocidade de conducao no nodo AV. Via nervo vago (X par craniano), acetilcolina nos receptores muscarinicos M2.", image_url: null, status: "approved", source: "professor", created_by: "prof-001", created_at: now },
      { id: "fc-003", summary_id: "sum-bioquim-001", keyword_id: "kw-hemoglobina", subtopic_id: "kw-hemoglobina", institution_id: "inst-faculdade-xyz", front: "O que e o efeito Bohr e qual sua importancia clinica?", back: "Diminuicao da afinidade da hemoglobina pelo O2 quando o pH diminui. Nos tecidos metabolicamente ativos, a Hb libera mais O2.", image_url: "https://images.unsplash.com/photo-1647083701139-3930542304cf?w=1080", status: "approved", source: "professor", created_by: "prof-002", created_at: now },
      { id: "fc-004", summary_id: "sum-nefro-001", keyword_id: "kw-renal", subtopic_id: "st-filtracao", institution_id: "inst-faculdade-xyz", front: "Qual e a taxa de filtracao glomerular (TFG) normal?", back: "TFG normal: ~120 mL/min ou ~180 L/dia. Estimada pela clearance de creatinina ou CKD-EPI.", image_url: "https://images.unsplash.com/photo-1715111966027-9e24fc956b5d?w=1080", status: "approved", source: "ai", created_by: "ai-gen-001", created_at: now },
      { id: "fc-005", summary_id: "sum-farma-001", keyword_id: "kw-farma", subtopic_id: "st-aines", institution_id: "inst-faculdade-xyz", front: "Qual o mecanismo de acao dos AINEs?", back: "AINEs inibem a ciclooxigenase (COX-1/COX-2), reduzindo prostaglandinas. Efeitos adversos: gastropatia, nefrotoxicidade.", image_url: null, status: "approved", source: "professor", created_by: "prof-003", created_at: now },
      { id: "fc-006", summary_id: "sum-cardio-001", keyword_id: "kw-cardio", subtopic_id: "st-ecg", institution_id: "inst-faculdade-xyz", front: "O que representa o intervalo QT no ECG?", back: "Despolarizacao e repolarizacao ventricular completa. QTc > 450ms (homens) ou > 470ms (mulheres) e prolongado.", image_url: "https://images.unsplash.com/photo-1513224502586-d1e602410265?w=1080", status: "approved", source: "professor", created_by: "prof-001", created_at: now },
      { id: "fc-007", summary_id: "sum-imuno-001", keyword_id: "kw-imuno", subtopic_id: "st-anticorpos", institution_id: "inst-faculdade-xyz", front: "Qual a diferenca entre IgM e IgG?", back: "IgM: resposta primaria, pentamerico. IgG: resposta secundaria, cruza placenta, mais abundante no soro.", image_url: null, status: "approved", source: "ai", created_by: "ai-gen-001", created_at: now },
      { id: "fc-008", summary_id: "sum-neuro-001", keyword_id: "kw-neuro", subtopic_id: "st-barreira", institution_id: "inst-faculdade-xyz", front: "Quais sao as caracteristicas da barreira hematoencefalica?", back: "Celulas endoteliais com tight junctions, membrana basal espessa, pericitos/astrocitos. Permite passagem de substancias lipossoluveis.", image_url: null, status: "approved", source: "professor", created_by: "prof-002", created_at: now },
    ];
    const kwKeys: string[] = [];
    const kwVals: any[] = [];
    const seenKw = new Set<string>();
    for (const card of SEED_CARDS) {
      if (!seenKw.has(card.keyword_id)) {
        seenKw.add(card.keyword_id);
        kwKeys.push(kwKey(card.keyword_id));
        kwVals.push({ id: card.keyword_id, term: card.keyword_id, priority: 3 });
      }
    }
    await kv.mset(kwKeys, kwVals);
    const keys: string[] = [];
    const vals: any[] = [];
    for (const card of SEED_CARDS) {
      keys.push(fcKey(card.id));
      vals.push(card);
      keys.push(idxKwFc(card.keyword_id, card.id));
      vals.push(card.id);
      const fsrsState = { ...createNewCard(), student_id: studentId, card_id: card.id };
      keys.push(fsrsKey(studentId, card.id));
      vals.push(fsrsState);
      keys.push(idxStudentFsrs(studentId, card.id));
      vals.push(card.id);
      keys.push(idxDue(studentId, card.id, today));
      vals.push(card.id);
    }
    await kv.mset(keys, vals);
    console.log(`[Seed] Seeded ${SEED_CARDS.length} flashcards for student ${studentId}`);
    return c.json({ success: true, data: { cards_created: SEED_CARDS.length, student_id: studentId, keywords_created: seenKw.size } });
  } catch (err: any) {
    console.log(`[Seed] Error:`, err?.message ?? err);
    return c.json({ success: false, error: { message: `Seed failed: ${err?.message ?? err}` } }, 500);
  }
});

Deno.serve(app.fetch);
