// ============================================================
// Axon AI Assistant — Types, interfaces & constants
// ============================================================

import { Lightbulb, Brain, Zap, Sparkles, Layers, GraduationCap, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Mode ──────────────────────────────────────────────────

export type AssistantMode = 'chat' | 'flashcards' | 'quiz' | 'explain';

// ── Messages ──────────────────────────────────────────────

export interface DisplayMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

// ── Quick prompts (chat) ──────────────────────────────────

export interface QuickPrompt {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  { icon: Lightbulb, label: 'Explique o ciclo de Krebs', color: 'text-amber-500' },
  { icon: Brain,     label: 'Mecanismo de acao dos betabloqueadores', color: 'text-blue-500' },
  { icon: Zap,       label: 'Diferenca entre arterias e veias', color: 'text-rose-500' },
];

// ── Mode tabs ─────────────────────────────────────────────

export interface ModeTab {
  id: AssistantMode;
  icon: LucideIcon;
  label: string;
}

export const MODE_TABS: ModeTab[] = [
  { id: 'chat',       icon: Sparkles,      label: 'Chat' },
  { id: 'flashcards', icon: Layers,        label: 'Flashcards' },
  { id: 'quiz',       icon: GraduationCap, label: 'Quiz' },
  { id: 'explain',    icon: BookOpen,       label: 'Explicar' },
];

// ── Explain suggestions ───────────────────────────────────

export const EXPLAIN_SUGGESTIONS = [
  'Sistema Renina-Angiotensina-Aldosterona',
  'Ciclo de Krebs e fosforilacao oxidativa',
  'Mecanismo de Frank-Starling',
];

// ── Flashcard count options ───────────────────────────────

export const FLASHCARD_COUNT_OPTIONS = [3, 5, 8, 10] as const;

// ── Quiz difficulty options ───────────────────────────────

export type QuizDifficulty = 'basic' | 'intermediate' | 'advanced';

export interface DifficultyOption {
  id: QuizDifficulty;
  label: string;
  color: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: 'basic',        label: 'Basica',        color: 'emerald' },
  { id: 'intermediate', label: 'Intermediaria',  color: 'amber' },
  { id: 'advanced',     label: 'Avancada',       color: 'red' },
];
