// ============================================================
// Axon — AI Feedback Routes (Agent 7 — NEXUS)
// File ownership: Agent 7 exclusive
//
// A7-01: POST /ai/quiz-feedback
// A7-02: POST /ai/flashcard-feedback
// A7-03: POST /ai/summary-diagnostic
// A7-04: POST /ai/learning-profile  (KV cache 24h)
// A7-05: POST /ai/learning-profile/regenerate
//
// All prompts in pt-BR, structured JSON via Gemini,
// BKT color system, immutable reads from QuizAttempt/QuizBundle.
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUserIdFromToken } from "./auth.tsx";
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

// ────────────────────────────────────────────────────────────
// A7-01: POST /ai/quiz-feedback
// Input: { bundle_id: string }
// Reads QuizBundle + QuizAttempts (immutable), calls Gemini.
// ────────────────────────────────────────────────────────────
aiFeedback.post("/ai/quiz-feedback", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json();
    const { bundle_id } = body;

    if (!bundle_id) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "bundle_id e obrigatorio" } }, 400);
    }

    const bundle = await kv.get(quizBundleKey(bundle_id)) as any;
    if (!bundle) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: `QuizBundle ${bundle_id} nao encontrado` } }, 404);
    }

    // Read quiz attempts for this student
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

    // Read quiz questions for context
    let quizQuestions: any[] = [];
    if (bundle.question_ids && bundle.question_ids.length > 0) {
      quizQuestions = (await kv.mget(
        bundle.question_ids.map((id: string) => quizKey(id))
      )).filter(Boolean);
    }

    // Build context
    const latest = attempts.length > 0
      ? attempts.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
      : null;

    const totalQ = latest?.totalQuestions || bundle.total_questions || quizQuestions.length || 0;
    const correct = latest?.correctAnswers || 0;
    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    const timeSpent = latest?.timeSeconds || 0;

    const perQ = (latest?.answers || []).map((ans: any, i: number) => {
      const q = quizQuestions.find((qq: any) => qq.id === ans.questionId) || quizQuestions[i];
      return {
        question: q?.question || `Pergunta ${i + 1}`,
        student_answer: String(ans.userAnswer),
        correct: ans.correct,
        correct_answer: q?.correct_answer != null ? (q.options?.[q.correct_answer] || String(q.correct_answer)) : "N/A",
        explanation_hint: q?.explanation || "",
      };
    });

    const prompt = `Analise este resultado de quiz e gere feedback detalhado.

Dados: ${totalQ} perguntas, ${correct} acertos, ${totalQ - correct} erros, ${accuracy}% acuracia, ${timeSpent}s
${perQ.length > 0 ? `\nDetalhes:\n${JSON.stringify(perQ, null, 2)}` : ""}

Retorne JSON:
{
  "bundle_id": "${bundle_id}",
  "summary": { "total_questions": ${totalQ}, "correct": ${correct}, "incorrect": ${totalQ - correct}, "accuracy": ${accuracy}, "time_spent_seconds": ${timeSpent} },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string", "string", "string"],
  "per_question_feedback": [{ "question_id": "string", "question_text": "string", "was_correct": true, "student_answer": "string", "correct_answer": "string", "ai_explanation": "string" }],
  "study_strategy": "string",
  "encouragement": "string"
}`;

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

// ────────────────────────────────────────────────────────────
// A7-02: POST /ai/flashcard-feedback
// Input: { period_days?: number } (default 7)
// Reads FSRS states + daily activity, calls Gemini.
// ────────────────────────────────────────────────────────────
aiFeedback.post("/ai/flashcard-feedback", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json();
    const periodDays = body.period_days || 7;
    const now = new Date();

    // 1. Read all FSRS states
    const fsrsIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_FSRS}${userId}:`);
    let fsrsStates: any[] = [];
    if (fsrsIds.length > 0) {
      fsrsStates = (await kv.mget(
        (fsrsIds as string[]).map((id: string) => fsrsKey(userId, id))
      )).filter(Boolean);
    }

    // 2. Read daily activity
    const dailyKeys: string[] = [];
    for (let d = 0; d < periodDays; d++) {
      const date = new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
      dailyKeys.push(dailyKey(userId, date));
    }
    const dailyData = (await kv.mget(dailyKeys)).filter(Boolean);

    // 3. Stats
    const totalReviewed = fsrsStates.length;
    const mastered = fsrsStates.filter((s: any) => s.state === "review" && s.stability > 10).length;
    const struggling = fsrsStates.filter((s: any) => s.lapses >= 2).length;
    const retentionRate = totalReviewed > 0 ? Math.round((mastered / totalReviewed) * 100) : 0;
    const avgInterval = fsrsStates.length > 0
      ? Math.round((fsrsStates.reduce((sum: number, s: any) => sum + (s.stability || 0), 0) / fsrsStates.length) * 10) / 10
      : 0;

    // 4. Struggling cards (top 5)
    const topStruggling = fsrsStates
      .filter((s: any) => s.lapses >= 2)
      .sort((a: any, b: any) => b.lapses - a.lapses)
      .slice(0, 5);

    let strugglingWithFronts: any[] = [];
    if (topStruggling.length > 0) {
      const cardData = await kv.mget(topStruggling.map((s: any) => fcKey(s.card_id)));
      strugglingWithFronts = topStruggling.map((s: any, i: number) => ({
        flashcard_id: s.card_id,
        front: (cardData[i] as any)?.front || "Card sem texto",
        times_failed: s.lapses,
      }));
    }

    // 5. Streak
    let streakDays = 0;
    for (let d = 0; d < periodDays; d++) {
      const date = new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
      const day = dailyData.find((dd: any) => dd.date === date);
      if (day && (day as any).cardsReviewed > 0) streakDays++;
      else if (d > 0) break;
    }

    const prompt = `Analise o desempenho em flashcards nos ultimos ${periodDays} dias.

Cards revisados: ${totalReviewed}, dominados: ${mastered}, dificuldade: ${struggling}
Retencao: ${retentionRate}%, intervalo medio: ${avgInterval} dias, racha: ${streakDays} dias
${strugglingWithFronts.length > 0 ? `Cards dificeis:\n${JSON.stringify(strugglingWithFronts)}` : ""}

Retorne JSON:
{
  "period": { "days": ${periodDays} },
  "stats": { "cards_reviewed": ${totalReviewed}, "cards_mastered": ${mastered}, "cards_struggling": ${struggling}, "retention_rate": ${retentionRate}, "average_interval_days": ${avgInterval}, "streak_days": ${streakDays} },
  "struggling_cards": [{ "flashcard_id": "string", "front": "string", "times_failed": 0, "ai_tip": "dica mnemonica" }],
  "strengths": ["string"],
  "improvements": ["string"],
  "ai_study_tips": ["string", "string", "string", "string"],
  "next_session_recommendation": "string"
}`;

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

// ────────────────────────────────────────────────────────────
// A7-03: POST /ai/summary-diagnostic
// Input: { summary_id: string }
// Reads keywords + BKT states + quiz/flashcard performance.
// ────────────────────────────────────────────────────────────
aiFeedback.post("/ai/summary-diagnostic", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json();
    const { summary_id } = body;

    if (!summary_id) {
      return c.json({ success: false, error: { code: "VALIDATION", message: "summary_id e obrigatorio" } }, 400);
    }

    const summary = await kv.get(summaryKey(summary_id)) as any;
    if (!summary) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: `Summary ${summary_id} nao encontrado` } }, 404);
    }

    // Read keywords (via idx:summary-kw or idx:inst-kw fallback)
    let keywords: any[] = [];
    const kwInstIds = await kv.getByPrefix(`idx:summary-kw:${summary_id}:`);
    if (kwInstIds.length > 0) {
      const kwInstData = (await kv.mget(
        (kwInstIds as string[]).map((id: string) => `kw-inst:${id}`)
      )).filter(Boolean);
      const kwIds = kwInstData.map((ki: any) => ki.keyword_id || ki.id).filter(Boolean);
      if (kwIds.length > 0) {
        keywords = (await kv.mget(kwIds.map((id: string) => kwKey(id)))).filter(Boolean);
      }
    }
    if (keywords.length === 0 && summary.institution_id) {
      const instKwIds = await kv.getByPrefix(`idx:inst-kw:${summary.institution_id}:`);
      if (instKwIds.length > 0) {
        keywords = (await kv.mget(
          (instKwIds as string[]).slice(0, 20).map((id: string) => kwKey(id))
        )).filter(Boolean);
      }
    }

    // BKT states per keyword
    const kwBreakdown: any[] = [];
    for (const kw of keywords) {
      const stIds = await kv.getByPrefix(`idx:kw-subtopics:${kw.id}:`);
      let avgP = 0.5;
      if (stIds.length > 0) {
        const bktS = (await kv.mget(
          (stIds as string[]).map((stId: string) => bktKey(userId, stId))
        )).filter(Boolean);
        if (bktS.length > 0) {
          avgP = bktS.reduce((s: number, b: any) => s + (b.p_know || 0), 0) / bktS.length;
        }
      }
      kwBreakdown.push({
        keyword_id: kw.id, term: kw.term,
        p_know: Math.round(avgP * 100) / 100,
        bkt_color: getBktColor(avgP),
        status: getBktStatus(avgP),
      });
    }

    const overallMastery = kwBreakdown.length > 0
      ? Math.round((kwBreakdown.reduce((s: number, k: any) => s + k.p_know, 0) / kwBreakdown.length) * 100)
      : 50;

    // Quiz performance
    const attemptIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_ATTEMPTS}${userId}:`);
    let quizAttempts: any[] = [];
    if (attemptIds.length > 0) {
      const all = (await kv.mget((attemptIds as string[]).map((id: string) => quizAttemptKey(id)))).filter(Boolean);
      quizAttempts = all.filter((a: any) => a.topicId === summary.topic_id);
    }
    const avgAccuracy = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((s: number, a: any) => s + (a.score || 0), 0) / quizAttempts.length)
      : 0;

    // Flashcard performance
    let fcCount = 0;
    let fcMastered = 0;
    for (const kw of keywords) {
      const fcIds = await kv.getByPrefix(`idx:kw-fc:${kw.id}:`);
      fcCount += fcIds.length;
      if (fcIds.length > 0) {
        const states = (await kv.mget((fcIds as string[]).map((id: string) => fsrsKey(userId, id)))).filter(Boolean);
        fcMastered += states.filter((s: any) => s.state === "review" && s.stability > 10).length;
      }
    }

    // Call Gemini
    const prompt = `Analise o dominio sobre "${summary.title || summary_id}".

Dominio: ${overallMastery}%
Keywords (${kwBreakdown.length}):
${kwBreakdown.map((k: any) => `- ${k.term}: p_know=${k.p_know} (${getBktLabel(k.p_know)})`).join("\n")}
Quizzes: ${quizAttempts.length} tentativas, ${avgAccuracy}% media
Flashcards: ${fcCount} total, ${fcMastered} dominados

Retorne JSON:
{
  "ai_analysis": {
    "overall_assessment": "string",
    "key_strengths": ["string"],
    "gaps": ["string"],
    "recommended_actions": ["string", "string", "string", "string"],
    "estimated_time_to_mastery": "string"
  },
  "study_plan_suggestion": {
    "priority_keywords": ["string"],
    "recommended_order": ["string"],
    "daily_goal_minutes": 30
  }
}`;

    console.log(`[A7-03] Summary diagnostic: summary=${summary_id}, mastery=${overallMastery}%`);

    const aiResult = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      AI_FEEDBACK_SYSTEM, 0.7, 4096, true
    );
    const aiParsed = parseGeminiJson(aiResult);

    const sorted = [...kwBreakdown].sort((a: any, b: any) => b.p_know - a.p_know);
    const diagnostic = {
      summary_id,
      summary_title: summary.title || summary_id,
      overall_mastery: overallMastery,
      bkt_level: overallMastery >= 75 ? "green" : overallMastery >= 50 ? "yellow" : overallMastery >= 25 ? "orange" : "red",
      keywords_breakdown: kwBreakdown,
      quiz_performance: {
        total_attempts: quizAttempts.length,
        average_accuracy: avgAccuracy,
        best_topic: sorted[0]?.term || "N/A",
        worst_topic: sorted[sorted.length - 1]?.term || "N/A",
      },
      flashcard_performance: {
        total_reviews: fcCount,
        retention_rate: fcCount > 0 ? Math.round((fcMastered / fcCount) * 100) : 0,
        mastered_count: fcMastered,
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

// ────────────────────────────────────────────────────────────
// A7-04 / A7-05: Learning Profile (with KV cache 24h TTL)
// ────────────────────────────────────────────────────────────
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

async function buildLearningProfile(userId: string): Promise<any> {
  const studentStats = await kv.get(statsKey(userId)) as any;

  // BKT states
  const bktIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_BKT}${userId}:`);
  let bktStates: any[] = [];
  if (bktIds.length > 0) {
    bktStates = (await kv.mget((bktIds as string[]).map((id: string) => bktKey(userId, id)))).filter(Boolean);
  }

  const kwMastered = bktStates.filter((s: any) => s.p_know >= 0.75).length;
  const kwInProgress = bktStates.filter((s: any) => s.p_know >= 0.25 && s.p_know < 0.75).length;
  const kwWeak = bktStates.filter((s: any) => s.p_know < 0.25).length;
  const totalKw = bktStates.length;
  const overallAccuracy = totalKw > 0
    ? Math.round((bktStates.reduce((s: number, b: any) => s + (b.p_know || 0), 0) / totalKw) * 100)
    : 0;

  // Quiz + Flashcard counts
  const attemptIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_ATTEMPTS}${userId}:`);
  const quizCount = attemptIds.length;
  const fsrsIds = await kv.getByPrefix(`${KV_PREFIXES.IDX_STUDENT_FSRS}${userId}:`);
  const fcReviewed = fsrsIds.length;

  // Weekly progress (last 6 weeks)
  const now = new Date();
  const weeks: any[] = [];
  for (let w = 5; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
    let weekHours = 0;
    let weekAccuracy = 0;
    let dayCount = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart.getTime() + d * 86400000).toISOString().split("T")[0];
      const day = await kv.get(dailyKey(userId, date)) as any;
      if (day) {
        weekHours += (day.studyMinutes || 0) / 60;
        if (day.retentionPercent) { weekAccuracy += day.retentionPercent; dayCount++; }
      }
    }
    weeks.push({
      week: `Sem ${6 - w}`,
      keywords_mastered: Math.round(kwMastered * ((6 - w) / 6)),
      accuracy: dayCount > 0 ? Math.round(weekAccuracy / dayCount) : overallAccuracy,
      hours_studied: Math.round(weekHours * 10) / 10,
    });
  }

  // Streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  for (let d = 0; d < 60; d++) {
    const date = new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
    const day = await kv.get(dailyKey(userId, date)) as any;
    if (day && day.studyMinutes > 0) {
      tempStreak++;
      if (d === 0 || currentStreak > 0) currentStreak = tempStreak;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
      if (d === 0) currentStreak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const totalStudyHours = studentStats?.totalStudyMinutes
    ? Math.round(studentStats.totalStudyMinutes / 60)
    : weeks.reduce((s: number, w: any) => s + w.hours_studied, 0);

  const globalStats = {
    total_study_hours: totalStudyHours,
    total_quizzes_completed: quizCount,
    total_flashcards_reviewed: fcReviewed,
    total_keywords_studied: totalKw,
    keywords_mastered: kwMastered,
    keywords_in_progress: kwInProgress,
    keywords_weak: kwWeak,
    overall_accuracy: overallAccuracy,
    current_streak_days: currentStreak,
    longest_streak_days: longestStreak,
    study_consistency: totalStudyHours > 0 ? Math.min(Math.round((currentStreak / 7) * 100), 100) : 0,
  };

  const prompt = `Analise os dados deste estudante e gere um perfil de aprendizagem.

Estatisticas:\n${JSON.stringify(globalStats, null, 2)}
Timeline:\n${JSON.stringify(weeks, null, 2)}

Retorne JSON:
{
  "ai_profile": {
    "learning_style": "string",
    "strongest_areas": ["string"],
    "weakest_areas": ["string"],
    "study_pattern": "string",
    "personality_insight": "string"
  },
  "ai_recommendations": {
    "immediate_actions": ["string", "string", "string"],
    "weekly_goals": ["string", "string", "string"],
    "long_term_strategy": "string",
    "recommended_study_time": "string",
    "focus_keywords": ["string", "string", "string"]
  },
  "motivation": {
    "message": "string",
    "achievement_highlight": "string",
    "next_milestone": "string"
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

// A7-04: POST /ai/learning-profile (with cache)
aiFeedback.post("/ai/learning-profile", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    const userId = authResult.userId;
    const body = await c.req.json().catch(() => ({}));
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

// A7-05: POST /ai/learning-profile/regenerate (force bypass cache)
aiFeedback.post("/ai/learning-profile/regenerate", async (c) => {
  try {
    const authResult = await getUserIdFromToken(c.req.header("Authorization"));
    if ("error" in authResult) {
      return c.json({ success: false, error: { code: "AUTH_ERROR", message: authResult.error } }, 401);
    }
    console.log(`[A7-05] Force regenerating profile for user=${authResult.userId}`);
    const profile = await buildLearningProfile(authResult.userId);
    return c.json({ success: true, data: profile });
  } catch (err: unknown) {
    const msg = errMsg(err);
    console.log(`[A7-05] Error: ${msg}`);
    return c.json({ success: false, error: { code: "AI_ERROR", message: `Erro ao regenerar perfil: ${msg}` } }, 500);
  }
});

export default aiFeedback;
