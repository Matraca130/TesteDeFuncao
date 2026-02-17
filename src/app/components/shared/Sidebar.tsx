import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp, ViewType } from '@/app/context/AppContext';
import { useAdmin } from '@/app/context/AdminContext';
import { useAuth } from '@/app/context/AuthContext';
import { AxonLogo } from '@/app/components/shared/AxonLogo';
import { components } from '@/app/design-system';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Layers,
  Calendar,
  Database,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Home,
  Shield,
  Monitor,
  Sparkles,
  MessageCircle,
  ClipboardCheck,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

const iconMap: Record<string, React.ElementType> = {
  Home,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Layers,
  Calendar,
  Database,
  Settings,
  Users,
  Shield,
  Monitor,
  Sparkles,
  MessageCircle,
  ClipboardCheck,
};

/** Modulos principales — estos son los 3 modulos independientes del proyecto */
const moduleItems: { id: ViewType; label: string; icon: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', description: 'Visao geral' },
  { id: 'study', label: 'Estudar', icon: 'Monitor', description: 'Sessao de estudos' },
  { id: 'resumos', label: 'Resumos', icon: 'BookOpen', description: 'Resumos de estudo' },
  { id: 'quiz', label: 'Quiz', icon: 'GraduationCap', description: 'Testar conhecimento' },
];

/** Items secundarios de navegacion */
const secondaryItems: { id: ViewType; label: string; icon: string }[] = [
  { id: 'flashcards', label: 'Flashcards', icon: 'Layers' },
  { id: 'schedule', label: 'Cronograma', icon: 'Calendar' },
  { id: 'student-data', label: 'Meus Dados', icon: 'Database' },
];

/** Dev 6 — AI section items */
const aiItems: { id: ViewType; label: string; icon: string }[] = [
  { id: 'ai-generate', label: 'Gerar Conteudo', icon: 'Sparkles' },
  { id: 'ai-approval', label: 'Aprovacao IA', icon: 'ClipboardCheck' },
  { id: 'ai-chat', label: 'Chat IA', icon: 'MessageCircle' },
];

export function Sidebar() {
  const { activeView, setActiveView, isSidebarOpen, setSidebarOpen } = useApp();
  const { isAdmin } = useAdmin();
  const { user, logout } = useAuth();

  return (
    <AnimatePresence initial={false}>
      {isSidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: components.sidebar.width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full flex-shrink-0 overflow-hidden"
        >
          <div
            className="h-full flex flex-col"
            style={{
              width: components.sidebar.width,
              backgroundColor: components.sidebar.bgOuter,
            }}
          >
            {/* Logo + collapse */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <AxonLogo size="sm" theme="light" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Recolher sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Modulos principales */}
            <div className="px-3 mb-2">
              <p className={components.sidebar.sectionLabel}>Modulos</p>
            </div>
            <nav className="px-3 space-y-1">
              {moduleItems.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={clsx(
                      components.sidebar.navItem.base,
                      isActive
                        ? components.sidebar.navItem.active
                        : components.sidebar.navItem.inactive
                    )}
                  >
                    <Icon size={18} />
                    <div className="text-left flex-1 min-w-0">
                      <span className="block leading-tight">{item.label}</span>
                      {!isActive && (
                        <span className="block text-[10px] text-gray-500 leading-tight mt-0.5 truncate">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-dot"
                        className="w-1.5 h-1.5 rounded-full bg-sky-400"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Separador */}
            <div className="mx-5 my-4 border-t border-white/[0.06]" />

            {/* Items secundarios */}
            <div className="px-3 mb-2">
              <p className={components.sidebar.sectionLabel}>Ferramentas</p>
            </div>
            <nav className="px-3 space-y-1">
              {secondaryItems.map((item) => {
                const Icon = iconMap[item.icon] || Layers;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={clsx(
                      components.sidebar.navItem.base,
                      isActive
                        ? components.sidebar.navItem.active
                        : components.sidebar.navItem.inactive
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Separador AI */}
            <div className="mx-5 my-4 border-t border-white/[0.06]" />

            {/* Dev 6 — AI Section */}
            <div className="px-3 mb-2">
              <p className={components.sidebar.sectionLabel}>Inteligencia Artificial</p>
            </div>
            <nav className="px-3 space-y-1">
              {aiItems.map((item) => {
                const Icon = iconMap[item.icon] || Sparkles;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={clsx(
                      components.sidebar.navItem.base,
                      isActive
                        ? 'bg-purple-500/20 text-purple-300 font-semibold'
                        : 'text-purple-400/60 hover:text-purple-300 hover:bg-purple-500/10'
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-ai-dot"
                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="mt-auto px-3 pb-4 space-y-1">
              <div className="mx-2 mb-3 border-t border-white/[0.06]" />
              <button
                onClick={() => setActiveView('student-data' as ViewType)}
                className={clsx(
                  components.sidebar.navItem.base,
                  activeView === 'student-data'
                    ? components.sidebar.navItem.active
                    : components.sidebar.navItem.inactive
                )}
              >
                <Settings size={18} />
                <span>Configuracoes</span>
              </button>

              {/* Admin button — reads from AdminContext (independent module) */}
              <button
                onClick={() => setActiveView('admin')}
                className={clsx(
                  components.sidebar.navItem.base,
                  activeView === 'admin'
                    ? 'bg-amber-500/20 text-amber-400 font-semibold'
                    : 'text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/10'
                )}
              >
                <Shield size={18} />
                <span>Administrador</span>
                {isAdmin && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto" title="Sessao ativa" />
                )}
              </button>

              {/* User info + Logout */}
              {user && (
                <div className="mx-2 mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-xs text-gray-300 font-medium truncate" title={user.email}>
                    {user.name || user.email}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                    {user.email}
                  </p>
                  <button
                    onClick={logout}
                    className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    <LogOut size={12} />
                    Sair
                  </button>
                </div>
              )}

              {/* Modulo badge */}
              <div className="mx-2 mt-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                  Modulo Ativo
                </p>
                <p className="text-xs text-sky-400 font-semibold">
                  {activeView === 'admin'
                    ? 'Administrador'
                    : activeView.startsWith('ai-')
                      ? aiItems.find((a) => a.id === activeView)?.label ?? 'IA'
                      : (moduleItems.find((m) => m.id === activeView)?.label ?? 'Dashboard')}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Mini boton flotante para abrir el sidebar cuando esta cerrado */
export function SidebarToggle() {
  const { isSidebarOpen, setSidebarOpen } = useApp();
  if (isSidebarOpen) return null;

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-[#1c1c1e] text-gray-400 hover:text-white border border-white/10 shadow-lg hover:bg-[#2d3e50] transition-colors"
      title="Abrir sidebar"
    >
      <ChevronRight size={18} />
    </button>
  );
}
