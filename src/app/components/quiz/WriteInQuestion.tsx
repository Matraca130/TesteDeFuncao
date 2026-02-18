// ============================================================
// Axon v4.2 — WriteInQuestion: Free-text answer input
// ============================================================
import { useState } from "react";
import type { QuizResultData } from "./QuizResult";

interface WriteInQuestionProps {
  question: string;
  quizType: "open" | "true_false";
  hint?: string | null;
  disabled: boolean;
  result: QuizResultData | null;
  onAnswer: (answer: string) => void;
}

export function WriteInQuestion({
  question,
  quizType,
  hint,
  disabled,
  result,
  onAnswer,
}: WriteInQuestionProps) {
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

  const handleTrueFalse = (value: string) => {
    if (disabled || result || submitted) return;
    setSubmitted(true);
    setAnswer(value);
    onAnswer(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed text-foreground">{question}</p>
      {hint && !result && (
        <button onClick={() => setShowHint(!showHint)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          {showHint ? "Esconder dica" : "Mostrar dica"}
        </button>
      )}
      {showHint && hint && !result && (
        <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">{hint}</p>
      )}
      {quizType === "true_false" ? (
        <div className="flex gap-3">
          {["true", "false"].map((val) => {
            const isSelected = answer === val;
            const isCorrect = result && result.correct_answer.toLowerCase() === val;
            const isWrong = result && isSelected && !result.correct;
            let style = "border-border hover:border-primary/40 hover:bg-accent/50";
            if (result) {
              if (isCorrect) style = "border-green-400 bg-green-50 dark:bg-green-950/30";
              else if (isWrong) style = "border-red-400 bg-red-50 dark:bg-red-950/30";
              else style = "border-border opacity-50";
            } else if (isSelected) {
              style = "border-primary bg-primary/5 ring-2 ring-primary/20";
            }
            return (
              <button
                key={val}
                onClick={() => handleTrueFalse(val)}
                disabled={disabled || !!result}
                className={`flex-1 py-3 px-6 rounded-lg border font-medium text-sm transition-all ${style} ${disabled || result ? "cursor-default" : "cursor-pointer"}`}
              >
                {val === "true" ? "Verdadeiro" : "Falso"}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua resposta..."
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
      )}
    </div>
  );
}
