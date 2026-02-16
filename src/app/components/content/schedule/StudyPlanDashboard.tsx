/**
 * StudyPlanDashboard — 3-column layout shown when study plans exist.
 *
 * Structure:
 *   Left   → Mini calendar + checklist + plan list
 *   Center → Daily task list grouped by subject
 *   Right  → Progress gauge + quick actions + plan cards
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Trophy,
  Plus,
  Pencil,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  BarChart3,
  Flame,
  Activity,
  Calendar as CalendarIcon,
} from 'lucide-react';
import clsx from 'clsx';
import {
  format,
  isSameDay,
  isToday,
  addDays,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { MiniCalendar } from './MiniCalendar';
import { QuickNavButton } from './QuickNavButton';
import {
  METHOD_ICONS,
  METHOD_LABELS,
  METHOD_COLORS,
  DEMO_TODAY,
  PRE_STUDY_CHECKLIST,
} from './types';

// ─── Component ──────────────────────────────────
export function StudyPlanDashboard() {
  const { studyPlans, setActiveView, toggleTaskComplete } = useApp();

  const [currentDate, setCurrentDate] = useState(DEMO_TODAY);
  const [selectedDate, setSelectedDate] = useState<Date>(DEMO_TODAY);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // ── Derived data ────────────────────────────
  const allTasks = useMemo(
    () => studyPlans.flatMap((plan) => plan.tasks.map((t) => ({ ...t, planId: plan.id }))),
    [studyPlans],
  );

  const tasksForDate = useMemo(
    () => allTasks.filter((t) => isSameDay(t.date, selectedDate)),
    [allTasks, selectedDate],
  );

  const daysWithTasks = useMemo(
    () => new Set(allTasks.map((t) => format(t.date, 'yyyy-MM-dd'))),
    [allTasks],
  );

  const tasksBySubject = useMemo(() => {
    const map: Record<string, typeof tasksForDate> = {};
    for (const task of tasksForDate) {
      if (!map[task.subject]) map[task.subject] = [];
      map[task.subject].push(task);
    }
    return map;
  }, [tasksForDate]);

  // ── Stats ───────────────────────────────────
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayTotalMinutes = tasksForDate.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const todayHours = Math.floor(todayTotalMinutes / 60);
  const todayMins = todayTotalMinutes % 60;

  const todayCompleted = tasksForDate.filter((t) => t.completed).length;
  const todayProgress = tasksForDate.length > 0 ? Math.round((todayCompleted / tasksForDate.length) * 100) : 0;

  // "On track" when at least 40% of tasks are done (meaningful threshold)
  const isOnTrack = totalTasks > 0 && completedTasks / totalTasks >= 0.4;

  // ── Handlers ────────────────────────────────
  const toggleExpand = (taskId: string) =>
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });

  const nextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const prevDay = () => setSelectedDate(subDays(selectedDate, 1));

  // ── Render ──────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-surface-dashboard">
      {/* ─── Page header ─── */}
      <div className="shrink-0">
        <AxonPageHeader
          title="Cronograma"
          subtitle="Plano de Estudos Ativo"
          statsLeft={
            <p className="text-gray-500 text-sm">
              {completedTasks} de {totalTasks} tarefas concluídas &middot; {progressPercent}% completo
            </p>
          }
          statsRight={
            <div className="hidden md:flex items-center gap-5">
              <StatDot color="bg-emerald-500" textColor="text-emerald-600" value={completedTasks} label="concluídas" />
              <StatDot color="bg-amber-500" textColor="text-amber-600" value={tasksForDate.length} label="para hoje" />
              <StatDot color="bg-teal-500" textColor="text-teal-600" value={studyPlans.length} label="planos" />
            </div>
          }
          actionButton={
            <button
              onClick={() => setActiveView('organize-study')}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-full text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
            >
              <Plus size={15} /> Novo Plano
            </button>
          }
        />
      </div>

      {/* ─── 3-column body ─── */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* ════ Left Sidebar ════ */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <LayoutGrid size={16} />
              <span className="text-sm font-semibold">Lista de planos de estudo</span>
            </div>
            <span className="text-xs text-gray-500">ativos: {studyPlans.length}</span>
          </div>

          <MiniCalendar
            currentDate={currentDate}
            selectedDate={selectedDate}
            daysWithTasks={daysWithTasks}
            onMonthChange={setCurrentDate}
            onDaySelect={setSelectedDate}
          />

          {/* Checklist */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Pencil size={14} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Checklist prévia ao estudo</span>
            </div>
            <div className="space-y-2">
              {PRE_STUDY_CHECKLIST.map((item, i) => (
                <label key={i} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer group">
                  <input type="checkbox" className="rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
                  <span className="group-hover:text-gray-800 transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ════ Center: Tasks ════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Day/week/month toggle + date nav */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {(['day', 'week', 'month'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                    viewMode === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={prevDay} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                <ChevronLeft size={18} />
              </button>
              <span className="font-bold text-gray-800">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
              {isToday(selectedDate) && <span className="w-2 h-2 bg-teal-500 rounded-full" />}
              <button
                onClick={() => setSelectedDate(DEMO_TODAY)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 px-2 py-1 rounded-md hover:bg-teal-50"
              >
                Hoje
              </button>
              <button onClick={nextDay} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                <ChevronRight size={18} />
              </button>
            </div>

            <button className="flex items-center gap-1 text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-2 rounded-lg hover:bg-teal-100 transition-colors">
              <Plus size={14} />
              Material personalizado
            </button>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {tasksForDate.length > 0 ? (
              <>
                {Object.entries(tasksBySubject).map(([subject, tasks]) => (
                  <div key={subject} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={clsx('w-2.5 h-2.5 rounded-sm', tasks[0]?.subjectColor || 'bg-teal-500')} />
                      <span className="text-sm font-semibold text-gray-600">{subject}</span>
                    </div>

                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isExpanded={expandedTasks.has(task.id)}
                        onToggleComplete={() => toggleTaskComplete(task.planId, task.id)}
                        onToggleExpand={() => toggleExpand(task.id)}
                      />
                    ))}
                  </div>
                ))}

                {/* Daily summary bar */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
                  <div className="grid grid-cols-4 text-sm">
                    <div className="px-4 py-3 bg-teal-50 font-semibold text-teal-800 border-r border-teal-100 flex items-center gap-2">
                      <BookOpen size={14} />
                      Tarefas de estudo para hoje
                    </div>
                    <div className="px-4 py-3 bg-gray-50 font-medium text-gray-600 border-r border-gray-200 text-center">
                      Tempo est.
                    </div>
                    <div className="px-4 py-3 bg-gray-50 font-medium text-gray-600 border-r border-gray-200 text-center flex items-center justify-center gap-1">
                      <Clock size={14} className="text-teal-500" />
                      {todayHours > 0 ? `${todayHours} hrs ` : ''}{todayMins} mins
                    </div>
                    <div className="px-4 py-3 bg-gray-50 font-medium text-gray-600 text-center">
                      Progresso {todayProgress}%
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <CalendarIcon size={48} className="mb-4 text-gray-300" />
                <p className="font-medium">Nenhuma tarefa para este dia.</p>
                <p className="text-sm mt-1">Selecione outro dia no calendário ou crie um novo plano.</p>
              </div>
            )}
          </div>
        </div>

        {/* ════ Right Sidebar ════ */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
          {/* Actions */}
          <div className="p-4 border-b border-gray-100 space-y-2">
            <button
              onClick={() => setActiveView('organize-study')}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Agregar novo plano de estudo
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              <Pencil size={16} />
              Editar plano de estudo
            </button>
          </div>

          {/* Quick nav */}
          <div className="p-4 border-b border-gray-100 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Acesso rápido</p>
            <QuickNavButton icon={<RotateCcw size={15} />} label="Sessão de Revisão" sub="Repetição espaçada" color="violet" onClick={() => setActiveView('review-session')} />
            <QuickNavButton icon={<BarChart3 size={15} />} label="Dashboards de Estudo" sub="Desempenho e métricas" color="emerald" onClick={() => setActiveView('study-dashboards')} />
            <QuickNavButton icon={<Flame size={15} />} label="Knowledge Heatmap" sub="Mapa de calor de retenção" color="orange" onClick={() => setActiveView('knowledge-heatmap')} />
            <QuickNavButton icon={<Activity size={15} />} label="Mastery Dashboard" sub="Agenda diária e tarefas" color="teal" onClick={() => setActiveView('mastery-dashboard')} />
          </div>

          {/* Progress gauge */}
          <div className="p-6 border-b border-gray-100">
            <h4 className="font-bold text-gray-800 text-sm mb-4">Progresso geral</h4>
            <div className="flex flex-col items-center mb-4">
              <svg viewBox="0 0 120 80" className="w-40">
                <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="#0d9488" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${progressPercent * 1.57} 157`} />
                <text x="60" y="55" textAnchor="middle" className="text-2xl font-bold" fill="#1e293b" fontSize="24">{progressPercent}%</text>
                <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="9">do conteúdo coberto</text>
              </svg>
            </div>
            <div className="flex justify-center">
              <span className={clsx(
                'px-3 py-1 rounded-full text-xs font-bold',
                isOnTrack ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
              )}>
                {isOnTrack ? 'No ritmo' : 'Atenção ao ritmo'}
              </span>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              {isOnTrack
                ? 'Você está no ritmo previsto e vai alcançar seu objetivo conforme programado.'
                : 'Considere dedicar mais tempo de estudo para cumprir o cronograma.'}
            </p>
          </div>

          {/* Active plan cards */}
          <div className="p-4 flex-1 overflow-y-auto">
            <h4 className="font-bold text-gray-800 text-sm mb-3">Planos ativos</h4>
            <div className="space-y-3">
              {studyPlans.map((plan) => {
                const planCompleted = plan.tasks.filter((t) => t.completed).length;
                const planTotal = plan.tasks.length;
                const planProgress = planTotal > 0 ? Math.round((planCompleted / planTotal) * 100) : 0;
                return (
                  <div key={plan.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800 text-sm">{plan.name}</span>
                      <span className="text-[10px] font-bold text-gray-500">{planProgress}%</span>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {plan.subjects.map((s) => (
                        <span key={s.id} className={clsx('text-[10px] px-2 py-0.5 rounded-full text-white font-bold', s.color)}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${planProgress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                      <span>{planCompleted}/{planTotal} tarefas</span>
                      <span>até {format(plan.completionDate, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <Trophy size={16} className="text-yellow-400" />
              Ver Relatório Semanal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  Private sub-components
// ═══════════════════════════════════════════════

function StatDot({ color, textColor, value, label }: { color: string; textColor: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-500">
        <span className={`${textColor} font-semibold`}>{value}</span> {label}
      </span>
    </div>
  );
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    subject: string;
    method: string;
    estimatedMinutes: number;
    completed: boolean;
    planId: string;
  };
  isExpanded: boolean;
  onToggleComplete: () => void;
  onToggleExpand: () => void;
}

function TaskCard({ task, isExpanded, onToggleComplete, onToggleExpand }: TaskCardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border transition-all',
        task.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 hover:shadow-sm',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggleComplete}
          className={clsx(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
            task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-teal-400',
          )}
        >
          {task.completed && <CheckCircle2 size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx('font-semibold transition-colors', task.completed ? 'line-through text-gray-400' : 'text-gray-800')}>
              {task.title}
            </span>
            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1', METHOD_COLORS[task.method] || 'bg-gray-100 text-gray-600 border-gray-200')}>
              {METHOD_ICONS[task.method]}
              {METHOD_LABELS[task.method] || task.method}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            {task.estimatedMinutes} min
          </span>
          <button onClick={onToggleExpand} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronDown size={16} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 border-t border-gray-100 text-sm text-gray-500 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <BookOpen size={12} /> {task.subject}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {task.estimatedMinutes} minutos estimados
              </span>
              <button className="ml-auto text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1 rounded-lg">
                Iniciar Estudo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
