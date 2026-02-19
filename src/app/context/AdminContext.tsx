// ============================================================
// Axon v4.4 — Admin Context (Dev 3)
// Manages admin-level state (selected institution, admin data)
// ============================================================
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AdminContextType {
  activeSection: string;
  setActiveSection: (section: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('[AdminContext] useAdmin must be used within AdminProvider');
  }
  return ctx;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const value: AdminContextType = {
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
