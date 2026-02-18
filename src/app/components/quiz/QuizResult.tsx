// ============================================================
// Axon v4.2 — QuizResult: Post-answer feedback display
// ============================================================
export interface QuizResultData {
  correct: boolean;
  grade: number;
  correct_answer: string;
  explanation: string | null;
}

export interface QuizFeedback {
  delta_before: number;
  delta_after: number;
  color_before: string;
  color_after: string;
  mastery: number;
  stability: number | null;
  next_due: string | null;
}

interface QuizResultProps {
  result: QuizResultData;
  feedback?: QuizFeedback | null;
  onNext: () => void;
  isLast: boolean;
}

const COLOR_MAP: Record<string, { bg: string; text: string; label: string }> = {
  red: { bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", label: "Vermelho" },
  orange: { bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400", label: "Laranja" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-400", label: "Amarelo" },
  green: { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-700 dark:text-green-400", label: "Verde" },
};

export function QuizResult({ result, feedback, onNext, isLast }: QuizResultProps) {
  const colorInfo = feedback ? COLOR_MAP[feedback.color_after] ?? COLOR_MAP.red : null;
  const colorChanged = feedback && feedback.color_before !== feedback.color_after;

  return (
    <div className="space-y-4">
      {/* Correct / Incorrect banner */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${result.correct ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"}`}>
        <div className="flex-1">
          <p className={`font-semibold text-base ${result.correct ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
            {result.correct ? "Correto!" : "Incorreto"}
          </p>
          {!result.correct && (
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              Resposta correta: <span className="font-medium">{result.correct_answer}</span>
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${result.correct ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300"}`}>
          {result.correct ? "+0.65" : "0.00"}
        </span>
      </div>

      {/* Explanation */}
      {result.explanation && (
        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Explicacao</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.explanation}</p>
        </div>
      )}

      {/* Mastery feedback */}
      {feedback && colorInfo && (
        <div className={`flex items-center justify-between p-3 rounded-lg ${colorInfo.bg}`}>
          <span className={`text-sm font-medium ${colorInfo.text}`}>
            Dominio: {(feedback.mastery * 100).toFixed(1)}%
          </span>
          <div className="flex items-center gap-2">
            {colorChanged && (
              <>
                <span className="text-xs px-1.5 py-0.5 rounded border">{COLOR_MAP[feedback.color_before]?.label ?? feedback.color_before}</span>
                <span className="text-muted-foreground text-xs">&rarr;</span>
              </>
            )}
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${colorInfo.text}`}>{colorInfo.label}</span>
          </div>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
      >
        {isLast ? "Finalizar" : "Proxima pergunta"}
      </button>
    </div>
  );
}
