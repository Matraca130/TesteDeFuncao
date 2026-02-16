import React from 'react';
// @refresh reset
import { AppProvider, useApp } from '@/app/context/AppContext';
import { StudentDataProvider } from '@/app/context/StudentDataContext';
import { DashboardView } from '@/app/components/content/DashboardView';
import { ResumosView } from '@/app/components/content/ResumosView';
import { AdminPanel, AdminLoginGate } from '@/app/components/content/AdminPanel';
import { Sidebar, SidebarToggle } from '@/app/components/shared/Sidebar';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Mapa de vistas por módulo.
 * Cuando Programador B/C entreguen sus módulos, solo hay que:
 * 1. Reemplazar el import del placeholder por el real
 * 2. El resto del routing funciona igual
 */
function ViewRouter() {
  const { activeView, isAdmin } = useApp();

  const renderView = () => {
    switch (activeView) {
      case 'resumos':
        return <ResumosView key="resumos" />;
      case 'admin':
        // ADMIN_PLACEHOLDER: Si no está autenticado, muestra login; si sí, muestra panel
        return isAdmin ? <AdminPanel key="admin" /> : <AdminLoginGate key="admin-login" />;
      case 'quiz':
        return <div key="quiz" className="h-full flex items-center justify-center bg-[#f5f2ea] text-gray-400 text-sm">Módulo Quiz — em desenvolvimento em outra instância</div>;
      case 'dashboard':
      default:
        return <DashboardView key="dashboard" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeView + (activeView === 'admin' ? (isAdmin ? '-auth' : '-login') : '')}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="h-full w-full min-w-0"
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <Sidebar />
      <SidebarToggle />
      <main className="flex-1 min-w-0 h-full overflow-hidden">
        <ViewRouter />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <StudentDataProvider>
        <AppShell />
      </StudentDataProvider>
    </AppProvider>
  );
}
