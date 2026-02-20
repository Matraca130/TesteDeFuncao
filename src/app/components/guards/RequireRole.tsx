// ============================================================
// Axon v4.4 — RequireRole Guard
// Redirects users without the required role
// FIX: useNavigate + useEffect (React Router v7 compatible)
// ============================================================
import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import type { MembershipRole } from '../../../types/auth';

interface Props {
  roles: MembershipRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const { isAuthenticated, currentMembership, memberships, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    if (!isAuthenticated) {
      console.log('[Router] RequireRole: not authenticated, redirecting to /');
      hasNavigated.current = true;
      navigate('/', { replace: true });
      return;
    }

    // No membership selected -> redirect to selection
    if (!currentMembership) {
      hasNavigated.current = true;
      if (memberships.length === 0) {
        navigate('/no-institution', { replace: true });
      } else {
        navigate('/select-institution', { replace: true });
      }
      return;
    }

    // Verify role matches
    if (!roles.includes(currentMembership.role)) {
      console.log(
        `[Router] RequireRole: user has role '${currentMembership.role}', needs [${roles}]. Redirecting to /go`
      );
      hasNavigated.current = true;
      navigate('/go', { replace: true });
    }
  }, [isAuthenticated, currentMembership, memberships, roles, isLoading, navigate]);

  if (isLoading) {
    return null; // Or a spinner
  }

  if (!isAuthenticated || !currentMembership || !roles.includes(currentMembership.role)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
