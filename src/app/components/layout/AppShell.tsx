// ============================================================
// AXON v4.4 — AppShell (LAYOUT BLOQUEADO)
// ============================================================
// ESTE ARCHIVO ESTA PROTEGIDO. Ningun dev lo modifica.
// Provee: sidebar + topbar + content area.
// Los devs construyen paginas que van DENTRO del <Outlet />.
//
// Uso:
//   <AppShell variant="student" navItems={...}>
//     <Outlet />    ← Tu pagina va aqui
//   </AppShell>
// ============================================================

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronDown, Bell, LogOut, ChevronRight,
  Search, Settings,
} from 'lucide-react';

// ── Types ──
export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  badgeColor?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface AppShellUser {
  name: string;
  avatar_url?: string | null;
  role_label: string;     // "PREMIUM", "Admin", "Professor"
  role_color: string;     // tailwind color class: "text-emerald-400"
}

export interface AppShellCourse {
  id: string;
  name: string;
}

interface AppShellProps {
  variant: 'student' | 'admin' | 'professor';
  sections: NavSection[];
  user: AppShellUser;
  currentCourse?: AppShellCourse | null;
  courses?: AppShellCourse[];
  onCourseChange?: (courseId: string) => void;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

// ── Axon Logo ──
function AxonLogo({ collapsed, variant }: { collapsed: boolean; variant: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
        <span className="text-white text-sm font-black tracking-tighter">A</span>
      </div>
      {!collapsed && (
        <span className="text-sm font-bold text-white tracking-tight">AXON</span>
      )}
    </div>
  );
}

// ── Sidebar Nav Item ──
function SidebarItem({
  item, active, collapsed, onNavigate,
}: {
  item: NavItem; active: boolean; collapsed: boolean;
  onNavigate: (path: string) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.path)}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all relative ${
        active
          ? 'bg-[--axon-sidebar-bg-active] text-[--axon-teal]'
          : 'text-[--axon-sidebar-text] hover:text-[--axon-sidebar-text-hover] hover:bg-[--axon-sidebar-bg-hover]'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[--axon-teal] rounded-r-full" />
      )}
      <Icon size={18} className={active ? 'text-[--axon-teal]' : ''} />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold text-white ${
              item.badgeColor || 'bg-red-500'
            }`}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// ── Main AppShell ──
export default function AppShell({
  variant, sections, user, currentCourse, courses, onCourseChange,
  activePath, onNavigate, onLogout, children,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

  const sidebarW = sidebarCollapsed ? 'w-16' : 'w-60';

  // ── Sidebar Content (shared desktop/mobile) ──
  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-[--axon-sidebar-bg]">
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <AxonLogo collapsed={collapsed} variant={variant} />
        {!collapsed && (
          <button
            onClick={() => { setSidebarCollapsed(true); setMobileSidebarOpen(false); }}
            className="p-1 rounded-lg hover:bg-[--axon-sidebar-bg-hover] text-[--axon-sidebar-text]"
          >
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {!collapsed && section.title && (
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[--axon-sidebar-section-text]">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={activePath === item.path || activePath.startsWith(item.path + '/')}
                  collapsed={collapsed}
                  onNavigate={(path) => {
                    onNavigate(path);
                    setMobileSidebarOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="px-3 py-3 border-t border-white/5 shrink-0">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className={`text-[10px] font-bold ${user.role_color}`}>{user.role_label}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onLogout}
              title="Sair"
              className="p-1.5 rounded-lg hover:bg-[--axon-sidebar-bg-hover] text-[--axon-sidebar-text] hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[--axon-content-bg]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Topbar ── */}
      <header className="h-14 bg-[--axon-topbar-bg] flex items-center px-4 gap-3 shrink-0 z-30">
        {/* Mobile menu button */}
        <button
          onClick={() => { setMobileSidebarOpen(true); setSidebarCollapsed(false); }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[--axon-topbar-text-muted] md:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Desktop: expand sidebar if collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[--axon-topbar-text-muted] hidden md:flex"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Logo in topbar (always visible) */}
        <div className="flex items-center gap-2 md:ml-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center md:hidden">
            <span className="text-white text-[10px] font-black">A</span>
          </div>
          <span className="text-xs font-bold text-white tracking-wide hidden md:block">AXON</span>
        </div>

        {/* Course selector */}
        {currentCourse && courses && courses.length > 0 && (
          <div className="relative ml-2">
            <button
              onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-teal-400">
                  {currentCourse.name.charAt(0)}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[9px] uppercase tracking-wider text-[--axon-topbar-text-muted] leading-none">
                  CURSO ATUAL
                </p>
                <p className="text-xs font-semibold text-[--axon-topbar-text]">
                  {currentCourse.name}
                </p>
              </div>
              <ChevronDown size={12} className="text-[--axon-topbar-text-muted]" />
            </button>

            {courseDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCourseDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-[--axon-topbar-bg] border border-white/10 rounded-xl shadow-xl z-50 py-1.5">
                  {courses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onCourseChange?.(c.id);
                        setCourseDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${
                        c.id === currentCourse.id ? 'text-teal-400 font-semibold' : 'text-[--axon-topbar-text]'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10 text-[--axon-topbar-text-muted] transition-colors relative">
            <Search size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 text-[--axon-topbar-text-muted] transition-colors relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400" />
          </button>
          {/* User avatar (topbar) */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-[--axon-topbar-text] leading-tight">
                {user.name}
              </p>
              <p className={`text-[10px] font-bold ${user.role_color} leading-tight`}>
                {user.role_label}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        <aside className={`hidden md:flex flex-col shrink-0 transition-all duration-200 ${sidebarW}`}>
          {renderSidebarContent(sidebarCollapsed)}
        </aside>

        {/* ── Mobile Sidebar Overlay ── */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 h-full w-60 z-50 md:hidden"
              >
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                {renderSidebarContent(false)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Content Area ── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
