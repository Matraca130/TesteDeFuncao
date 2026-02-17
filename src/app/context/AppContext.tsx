import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Course, Topic, courses } from '@/app/data/courses';

// @refresh reset

// ================================================================
// APP CONTEXT — Estado do aluno e navegacao
//
// ViewTypes incluem os modulos de todos os devs:
//   - dashboard, study, resumos, quiz, flashcards (Devs 1-5)
//   - ai-generate, ai-chat, ai-approval (Dev 6 — Auth & AI)
//   - admin (AdminContext gerencia sessao independente)
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
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(
    courses[0].semesters[0].sections[0].topics[0]
  );
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
