// ============================================================
// Axon v4.4 — RequireRole Guard
// Redirects users without the required role
// ============================================================
import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import type { MembershipRole } from '../../types/auth';

interface Props {
  roles: MembershipRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const { isAuthenticated, currentMembership, memberships } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // No membership selected -> redirect to selection
  if (!currentMembership) {
    if (memberships.length === 0) {
      return <Navigate to="/no-institution" replace />;
    }
    return <Navigate to="/select-institution" replace />;
  }

  // Verify role matches
  if (!roles.includes(currentMembership.role)) {
    console.log(
      `[Router] RequireRole: user has role '${currentMembership.role}', needs [${roles}]. Redirecting to /go`
    );
    return <Navigate to="/go" replace />;
  }

  return <>{children}</>;
}
