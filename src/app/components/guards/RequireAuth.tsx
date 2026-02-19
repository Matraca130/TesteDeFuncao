// ============================================================
// Axon v4.4 — RequireAuth Guard
// Redirects unauthenticated users to landing page
// ============================================================
import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">A</span>
          </div>
          <Loader2 size={20} className="animate-spin text-teal-500" />
          <p className="text-sm text-gray-500">Verificando sessao...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[Router] RequireAuth: not authenticated, redirecting to /');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
