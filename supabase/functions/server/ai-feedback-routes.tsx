// ============================================================
// Axon — AI Feedback Routes (Agent 7 — NEXUS)
// Simplified for Figma Make (no auth dependency)
//
// A7-01: POST /ai/quiz-feedback
// A7-02: POST /ai/flashcard-feedback
// A7-03: POST /ai/summary-diagnostic
// A7-04: POST /ai/learning-profile
// A7-05: POST /ai/learning-profile/regenerate
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

function getUserId(body: any): string {
  return body?.student_id || body?.user_id || "demo-student-1";
}

// A7-01
aiFeedback.post("/ai/quiz-feedback", async (c) => {
  try {
    const body = await c.req.json();
    const userId = getUserId(body);
    const { bundle_id } = body;
    if (!bundle_id) return c.json({ success: false, error: { code: "VALIDATION", message: "bundle_id e obrigatorio" } }, 400);
    const bundle = await kv.get(quizBundleKey(bundle_id)) as any;
    let totalQ = 10, correct = 7, accuracy = 70, timeSpent = 720;
    if (bundle) {
      const attemptIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_ATTEMPTS}${userId}:`);
      let attempts: any[] = [];
      if (attemptIds.length > 0) {
        const allAttempts = (await kv.mget((attemptIds as string[]).map((id: string) => quizAttemptKey(id)))).filter(Boolean);
        attempts = allAttempts.filter((a: any) => a.courseId === bundle.course_id || a.topicId === bundle.topic_id);
      }
      const latest = attempts.length > 0 ? attempts.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] : null;
      totalQ = latest?.totalQuestions || bundle.total_questions || 10;
      correct = latest?.correctAnswers || 7;
      accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 70;
      timeSpent = latest?.timeSeconds || 720;
    }
    const prompt = `Analise este resultado de quiz e gere feedback educacional detalhado.\n\nDados: ${totalQ} perguntas, ${correct} acertos, ${totalQ - correct} erros, ${accuracy}% acuracia, ${timeSpent}s\nTema: Biologia Celular (bundle: ${bundle_id})\n\nRetorne JSON:\n{\n  "bundle_id": "${bundle_id}",\n  "summary": { "total_questions": ${totalQ}, "correct": ${correct}, "incorrect": ${totalQ - correct}, "accuracy": ${accuracy}, "time_spent_seconds": ${timeSpent} },\n  "strengths": ["string"],\n  "weaknesses": ["string"],\n  "recommendations": ["string", "string", "string"],\n  "per_question_feedback": [{ "question_id": "string", "question_text": "string", "was_correct": true, "student_answer": "string", "correct_answer": "string", "ai_explanation": "string" }],\n  "study_strategy": "string",\n  "encouragement": "string"\n}\n\nIMPORTANTE: Gere pelo menos 5 perguntas no per_question_feedback.`;
    console.log(`[A7-01] Quiz feedback: bundle=${bundle_id}, user=${userId}, accuracy=${accuracy}%`);
    const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }], AI_FEEDBACK_SYSTEM, 0.7, 6144, true);
    return c.json({ success: true, data: parseGeminiJson(result) });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-01] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar feedback: ${msg}` } }, 500);
  }
});

// A7-02
aiFeedback.post("/ai/flashcard-feedback", async (c) => {
  try {
    const body = await c.req.json();
    const userId = getUserId(body);
    const periodDays = body.period_days || 7;
    let totalReviewed = 45, mastered = 12, struggling = 5, retentionRate = 78, avgInterval = 4.2, streakDays = 5;
    const fsrsIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_FSRS}${userId}:`);
    if (fsrsIds.length > 0) {
      const fsrsStates = (await kv.mget((fsrsIds as string[]).map((id: string) => fsrsKey(userId, id)))).filter(Boolean);
      totalReviewed = fsrsStates.length;
      mastered = fsrsStates.filter((s: any) => s.state === "review" && s.stability > 10).length;
      struggling = fsrsStates.filter((s: any) => s.lapses >= 2).length;
      retentionRate = totalReviewed > 0 ? Math.round((mastered / totalReviewed) * 100) : 0;
      avgInterval = fsrsStates.length > 0 ? Math.round((fsrsStates.reduce((sum: number, s: any) => sum + (s.stability || 0), 0) / fsrsStates.length) * 10) / 10 : 0;
    }
    const prompt = `Analise o desempenho em flashcards nos ultimos ${periodDays} dias.\n\nCards revisados: ${totalReviewed}, dominados: ${mastered}, dificuldade: ${struggling}\nRetencao: ${retentionRate}%, intervalo medio: ${avgInterval}d, racha: ${streakDays}d\n\nRetorne JSON:\n{\n  "period": { "from": "2026-02-12", "to": "2026-02-19", "days": ${periodDays} },\n  "stats": { "cards_reviewed": ${totalReviewed}, "cards_mastered": ${mastered}, "cards_struggling": ${struggling}, "retention_rate": ${retentionRate}, "average_interval_days": ${avgInterval}, "streak_days": ${streakDays} },\n  "struggling_cards": [{ "flashcard_id": "fc-1", "front": "string", "times_failed": 4, "ai_tip": "dica mnemonica" }],\n  "strengths": ["string"],\n  "improvements": ["string"],\n  "ai_study_tips": ["string", "string", "string", "string"],\n  "next_session_recommendation": "string"\n}\nIMPORTANTE: Gere pelo menos 3 struggling_cards com dicas mnemonicas sobre biologia.`;
    console.log(`[A7-02] Flashcard feedback: user=${userId}, period=${periodDays}d`);
    const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }], AI_FEEDBACK_SYSTEM, 0.7, 6144, true);
    return c.json({ success: true, data: parseGeminiJson(result) });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-02] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar feedback: ${msg}` } }, 500);
  }
});

// A7-03
aiFeedback.post("/ai/summary-diagnostic", async (c) => {
  try {
    const body = await c.req.json();
    const userId = getUserId(body);
    const { summary_id } = body;
    if (!summary_id) return c.json({ success: false, error: { code: "VALIDATION", message: "summary_id e obrigatorio" } }, 400);
    const summary = await kv.get(summaryKey(summary_id)) as any;
    const summaryTitle = summary?.title || "Biologia Celular";
    const kwTerms = ["Mitocondria", "Ribossomo", "DNA Polimerase", "Meiose", "Complexo de Golgi", "Reticulo Endoplasmatico", "Membrana Plasmatica", "Lisossomo"];
    const kwBreakdown = kwTerms.map((term, i) => {
      const pKnow = [0.85, 0.65, 0.45, 0.15, 0.78, 0.55, 0.90, 0.30][i];
      return { keyword_id: `kw-${i + 1}`, term, p_know: pKnow, bkt_color: getBktColor(pKnow), status: getBktStatus(pKnow) };
    });
    const overallMastery = Math.round((kwBreakdown.reduce((s, k) => s + k.p_know, 0) / kwBreakdown.length) * 100);
    const prompt = `Analise o dominio sobre "${summaryTitle}".\n\nDominio: ${overallMastery}%\nKeywords:\n${kwBreakdown.map(k => `- ${k.term}: p_know=${k.p_know} (${getBktLabel(k.p_know)})`).join("\n")}\n\nRetorne JSON:\n{\n  "ai_analysis": { "overall_assessment": "string", "key_strengths": ["string"], "gaps": ["string"], "recommended_actions": ["string"], "estimated_time_to_mastery": "string" },\n  "study_plan_suggestion": { "priority_keywords": ["string"], "recommended_order": ["string"], "daily_goal_minutes": 30 }\n}`;
    console.log(`[A7-03] Summary diagnostic: summary=${summary_id}, mastery=${overallMastery}%`);
    const aiResult = await callGemini([{ role: "user", parts: [{ text: prompt }] }], AI_FEEDBACK_SYSTEM, 0.7, 4096, true);
    const aiParsed = parseGeminiJson(aiResult);
    const sorted = [...kwBreakdown].sort((a, b) => b.p_know - a.p_know);
    return c.json({ success: true, data: {
      summary_id, summary_title: summaryTitle, overall_mastery: overallMastery,
      bkt_level: overallMastery >= 75 ? "green" : overallMastery >= 50 ? "yellow" : overallMastery >= 25 ? "orange" : "red",
      keywords_breakdown: kwBreakdown,
      quiz_performance: { total_attempts: 8, average_accuracy: 68, best_topic: sorted[0]?.term || "N/A", worst_topic: sorted[sorted.length - 1]?.term || "N/A" },
      flashcard_performance: { total_reviews: 120, retention_rate: 75, mastered_count: 15 },
      ai_analysis: aiParsed.ai_analysis || {}, study_plan_suggestion: aiParsed.study_plan_suggestion || {},
    }});
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-03] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao gerar diagnostico: ${msg}` } }, 500);
  }
});

// A7-04/05: Learning Profile
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

async function buildLearningProfile(userId: string): Promise<any> {
  const studentStats = await kv.get(statsKey(userId)) as any;
  const bktIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_BKT}${userId}:`);
  let kwMastered = 12, kwInProgress = 10, kwWeak = 6, totalKw = 28, overallAccuracy = 72;
  if (bktIds.length > 0) {
    const bktStates = (await kv.mget((bktIds as string[]).map((id: string) => bktKey(userId, id)))).filter(Boolean);
    totalKw = bktStates.length; kwMastered = bktStates.filter((s: any) => s.p_know >= 0.75).length;
    kwInProgress = bktStates.filter((s: any) => s.p_know >= 0.25 && s.p_know < 0.75).length;
    kwWeak = bktStates.filter((s: any) => s.p_know < 0.25).length;
    overallAccuracy = totalKw > 0 ? Math.round((bktStates.reduce((s: number, b: any) => s + (b.p_know || 0), 0) / totalKw) * 100) : 72;
  }
  const totalStudyHours = studentStats?.totalStudyMinutes ? Math.round(studentStats.totalStudyMinutes / 60) : 42;
  const globalStats = { total_study_hours: totalStudyHours, total_quizzes_completed: 15, total_flashcards_reviewed: 320, total_keywords_studied: totalKw, keywords_mastered: kwMastered, keywords_in_progress: kwInProgress, keywords_weak: kwWeak, overall_accuracy: overallAccuracy, current_streak_days: 5, longest_streak_days: 14, study_consistency: 68 };
  const weeks = [
    { week: "Sem 3", keywords_mastered: 1, accuracy: 55, hours_studied: 3 },
    { week: "Sem 4", keywords_mastered: 2, accuracy: 58, hours_studied: 4 },
    { week: "Sem 5", keywords_mastered: 2, accuracy: 60, hours_studied: 5 },
    { week: "Sem 6", keywords_mastered: 3, accuracy: 65, hours_studied: 7 },
    { week: "Sem 7", keywords_mastered: 4, accuracy: 72, hours_studied: 8 },
    { week: "Sem 8", keywords_mastered: 5, accuracy: 75, hours_studied: 9 },
  ];
  const prompt = `Analise os dados deste estudante e gere um perfil de aprendizagem.\n\nEstatisticas:\n${JSON.stringify(globalStats, null, 2)}\nTimeline:\n${JSON.stringify(weeks, null, 2)}\n\nRetorne JSON:\n{\n  "ai_profile": { "learning_style": "string", "strongest_areas": ["string"], "weakest_areas": ["string"], "study_pattern": "string", "personality_insight": "string" },\n  "ai_recommendations": { "immediate_actions": ["string"], "weekly_goals": ["string"], "long_term_strategy": "string", "recommended_study_time": "string", "focus_keywords": ["string"] },\n  "motivation": { "message": "string", "achievement_highlight": "string", "next_milestone": "string" }\n}`;
  console.log(`[A7-04] Building profile for user=${userId}`);
  const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }], AI_FEEDBACK_SYSTEM, 0.7, 6144, true);
  const aiParsed = parseGeminiJson(result);
  const profile = { student_id: userId, generated_at: new Date().toISOString(), cached: false, global_stats: globalStats, ai_profile: aiParsed.ai_profile || {}, ai_recommendations: aiParsed.ai_recommendations || {}, progress_timeline: weeks, motivation: aiParsed.motivation || {} };
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
