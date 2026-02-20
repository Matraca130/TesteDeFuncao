// ============================================================
// Axon v4.4 — Admin Helpers (Shared)
// Agent 5: FORGE
//
// Pure utility functions used across multiple admin pages.
// No React dependencies — these are pure TypeScript functions.
// ============================================================

/**
 * Extract initials from a name or email for avatar display.
 * @example getInitials('Dr. Carlos Mendoza', 'carlos@unifesp.br') → 'DC'
 * @example getInitials(undefined, 'carlos@unifesp.br') → 'C'
 */
export function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  return (email || '?')[0].toUpperCase();
}

/**
 * Format a date string as a relative time label in Portuguese.
 * @example relativeTime('2026-02-18T10:00:00Z') → 'há 1 dia'
 */
export function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'há 1 dia';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana(s)`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} mês(es)`;
  return `há ${Math.floor(diffDays / 365)} ano(s)`;
}

/**
 * Basic email validation.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
