// ════════════════════════════════════════════════════════════════
// CANVAS TYPES & CONSTANTS
// ════════════════════════════════════════════════════════════════

export type BlockType = 'heading' | 'subheading' | 'text' | 'image' | 'callout' | 'divider' | 'list' | 'quote';

export interface CanvasBlock {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    align?: 'left' | 'center' | 'right';
    calloutColor?: 'yellow' | 'blue' | 'green' | 'pink' | 'teal';
    imageCaption?: string;
    imageWidth?: number;
    imageFit?: 'cover' | 'contain';
    imageAspectRatio?: string;
    imageMaxHeight?: number;
    listStyle?: 'bullet' | 'numbered';
    columnGroup?: string;
    columnWidth?: number;
    columnSlot?: number;
  };
}

export interface TopicOption {
  courseId: string;
  courseName: string;
  topicId: string;
  topicTitle: string;
  sectionTitle: string;
}

// ── Row grouping types ──
export interface ColumnSlotData {
  slot: number;
  width: number;
  blocks: CanvasBlock[];
}

export interface RowGroup {
  groupId: string | null;
  columns: ColumnSlotData[];
}

// ── Highlight Colors ──
export const HIGHLIGHT_COLORS = [
  { id: 'yellow', bg: 'bg-amber-200/70', css: 'rgba(251,191,36,0.35)', label: 'Amarelo', ring: 'ring-amber-400' },
  { id: 'blue', bg: 'bg-blue-200/70', css: 'rgba(96,165,250,0.35)', label: 'Azul', ring: 'ring-blue-400' },
  { id: 'green', bg: 'bg-green-200/70', css: 'rgba(74,222,128,0.35)', label: 'Verde', ring: 'ring-green-400' },
  { id: 'pink', bg: 'bg-pink-200/70', css: 'rgba(244,114,182,0.35)', label: 'Rosa', ring: 'ring-pink-400' },
  { id: 'teal', bg: 'bg-teal-200/70', css: 'rgba(45,212,191,0.35)', label: 'Teal', ring: 'ring-teal-400' },
] as const;

// ── Callout styles ──
export const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  yellow: { border: 'border-l-amber-400', bg: 'bg-amber-50', icon: '\u{1F4A1}' },
  blue:   { border: 'border-l-blue-400',  bg: 'bg-blue-50',  icon: '\u{1F4D8}' },
  green:  { border: 'border-l-green-400', bg: 'bg-green-50', icon: '\u{2705}' },
  pink:   { border: 'border-l-pink-400',  bg: 'bg-pink-50',  icon: '\u{26A0}\u{FE0F}' },
  teal:   { border: 'border-l-teal-400',  bg: 'bg-teal-50',  icon: '\u{1F52C}' },
};

// ── Image presets ──
export const IMAGE_PRESETS = [
  { label: '25%', value: 25 },
  { label: '33%', value: 33 },
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
];

export const ASPECT_RATIO_PRESETS = [
  { label: 'Livre', value: 'auto' },
  { label: '16:9', value: '16/9' },
  { label: '4:3', value: '4/3' },
  { label: '1:1', value: '1/1' },
  { label: '3:4', value: '3/4' },
  { label: '9:16', value: '9/16' },
];

// ── Shared card class ──
export const CARD = 'bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100';

// ── A4 page height (visual guides) ──
export const A4_CONTENT_HEIGHT = 1060;

// ── Sample medical images ──
export const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1715111641804-f8af88e93b01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwYW5hdG9teSUyMHNob3VsZGVyJTIwbXVzY2xlc3xlbnwxfHx8fDE3NzEyMTczNzV8MA&ixlib=rb-4.1.0&q=80&w=1080', label: 'Ombro e Musculos' },
  { url: 'https://images.unsplash.com/photo-1768726455785-8c1b4a153f47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFydCUyMGFuYXRvbXklMjBtZWRpY2FsJTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3MTIxNzM3OHww&ixlib=rb-4.1.0&q=80&w=1080', label: 'Coracao' },
  { url: 'https://images.unsplash.com/photo-1647083701139-3930542304cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b2xvZ3klMjBjZWxscyUyMG1pY3Jvc2NvcGUlMjB0aXNzdWV8ZW58MXx8fHwxNzcxMjE3MzgxfDA&ixlib=rb-4.1.0&q=80&w=1080', label: 'Histologia' },
];
