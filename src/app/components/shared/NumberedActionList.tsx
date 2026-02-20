// ============================================================
// NumberedActionList — Numbered list of actions/recommendations
// Used in: QuizFeedback, SummaryDiagnostic, FlashcardFeedback, LearningProfile
// ============================================================

interface NumberedActionListProps {
  items: string[];
  color?: 'indigo' | 'red' | 'teal' | 'green';
  variant?: 'compact' | 'card';
}

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-200', text: 'text-indigo-700' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  teal: { bg: 'bg-teal-200', text: 'text-teal-700' },
  green: { bg: 'bg-green-200', text: 'text-green-700' },
};

export function NumberedActionList({
  items,
  color = 'indigo',
  variant = 'compact',
}: NumberedActionListProps) {
  const { bg, text } = COLOR_MAP[color];

  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
            <div className={`w-6 h-6 rounded-full ${bg} ${text} flex items-center justify-center shrink-0 text-xs`}>
              {i + 1}
            </div>
            <span className="text-gray-700 flex-1 font-body">{item}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className={`w-5 h-5 rounded-full ${bg} ${text} flex items-center justify-center shrink-0 mt-0.5 text-[11px]`}>
            {i + 1}
          </div>
          <span className="text-gray-700 font-body">{item}</span>
        </div>
      ))}
    </div>
  );
}
