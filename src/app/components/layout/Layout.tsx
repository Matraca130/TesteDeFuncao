import React from 'react';
// @refresh reset
import { useApp } from '@/app/context/AppContext';
import { Sidebar } from '@/app/components/layout/Sidebar';
import { TopicSidebar } from '@/app/components/layout/TopicSidebar';
import { CourseSwitcher } from '@/app/components/layout/CourseSwitcher';
import { AxonLogo } from '@/app/components/shared/AxonLogo';
import { WelcomeView } from '@/app/components/content/WelcomeView';
import { DashboardView } from '@/app/components/content/DashboardView';
import { StudyHubView } from '@/app/components/content/StudyHubView';
import { StudyView } from '@/app/components/content/StudyView';
import { FlashcardView } from '@/app/components/content/FlashcardView';
import { ThreeDView } from '@/app/components/content/ThreeDView';
import { QuizView } from '@/app/components/content/QuizView';
import { ScheduleView } from '@/app/components/content/schedule';
import { StudyOrganizerWizard } from '@/app/components/content/StudyOrganizerWizard';
import { ReviewSessionView } from '@/app/components/content/ReviewSessionView';
import { StudyDashboardsView } from '@/app/components/content/StudyDashboardsView';
import { KnowledgeHeatmapView } from '@/app/components/content/KnowledgeHeatmapView';
import { MasteryDashboardView } from '@/app/components/content/MasteryDashboardView';
import { StudentDataPanel } from '@/app/components/content/StudentDataPanel';
import { QuizAdminView } from '@/app/components/admin/QuizAdminView';
import { FlashcardAdminView } from '@/app/components/admin/FlashcardAdminView';
import { UserProfileDropdown } from '@/app/components/layout/UserProfileDropdown';
import { AxonAIAssistant } from '@/app/components/ai/AxonAIAssistant';
import { components, animation } from '@/app/design-system';
import { motion } from 'motion/react';
import { Menu, Sparkles } from 'lucide-react';

export function Layout() {
  const { activeView, setActiveView, isSidebarOpen, setSidebarOpen, isStudySessionActive } = useApp();
  const [isAIOpen, setAIOpen] = React.useState(false);

  const showTopicSidebar = (activeView === 'study-hub' || activeView === 'study') && !isStudySessionActive;

  const renderContent = () => {
    switch (activeView) {
      case 'home': return <WelcomeView />;
      case 'dashboard': return <DashboardView />;
      case 'study-hub': return <StudyHubView />;
      case 'study': return <StudyView />;
      case 'flashcards': return <FlashcardView />;
      case '3d': return <ThreeDView />;
      case 'quiz': return <QuizView />;
      case 'schedule': return <ScheduleView />;
      case 'organize-study': return <StudyOrganizerWizard />;
      case 'review-session': return <ReviewSessionView />;
      case 'study-dashboards': return <StudyDashboardsView />;
      case 'knowledge-heatmap': return <KnowledgeHeatmapView />;
      case 'mastery-dashboard': return <MasteryDashboardView />;
      case 'student-data': return <StudentDataPanel />;
      case 'admin': return <QuizAdminView />;
      case 'flashcard-admin': return <FlashcardAdminView />;
      default: return <WelcomeView />;
    };
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Navigation Bar */}
        <header className={`${components.header.height} ${components.header.bg} ${components.header.border} flex items-center justify-between px-[14px] z-20 shrink-0 py-[2px] m-[0px]`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={`${components.header.menuBtn} hover:text-white transition-all duration-200`}
              title={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              <Menu size={20} />
            </button>
            
            {/* Logo Area - Click to Home */}
            <button 
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2.5 mr-4 hover:opacity-80 transition-opacity"
            >
              <AxonLogo size="sm" theme="light" />
            </button>

            {/* Course Switcher */}
            <CourseSwitcher />
          </div>

          {/* Right side header actions */}
          <div className="flex items-center gap-1.5">
            {/* AI button */}
            
            <UserProfileDropdown />
          </div>
        </header>

        {/* Content Area — sidebar + main side by side when on study views */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Permanent Topic Sidebar */}
          {showTopicSidebar && <TopicSidebar />}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto relative min-w-0">
            <motion.div
              key={activeView}
              initial={animation.pageTransition.initial}
              animate={animation.pageTransition.animate}
              transition={{ duration: animation.pageTransition.duration }}
              className="h-full w-full"
            >
              {renderContent()}
            </motion.div>
          </main>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <AxonAIAssistant isOpen={isAIOpen} onClose={() => setAIOpen(false)} />
    </div>
  );
}