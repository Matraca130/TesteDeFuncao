import type React from 'react';

// ─── Shared Types ────────────────────────────────────────────────────────────

export type AnnotationColor = 'yellow' | 'blue' | 'green' | 'pink';
export type AnnotationType = 'highlight' | 'note' | 'question';
export type ToolType = 'cursor' | 'highlight' | 'pen';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type AnnotationTabType = 'highlight' | 'note' | 'question';

export interface TextAnnotation {
  id: string;
  originalText: string;
  displayText: string;
  color: AnnotationColor;
  note: string;
  type: AnnotationType;
  botReply?: string;
  timestamp: number;
}

export interface PendingAnnotation {
  text: string;
  rect: DOMRect;
}

// ─── Highlighter Styles ──────────────────────────────────────────────────────

export const highlighterStyles: Record<AnnotationColor, React.CSSProperties> = {
  yellow: { background: 'linear-gradient(to bottom, transparent 40%, #fde047 40%, #fde047 85%, transparent 85%)' },
  blue:   { background: 'linear-gradient(to bottom, transparent 40%, #93c5fd 40%, #93c5fd 85%, transparent 85%)' },
  green:  { background: 'linear-gradient(to bottom, transparent 40%, #6ee7b7 40%, #6ee7b7 85%, transparent 85%)' },
  pink:   { background: 'linear-gradient(to bottom, transparent 40%, #f9a8d4 40%, #f9a8d4 85%, transparent 85%)' },
};

// ─── Color Maps ──────────────────────────────────────────────────────────────

export const colorBgMap: Record<AnnotationColor, string> = {
  yellow: 'bg-yellow-50 border-yellow-200',
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-emerald-50 border-emerald-200',
  pink: 'bg-pink-50 border-pink-200',
};

export const colorAccentMap: Record<AnnotationColor, string> = {
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-400',
  green: 'bg-emerald-400',
  pink: 'bg-pink-400',
};

export const colorButtonMap: Record<AnnotationColor, string> = {
  yellow: 'bg-yellow-300 ring-yellow-400',
  blue: 'bg-blue-300 ring-blue-400',
  green: 'bg-emerald-300 ring-emerald-400',
  pink: 'bg-pink-300 ring-pink-400',
};

export const colorDotMap: Record<AnnotationColor, string> = {
  yellow: 'bg-yellow-300',
  blue: 'bg-blue-300',
  green: 'bg-emerald-300',
  pink: 'bg-pink-300',
};
