// ============================================================
// AXON v4.4 — Navigation Configuration (BLOQUEADO)
// ============================================================
// Define los items de navegacion por rol.
// Para agregar un item, agregalo aqui — NO en el layout.
// ============================================================

import {
  Home, LayoutDashboard, BookOpen, Calendar, Layers,
  Eye, HelpCircle, User, Bot, ClipboardCheck, Library,
  Video, GraduationCap, TreePine, FileText, Tag,
  CheckSquare, Activity, Users, CreditCard, Settings,
  Shield, Wrench, Brain,
} from 'lucide-react';
import type { NavSection } from './AppShell';

// ── Student Navigation ──
export const STUDENT_NAV: NavSection[] = [
  {
    title: 'MENU',
    items: [
      { id: 'home',         label: 'Inicio',         icon: Home,            path: '/study' },
      { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, path: '/study/dashboard' },
      { id: 'study',        label: 'Estudar',        icon: BookOpen,        path: '/study/learn' },
      { id: 'schedule',     label: 'Cronograma',     icon: Calendar,        path: '/study/schedule' },
      { id: 'flashcards',   label: 'Flashcards',     icon: Layers,          path: '/study/flashcards' },
      { id: 'atlas',        label: 'Atlas Visual',   icon: Eye,             path: '/study/atlas' },
      { id: 'quiz',         label: 'Quiz',           icon: HelpCircle,      path: '/study/quiz' },
      { id: 'profile',      label: 'Meus Dados',     icon: User,            path: '/study/profile' },
      { id: 'ai-mentor',    label: 'IA Mentor',      icon: Bot,             path: '/study/ai-mentor' },
      { id: 'evaluations',  label: 'Avaliacoes',     icon: ClipboardCheck,  path: '/study/evaluations' },
      { id: 'library',      label: 'Biblioteca',     icon: Library,         path: '/study/library' },
      { id: 'masterclass',  label: 'Masterclasses',  icon: Video,           path: '/study/masterclass' },
    ],
  },
  {
    title: 'OUTROS',
    items: [
      { id: 'settings',     label: 'Configuracoes',  icon: Settings,        path: '/study/settings' },
    ],
  },
];

// ── Admin Navigation ──
export const ADMIN_NAV: NavSection[] = [
  {
    title: 'GESTAO',
    items: [
      { id: 'overview',     label: 'Visao Geral',       icon: LayoutDashboard, path: '/admin' },
      { id: 'members',      label: 'Membros',           icon: Users,           path: '/admin/members' },
      { id: 'plans',        label: 'Planos',            icon: CreditCard,      path: '/admin/plans' },
      { id: 'content',      label: 'Conteudo',          icon: TreePine,        path: '/admin/content' },
      { id: 'courses',      label: 'Cursos',            icon: GraduationCap,   path: '/admin/courses' },
    ],
  },
  {
    title: 'CONTEUDO',
    items: [
      { id: 'summaries',    label: 'Resumos',           icon: FileText,        path: '/admin/summaries' },
      { id: 'keywords',     label: 'Keywords',          icon: Tag,             path: '/admin/keywords' },
      { id: 'approval',     label: 'Aprovacao',         icon: CheckSquare,     path: '/admin/approval' },
      { id: 'ai',           label: 'IA Geracao',        icon: Brain,           path: '/admin/ai' },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      { id: 'diagnostics',  label: 'Diagnostico',       icon: Activity,        path: '/admin/diagnostics' },
      { id: 'settings',     label: 'Configuracoes',     icon: Settings,        path: '/admin/settings' },
    ],
  },
];

// ── Professor Navigation ──
export const PROFESSOR_NAV: NavSection[] = [
  {
    title: 'CONTEUDO',
    items: [
      { id: 'overview',     label: 'Visao Geral',       icon: LayoutDashboard, path: '/professor' },
      { id: 'courses',      label: 'Meus Cursos',       icon: GraduationCap,   path: '/professor/courses' },
      { id: 'summaries',    label: 'Resumos',           icon: FileText,        path: '/professor/summaries' },
      { id: 'keywords',     label: 'Keywords',          icon: Tag,             path: '/professor/keywords' },
      { id: 'flashcards',   label: 'Flashcards',        icon: Layers,          path: '/professor/flashcards' },
      { id: 'quiz',         label: 'Quiz',              icon: HelpCircle,      path: '/professor/quiz' },
    ],
  },
  {
    title: 'FERRAMENTAS',
    items: [
      { id: 'ai',           label: 'IA Geracao',        icon: Brain,           path: '/professor/ai' },
      { id: 'settings',     label: 'Configuracoes',     icon: Settings,        path: '/professor/settings' },
    ],
  },
];
