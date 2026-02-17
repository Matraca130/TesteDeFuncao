/**
 * ScheduleView — lean orchestrator.
 *
 * Routes between:
 *   • StudyPlanDashboard  → when at least one study plan exists
 *   • DefaultScheduleView → fallback calendar view
 *
 * Sub-components:
 *   ├── StudyPlanDashboard.tsx   (3-column layout)
 *   ├── DefaultScheduleView.tsx  (calendar + dark sidebar)
 *   ├── MiniCalendar.tsx         (compact calendar)
 *   ├── CalendarGrid.tsx         (full-size calendar)
 *   ├── QuickNavButton.tsx       (light & dark variants)
 *   └── types.ts                 (shared constants & types)
 */

import React from 'react';
import { useApp } from '@/app/context/AppContext';
import { StudyPlanDashboard } from './StudyPlanDashboard';
import { DefaultScheduleView } from './DefaultScheduleView';

export function ScheduleView() {
  const { studyPlans } = useApp();

  if (studyPlans.length > 0) {
    return <StudyPlanDashboard />;
  }
  return <DefaultScheduleView />;
}
