// ============================================================
// Axon v4.4 — AppShell
// Main layout: Sidebar + ViewRouter + Global KeywordPopup overlay.
// Extracted from App.tsx for modularity.
//
// KeywordPopup is mounted HERE (not inside ViewRouter) so it
// overlays ANY view including ThreeDView. This is the SINGLE mount point.
// ============================================================

import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { Sidebar, SidebarToggle } from '@/app/components/shared/Sidebar';
import { KeywordPopup } from '@/app/components/ai/KeywordPopup';
import { ViewRouter } from './ViewRouter';

export function AppShell() {
  const {
    kwPopupOpen, kwPopupId,
    openKeywordPopup, closeKeywordPopup,
    navigateTo3D,
  } = useApp();

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <Sidebar />
      <SidebarToggle />
      <main className="flex-1 min-w-0 h-full overflow-hidden">
        <ViewRouter />
      </main>

      {/* Global KeywordPopup overlay — accessible from ANY view */}
      <AnimatePresence>
        {kwPopupOpen && kwPopupId && (
          <KeywordPopup
            keywordId={kwPopupId}
            onClose={closeKeywordPopup}
            onNavigateToKeyword={(id) => openKeywordPopup(id)}
            onNavigateTo3D={(modelId) => {
              closeKeywordPopup();
              navigateTo3D(modelId);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
