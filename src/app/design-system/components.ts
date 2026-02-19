// ============================================================
// Axon v4.4 — Design System Component Patterns
// ============================================================

export const componentStyles = {
  card: 'bg-white rounded-2xl border border-gray-200 shadow-sm p-5',
  cardHover: 'bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow',
  button: {
    primary: 'bg-teal-500 hover:bg-teal-600 text-white rounded-full px-4 py-2 transition-colors',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 transition-colors',
    danger: 'bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 transition-colors',
    ghost: 'hover:bg-gray-100 text-gray-600 rounded-lg px-3 py-2 transition-colors',
  },
  icon: {
    container: 'bg-teal-50 text-teal-500 rounded-xl p-2',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  },
  progress: {
    track: 'h-2 bg-gray-100 rounded-full',
    fill: 'h-2 bg-teal-500 rounded-full transition-all',
  },
  badge: {
    default: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  },
} as const;
