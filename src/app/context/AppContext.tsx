import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Course, Topic, courses } from '@/app/data/courses';

// @refresh reset

// ════════════════════════════════════════════════════════════════
// APP CONTEXT — Estado do aluno e navegacao
//
// ViewTypes incluem os modulos de todos os devs:
//   - dashboard, study, resumos, quiz, flashcards (Devs 1-5)
//   - ai-generate, ai-chat, ai-approval (Dev 6 — Auth & AI)
//   - admin (AdminContext gerencia sessao independente)
//
// Dev 6 additions (Oleada 3-4):
//   - KeywordPopup state (global overlay)
//   - 3D navigation (navigateTo3D / returnFrom3D)
// ════════════════════════════════════════════════════════════════

export type ViewType =
  | 'home'
  | 'dashboard'
  | 'resumos'
  | 'study'
  | 'study-hub'
  | 'flashcards'
  | 'quiz'
  | '3d'
  | 'schedule'
  | 'organize-study'
  | 'review-session'
  | 'study-dashboards'
  | 'knowledge-heatmap'
  | 'mastery-dashboard'
  | 'student-data'
  | 'admin'
  | 'flashcard-admin'
  | 'curriculum-admin'
  | 'diagnostic'
  // Dev 6 — Auth & AI views
  | 'ai-generate'
  | 'ai-chat'
  | 'ai-approval'
  | 'batch-verify';

export type ThemeType = 'dark' | 'light';

interface AppContextType {
  // ── Original (Devs 1-5) ──
  currentCourse: Course;
  setCurrentCourse: (course: Course) => void;
  currentTopic: Topic | null;
  setCurrentTopic: (topic: Topic) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;

  // ── Dev 6: KeywordPopup (global overlay) ──
  kwPopupOpen: boolean;
  kwPopupId: string | null;
  openKeywordPopup: (keywordId: string) => void;
  closeKeywordPopup: () => void;

  // ── Dev 6: 3D Navigation ──
  selectedModelId: string | null;
  navigateTo3D: (modelId: string) => void;
  returnFrom3D: () => void;
}

const noop = () => {};
const AppContext = createContext<AppContextType>({
  currentCourse: courses[0],
  setCurrentCourse: noop,
  currentTopic: courses[0].semesters[0].sections[0].topics[0],
  setCurrentTopic: noop,
  activeView: 'dashboard',
  setActiveView: noop,
  isSidebarOpen: true,
  setSidebarOpen: noop,

  // Dev 6 defaults
  kwPopupOpen: false,
  kwPopupId: null,
  openKeywordPopup: noop,
  closeKeywordPopup: noop,
  selectedModelId: null,
  navigateTo3D: noop,
  returnFrom3D: noop,
});

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Original state ──
  const [currentCourse, setCurrentCourse] = useState<Course>(courses[0]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(
    courses[0].semesters[0].sections[0].topics[0]
  );
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // ── Dev 6: KeywordPopup state ──
  // kwPopupOpen derived from kwPopupId (single source of truth — eliminates impossible state)
  const [kwPopupId, setKwPopupId] = useState<string | null>(null);
  const kwPopupOpen = kwPopupId !== null;

  // ── Dev 6: 3D navigation state ──
  const [returnToView, setReturnToView] = useState<ViewType | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // ── Dev 6: KeywordPopup actions ──
  const openKeywordPopup = useCallback((keywordId: string) => {
    setKwPopupId(keywordId);
  }, []);

  const closeKeywordPopup = useCallback(() => {
    setKwPopupId(null);
  }, []);

  // ── Dev 6: 3D navigation actions ──
  const navigateTo3D = useCallback((modelId: string) => {
    setReturnToView(activeView);
    setSelectedModelId(modelId);
    setActiveView('3d');
  }, [activeView]);

  const returnFrom3D = useCallback(() => {
    if (returnToView) {
      setActiveView(returnToView);
      setReturnToView(null);
    } else {
      setActiveView('dashboard');
    }
    setSelectedModelId(null);
  }, [returnToView]);

  return (
    <AppContext.Provider
      value={{
        // Original
        currentCourse,
        setCurrentCourse,
        currentTopic,
        setCurrentTopic,
        activeView,
        setActiveView,
        isSidebarOpen,
        setSidebarOpen,

        // Dev 6: KeywordPopup
        kwPopupOpen,
        kwPopupId,
        openKeywordPopup,
        closeKeywordPopup,

        // Dev 6: 3D Navigation
        selectedModelId,
        navigateTo3D,
        returnFrom3D,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}