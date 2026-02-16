/**
 * Full-size monthly calendar grid used in DefaultScheduleView.
 * Shows event pills inside each day cell.
 */

import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
import { headingStyle } from '@/app/design-system';
import type { ScheduleEvent } from './types';

const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date;
  events: ScheduleEvent[];
  onMonthChange: (date: Date) => void;
  onDaySelect: (date: Date) => void;
}

export function CalendarGrid({
  currentDate,
  selectedDate,
  events,
  onMonthChange,
  onDaySelect,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const emptyDays = Array(monthStart.getDay()).fill(null);

  const getEventsForDay = (date: Date) =>
    events.filter((event) => isSameDay(event.date, date));

  return (
    <div className="flex-1 flex flex-col min-w-0 p-8">
      {/* Header bar */}
      <div className="bg-white rounded-t-2xl border border-gray-100 border-b-0 p-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold text-gray-900 capitalize flex items-center gap-2"
          style={headingStyle}
        >
          <CalendarIcon size={20} className="text-teal-600" />
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => onMonthChange(currentDate)} // reset to current month
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            Hoje
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar body */}
      <div className="bg-white border border-gray-100 border-t-gray-200/60 rounded-b-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px]">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {WEEKDAY_HEADERS.map((day) => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="bg-white/50" />
          ))}

          {daysInMonth.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const dayEvents = getEventsForDay(day);

            return (
              <div
                key={key}
                onClick={() => onDaySelect(day)}
                className={clsx(
                  'bg-white p-2 min-h-[100px] cursor-pointer transition-colors relative hover:bg-gray-50',
                  isSelected && 'bg-teal-50/30',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={clsx(
                      'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-all',
                      isTodayDate
                        ? 'bg-teal-600 text-white shadow-md'
                        : isSelected
                          ? 'bg-teal-500 text-white'
                          : 'text-gray-700',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        'text-[10px] px-1.5 py-1 rounded border truncate font-medium',
                        event.color,
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div className="absolute inset-0 border-2 border-teal-500 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
