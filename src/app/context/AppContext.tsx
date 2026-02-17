import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Course, Topic, courses } from '@/app/data/courses';

// @refresh reset
export type ViewType = 'home' | 'dashboard' | 'resumos' | 'study-hub' | 'study' | 'flashcards' | 'quiz' | '3d' | 'schedule' | 'organize-study' | 'review-session' | 'study-dashboards' | 'knowledge-heatmap' | 'mastery-dashboard' | 'student-data' | 'admin';

// ════════════════════════════════════════════════════════════════
// APP CONTEXT — Estado do aluno e navegacao
//
// Este contexto gerencia APENAS:
//   - Curso e topico selecionado pelo aluno
//   - View ativa (routing manual por ViewType)
//   - Estado do sidebar
//
// A sessao admin foi extraida para AdminContext.tsx
// (nucleo independente). Busque "useAdmin" nos componentes
// que precisam do estado admin.
// ════════════════════════════════════════════════════════════════

interface AppContextType {
  currentCourse: Course;
  setCurrentCourse: (course: Course) => void;
  currentTopic: Topic | null;
  setCurrentTopic: (topic: Topic) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
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
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCourse, setCurrentCourse] = useState<Course>(courses[0]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(courses[0].semesters[0].sections[0].topics[0]);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AppContext.Provider value={{
      currentCourse, setCurrentCourse,
      currentTopic, setCurrentTopic,
      activeView, setActiveView,
      isSidebarOpen, setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
