// ============================================================
// Axon v4.4 — Design System Colors
// Primary = teal-500 (#14b8a6)
// ============================================================

export const colors = {
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // PRIMARY
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  surface: {
    dashboard: '#f5f2ea',
    card: '#ffffff',
    page: '#f9fafb',
    sidebar: '#1c1c1e',
    sidebarInner: '#2d3e50',
    header: '#1e293b',
  },
  border: {
    default: '#e5e7eb',
    light: '#f3f4f6',
    dark: '#d1d5db',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  bkt: {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
  },
} as const;

export function getBktColor(pKnow: number): { color: string; label: string; bg: string } {
  if (pKnow < 0.25) return { color: colors.bkt.red, label: 'No domina', bg: '#fef2f2' };
  if (pKnow < 0.5) return { color: colors.bkt.orange, label: 'En progreso', bg: '#fff7ed' };
  if (pKnow < 0.75) return { color: colors.bkt.yellow, label: 'Casi domina', bg: '#fefce8' };
  return { color: colors.bkt.green, label: 'Domina', bg: '#f0fdf4' };
}
