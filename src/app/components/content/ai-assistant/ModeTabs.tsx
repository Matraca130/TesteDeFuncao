// ============================================================
// ModeTabs — Mode selector (chat / flashcards / quiz / explain)
// ============================================================

import clsx from 'clsx';
import type { AssistantMode } from './types';
import { MODE_TABS } from './types';

interface ModeTabsProps {
  current: AssistantMode;
  onChange: (mode: AssistantMode) => void;
}

export function ModeTabs({ current, onChange }: ModeTabsProps) {
  return (
    <div className="shrink-0 px-3 py-2 bg-white border-b border-gray-200/60 flex gap-1">
      {MODE_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
            current === tab.id
              ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-200/60'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
