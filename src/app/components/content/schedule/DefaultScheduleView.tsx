/**
 * DefaultScheduleView — shown when no study plans exist.
 * Full-size calendar + dark right sidebar with exam/completed details.
 */

import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { headingStyle } from '@/app/design-system';
import {
  BookOpen,
  Star,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  MoreVertical,
  Plus,
  RotateCcw,
  BarChart3,
  Flame,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { CalendarGrid } from './CalendarGrid';
import { QuickNavButtonDark } from './QuickNavButton';
import {
  SCHEDULE_EVENTS,
  UPCOMING_EXAMS,
  COMPLETED_TASKS,
  DEMO_TODAY,
} from './types';

export function DefaultScheduleView() {
  const { setActiveView } = useApp();
  const [currentDate, setCurrentDate] = useState(DEMO_TODAY);
  const [selectedDate, setSelectedDate] = useState<Date>(DEMO_TODAY);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    provas: false,
    concluido: false,
  });

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const selectedEvents = SCHEDULE_EVENTS.filter((e) => isSameDay(e.date, selectedDate));

  return (
    <div className="h-full overflow-y-auto custom-scrollbar-light bg-surface-dashboard">
      <div>
        <AxonPageHeader
          title="Cronograma"
          subtitle="Organize sua rotina de estudos"
          statsLeft={
            <p className="text-gray-500 text-sm">
              {SCHEDULE_EVENTS.length} eventos agendados &middot; Fevereiro 2026
            </p>
          }
          actionButton={
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveView('organize-study')}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-full text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
              >
                <Plus size={15} /> Organizar Estudo
              </button>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode('month')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'month' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50',
                  )}
                >
                  Mês
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'week' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50',
                  )}
                >
                  Semana
                </button>
              </div>
            </div>
          }
        />
      </div>

      <div className="flex w-full">
        {/* ═══ Calendar ═══ */}
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={SCHEDULE_EVENTS}
          onMonthChange={setCurrentDate}
          onDaySelect={setSelectedDate}
        />

        {/* ═══ Dark Right Sidebar ═══ */}
        <div className="w-96 bg-[#2d3e50] border-l border-white/10 shadow-xl flex flex-col z-10 sticky top-0 self-start max-h-screen">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#263545]">
            <h3 className="font-semibold text-white text-lg" style={headingStyle}>
              Detalhes do Dia
            </h3>
            <span className="text-sm font-medium text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full">
              {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar-light p-6 space-y-8 bg-[#2d3e50]">
            {/* What to study today */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-teal-400" />
                <h4 className="font-semibold text-white text-sm uppercase tracking-wide" style={headingStyle}>
                  O que estudar hoje
                </h4>
              </div>

              {selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden"
                    >
                      <div className={clsx('absolute left-0 top-0 bottom-0 w-1', event.type === 'exam' ? 'bg-red-400' : 'bg-teal-400')} />
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={clsx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                            event.type === 'exam' ? 'bg-red-500/20 text-red-300' : 'bg-teal-500/20 text-teal-300',
                          )}
                        >
                          {event.type === 'exam' ? 'Prova' : 'Estudo'}
                        </span>
                        <button className="text-white/30 hover:text-white/60">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                      <h5 className="font-semibold text-white mb-1">{event.title}</h5>
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> 2h 30m
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={12} /> Alta prioridade
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-white/15 rounded-2xl bg-white/5">
                  <p className="text-sm font-medium text-white/40">Nada planejado para este dia.</p>
                  <button className="mt-2 text-xs font-medium text-teal-400 hover:text-teal-300">
                    + Adicionar tarefa
                  </button>
                </div>
              )}
            </section>

            {/* Upcoming exams */}
            <CollapsibleSection
              icon={<AlertCircle size={18} className="text-red-400" />}
              title="Próximas Provas"
              count={UPCOMING_EXAMS.length}
              countColor="text-red-300 bg-red-500/20"
              isOpen={expandedSections.provas}
              onToggle={() => toggleSection('provas')}
            >
              <div className="space-y-3">
                {UPCOMING_EXAMS.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <div>
                      <h5 className="font-semibold text-white text-sm">{exam.title}</h5>
                      <p className="text-xs text-red-300 font-medium">
                        {exam.date} &bull; {exam.daysLeft === 0 ? 'HOJE!' : `Faltam ${exam.daysLeft} dias`}
                      </p>
                    </div>
                    {exam.priority === 'high' && (
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" title="Alta Prioridade" />
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Recently completed */}
            <CollapsibleSection
              icon={<CheckCircle2 size={18} className="text-teal-400" />}
              title="Concluído Recentemente"
              count={COMPLETED_TASKS.length}
              countColor="text-teal-300 bg-teal-500/20"
              isOpen={expandedSections.concluido}
              onToggle={() => toggleSection('concluido')}
            >
              <div className="space-y-3 relative">
                <div className="absolute left-3.5 top-2 bottom-4 w-px bg-white/15" />
                {COMPLETED_TASKS.map((task) => (
                  <div key={task.id} className="relative pl-8 flex items-center justify-between group">
                    <div className="absolute left-2 w-3 h-3 rounded-full bg-teal-400 border-2 border-[#2d3e50] shadow-sm z-10" />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{task.title}</h5>
                      <p className="text-[10px] text-white/40">{task.date}</p>
                    </div>
                    <span className="text-xs font-semibold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full">
                      {task.score}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>

          {/* Quick Nav */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-[#263545]">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Acesso rápido</p>
            <QuickNavButtonDark icon={<RotateCcw size={15} />} label="Sessão de Revisão" sub="Repetição espaçada" color="violet" onClick={() => setActiveView('review-session')} />
            <QuickNavButtonDark icon={<BarChart3 size={15} />} label="Dashboards de Estudo" sub="Desempenho e métricas" color="teal" onClick={() => setActiveView('study-dashboards')} />
            <QuickNavButtonDark icon={<Flame size={15} />} label="Knowledge Heatmap" sub="Mapa de calor de retenção" color="orange" onClick={() => setActiveView('knowledge-heatmap')} />
            <QuickNavButtonDark icon={<Activity size={15} />} label="Mastery Dashboard" sub="Agenda diária e tarefas" color="teal" onClick={() => setActiveView('mastery-dashboard')} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  Private sub-components
// ═══════════════════════════════════════════════

interface CollapsibleSectionProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  countColor: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ icon, title, count, countColor, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <section>
      <button onClick={onToggle} className="flex items-center gap-2 mb-4 w-full group cursor-pointer">
        {icon}
        <h4 className="font-semibold text-white text-sm uppercase tracking-wide flex-1 text-left" style={headingStyle}>
          {title}
        </h4>
        <span className={`text-[10px] font-semibold ${countColor} px-2 py-1 rounded-full mr-1`}>{count}</span>
        <ChevronDown size={16} className={clsx('text-white/40 group-hover:text-white/60 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
