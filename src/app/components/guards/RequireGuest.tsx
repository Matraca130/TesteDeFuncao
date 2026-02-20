// ============================================================
// Axon v4.4 — RequireGuest Guard
// Redirects authenticated users away from login/signup pages
// FIX: useNavigate + useEffect (React Router v7 compatible)
// ============================================================
import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: ReactNode;
}

export function RequireGuest({ children }: Props) {
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;
    if (isAuthenticated) {
      console.log('[Router] RequireGuest: already authenticated, redirecting to /go');
      hasNavigated.current = true;
      navigate('/go', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // While loading or already authenticated, show children (no flash)
  // The useEffect will handle the redirect
  if (isLoading || !isAuthenticated) {
    return <>{children}</>;
  }

  // Show nothing briefly while the useEffect redirect fires
  return null;
}
