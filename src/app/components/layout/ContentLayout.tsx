// ============================================================
// Axon v4.4 — ContentLayout
// Reusable layout wrapper for content views:
//   bg-[#f5f2ea] full-height scrollable + centered max-width container.
//
// Usage:
//   <ContentLayout maxWidth="4xl">
//     <h1>Title</h1>
//     <SomeComponent />
//   </ContentLayout>
//
// Extracted from ViewRouter.tsx (Step 3 modularization).
// ============================================================

import React from 'react';
import type { ReactNode } from 'react';

interface ContentLayoutProps {
  children: ReactNode;
  /** Tailwind max-width token: '2xl' | '4xl' | '5xl' etc. Default: '4xl' */
  maxWidth?: string;
  /** Additional className for the outer container */
  className?: string;
  /** Use flex layout (e.g., for chat views that need min-h-0 flex-col). Default: false */
  flex?: boolean;
}

const MAX_WIDTH_MAP: Record<string, string> = {
  'sm': 'max-w-sm',
  'md': 'max-w-md',
  'lg': 'max-w-lg',
  'xl': 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

export function ContentLayout({ children, maxWidth = '4xl', className = '', flex = false }: ContentLayoutProps) {
  const mwClass = MAX_WIDTH_MAP[maxWidth] || 'max-w-4xl';

  if (flex) {
    return (
      <div className={`h-full bg-[#f5f2ea] flex flex-col ${className}`}>
        <div className={`${mwClass} mx-auto w-full flex-1 flex flex-col p-6 min-h-0`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto bg-[#f5f2ea] ${className}`}>
      <div className={`${mwClass} mx-auto p-6`}>
        {children}
      </div>
    </div>
  );
}
