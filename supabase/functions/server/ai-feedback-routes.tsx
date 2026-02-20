// ============================================================
// Axon — AI Feedback Routes (Agent 7 — NEXUS)
// Simplified for Figma Make (no auth dependency)
//
// A7-01: POST /ai/quiz-feedback
// A7-02: POST /ai/flashcard-feedback
// A7-03: POST /ai/summary-diagnostic
// A7-04: POST /ai/learning-profile
// A7-05: POST /ai/learning-profile/regenerate
//
// P5/A7-12: Enriched quiz-feedback prompt with student stats + BKT
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  callGemini, parseGeminiJson, errMsg,
  getBktLabel, getBktColor, getBktStatus,
  AI_FEEDBACK_SYSTEM,
} from "./ai-helpers.tsx";
import {
  quizBundleKey, quizAttemptKey, learningProfileKey,
  bktKey, statsKey, dailyKey,
  summaryKey, kwKey, fcKey, quizKey, fsrsKey,
  KV_PREFIXES,
} from "./kv-keys.ts";

const aiFeedback = new Hono();

// Helper: extract user id from body or use default
function getUserId(body: any): string {
  return body?.student_id || body?.user_id || "demo-student-1";
}

// ── A7-01: POST /ai/quiz-feedback ──
aiFeedback.post("/ai/quiz-feedback", async (c) => {
  try {
    const body = await c.req.json();
    const userId = getUserId(body);
    const { bundle_id } = body;

    if (!bundle_id) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "bundle_id e obrigatorio" } }, 400);
    }

    // Try to read real data from KV
    const bundle = await kv.get(quizBundleKey(bundle_id)) as any;

    // Enrich context: student stats + BKT data (A7-12)
    const studentStats = await kv.get(statsKey(userId)) as any;
    const bktIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_BKT}${userId}:`);
    let studentContext = "";
    if (studentStats) {
      studentContext += `\nContexto do estudante: ${studentStats.totalStudyMinutes || 0} minutos de estudo total, `;
      studentContext += `${studentStats.quizzesCompleted || 0} quizzes completados.`;
    }
    if (bktIds.length > 0) {
      const bktStates = (await kv.mget((bktIds as string[]).map((id: string) => bktKey(userId, id)))).filter(Boolean);
      const mastered = bktStates.filter((s: any) => s.p_know >= 0.75).length;
      const weak = bktStates.filter((s: any) => s.p_know < 0.25).length;
      studentContext += `\nBKT: ${bktStates.length} keywords estudadas, ${mastered} dominadas, ${weak} precisam atencao.`;
    }

    // Build context from real data or use minimal context
    let totalQ = 10, correct = 7, accuracy = 70, timeSpent = 720;
    let perQContext = "";

    if (bundle) {
      const attemptIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_ATTEMPTS}${userId}:`);
      let attempts: any[] = [];
      if (attemptIds.length > 0) {
        const allAttempts = (await kv.mget(
          (attemptIds as string[]).map((id: string) => quizAttemptKey(id))
        )).filter(Boolean);
        attempts = allAttempts.filter((a: any) =>
          a.courseId === bundle.course_id || a.topicId === bundle.topic_id
        );
      }
      const latest = attempts.length > 0
        ? attempts.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
        : null;

      totalQ = latest?.totalQuestions || bundle.total_questions || 10;
      correct = latest?.correctAnswers || 7;
      accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 70;
      timeSpent = latest?.timeSeconds || 720;
    }

    const prompt = `Analise este resultado de quiz e gere feedback educacional detalhado.

Dados: ${totalQ} perguntas, ${correct} acertos, ${totalQ - correct} erros, ${accuracy}% acuracia, ${timeSpent}s de tempo
Tema: Biologia Celular (quiz bundle: ${bundle_id})
${studentContext}
${perQContext}

Retorne JSON com esta estrutura EXATA:
{
  "bundle_id": "${bundle_id}",
  "summary": { "total_questions": ${totalQ}, "correct": ${correct}, "incorrect": ${totalQ - correct}, "accuracy": ${accuracy}, "time_spent_seconds": ${timeSpent} },
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["area de melhoria 1", "area de melhoria 2"],
  "recommendations": ["recomendacao 1", "recomendacao 2", "recomendacao 3"],
  "per_question_feedback": [
    { "question_id": "qq-1", "question_text": "pergunta exemplo", "was_correct": true, "student_answer": "resposta", "correct_answer": "resposta", "ai_explanation": "explicacao detalhada" },
    { "question_id": "qq-2", "question_text": "pergunta exemplo 2", "was_correct": false, "student_answer": "resposta errada", "correct_answer": "resposta certa", "ai_explanation": "explicacao detalhada" }
  ],
  "study_strategy": "estrategia de estudo personalizada",
  "encouragement": "mensagem motivacional"
}

IMPORTANTE: Gere pelo menos 5 perguntas no per_question_feedback, misturando acertos e erros conforme a acuracia.`;

    console.log(`[A7-01] Quiz feedback: bundle=${bundle_id}, user=${userId}, accuracy=${accuracy}%`);

    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      AI_FEEDBACK_SYSTEM, 0.7, 6144, true
    );

    return c.json({ success: true, data: parseGeminiJson(result) });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-01] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar feedback: ${msg}` } }, 500);
  }
});

// ── A7-02: POST /ai/flashcard-feedback ──
aiFeedback.post("/ai/flashcard-feedback", async (c) => {
  try {
    const body = await c.req.json();
    const userId = getUserId(body);
    const periodDays = body.period_days || 7;

    // Try reading real FSRS data
    let totalReviewed = 45, mastered = 12, struggling = 5, retentionRate = 78;
    let avgInterval = 4.2, streakDays = 5;

    const fsrsIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_FSRS}${userId}:`);
    if (fsrsIds.length > 0) {
      const fsrsStates = (await kv.mget(
        (fsrsIds as string[]).map((id: string) => fsrsKey(userId, id))
      )).filter(Boolean);
      totalReviewed = fsrsStates.length;
      mastered = fsrsStates.filter((s: any) => s.state === "review" && s.stability > 10).length;
      struggling = fsrsStates.filter((s: any) => s.lapses >= 2).length;
      retentionRate = totalReviewed > 0 ? Math.round((mastered / totalReviewed) * 100) : 0;
      avgInterval = fsrsStates.length > 0
        ? Math.round((fsrsStates.reduce((sum: number, s: any) => sum + (s.stability || 0), 0) / fsrsStates.length) * 10) / 10
        : 0;
    }

    const prompt = `Analise o desempenho em flashcards nos ultimos ${periodDays} dias.

Cards revisados: ${totalReviewed}, dominados: ${mastered}, com dificuldade: ${struggling}
Retencao: ${retentionRate}%, intervalo medio: ${avgInterval} dias, racha: ${streakDays} dias

Retorne JSON com esta estrutura EXATA:
{
  "period": { "from": "2026-02-12", "to": "2026-02-19", "days": ${periodDays} },
  "stats": { "cards_reviewed": ${totalReviewed}, "cards_mastered": ${mastered}, "cards_struggling": ${struggling}, "retention_rate": ${retentionRate}, "average_interval_days": ${avgInterval}, "streak_days": ${streakDays} },
  "struggling_cards": [
    { "flashcard_id": "fc-1", "front": "pergunta do card dificil", "times_failed": 4, "ai_tip": "dica mnemonica personalizada" },
    { "flashcard_id": "fc-2", "front": "pergunta do card dificil 2", "times_failed": 3, "ai_tip": "dica mnemonica personalizada" }
  ],
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "improvements": ["melhoria 1", "melhoria 2", "melhoria 3"],
  "ai_study_tips": ["dica 1", "dica 2", "dica 3", "dica 4"],
  "next_session_recommendation": "recomendacao para proxima sessao"
}

IMPORTANTE: Gere pelo menos 3 struggling_cards com dicas mnemonicas criativas sobre biologia.`;

    console.log(`[A7-02] Flashcard feedback: user=${userId}, period=${periodDays}d`);

    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      AI_FEEDBACK_SYSTEM, 0.7, 6144, true
    );

    return c.json({ success: true, data: parseGeminiJson(result) });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-02] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar feedback: ${msg}` } }, 500);
  }
});

// ── A7-03: POST /ai/summary-diagnostic ──
aiFeedback.post("/ai/summary-diagnostic", async (c) => {
  try {
    const body = await c.req.json();
    const userId = getUserId(body);
    const { summary_id } = body;

    if (!summary_id) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "summary_id e obrigatorio" } }, 400);
    }

    // Try reading real summary data
    const summary = await kv.get(summaryKey(summary_id)) as any;
    const summaryTitle = summary?.title || "Biologia Celular";

    // Generate realistic keyword breakdown
    const kwTerms = ["Mitocondria", "Ribossomo", "DNA Polimerase", "Meiose",
      "Complexo de Golgi", "Reticulo Endoplasmatico", "Membrana Plasmatica", "Lisossomo"];

    const kwBreakdown = kwTerms.map((term, i) => {
      const pKnow = [0.85, 0.65, 0.45, 0.15, 0.78, 0.55, 0.90, 0.30][i];
      return {
        keyword_id: `kw-${i + 1}`,
        term,
        p_know: pKnow,
        bkt_color: getBktColor(pKnow),
        status: getBktStatus(pKnow),
      };
    });

    const overallMastery = Math.round(
      (kwBreakdown.reduce((s, k) => s + k.p_know, 0) / kwBreakdown.length) * 100
    );

    const prompt = `Analise o dominio sobre "${summaryTitle}".

Dominio: ${overallMastery}%
Keywords (${kwBreakdown.length}):
${kwBreakdown.map(k => `- ${k.term}: p_know=${k.p_know} (${getBktLabel(k.p_know)})`).join("\n")}

Retorne JSON com esta estrutura EXATA:
{
  "ai_analysis": {
    "overall_assessment": "avaliacao geral detalhada",
    "key_strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
    "gaps": ["lacuna 1", "lacuna 2", "lacuna 3", "lacuna 4"],
    "recommended_actions": ["acao 1", "acao 2", "acao 3", "acao 4"],
    "estimated_time_to_mastery": "estimativa de tempo"
  },
  "study_plan_suggestion": {
    "priority_keywords": ["keyword prioritaria 1", "keyword prioritaria 2", "keyword prioritaria 3"],
    "recommended_order": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
    "daily_goal_minutes": 30
  }
}`;

    console.log(`[A7-03] Summary diagnostic: summary=${summary_id}, mastery=${overallMastery}%`);

    const aiResult = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      AI_FEEDBACK_SYSTEM, 0.7, 4096, true
    );
    const aiParsed = parseGeminiJson(aiResult);

    const sorted = [...kwBreakdown].sort((a, b) => b.p_know - a.p_know);
    const diagnostic = {
      summary_id,
      summary_title: summaryTitle,
      overall_mastery: overallMastery,
      bkt_level: overallMastery >= 75 ? "green" : overallMastery >= 50 ? "yellow" : overallMastery >= 25 ? "orange" : "red",
      keywords_breakdown: kwBreakdown,
      quiz_performance: {
        total_attempts: 8,
        average_accuracy: 68,
        best_topic: sorted[0]?.term || "N/A",
        worst_topic: sorted[sorted.length - 1]?.term || "N/A",
      },
      flashcard_performance: {
        total_reviews: 120,
        retention_rate: 75,
        mastered_count: 15,
      },
      ai_analysis: aiParsed.ai_analysis || {},
      study_plan_suggestion: aiParsed.study_plan_suggestion || {},
    };

    return c.json({ success: true, data: diagnostic });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-03] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar diagnostico: ${msg}` } }, 500);
  }
});

// ── A7-04: POST /ai/learning-profile (cache 24h) ──
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

async function buildLearningProfile(userId: string): Promise<any> {
  // Try reading real stats
  const studentStats = await kv.get(statsKey(userId)) as any;

  const bktIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_BKT}${userId}:`);
  let kwMastered = 12, kwInProgress = 10, kwWeak = 6, totalKw = 28, overallAccuracy = 72;

  if (bktIds.length > 0) {
    const bktStates = (await kv.mget((bktIds as string[]).map((id: string) => bktKey(userId, id)))).filter(Boolean);
    totalKw = bktStates.length;
    kwMastered = bktStates.filter((s: any) => s.p_know >= 0.75).length;
    kwInProgress = bktStates.filter((s: any) => s.p_know >= 0.25 && s.p_know < 0.75).length;
    kwWeak = bktStates.filter((s: any) => s.p_know < 0.25).length;
    overallAccuracy = totalKw > 0
      ? Math.round((bktStates.reduce((s: number, b: any) => s + (b.p_know || 0), 0) / totalKw) * 100)
      : 72;
  }

  const totalStudyHours = studentStats?.totalStudyMinutes
    ? Math.round(studentStats.totalStudyMinutes / 60) : 42;

  const globalStats = {
    total_study_hours: totalStudyHours,
    total_quizzes_completed: 15,
    total_flashcards_reviewed: 320,
    total_keywords_studied: totalKw,
    keywords_mastered: kwMastered,
    keywords_in_progress: kwInProgress,
    keywords_weak: kwWeak,
    overall_accuracy: overallAccuracy,
    current_streak_days: 5,
    longest_streak_days: 14,
    study_consistency: 68,
  };

  const weeks = [
    { week: "Sem 3", keywords_mastered: 1, accuracy: 55, hours_studied: 3 },
    { week: "Sem 4", keywords_mastered: 2, accuracy: 58, hours_studied: 4 },
    { week: "Sem 5", keywords_mastered: 2, accuracy: 60, hours_studied: 5 },
    { week: "Sem 6", keywords_mastered: 3, accuracy: 65, hours_studied: 7 },
    { week: "Sem 7", keywords_mastered: 4, accuracy: 72, hours_studied: 8 },
    { week: "Sem 8", keywords_mastered: 5, accuracy: 75, hours_studied: 9 },
  ];

  const prompt = `Analise os dados deste estudante e gere um perfil de aprendizagem.

Estatisticas:
${JSON.stringify(globalStats, null, 2)}
Timeline:
${JSON.stringify(weeks, null, 2)}

Retorne JSON com esta estrutura EXATA:
{
  "ai_profile": {
    "learning_style": "estilo de aprendizagem",
    "strongest_areas": ["area forte 1", "area forte 2", "area forte 3"],
    "weakest_areas": ["area fraca 1", "area fraca 2", "area fraca 3"],
    "study_pattern": "descricao do padrao de estudo",
    "personality_insight": "insight sobre personalidade academica"
  },
  "ai_recommendations": {
    "immediate_actions": ["acao imediata 1", "acao imediata 2", "acao imediata 3"],
    "weekly_goals": ["meta semanal 1", "meta semanal 2", "meta semanal 3"],
    "long_term_strategy": "estrategia de longo prazo detalhada",
    "recommended_study_time": "tempo recomendado",
    "focus_keywords": ["keyword foco 1", "keyword foco 2", "keyword foco 3", "keyword foco 4", "keyword foco 5"]
  },
  "motivation": {
    "message": "mensagem motivacional personalizada",
    "achievement_highlight": "conquista recente",
    "next_milestone": "proximo marco"
  }
}`;

  console.log(`[A7-04] Building profile for user=${userId}`);

  const result = await callGemini(
    [{ role: "user", parts: [{ text: prompt }] }],
    AI_FEEDBACK_SYSTEM, 0.7, 6144, true
  );
  const aiParsed = parseGeminiJson(result);

  const profile = {
    student_id: userId,
    generated_at: new Date().toISOString(),
    cached: false,
    global_stats: globalStats,
    ai_profile: aiParsed.ai_profile || {},
    ai_recommendations: aiParsed.ai_recommendations || {},
    progress_timeline: weeks,
    motivation: aiParsed.motivation || {},
  };

  await kv.set(learningProfileKey(userId), profile);
  console.log(`[A7-04] Profile cached for user=${userId}`);
  return profile;
}

aiFeedback.post("/ai/learning-profile", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const userId = getUserId(body);
    const force = body.force === true;

    if (!force) {
      const cached = await kv.get(learningProfileKey(userId)) as any;
      if (cached && cached.generated_at) {
        const age = Date.now() - new Date(cached.generated_at).getTime();
        if (age < PROFILE_TTL_MS) {
          console.log(`[A7-04] Returning cached profile (age=${Math.round(age / 60000)}min)`);
          return c.json({ success: true, data: { ...cached, cached: true } });
        }
      }
    }

    const profile = await buildLearningProfile(userId);
    return c.json({ success: true, data: profile });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-04] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar perfil: ${msg}` } }, 500);
  }
});

// ── A7-05: POST /ai/learning-profile/regenerate ──
aiFeedback.post("/ai/learning-profile/regenerate", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const userId = getUserId(body);
    console.log(`[A7-05] Force regenerating profile for user=${userId}`);
    const profile = await buildLearningProfile(userId);
    return c.json({ success: true, data: profile });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-05] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao regenerar perfil: ${msg}` } }, 500);
  }
});

export default aiFeedback;
