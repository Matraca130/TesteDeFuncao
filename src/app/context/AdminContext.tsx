import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// ════════════════════════════════════════════════════════════════
// ADMIN CONTEXT — Nucleo independiente de sessao admin
//
// Este contexto e AUTONOMO: nao importa nem conhece AppContext.
// Gerencia apenas autenticacao e metadata da sessao admin.
//
// Busque "ADMIN_PLACEHOLDER" para encontrar todos os pontos
// que precisam ser atualizados quando implementar Supabase Auth.
//
// Migracao para Supabase Auth:
//   1. Trocar ADMIN_PASSWORD por verificacao de role via Supabase
//   2. Usar session tokens em vez de boolean
//   3. Todos os consumidores (useAdmin) continuam funcionando
//      — so este arquivo muda.
// ════════════════════════════════════════════════════════════════

// ADMIN_PLACEHOLDER: Senha hardcoded — trocar por Supabase Auth session
const ADMIN_PASSWORD = 'admin123';

interface AdminContextType {
  /** Se o admin esta autenticado */
  isAdmin: boolean;
  /** Tenta login com senha. Retorna true se sucesso. */
  adminLogin: (password: string) => boolean;
  /** Encerra sessao admin (so limpa estado admin, nao navega) */
  adminLogout: () => void;
  /** Quando a sessao admin comecou (null se nao logado) */
  sessionStartedAt: Date | null;
  /** Minutos desde o login (0 se nao logado) */
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
  // ADMIN_PLACEHOLDER: simple boolean session (no persistence)
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);

  const adminLogin = useCallback((password: string): boolean => {
    // ADMIN_PLACEHOLDER: Comparacao com senha hardcoded
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setSessionStartedAt(new Date());
      return true;
    }
    return false;
  }, []);

  const adminLogout = useCallback(() => {
    // ADMIN_PLACEHOLDER: Limpar sessao admin
    // NOTA: Este logout NAO navega — o componente consumidor
    // decide para onde ir (ex: setActiveView('dashboard') via AppContext)
    setIsAdmin(false);
    setSessionStartedAt(null);
  }, []);

  const sessionDurationMinutes = useMemo(() => {
    if (!sessionStartedAt) return 0;
    return Math.floor((Date.now() - sessionStartedAt.getTime()) / 60000);
  }, [sessionStartedAt]);

  return (
    <AdminContext.Provider value={{
      isAdmin, adminLogin, adminLogout,
      sessionStartedAt, sessionDurationMinutes,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() { return useContext(AdminContext); }
