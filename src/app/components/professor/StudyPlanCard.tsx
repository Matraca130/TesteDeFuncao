// ============================================================
// StudyPlanCard.tsx | Added by Agent 6 — PRISM — P7 DRY (P3)
// Plan card for the sidebar list in StudyPlansPage.
// Shows title, description, progress bar, dates, and days left.
// ============================================================
import { Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface StudyPlanCardPlan {
  id: string;
  title: string;
  description: string;
  progress: number;
  start_date: string;
  end_date: string;
}

interface StudyPlanCardProps {
  plan: StudyPlanCardPlan;
  index: number;
  isSelected: boolean;
  onClick: (id: string) => void;
}

function daysRemaining(endDate: string): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function StudyPlanCard({ plan, index, isSelected, onClick }: StudyPlanCardProps) {
  const remaining = daysRemaining(plan.end_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.08, 0.3),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card
        className={`border-gray-200 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-teal-500 border-teal-200' : ''
        }`}
        onClick={() => onClick(plan.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-gray-900 truncate">{plan.title}</h3>
              <p
                className="text-gray-500 truncate mt-0.5"
                style={{ fontSize: '0.75rem' }}
              >
                {plan.description}
              </p>
            </div>
            <ChevronRight
              className={`w-4 h-4 shrink-0 transition-transform ${
                isSelected ? 'text-teal-500 rotate-90' : 'text-gray-300'
              }`}
            />
          </div>
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400" style={{ fontSize: '0.75rem' }}>
                Progresso
              </span>
              <span className="text-gray-600" style={{ fontSize: '0.75rem' }}>
                {plan.progress}%
              </span>
            </div>
            <Progress value={plan.progress} className="h-2" />
          </div>
          <div
            className="flex items-center gap-3 mt-2 text-gray-400"
            style={{ fontSize: '0.75rem' }}
          >
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {plan.start_date}
            </span>
            {remaining !== null && (
              <Badge
                variant="secondary"
                className={
                  remaining <= 3
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                }
                style={{ fontSize: '0.625rem' }}
              >
                {remaining > 0 ? `${remaining} dias restantes` : 'Expirado'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
