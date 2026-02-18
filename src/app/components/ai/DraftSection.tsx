// ============================================================
// Axon v4.4 — DraftSection
// Collapsible section used in AIGeneratePanel to display
// generated keywords, flashcards, quiz questions, etc.
// Extracted from AIGeneratePanel.tsx for modularity.
// ============================================================

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DraftSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  selectedCount: number;
  expanded: boolean;
  onToggle: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  children: React.ReactNode;
}

export function DraftSection({
  title,
  icon,
  count,
  selectedCount,
  expanded,
  onToggle,
  onSelectAll,
  onDeselectAll,
  children,
}: DraftSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
      >
        <span className="text-indigo-500">{icon}</span>
        <span className="text-sm font-medium text-gray-900 flex-1 text-left">{title}</span>
        <span className="text-xs text-gray-500">
          {selectedCount}/{count} selecionados
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={onSelectAll} className="text-xs text-indigo-600 hover:underline">
              Selecionar todos
            </button>
            <span className="text-xs text-gray-300">|</span>
            <button onClick={onDeselectAll} className="text-xs text-gray-500 hover:underline">
              Deselecionar todos
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
