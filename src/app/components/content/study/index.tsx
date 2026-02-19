// ============================================================
// Axon v4.4 — StudyView (Orchestrator)
// ============================================================
// Thin orchestrator that manages sub-view state and composes:
//   - StudyPlanView.tsx     (study plan with section/topic cards)
//   - StudySessionView.tsx  (PDF-reader style session viewer)
//
// Sub-views: 'plan' (Plano de Estudos) | 'session' (Lector PDF)
// ============================================================
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import type { Section, Topic } from '@/app/data/courses';
import { StudyPlan } from './StudyPlanView';
import { StudySession } from './StudySessionView';

type StudySubView = 'plan' | 'session';

export function StudyView() {
  const { currentCourse, setCurrentTopic } = useApp();
  const [subView, setSubView] = useState<StudySubView>('plan');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const handleStartSession = useCallback((topic: Topic, section: Section) => {
    setActiveTopic(topic);
    setActiveSectionId(section.id);
    setCurrentTopic(topic);
    setSubView('session');
  }, [setCurrentTopic]);

  const handleBackToPlan = useCallback(() => { setSubView('plan'); }, []);

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {subView === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <StudyPlan course={currentCourse} selectedSection={selectedSection} onSelectSection={setSelectedSection} onStartSession={handleStartSession} />
          </motion.div>
        )}
        {subView === 'session' && activeTopic && (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <StudySession course={currentCourse} topic={activeTopic} sectionId={activeSectionId} onBack={handleBackToPlan} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
