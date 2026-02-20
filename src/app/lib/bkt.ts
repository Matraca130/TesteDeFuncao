// ============================================================
// Axon v4.4 — BKT Color System (frontend)
// Single source of truth for BKT visual representation
// Colors: red (<0.25) / orange (0.25-0.5) / yellow (0.5-0.75) / green (>0.75)
// ============================================================

export interface BktColorSet {
  color: string;
  label: string;
  tw: string;
  textTw: string;
  borderTw: string;
  bgTw: string;
}

const BKT_LEVELS: Array<{ max: number; set: BktColorSet }> = [
  { max: 0.25, set: { color: '#ef4444', label: 'Nao domina', tw: 'bg-red-500', textTw: 'text-red-700', borderTw: 'border-red-300', bgTw: 'bg-red-50' } },
  { max: 0.5,  set: { color: '#f97316', label: 'Em progresso', tw: 'bg-orange-500', textTw: 'text-orange-700', borderTw: 'border-orange-300', bgTw: 'bg-orange-50' } },
  { max: 0.75, set: { color: '#eab308', label: 'Quase domina', tw: 'bg-yellow-500', textTw: 'text-yellow-700', borderTw: 'border-yellow-300', bgTw: 'bg-yellow-50' } },
  { max: Infinity, set: { color: '#22c55e', label: 'Domina', tw: 'bg-green-500', textTw: 'text-green-700', borderTw: 'border-green-300', bgTw: 'bg-green-50' } },
];

export function getBktColorSet(pKnow: number): BktColorSet {
  return BKT_LEVELS.find(l => pKnow < l.max)!.set;
}

export const STATUS_LABELS: Record<string, string> = {
  dominado: 'Dominado',
  em_progresso: 'Em progresso',
  precisa_atencao: 'Precisa atencao',
  nao_estudado: 'Nao estudado',
};

/** Accuracy-based color for quiz scores */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 75) return 'text-green-600';
  if (accuracy >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getAccuracyStroke(accuracy: number): string {
  if (accuracy >= 75) return 'stroke-green-500';
  if (accuracy >= 50) return 'stroke-yellow-500';
  return 'stroke-red-500';
}
