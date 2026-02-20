// ============================================================
// StrengthsWeaknessesGrid — Dual card grid for strengths + weaknesses
// Used in: QuizFeedback, FlashcardFeedback, SummaryDiagnostic
// ============================================================
import { CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface StrengthsWeaknessesGridProps {
  strengths: string[];
  weaknesses: string[];
  variant?: 'badges' | 'list';
  strengthsLabel?: string;
  weaknessesLabel?: string;
  strengthsIcon?: 'check' | 'trending';
}

export function StrengthsWeaknessesGrid({
  strengths,
  weaknesses,
  variant = 'badges',
  strengthsLabel = 'Pontos Fortes',
  weaknessesLabel = 'Areas de Melhoria',
  strengthsIcon = 'check',
}: StrengthsWeaknessesGridProps) {
  const StrengthIcon = strengthsIcon === 'trending' ? TrendingUp : CheckCircle;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700 font-heading">
            <StrengthIcon className="w-5 h-5" />
            {strengthsLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variant === 'badges' ? (
            <div className="flex flex-wrap gap-2">
              {strengths.map((s, i) => (
                <Badge key={i} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-green-800 font-body">
                  <span className="text-green-500 mt-1">+</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700 font-heading">
            <AlertTriangle className="w-5 h-5" />
            {weaknessesLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variant === 'badges' ? (
            <div className="flex flex-wrap gap-2">
              {weaknesses.map((w, i) => (
                <Badge key={i} variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  {w}
                </Badge>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-orange-800 font-body">
                  <span className="text-orange-500 mt-1">!</span>
                  {w}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
