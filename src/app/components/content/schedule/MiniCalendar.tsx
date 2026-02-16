/**
 * Compact monthly calendar used in the StudyPlanDashboard left sidebar.
 * Highlights selected day, today, and days that have tasks.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const WEEKDAY_HEADERS = ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá'] as const;

interface MiniCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  daysWithTasks: Set<string>;
  onMonthChange: (date: Date) => void;
  onDaySelect: (date: Date) => void;
}

export function MiniCalendar({
  currentDate,
  selectedDate,
  daysWithTasks,
  onMonthChange,
  onDaySelect,
}: MiniCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const emptyDays = Array(monthStart.getDay()).fill(null);

  return (
    <div className="p-4 border-b border-gray-100">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(subMonths(currentDate, 1))}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-bold text-gray-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          onClick={() => onMonthChange(addMonths(currentDate, 1))}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
        {emptyDays.map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {daysInMonth.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasTasks = daysWithTasks.has(key);

          return (
            <button
              key={key}
              onClick={() => onDaySelect(day)}
              className={clsx(
                'w-7 h-7 flex items-center justify-center rounded-full text-xs relative transition-all',
                isTodayDate && !isSelected && 'bg-teal-100 text-teal-700 font-bold',
                isSelected && 'bg-teal-600 text-white font-bold',
                !isSelected && !isTodayDate && 'text-gray-700 hover:bg-gray-100',
              )}
            >
              {format(day, 'd')}
              {hasTasks && !isSelected && (
                <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
