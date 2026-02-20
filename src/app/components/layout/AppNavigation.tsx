// ============================================================
// AppNavigation — Layout shell with sidebar for Axon v4.4
// ============================================================
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Home, Key, Layers, HelpCircle, Play, Rocket,
  Brain, Target, Calendar, BarChart3,
  ChevronLeft, Menu, GraduationCap, BookOpen, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const PROFESSOR_NAV: NavItem[] = [
  { label: 'Keywords', icon: Key, path: '/professor/keywords' },
  { label: 'Flashcards', icon: Layers, path: '/professor/flashcards' },
  { label: 'Quiz', icon: HelpCircle, path: '/professor/quizzes' },
  { label: 'Videos', icon: Play, path: '/professor/videos' },
  { label: 'Content Flow', icon: Rocket, path: '/professor/content-flow' },
];

const STUDENT_NAV: NavItem[] = [
  { label: 'Estudo Inteligente', icon: Brain, path: '/study/smart-study' },
  { label: 'Planos de Estudo', icon: Target, path: '/study/plans' },
  { label: 'Video de Estudo', icon: Play, path: '/study/video/vid-1' },
];

export function AppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isProfessor = location.pathname.startsWith('/professor');

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 h-full transition-all duration-300 flex flex-col bg-[#1e293b] text-white
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        {/* Logo */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '1.25rem' }} className="text-white tracking-tight">
              AXON
            </span>
          )}
        </div>

        <Separator className="bg-white/10" />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          {/* Professor Section */}
          <div className={`px-3 ${collapsed ? 'text-center' : ''}`}>
            {!collapsed && (
              <p className="text-white/40 uppercase tracking-wider mb-2 px-2" style={{ fontSize: '0.625rem' }}>
                Professor
              </p>
            )}
            {PROFESSOR_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors
                    ${isActive ? 'bg-teal-500/20 text-teal-400' : 'text-white/60 hover:text-white hover:bg-white/5'}
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span style={{ fontSize: '0.875rem' }}>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <Separator className="bg-white/10 my-3 mx-3" />

          {/* Student Section */}
          <div className={`px-3 ${collapsed ? 'text-center' : ''}`}>
            {!collapsed && (
              <p className="text-white/40 uppercase tracking-wider mb-2 px-2" style={{ fontSize: '0.625rem' }}>
                Alumno
              </p>
            )}
            {STUDENT_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path.split('/').slice(0, 3).join('/'));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors
                    ${isActive ? 'bg-teal-500/20 text-teal-400' : 'text-white/60 hover:text-white hover:bg-white/5'}
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span style={{ fontSize: '0.875rem' }}>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <Separator className="bg-white/10 my-3 mx-3" />

          {/* Demo Section */}
          <div className={`px-3 ${collapsed ? 'text-center' : ''}`}>
            {!collapsed && (
              <p className="text-white/40 uppercase tracking-wider mb-2 px-2" style={{ fontSize: '0.625rem' }}>
                Demo
              </p>
            )}
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors
                ${location.pathname === '/' ? 'bg-teal-500/20 text-teal-400' : 'text-white/60 hover:text-white hover:bg-white/5'}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Home className="w-4 h-4 shrink-0" />
              {!collapsed && <span style={{ fontSize: '0.875rem' }}>Dashboard</span>}
            </Link>
          </div>
        </ScrollArea>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/10">
          {!collapsed && user && (
            <p className="text-white/50 text-xs truncate px-2 mb-2">
              {user.name || user.email}
            </p>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span style={{ fontSize: '0.875rem' }}>Sair</span>}
          </button>
        </div>

        {/* Collapse button */}
        <div className="p-3 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)} className="text-gray-600">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontFamily: "'Georgia', serif" }} className="text-gray-900">AXON</span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
