// ============================================================
// Axon v4.2 — FillBlankQuestion: Sentence with blank to fill
// ============================================================
import { useState } from "react";
import type { QuizResultData } from "./QuizResult";

interface FillBlankQuestionProps {
  question: string;
  hint?: string | null;
  disabled: boolean;
  result: QuizResultData | null;
  onAnswer: (answer: string) => void;
}

export function FillBlankQuestion({
  question,
  hint,
  disabled,
  result,
  onAnswer,
}: FillBlankQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (disabled || result || submitted) return;
    const trimmed = answer.trim();
    if (!trimmed) return;
    setSubmitted(true);
    onAnswer(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const parts = question.split(/_{3,}/);
  const hasBlankMarker = parts.length > 1;

  return (
    <div className="space-y-4">
      {hasBlankMarker ? (
        <div className="text-base font-medium leading-relaxed text-foreground">
          <span>{parts[0]}</span>
          <span className={`inline-block mx-1 px-3 py-0.5 min-w-[120px] rounded-md border-b-2 text-center ${result ? (result.correct ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400") : "border-primary/40 bg-muted/50 text-muted-foreground"}`}>
            {answer || (result ? result.correct_answer : "______")}
          </span>
          {parts[1] && <span>{parts[1]}</span>}
        </div>
      ) : (
        <p className="text-base font-medium leading-relaxed text-foreground">{question}</p>
      )}
      {hint && !result && (
        <button onClick={() => setShowHint(!showHint)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          {showHint ? "Esconder dica" : "Mostrar dica"}
        </button>
      )}
      {showHint && hint && !result && (
        <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">{hint}</p>
      )}
      <div className="flex gap-2">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Preencha o espaco em branco..."
          disabled={disabled || !!result}
          className={`flex-1 px-3 py-2 rounded-md border text-sm bg-background ${result ? (result.correct ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-red-400 bg-red-50 dark:bg-red-950/20") : "border-input"}`}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !!result || !answer.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90 shrink-0 text-sm"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
