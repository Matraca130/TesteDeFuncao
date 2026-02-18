// ============================================================
// Axon v4.2 — QuizSession: Full quiz session orchestrator
// ============================================================
// Manages the complete quiz flow:
//   1. Load questions from backend (by keyword_id or summary_id)
//   2. Create a study session (POST /sessions)
//   3. For each question: render -> evaluate -> show result -> review
//   4. Show session summary at the end
//
// Integration:
//   - If `apiFetchFn` is provided (GitHub platform), it is used
//     for all API calls. Caller wraps AuthContext.apiFetch.
//   - If not provided (Figma Make standalone), uses inline fetch
//     with dual-header pattern.
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { WriteInQuestion } from "./WriteInQuestion";
import { FillBlankQuestion } from "./FillBlankQuestion";
import { QuizResult } from "./QuizResult";
import type { QuizResultData, QuizFeedback } from "./QuizResult";

interface QuizQuestionData {
  id: string;
  summary_id: string | null;
  keyword_id: string;
  subtopic_id: string | null;
  question: string;
  quiz_type: string;
  options?: { label: string; text: string; is_correct: boolean }[] | null;
  correct_answer?: string | null;
  accepted_variations?: string[] | null;
  hint?: string | null;
  explanation?: string | null;
}

interface SessionSummary {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  results: { question: string; correct: boolean; type: string }[];
}

type SessionPhase = "loading" | "active" | "result" | "summary" | "error";

// ── API fetch function signature ──
type ApiFetchFn = (path: string, opts?: { method?: string; body?: any }) => Promise<any>;

interface QuizSessionProps {
  keywordId?: string;
  summaryId?: string;
  /** API base URL (used only when apiFetchFn is NOT provided) */
  apiBase?: string;
  /** Public anon key (used only when apiFetchFn is NOT provided) */
  publicAnonKey?: string;
  /** Access token (used only when apiFetchFn is NOT provided) */
  accessToken?: string;
  /** Custom API fetch function — injected by caller (e.g. QuizView wrapping AuthContext.apiFetch) */
  apiFetchFn?: ApiFetchFn;
  onSessionEnd?: (summary: SessionSummary) => void;
}

export function QuizSession({
  keywordId,
  summaryId,
  apiBase,
  publicAnonKey: anonKey,
  accessToken,
  apiFetchFn,
  onSessionEnd,
}: QuizSessionProps) {
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evalResult, setEvalResult] = useState<QuizResultData | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const showTime = useRef(Date.now());
  const resultsRef = useRef<{ question: string; correct: boolean; type: string }[]>([]);

  // ── Fetch helper — uses injected fn or falls back to inline ──
  const apiFetch: ApiFetchFn = useCallback(
    apiFetchFn ?? (async (path: string, opts?: { method?: string; body?: any }) => {
      if (!apiBase || !anonKey) throw new Error("apiBase and publicAnonKey required when apiFetchFn is not provided");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      };
      if (accessToken) headers["X-User-Token"] = accessToken;
      const res = await fetch(`${apiBase}${path}`, {
        method: opts?.method ?? "GET",
        headers,
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
      });
      return res.json();
    }),
    [apiFetchFn, apiBase, anonKey, accessToken]
  );

  // ── Initialize session ──
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const sessRes = await apiFetch("/sessions", {
          method: "POST",
          body: { session_type: "quiz", course_id: null },
        });
        if (!sessRes?.success) throw new Error(sessRes?.error?.message || "Failed to create session");
        if (!cancelled) setSessionId(sessRes.data.id);

        const param = keywordId ? `keyword_id=${keywordId}` : summaryId ? `summary_id=${summaryId}` : null;
        if (!param) throw new Error("keywordId or summaryId required");

        const qRes = await apiFetch(`/quiz-questions?${param}`);
        if (!qRes?.success) throw new Error(qRes?.error?.message || "Failed to load questions");

        const qs = qRes.data as QuizQuestionData[];
        if (qs.length === 0) throw new Error("Nenhuma pergunta encontrada");

        const shuffled = [...qs].sort(() => Math.random() - 0.5);
        if (!cancelled) {
          setQuestions(shuffled);
          setPhase("active");
          showTime.current = Date.now();
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message);
          setPhase("error");
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, [apiFetch, keywordId, summaryId]);

  const currentQ = questions[currentIndex] ?? null;
  const progressPct = questions.length > 0 ? ((currentIndex + (evalResult ? 1 : 0)) / questions.length) * 100 : 0;

  const handleAnswer = async (answer: string) => {
    if (!currentQ || loading) return;
    setLoading(true);
    try {
      const evalRes = await apiFetch("/quiz-questions/evaluate", {
        method: "POST",
        body: { question_id: currentQ.id, student_answer: answer },
      });
      if (!evalRes?.success) throw new Error(evalRes?.error?.message || "Evaluate failed");
      const evalData: QuizResultData = evalRes.data;
      setEvalResult(evalData);
      setPhase("result");
      resultsRef.current.push({ question: currentQ.question, correct: evalData.correct, type: currentQ.quiz_type });

      const elapsed = Date.now() - showTime.current;
      const revRes = await apiFetch("/reviews", {
        method: "POST",
        body: {
          session_id: sessionId,
          item_id: currentQ.id,
          instrument_type: "quiz",
          subtopic_id: currentQ.subtopic_id ?? currentQ.keyword_id,
          keyword_id: currentQ.keyword_id,
          grade: evalData.correct ? 3 : 1,
          response_time_ms: elapsed,
        },
      });
      if (revRes?.success && revRes.data?.feedback) {
        setFeedback(revRes.data.feedback);
      }
    } catch (err: any) {
      console.error("[QuizSession] Error:", err);
    }
    setLoading(false);
  };

  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      const correctCount = resultsRef.current.filter((r) => r.correct).length;
      const summaryData: SessionSummary = {
        totalQuestions: questions.length,
        correctCount,
        incorrectCount: questions.length - correctCount,
        results: resultsRef.current,
      };
      setSummary(summaryData);
      setPhase("summary");
      onSessionEnd?.(summaryData);
      apiFetch(`/sessions/${sessionId}/end`, { method: "PUT" }).catch(() => {});
    } else {
      setCurrentIndex(nextIdx);
      setEvalResult(null);
      setFeedback(null);
      setPhase("active");
      showTime.current = Date.now();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setEvalResult(null);
    setFeedback(null);
    setSummary(null);
    resultsRef.current = [];
    setPhase("active");
    showTime.current = Date.now();
    setQuestions((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const renderQuestion = () => {
    if (!currentQ) return null;
    switch (currentQ.quiz_type) {
      case "mcq":
        return <MultipleChoiceQuestion question={currentQ.question} options={currentQ.options ?? []} hint={currentQ.hint} disabled={loading} result={evalResult} onAnswer={handleAnswer} />;
      case "true_false":
      case "open":
        return <WriteInQuestion question={currentQ.question} quizType={currentQ.quiz_type as "true_false" | "open"} hint={currentQ.hint} disabled={loading} result={evalResult} onAnswer={handleAnswer} />;
      case "fill_blank":
        return <FillBlankQuestion question={currentQ.question} hint={currentQ.hint} disabled={loading} result={evalResult} onAnswer={handleAnswer} />;
      default:
        return <p className="text-muted-foreground">Tipo desconhecido: {currentQ.quiz_type}</p>;
    }
  };

  // ── RENDER ──

  if (phase === "loading") {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Carregando perguntas...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>
      </div>
    );
  }

  if (phase === "summary" && summary) {
    const pct = summary.totalQuestions > 0 ? Math.round((summary.correctCount / summary.totalQuestions) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Sessao Completa!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Voce acertou {summary.correctCount} de {summary.totalQuestions} perguntas
          </p>
        </div>
        <div className="flex justify-center">
          <div className={`size-24 rounded-full flex items-center justify-center border-4 ${pct >= 80 ? "border-green-500 text-green-600" : pct >= 50 ? "border-yellow-500 text-yellow-600" : "border-red-500 text-red-600"}`}>
            <span className="text-2xl font-bold">{pct}%</span>
          </div>
        </div>
        <div className="space-y-2">
          {summary.results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${r.correct ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}`}>
              <span>{r.correct ? "\u2705" : "\u274C"}</span>
              <span className="flex-1 truncate">{r.question}</span>
              <span className="text-xs px-1.5 py-0.5 rounded border">{r.type}</span>
            </div>
          ))}
        </div>
        <button onClick={handleRestart} className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
          Repetir quiz
        </button>
      </div>
    );
  }

  // Active / Result
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Quiz</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs px-1.5 py-0.5 rounded border">
            {currentQ?.quiz_type === "mcq" ? "Multipla escolha" : currentQ?.quiz_type === "true_false" ? "V/F" : currentQ?.quiz_type === "fill_blank" ? "Preencher" : currentQ?.quiz_type === "open" ? "Aberta" : currentQ?.quiz_type}
          </span>
          <span className="text-sm text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>
      {renderQuestion()}
      {loading && <p className="text-sm text-muted-foreground">Avaliando resposta...</p>}
      {evalResult && phase === "result" && (
        <QuizResult result={evalResult} feedback={feedback} onNext={handleNext} isLast={currentIndex >= questions.length - 1} />
      )}
    </div>
  );
}
