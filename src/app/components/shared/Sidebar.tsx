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
  ChevronLeft,
  ChevronRight,
  Monitor,
  Shield,
  Sparkles,
  MessageCircle,
  FileCheck,
  LogOut,
  User,
  Zap,
  Box,
} from 'lucide-react';
import clsx from 'clsx';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, BookOpen, GraduationCap, Layers, Calendar, Database,
  Settings, Monitor, Shield, Sparkles, MessageCircle, FileCheck, LogOut, User, Zap, Box,
};

const moduleItems: { id: ViewType; label: string; icon: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', description: 'Visao geral' },
  { id: 'study', label: 'Estudar', icon: 'Monitor', description: 'Sessao de estudos' },
  { id: 'resumos', label: 'Resumos', icon: 'BookOpen', description: 'Resumos de estudo' },
  { id: 'quiz', label: 'Quiz', icon: 'GraduationCap', description: 'Testar conhecimento' },
  { id: '3d', label: 'Visor 3D', icon: 'Box', description: 'Modelos anatomicos' },
];

const aiItems: { id: ViewType; label: string; icon: string }[] = [
  { id: 'ai-generate', label: 'Gerar Conteudo AI', icon: 'Sparkles' },
  { id: 'ai-chat', label: 'Chat com Axon AI', icon: 'MessageCircle' },
  { id: 'ai-approval', label: 'Aprovar Conteudo', icon: 'FileCheck' },
];

const secondaryItems: { id: ViewType; label: string; icon: string }[] = [
  { id: 'flashcards', label: 'Flashcards', icon: 'Layers' },
  { id: 'schedule', label: 'Cronograma', icon: 'Calendar' },
  { id: 'student-data', label: 'Meus Dados', icon: 'Database' },
];

export function Sidebar() {
  const { activeView, setActiveView, isSidebarOpen, setSidebarOpen } = useApp();
  const { isAdmin } = useAdmin();
  const { user, logout, isAuthenticated } = useAuth();

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
              <AxonLogo size="sm" theme="dark" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Recolher sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Modulos principais */}
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

            {/* AI Section (Dev 6) */}
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
                        ? 'bg-purple-500/15 text-purple-400 font-semibold'
                        : 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/[0.05]'
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-dot"
                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Separador */}
            <div className="mx-5 my-4 border-t border-white/[0.06]" />

            {/* Ferramentas */}
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

            {/* Footer */}
            <div className="mt-auto px-3 pb-4 space-y-1">
              <div className="mx-2 mb-3 border-t border-white/[0.06]" />

              {/* Admin */}
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

              {/* Batch Verify */}
              <button
                onClick={() => setActiveView('batch-verify')}
                className={clsx(
                  components.sidebar.navItem.base,
                  activeView === 'batch-verify'
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/10'
                )}
              >
                <Zap size={18} />
                <span>Batch Verify</span>
              </button>

              {/* User info + Logout */}
              {isAuthenticated && user && (
                <div className="mx-2 mt-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200 font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut size={14} />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}

              {/* Modulo badge */}
              <div className="mx-2 mt-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                  Modulo Ativo
                </p>
                <p className="text-xs text-sky-400 font-semibold">
                  {activeView === 'admin' ? 'Administrador' :
                   activeView.startsWith('ai-') ? 'Axon AI' :
                   (moduleItems.find((m) => m.id === activeView)?.label ?? 'Dashboard')}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

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
