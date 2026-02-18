// ============================================================
// Axon v4.4 — Sidebar Navigation Data
// Navigation items and icon mapping for the sidebar.
// Extracted from Sidebar.tsx for modularity.
// ============================================================

import type { ViewType } from '@/app/context/AppContext';
import type { ElementType } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Layers,
  Calendar,
  Database,
  Settings,
  Monitor,
  Shield,
  Sparkles,
  MessageCircle,
  FileCheck,
  LogOut,
  User,
  Zap,
  Box,
} from 'lucide-react';

// ── Icon Registry ───────────────────────────────────────────

export const iconMap: Record<string, ElementType> = {
  LayoutDashboard, BookOpen, GraduationCap, Layers, Calendar, Database,
  Settings, Monitor, Shield, Sparkles, MessageCircle, FileCheck, LogOut, User, Zap, Box,
};

// ── Nav Item Types ──────────────────────────────────────────

export interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
  description?: string;
}

// ── Module Items (main navigation) ──────────────────────────

export const moduleItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', description: 'Visao geral' },
  { id: 'study', label: 'Estudar', icon: 'Monitor', description: 'Sessao de estudos' },
  { id: 'resumos', label: 'Resumos', icon: 'BookOpen', description: 'Resumos de estudo' },
  { id: 'quiz', label: 'Quiz', icon: 'GraduationCap', description: 'Testar conhecimento' },
  { id: '3d', label: 'Visor 3D', icon: 'Box', description: 'Modelos anatomicos' },
];

// ── AI Section Items (Dev 6) ────────────────────────────────

export const aiItems: NavItem[] = [
  { id: 'ai-generate', label: 'Gerar Conteudo AI', icon: 'Sparkles' },
  { id: 'ai-chat', label: 'Chat com Axon AI', icon: 'MessageCircle' },
  { id: 'ai-approval', label: 'Aprovar Conteudo', icon: 'FileCheck' },
];

// ── Secondary Items (tools) ─────────────────────────────────

export const secondaryItems: NavItem[] = [
  { id: 'flashcards', label: 'Flashcards', icon: 'Layers' },
  { id: 'schedule', label: 'Cronograma', icon: 'Calendar' },
  { id: 'student-data', label: 'Meus Dados', icon: 'Database' },
];
