// ============================================================
// PageShell — Shared page wrapper for all AI feedback pages
// Provides: bg color, ScrollArea, max-width container, padding
// ============================================================
import type { ReactNode } from 'react';
import { ScrollArea } from '../ui/scroll-area';

interface PageShellProps {
  children: ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
}

const MAX_WIDTH_MAP: Record<string, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export function PageShell({ children, maxWidth = '4xl' }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      <ScrollArea className="h-screen">
        <div className={`${MAX_WIDTH_MAP[maxWidth]} mx-auto p-4 md:p-6 pb-20 space-y-6`}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
