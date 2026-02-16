/**
 * @module @axon/design-system/navigation
 * @version 1.0.0
 *
 * Estructura de navegacion: vistas disponibles, items de sidebar
 * (primarios y secundarios), y atajos de acceso rapido.
 *
 * Standalone:  import { navigation, ViewType } from '@/app/design-system/navigation';
 * Barrel:      import { navigation } from '@/app/design-system';
 */

// ─────────────────────────────────────────────
// NAVIGATION TOKENS
// ─────────────────────────────────────────────

export const navigation = {
  /** All available views (must match ViewType in AppContext) */
  views: [
    'home',
    'dashboard',
    'study-hub',
    'study',
    'flashcards',
    'quiz',
    '3d',
    'schedule',
    'organize-study',
    'review-session',
    'study-dashboards',
    'knowledge-heatmap',
    'mastery-dashboard',
    'student-data',
  ] as const,

  /** Primary sidebar items (icon names from lucide-react) */
  primaryItems: [
    { id: 'home',         label: 'Inicio',        icon: 'Home' },
    { id: 'dashboard',    label: 'Dashboard',      icon: 'LayoutDashboard' },
    { id: 'study-hub',    label: 'Estudar',        icon: 'BookOpen' },
    { id: 'schedule',     label: 'Cronograma',     icon: 'Calendar' },
    { id: 'flashcards',   label: 'Flashcards',     icon: 'Layers' },
    { id: '3d',           label: 'Atlas 3D',       icon: 'Box' },
    { id: 'quiz',         label: 'Quiz',           icon: 'GraduationCap' },
    { id: 'student-data', label: 'Meus Dados',     icon: 'Database' },
  ],

  /** Secondary sidebar items */
  secondaryItems: [
    { id: 'community', label: 'Comunidade',     icon: 'Users' },
    { id: 'settings',  label: 'Configuracoes',  icon: 'Settings' },
  ],

  /** Quick-access shortcuts (WelcomeView) */
  shortcuts: [
    { title: 'Resumos',    subtitle: 'Acessar resumos',     icon: 'BookOpen',       view: 'summaries' },
    { title: 'Flashcards', subtitle: 'Revisar cartoes',     icon: 'Layers',         view: 'flashcards' },
    { title: 'Quiz',       subtitle: 'Testar conhecimento', icon: 'GraduationCap',  view: 'quiz' },
    { title: 'Atlas 3D',   subtitle: 'Explorar modelos',    icon: 'Box',            view: '3d-atlas' },
  ],
} as const;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ViewType = (typeof navigation.views)[number];
