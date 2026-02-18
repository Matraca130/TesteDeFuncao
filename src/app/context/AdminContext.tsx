import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// ════════════════════════════════════════════════════════════════
// ADMIN CONTEXT v4.4 — Fully migrated to Supabase Auth
//
// Migration COMPLETE (was ADMIN_PLACEHOLDER with 'admin123'):
//   - isAdmin derived from user.is_super_admin OR membership role
//   - adminLogin checks role, NO hardcoded password
//   - Interface preservada: isAdmin, adminLogin, adminLogout,
//     sessionStartedAt, sessionDurationMinutes
//   - Consumidores (AdminPanel, AdminBanner, Sidebar) no cambian
// ════════════════════════════════════════════════════════════════

interface AdminContextType {
  isAdmin: boolean;
  hasAdminRole: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  sessionStartedAt: Date | null;
  sessionDurationMinutes: number;
}

const noop = () => {};
const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  hasAdminRole: false,
  adminLogin: () => false,
  adminLogout: noop,
  sessionStartedAt: null,
  sessionDurationMinutes: 0,
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, memberships } = useAuth();
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);

  // D8: super_admin is GLOBAL flag on User.is_super_admin
  const isSuperAdmin = user?.is_super_admin === true;

  // D8: institution_admin is per-institution role in Membership
  const isInstitutionAdmin = memberships.some(
    (m) => m.role === 'institution_admin'
  );

  // D8: professor can also access admin features
  const isProfessor = memberships.some(
    (m) => m.role === 'professor'
  );

  // Admin if super_admin, institution_admin, or professor — AND session is active
  const hasAdminRole = isSuperAdmin || isInstitutionAdmin || isProfessor;
  const isAdmin = hasAdminRole && sessionActive;

  const adminLogin = useCallback((password: string): boolean => {
    // With Supabase Auth, the password parameter is vestigial.
    // We check the user's ROLE, not a hardcoded password.
    // Any admin-role user can "activate" their admin session.
    if (hasAdminRole) {
      setSessionActive(true);
      setSessionStartedAt(new Date());
      return true;
    }
    return false;
  }, [hasAdminRole]);

  const adminLogout = useCallback(() => {
    setSessionActive(false);
    setSessionStartedAt(null);
  }, []);

  const sessionDurationMinutes = useMemo(() => {
    if (!sessionStartedAt) return 0;
    return Math.floor((Date.now() - sessionStartedAt.getTime()) / 60000);
  }, [sessionStartedAt]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        hasAdminRole,
        adminLogin,
        adminLogout,
        sessionStartedAt,
        sessionDurationMinutes,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}