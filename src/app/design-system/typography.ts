// ============================================================
// Axon v4.4 — Design System Typography
// Headings: Georgia, serif | Body: Inter, sans-serif
// ============================================================

export const typography = {
  fonts: {
    heading: "'Georgia', serif",
    body: "'Inter', sans-serif",
  },
  sizes: {
    pageTitle: 'clamp(2rem, 4vw, 3rem)',
    sectionTitle: '1.125rem',
    body: '0.875rem',
    caption: '0.75rem',
    label: '0.625rem',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;
