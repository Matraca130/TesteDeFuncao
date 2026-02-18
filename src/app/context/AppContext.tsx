import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Course, Topic, courses } from '@/app/data/courses';

// @refresh reset

// ================================================================
// APP CONTEXT — Estado do aluno e navegacao
//
// ViewTypes incluem os modulos de todos os devs:
//   - dashboard, study, resumos, quiz, flashcards (Devs 1-5)
//   - ai-generate, ai-chat, ai-approval (Dev 6 — Auth & AI)
//   - admin (AdminContext gerencia sessao independente)
//
// Oleada 3-4 additions (Dev 6):
//   - Keyword Popup global state (kwPopupOpen derived from kwPopupId)
//   - 3D navigation (selectedModelId, navigateTo3D, returnFrom3D)
// ================================================================

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
  | 'ai-approval';

export type ThemeType = 'dark' | 'light';

export interface StudyPlanTask {
  id: string;
  date: Date;
  title: string;
  subject: string;
  subjectColor: string;
  method: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  name: string;
  subjects: { id: string; name: string; color: string }[];
  methods: string[];
  selectedTopics: { courseId: string; courseName: string; sectionTitle: string; topicTitle: string; topicId: string }[];
  completionDate: Date;
  weeklyHours: number[];
  tasks: StudyPlanTask[];
  createdAt: Date;
  totalEstimatedHours: number;
}

interface AppContextType {
  currentCourse: Course;
  setCurrentCourse: (course: Course) => void;
  currentTopic: Topic | null;
  setCurrentTopic: (topic: Topic) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  // ── Oleada 3-4: Keyword Popup global state ──
  kwPopupOpen: boolean;
  kwPopupId: string | null;
  openKeywordPopup: (keywordId: string) => void;
  closeKeywordPopup: () => void;
  // ── Oleada 3-4: 3D navigation ──
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
  // ── Oleada 3-4 defaults ──
  kwPopupOpen: false,
  kwPopupId: null,
  openKeywordPopup: noop,
  closeKeywordPopup: noop,
  selectedModelId: null,
  navigateTo3D: noop,
  returnFrom3D: noop,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCourse, setCurrentCourse] = useState<Course>(courses[0]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(
    courses[0].semesters[0].sections[0].topics[0]
  );
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // ── Oleada 3-4: Keyword Popup state ──
  // kwPopupOpen is DERIVED from kwPopupId (single source of truth).
  // This eliminates the impossible state where open=true but id=null.
  const [kwPopupId, setKwPopupId] = useState<string | null>(null);
  const kwPopupOpen = kwPopupId !== null;

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Ref to save the view BEFORE navigating to 3D, so returnFrom3D
  // can restore it. Uses ref (not state) to avoid extra re-renders
  // and to keep the AppContextType interface unchanged.
  const viewBefore3DRef = useRef<ViewType>('dashboard');

  const openKeywordPopup = useCallback((keywordId: string) => {
    setKwPopupId(keywordId);
  }, []);

  const closeKeywordPopup = useCallback(() => {
    setKwPopupId(null);
  }, []);

  const navigateTo3D = useCallback((modelId: string) => {
    // Save current view before switching — reads activeView at call time
    // (React batching ensures this is the value BEFORE setActiveView('3d'))
    viewBefore3DRef.current = activeView;
    setSelectedModelId(modelId);
    setKwPopupId(null); // close popup
    setActiveView('3d');
  }, [activeView]);

  const returnFrom3D = useCallback(() => {
    setSelectedModelId(null);
    setActiveView(viewBefore3DRef.current);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentCourse,
        setCurrentCourse,
        currentTopic,
        setCurrentTopic,
        activeView,
        setActiveView,
        isSidebarOpen,
        setSidebarOpen,
        // ── Oleada 3-4 ──
        kwPopupOpen,
        kwPopupId,
        openKeywordPopup,
        closeKeywordPopup,
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
