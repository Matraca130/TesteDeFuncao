// ============================================================
// Axon v4.4 — RequireGuest Guard
// Redirects authenticated users away from login/signup pages
// ============================================================
import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: ReactNode;
}

export function RequireGuest({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  // While loading, show the page (don't flash redirect)
  if (isLoading) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    console.log('[Router] RequireGuest: already authenticated, redirecting to /go');
    return <Navigate to="/go" replace />;
  }

  return <>{children}</>;
}
