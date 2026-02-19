// ============================================================
// A6-13 | ActivityHeatmap.tsx | Agent 6 — PRISM
// SIGNAL: VIDEO_STUDY_DONE
// Daily activity heatmap estilo GitHub contributions
// P3: Refactored to use useDailyActivity hook
// ============================================================
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';
import { Flame, Calendar, TrendingUp } from 'lucide-react';
import { useDailyActivity } from '../../hooks/use-daily-activity';
import type { DailyActivity } from '../../data/mock-data';

function getActivityColor(minutes: number): string {
  if (minutes === 0) return '#f3f4f6';
  if (minutes <= 15) return '#99f6e4';
  if (minutes <= 30) return '#5eead4';
  if (minutes <= 60) return '#2dd4bf';
  return '#14b8a6';
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

interface ActivityHeatmapProps {
  studentId?: string;
  className?: string;
}

export function ActivityHeatmap({ className = '' }: ActivityHeatmapProps) {
  const { data, isLoading } = useDailyActivity();

  const { grid, monthLabels, totalHours, currentStreak, maxStreak } = useMemo(() => {
    const gridData: (DailyActivity | null)[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 53 }, () => null)
    );
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 364);
    const dataMap = new Map<string, DailyActivity>();
    data.forEach((d) => dataMap.set(d.date, d));
    const monthLabelArr: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let i = 0; i <= 364; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayOfWeek = d.getDay();
      const weekIndex = Math.floor(i / 7);
      const dateStr = d.toISOString().split('T')[0];
      const activity = dataMap.get(dateStr) || { date: dateStr, minutes: 0, sessions: 0 };
      gridData[dayOfWeek][weekIndex] = activity;
      const month = d.getMonth();
      if (month !== lastMonth) {
        monthLabelArr.push({ label: MONTHS[month], col: weekIndex });
        lastMonth = month;
      }
    }
    let total = 0;
    let maxStr = 0;
    let currentStr = 0;
    let countingCurrent = true;
    for (let i = 364; i >= 0; i--) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const activity = dataMap.get(dateStr);
      const mins = activity?.minutes || 0;
      total += mins;
      if (countingCurrent) {
        if (mins > 0) currentStr++;
        else if (i < 364) countingCurrent = false;
      }
    }
    let streak = 0;
    for (let i = 0; i <= 364; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const mins = dataMap.get(dateStr)?.minutes || 0;
      if (mins > 0) { streak++; maxStr = Math.max(maxStr, streak); } else { streak = 0; }
    }
    return { grid: gridData, monthLabels: monthLabelArr, totalHours: Math.round(total / 60), currentStreak: currentStr, maxStreak: maxStr };
  }, [data]);

  const CELL_SIZE = 12;
  const CELL_GAP = 2;
  const LABEL_WIDTH = 28;
  const gridWidth = 53 * (CELL_SIZE + CELL_GAP) + LABEL_WIDTH;
  const gridHeight = 7 * (CELL_SIZE + CELL_GAP) + 20;

  if (isLoading) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardHeader className="pb-3"><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent>
          <Skeleton className="h-[120px] w-full" />
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-gray-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Georgia', serif" }}>
          <Calendar className="w-5 h-5 text-teal-500" /> Atividade Diaria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <TooltipProvider delayDuration={100}>
            <svg width={gridWidth} height={gridHeight} className="min-w-[700px]">
              {monthLabels.map((m, i) => (<text key={i} x={LABEL_WIDTH + m.col * (CELL_SIZE + CELL_GAP)} y={10} fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif">{m.label}</text>))}
              {[1, 3, 5].map((day) => (<text key={day} x={0} y={20 + day * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2} fill="#94a3b8" fontSize="9" fontFamily="Inter, sans-serif">{DAYS[day].charAt(0)}</text>))}
              {grid.map((row, dayIndex) =>
                row.map((cell, weekIndex) => {
                  if (!cell) return null;
                  const x = LABEL_WIDTH + weekIndex * (CELL_SIZE + CELL_GAP);
                  const y = 18 + dayIndex * (CELL_SIZE + CELL_GAP);
                  return (
                    <Tooltip key={`${dayIndex}-${weekIndex}`}>
                      <TooltipTrigger asChild>
                        <rect x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} rx={2} fill={getActivityColor(cell.minutes)} className="cursor-pointer hover:opacity-80 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent><p style={{ fontSize: '0.75rem' }}><strong>{cell.date}</strong><br />{cell.minutes} min | {cell.sessions} sessoes</p></TooltipContent>
                    </Tooltip>
                  );
                })
              )}
            </svg>
          </TooltipProvider>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1" style={{ fontSize: '0.75rem' }}>
            <span className="text-gray-400">Menos</span>
            {[0, 10, 25, 45, 70].map((m) => (<div key={m} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getActivityColor(m) }} />))}
            <span className="text-gray-400">Mais</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center"><p className="text-gray-900" style={{ fontFamily: "'Georgia', serif", fontSize: '1.25rem' }}>{totalHours}h</p><p className="text-gray-400" style={{ fontSize: '0.75rem' }}>Total (ano)</p></div>
          <div className="text-center"><p className="text-gray-900 flex items-center justify-center gap-1" style={{ fontFamily: "'Georgia', serif", fontSize: '1.25rem' }}><Flame className="w-4 h-4 text-orange-500" />{currentStreak}</p><p className="text-gray-400" style={{ fontSize: '0.75rem' }}>Racha atual (dias)</p></div>
          <div className="text-center"><p className="text-gray-900 flex items-center justify-center gap-1" style={{ fontFamily: "'Georgia', serif", fontSize: '1.25rem' }}><TrendingUp className="w-4 h-4 text-teal-500" />{maxStreak}</p><p className="text-gray-400" style={{ fontSize: '0.75rem' }}>Racha maxima</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
