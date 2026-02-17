import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// ================================================================
// ADMIN CONTEXT — Sessao admin integrada com Supabase Auth
//
// Migracao de ADMIN_PLACEHOLDER:
//   - Agora verifica is_super_admin do AuthContext
//   - Fallback para senha hardcoded se nao tiver auth
//   - Todos os consumidores (useAdmin) continuam funcionando
// ================================================================

// Fallback password para dev/demo sem Supabase Auth
const ADMIN_PASSWORD_FALLBACK = 'admin123';

interface AdminContextType {
  isAdmin: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  sessionStartedAt: Date | null;
  sessionDurationMinutes: number;
}

const noop = () => {};
const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  adminLogin: () => false,
  adminLogout: noop,
  sessionStartedAt: null,
  sessionDurationMinutes: 0,
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdminLocal, setIsAdminLocal] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);

  // Check if user is super_admin from Supabase Auth
  const isSuperAdmin = user?.is_super_admin === true;

  // Combined admin check: Supabase super_admin OR local password login
  const isAdmin = isSuperAdmin || isAdminLocal;

  const adminLogin = useCallback((password: string): boolean => {
    if (isSuperAdmin) {
      setIsAdminLocal(true);
      setSessionStartedAt(new Date());
      return true;
    }
    if (password === ADMIN_PASSWORD_FALLBACK) {
      setIsAdminLocal(true);
      setSessionStartedAt(new Date());
      return true;
    }
    return false;
  }, [isSuperAdmin]);

  const adminLogout = useCallback(() => {
    setIsAdminLocal(false);
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
