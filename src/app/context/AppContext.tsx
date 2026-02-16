import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Course, Topic, courses } from '@/app/data/courses';

// @refresh reset
export type ViewType = 'home' | 'dashboard' | 'resumos' | 'study-hub' | 'study' | 'flashcards' | 'quiz' | '3d' | 'schedule' | 'organize-study' | 'review-session' | 'study-dashboards' | 'knowledge-heatmap' | 'mastery-dashboard' | 'student-data' | 'admin';

// ════════════════════════════════════════════════════════════════
// 🔑 ADMIN AUTH — PLACEHOLDER (SUBSTITUIR POR AUTH REAL DEPOIS)
// Busque "ADMIN_PLACEHOLDER" no código para encontrar todos os
// pontos que precisam ser atualizados quando implementar Supabase Auth.
// ════════════════════════════════════════════════════════════════
// ADMIN_PLACEHOLDER: Senha hardcoded — trocar por Supabase Auth session
const ADMIN_PASSWORD = 'admin123';

interface AppContextType {
  currentCourse: Course;
  setCurrentCourse: (course: Course) => void;
  currentTopic: Topic | null;
  setCurrentTopic: (topic: Topic) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  // ADMIN_PLACEHOLDER: Admin session state
  isAdmin: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
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
  // ADMIN_PLACEHOLDER defaults
  isAdmin: false,
  adminLogin: () => false,
  adminLogout: noop,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCourse, setCurrentCourse] = useState<Course>(courses[0]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(courses[0].semesters[0].sections[0].topics[0]);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  // ADMIN_PLACEHOLDER: simple boolean session (no persistence)
  const [isAdmin, setIsAdmin] = useState(false);

  const adminLogin = useCallback((password: string): boolean => {
    // ADMIN_PLACEHOLDER: Comparação com senha hardcoded
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  const adminLogout = useCallback(() => {
    // ADMIN_PLACEHOLDER: Limpar sessão admin
    setIsAdmin(false);
    setActiveView('dashboard');
  }, []);

  return (
    <AppContext.Provider value={{
      currentCourse, setCurrentCourse,
      currentTopic, setCurrentTopic,
      activeView, setActiveView,
      isSidebarOpen, setSidebarOpen,
      isAdmin, adminLogin, adminLogout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
