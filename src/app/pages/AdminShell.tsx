// ============================================================
// Axon v4.4 — Admin Shell (Sidebar + Content Area)
// Agent 5: FORGE
// UPDATED: Added 'Estudiantes' nav item for student management
// ============================================================

import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Wand2,
  Users,
  CreditCard,
  Shield,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../components/ui/utils';
import { headingStyle, bodyStyle } from '../lib/design-tokens';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="size-4" /> },
  { label: 'Estudiantes', path: '/admin/students', icon: <GraduationCap className="size-4" /> },
  { label: 'Wizard', path: '/admin/wizard', icon: <Wand2 className="size-4" /> },
  { label: 'Miembros', path: '/admin/members', icon: <Users className="size-4" /> },
  { label: 'Planes', path: '/admin/plans', icon: <CreditCard className="size-4" /> },
  { label: 'Permisos', path: '/admin/scopes', icon: <Shield className="size-4" /> },
];

export function AdminShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/' || location.pathname === '/admin';
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50" style={bodyStyle}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed z-50 flex h-full w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo area */}
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500">
            <GraduationCap className="size-5 text-white" />
          </div>
          <span className="text-zinc-900" style={{ ...headingStyle, fontSize: '1.125rem' }}>
            Axon Admin
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive(item.path)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <span className={isActive(item.path) ? 'text-teal-500' : 'text-zinc-400'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-4 py-3">
          <p className="text-xs text-zinc-400">Axon v4.4 — Admin</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-xs text-teal-700">CM</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
