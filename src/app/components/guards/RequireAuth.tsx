// ============================================================
// Axon v4.4 — RequireAuth Guard
// Redirects unauthenticated users to landing page
// FIX: useNavigate + useEffect (React Router v7 compatible)
// ============================================================
import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;
    if (!isAuthenticated) {
      console.log('[Router] RequireAuth: not authenticated, redirecting to /');
      hasNavigated.current = true;
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

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
    // Will redirect via useEffect, show nothing briefly
    return null;
  }

  return <>{children}</>;
}
