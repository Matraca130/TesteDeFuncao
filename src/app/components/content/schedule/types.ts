/**
 * Schedule module — shared types, constants & lookup maps.
 * Single source of truth for both DefaultScheduleView and StudyPlanDashboard.
 */

import React from 'react';
import { Video, Zap, GraduationCap, FileText, Box } from 'lucide-react';

// ─── Method lookup maps ─────────────────────────
export const METHOD_ICONS: Record<string, React.ReactNode> = {
  video: React.createElement(Video, { size: 14 }),
  flashcard: React.createElement(Zap, { size: 14 }),
  quiz: React.createElement(GraduationCap, { size: 14 }),
  resumo: React.createElement(FileText, { size: 14 }),
  '3d': React.createElement(Box, { size: 14 }),
};

export const METHOD_LABELS: Record<string, string> = {
  video: 'Vídeo',
  flashcard: 'Flashcards',
  quiz: 'Quiz',
  resumo: 'Resumo',
  '3d': 'Atlas 3D',
};

export const METHOD_COLORS: Record<string, string> = {
  video: 'bg-teal-100 text-teal-700 border-teal-200',
  flashcard: 'bg-amber-100 text-amber-700 border-amber-200',
  quiz: 'bg-purple-100 text-purple-700 border-purple-200',
  resumo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '3d': 'bg-orange-100 text-orange-700 border-orange-200',
};

// ─── Fallback event types ───────────────────────
export interface ScheduleEvent {
  date: Date;
  title: string;
  type: 'study' | 'review' | 'exam' | 'task';
  color: string;
}

export interface UpcomingExam {
  id: number;
  title: string;
  date: string;
  daysLeft: number;
  priority: 'high' | 'medium' | 'low';
}

export interface CompletedTask {
  id: number;
  title: string;
  date: string;
  score: string;
}

// ─── Fallback data (no study plans) ─────────────
export const SCHEDULE_EVENTS: ScheduleEvent[] = [
  { date: new Date(2026, 1, 5), title: 'Anatomia: Membro Superior', type: 'study', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { date: new Date(2026, 1, 5), title: 'Revisão: Histologia', type: 'review', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { date: new Date(2026, 1, 7), title: 'Prova de Fisiologia', type: 'exam', color: 'bg-red-100 text-red-700 border-red-200' },
  { date: new Date(2026, 1, 10), title: 'Bioquímica: Metabolismo', type: 'study', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { date: new Date(2026, 1, 12), title: 'Seminário de Patologia', type: 'task', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { date: new Date(2026, 1, 15), title: 'Simulado Geral', type: 'exam', color: 'bg-red-100 text-red-700 border-red-200' },
];

export const UPCOMING_EXAMS: UpcomingExam[] = [
  { id: 1, title: 'Prova de Fisiologia', date: '07 Fev', daysLeft: 0, priority: 'high' },
  { id: 2, title: 'Simulado Geral', date: '15 Fev', daysLeft: 8, priority: 'medium' },
  { id: 3, title: 'Anatomia Prática', date: '22 Fev', daysLeft: 15, priority: 'high' },
];

export const COMPLETED_TASKS: CompletedTask[] = [
  { id: 1, title: 'Resumo: Introdução à Anatomia', date: 'Ontem', score: '95%' },
  { id: 2, title: 'Flashcards: Ossos do Crânio', date: '05 Fev', score: '80%' },
  { id: 3, title: 'Quiz: Sistema Nervoso', date: '04 Fev', score: '100%' },
];

// ─── Quick‑nav color maps ───────────────────────
export type QuickNavColor = 'violet' | 'emerald' | 'orange' | 'teal';

export interface QuickNavColorSet {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
  iconText: string;
  subText: string;
  arrow: string;
}

export const QUICK_NAV_COLORS_LIGHT: Record<QuickNavColor, QuickNavColorSet> = {
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-100',  text: 'text-violet-700',  iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  subText: 'text-violet-500',  arrow: 'text-violet-400' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', subText: 'text-emerald-500', arrow: 'text-emerald-400' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-100',  text: 'text-orange-700',  iconBg: 'bg-orange-100',  iconText: 'text-orange-600',  subText: 'text-orange-500',  arrow: 'text-orange-400' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-100',    text: 'text-teal-700',    iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    subText: 'text-teal-500',    arrow: 'text-teal-400' },
};

export const QUICK_NAV_COLORS_DARK: Record<QuickNavColor, QuickNavColorSet> = {
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-300', iconBg: 'bg-violet-500/20', iconText: 'text-violet-400', subText: 'text-violet-400/60', arrow: 'text-violet-400/50' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300', iconBg: 'bg-emerald-500/20', iconText: 'text-emerald-400', subText: 'text-emerald-400/60', arrow: 'text-emerald-400/50' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-300', iconBg: 'bg-orange-500/20', iconText: 'text-orange-400', subText: 'text-orange-400/60', arrow: 'text-orange-400/50' },
  teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   text: 'text-teal-300',   iconBg: 'bg-teal-500/20',   iconText: 'text-teal-400',   subText: 'text-teal-400/60',   arrow: 'text-teal-400/50' },
};

// ─── Simulated "today" for demo ─────────────────
export const DEMO_TODAY = new Date(2026, 1, 7);

// ─── Pre‑study checklist items ──────────────────
export const PRE_STUDY_CHECKLIST = [
  'Revisar anotações do dia anterior',
  'Preparar material de estudo',
  'Eliminar distrações',
  'Definir metas claras',
] as const;
