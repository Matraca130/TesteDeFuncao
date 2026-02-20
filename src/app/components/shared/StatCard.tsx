// ============================================================
// StatCard — Reusable stat card (icon + big number + label)
// Used in: FlashcardFeedback (~5x), LearningProfile (~4x)
// ============================================================
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string | number;
  valueColor?: string;
  label: string;
  children?: ReactNode;
}

export function StatCard({
  icon: Icon,
  iconColor,
  value,
  valueColor = 'text-gray-900',
  label,
  children,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="py-5 text-center">
        <Icon className={`w-6 h-6 ${iconColor} mx-auto mb-2`} />
        <p className={`text-3xl ${valueColor} font-heading`}>{value}</p>
        <p className="text-gray-500 font-body">{label}</p>
        {children}
      </CardContent>
    </Card>
  );
}
