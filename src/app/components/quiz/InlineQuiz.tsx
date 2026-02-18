// ============================================================
// Axon v4.2 — InlineQuiz: Compact quiz for embedding in summary
// ============================================================
import { useState } from "react";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { WriteInQuestion } from "./WriteInQuestion";
import { FillBlankQuestion } from "./FillBlankQuestion";
import { QuizResult } from "./QuizResult";
import type { QuizResultData } from "./QuizResult";

interface InlineQuizQuestion {
  id: string;
  question: string;
  quiz_type: string;
  options?: { label: string; text: string; is_correct: boolean }[] | null;
  correct_answer?: string | null;
  accepted_variations?: string[] | null;
  hint?: string | null;
  explanation?: string | null;
}

interface InlineQuizProps {
  question: InlineQuizQuestion;
  onEvaluate: (questionId: string, answer: string) => Promise<QuizResultData>;
  onComplete?: (result: QuizResultData) => void;
  className?: string;
}

export function InlineQuiz({ question, onEvaluate, onComplete, className }: InlineQuizProps) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (answer: string) => {
    setLoading(true);
    try {
      const evalResult = await onEvaluate(question.id, answer);
      setResult(evalResult);
      onComplete?.(evalResult);
    } catch (err) {
      console.error("[InlineQuiz] Evaluate error:", err);
    }
    setLoading(false);
  };

  const renderQuestion = () => {
    switch (question.quiz_type) {
      case "mcq":
        return <MultipleChoiceQuestion question={question.question} options={question.options ?? []} hint={question.hint} disabled={loading} result={result} onAnswer={handleAnswer} />;
      case "true_false":
      case "open":
        return <WriteInQuestion question={question.question} quizType={question.quiz_type as "true_false" | "open"} hint={question.hint} disabled={loading} result={result} onAnswer={handleAnswer} />;
      case "fill_blank":
        return <FillBlankQuestion question={question.question} hint={question.hint} disabled={loading} result={result} onAnswer={handleAnswer} />;
      default:
        return <p className="text-sm text-muted-foreground">Tipo desconhecido: {question.quiz_type}</p>;
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden my-4 ${className ?? ""}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-4 py-3 bg-accent/30 hover:bg-accent/50 transition-colors text-left">
        <span className="text-sm font-medium flex-1">
          {result ? (result.correct ? "Pergunta respondida corretamente" : "Pergunta respondida incorretamente") : "Teste seu conhecimento"}
        </span>
        {result && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${result.correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {result.correct ? "Correto" : "Incorreto"}
          </span>
        )}
        <span className="text-muted-foreground text-xs">{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>
      {expanded && (
        <div className="p-4 space-y-4 border-t">
          {renderQuestion()}
          {result && <QuizResult result={result} onNext={() => setExpanded(false)} isLast={true} />}
        </div>
      )}
    </div>
  );
}
