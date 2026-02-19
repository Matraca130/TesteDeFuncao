// ============================================================
// Axon v4.4 — Design System Tokens (Bridge)
// Agent 5: FORGE
//
// This file mirrors ALL exports from TesteDeFuncao's
//   src/app/design-system/index.ts
//
// When migrating to the repo, replace all imports from this file
// with imports from '@/app/design-system'.
//
// Example migration (find & replace):
//   FROM: import { headingStyle } from '../lib/design-tokens';
//   TO:   import { headingStyle } from '@/app/design-system';
//
// CANONICAL SOURCE: src/app/design-system/ in TesteDeFuncao repo
// ============================================================

import type { CSSProperties } from 'react';

// ── Typography (from design-system/typography.ts) ───────────

export const typography = {
  families: {
    heading: 'Georgia, serif',
    body: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: '"Space Grotesk", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  imports: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  ],
  rules: {
    pageTitle:    { family: 'heading' as const, size: 'text-[clamp(2rem,4vw,3rem)]', weight: 'font-bold', tracking: 'tracking-tight' },
    sectionTitle: { family: 'heading' as const, size: 'text-lg', weight: 'font-semibold' },
    sectionLabel: { family: 'heading' as const, size: 'text-sm', weight: 'font-semibold', extra: 'uppercase tracking-wide' },
    cardTitle:    { family: 'heading' as const, size: 'default', weight: 'font-bold' },
    body:         { family: 'body' as const,    size: 'text-sm', weight: 'font-medium' },
    caption:      { family: 'body' as const,    size: 'text-xs', weight: 'font-medium' },
    label:        { family: 'body' as const,    size: 'text-[10px]', weight: 'font-medium', extra: 'uppercase tracking-wider' },
  },
} as const;

/** Inline style for heading elements (Georgia serif) */
export const headingStyle: CSSProperties = { fontFamily: typography.families.heading };

/** Inline style for body text (Inter sans-serif) */
export const bodyStyle: CSSProperties = { fontFamily: typography.families.body };

// ── Colors (from design-system/colors.ts) ───────────────────

export const colors = {
  primary: {
    50:  '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',   // Primary interaction color
    600: '#0d9488',   // Hover / active text
    700: '#0f766e',   // Pressed
    800: '#115e59',
    900: '#134e4a',
  },
  dark: {
    navBar:       '#1e293b',
    sidebarBase:  '#1c1c1e',
    sidebarBody:  '#2d3e50',
    cardDark:     '#2c3e50',
  },
  surface: {
    page:       '#f9fafb',
    dashboard:  '#f5f2ea',
    card:       '#ffffff',
    hover:      '#f3f4f6',
  },
  border: {
    card:     '#e5e7eb',
    subtle:   'rgba(229,231,235,0.6)',
    dark:     'rgba(255,255,255,0.1)',
    darkAlt:  'rgba(255,255,255,0.05)',
  },
  text: {
    primary:   '#111827',
    secondary: '#6b7280',
    tertiary:  '#9ca3af',
    disabled:  '#d1d5db',
    inverse:   '#ffffff',
  },
  semantic: {
    success:  '#10b981',
    warning:  '#f59e0b',
    error:    '#ef4444',
    info:     '#06b6d4',
  },
  mastery: {
    notStarted: '#d1d5db',
    learning:   '#fbbf24',
    reviewing:  '#14b8a6',
    mastered:   '#0d9488',
  },
  ratings: {
    1: '#f43f5e',
    2: '#f97316',
    3: '#facc15',
    4: '#84cc16',
    5: '#10b981',
  } as Record<number, string>,
  chart: {
    flashcards: '#14b8a6',
    videos:     '#06b6d4',
    bar:        '#0d9488',
    grid:       '#f3f4f6',
  },
} as const;

// ── Shadows (from design-system/shadows.ts) ─────────────────

export const shadows = {
  card:        'shadow-sm',
  cardHover:   'shadow-md',
  chart:       'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
  performance: 'shadow-lg',
  dropdown:    'shadow-2xl',
  tooltip:     'shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
} as const;

// ── Layout (from design-system/layout.ts) ───────────────────

export const layout = {
  sidebar: {
    width: 260,
    collapsedWidth: 0,
  },
  header: {
    height: 48,
  },
  content: {
    paddingX:  'px-6',
    paddingY:  'py-6',
    gap:       'gap-6',
    maxWidth:  'max-w-7xl',
  },
  grid: {
    stats:   'grid grid-cols-2 lg:grid-cols-4 gap-4',
    courses: 'grid grid-cols-1 lg:grid-cols-2 gap-5',
    kpi:     'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  },
} as const;

// ── Component Patterns (from design-system/components.ts) ───

export const components = {
  icon: {
    default:  { bg: 'bg-teal-50', text: 'text-teal-500' },
    sizes:    { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' },
    container: 'rounded-xl flex items-center justify-center',
  },
  card: {
    base:      'bg-white rounded-2xl border border-gray-200 shadow-sm',
    hover:     'hover:shadow-md transition-shadow',
    padding:   'p-5',
    paddingLg: 'p-6',
  },
  cardDark: {
    base:    'bg-[#2c3e50] rounded-2xl text-white shadow-lg',
    padding: 'p-7',
  },
  buttonPrimary: {
    base:  'bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-full transition-colors',
    sizes: { sm: 'px-4 py-1.5 text-xs', md: 'px-6 py-2.5 text-sm', lg: 'px-8 py-3 text-base' },
  },
  buttonAction: {
    base: 'bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm text-center transition-colors cursor-pointer',
    full: 'w-full py-2.5',
  },
  filterButton: {
    active:   'bg-teal-500 text-white shadow-sm',
    inactive: 'text-gray-500 hover:text-gray-700',
  },
  progressBar: {
    track:        'w-full h-2 bg-gray-100 rounded-full overflow-hidden',
    fill:         'h-full rounded-full transition-all duration-700',
    colorDefault: 'bg-teal-500',
  },
  kpiCard: {
    base:   'bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-all',
    iconBg: 'p-2.5 rounded-xl',
  },
  pageHeader: {
    wrapper:   'relative px-8 pt-4 pb-6 bg-white overflow-hidden border-b border-gray-200',
    title:     'text-[clamp(2rem,4vw,3rem)] font-bold text-gray-900 tracking-tight leading-[1]',
    titleFont: 'Georgia, serif',
    subtitle:  'text-sm text-gray-500',
  },
  sidebar: {
    width:       260,
    bgOuter:     '#1c1c1e',
    bgInner:     '#2d3e50',
    navItem: {
      base:     'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
      active:   'bg-sky-500/10 text-sky-400 shadow-sm border border-sky-500/20',
      inactive: 'text-gray-400 hover:text-white hover:bg-white/5',
    },
    sectionLabel: 'px-3 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2',
  },
} as const;

// ── Brand (from design-system/brand.ts) ─────────────────────

export const brand = {
  name: 'AXON',
  fullName: 'AxonPlataforma',
  version: '1.0.0',
  tagline: 'Plataforma de Estudos Medicos',
} as const;

// ── Design Rules (from design-system/rules.ts) ─────────────

export const designRules = {
  mandatory: [
    'Titulos SEMPRE em Georgia, serif (fontFamily inline style)',
    'Corpo SEMPRE em Inter (font-sans via Tailwind)',
    'Cor primaria de interacao: teal (#14b8a6)',
    'Botoes solidos: pill-shaped com rounded-full',
    'Cards brancos: rounded-2xl com shadow-sm',
    'Icones: bg-teal-50 + text-teal-500 (sem gradientes)',
    'Filtros ativos: bg-teal-500 text-white',
  ],
  forbidden: [
    'Glassmorphism (backdrop-blur em cards de conteudo)',
    'Gradientes em botoes ou icones',
    'Cores azul/violeta em elementos interativos (substituir por teal)',
  ],
} as const;

// ── Helper Functions (from design-system/components.ts) ─────

/** Icon pattern: combines bg + text + size + container */
export function iconClasses(size: 'sm' | 'md' | 'lg' = 'md') {
  return `${components.icon.sizes[size]} ${components.icon.default.bg} ${components.icon.container}`;
}

/** Card classes with optional interactive hover */
export function cardClasses(interactive = false) {
  return `${components.card.base} ${components.card.padding} ${interactive ? components.card.hover + ' cursor-pointer' : ''}`;
}

/** Full-width CTA button inside a card */
export function ctaButtonClasses() {
  return `${components.buttonAction.full} ${components.buttonPrimary.base}`;
}

/** KPI/stat card classes */
export function kpiCardClasses() {
  return components.kpiCard.base;
}

/** Icon badge classes (bg + icon color) */
export function iconBadgeClasses() {
  return `${components.kpiCard.iconBg} ${components.icon.default.bg} ${components.icon.default.text}`;
}

// ── Types ────────────────────────────────────────────────────

export type ButtonSize = keyof typeof components.buttonPrimary.sizes;
export type IconSize = keyof typeof components.icon.sizes;
