import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Brain } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard — Wraps content that requires authentication.
 * Shows loading spinner during session restore.
 * If not authenticated, renders fallback (or null).
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-6">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Restaurando sessao...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}
