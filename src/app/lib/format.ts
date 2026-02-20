// ============================================================
// Axon v4.4 — Shared formatters
// ============================================================

/** Format seconds to human-readable time string (pt-BR) */
export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0min';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}
