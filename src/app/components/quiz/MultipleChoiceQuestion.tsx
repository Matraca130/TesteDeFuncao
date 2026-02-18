// ============================================================
// Axon v4.2 — MultipleChoiceQuestion: MCQ with visual feedback
// ============================================================
import { useState } from "react";
import type { QuizResultData } from "./QuizResult";

interface MCQOption {
  label: string;
  text: string;
  is_correct: boolean;
}

interface MultipleChoiceQuestionProps {
  question: string;
  options: MCQOption[];
  hint?: string | null;
  disabled: boolean;
  result: QuizResultData | null;
  onAnswer: (answer: string) => void;
}

export function MultipleChoiceQuestion({
  question,
  options,
  hint,
  disabled,
  result,
  onAnswer,
}: MultipleChoiceQuestionProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleSelect = (label: string) => {
    if (disabled || result) return;
    setSelectedLabel(label);
    onAnswer(label);
  };

  const getOptionStyle = (opt: MCQOption) => {
    if (!result) {
      return selectedLabel === opt.label
        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
        : "border-border hover:border-primary/40 hover:bg-accent/50";
    }
    if (opt.is_correct) {
      return "border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-600";
    }
    if (selectedLabel === opt.label && !opt.is_correct) {
      return "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-600";
    }
    return "border-border opacity-50";
  };

  const getLabelStyle = (opt: MCQOption) => {
    if (!result) {
      return selectedLabel === opt.label
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground";
    }
    if (opt.is_correct) return "bg-green-500 text-white";
    if (selectedLabel === opt.label && !opt.is_correct) return "bg-red-500 text-white";
    return "bg-muted text-muted-foreground opacity-50";
  };

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed text-foreground">{question}</p>
      {hint && !result && (
        <button onClick={() => setShowHint(!showHint)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          {showHint ? "Esconder dica" : "Mostrar dica"}
        </button>
      )}
      {showHint && hint && !result && (
        <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">{hint}</p>
      )}
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleSelect(opt.label)}
            disabled={disabled || !!result}
            className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-all duration-200 ${getOptionStyle(opt)} ${disabled || result ? "cursor-default" : "cursor-pointer"}`}
          >
            <span className={`inline-flex items-center justify-center size-7 rounded-md text-sm font-semibold shrink-0 transition-colors ${getLabelStyle(opt)}`}>{opt.label}</span>
            <span className="text-sm pt-0.5 leading-relaxed">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
