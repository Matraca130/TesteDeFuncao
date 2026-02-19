// ============================================================
// Axon v4.4 — PostLoginRouter
// Redirects authenticated users to the correct dashboard by role
// ============================================================
import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import type { MembershipRole } from '../../types/auth';
import { Loader2 } from 'lucide-react';

function routeByRole(role: MembershipRole): string {
  switch (role) {
    case 'owner':
      return '/admin';
    case 'admin':
      return '/admin';
    case 'professor':
      return '/professor';
    case 'student':
      return '/study';
    default:
      return '/';
  }
}

export function PostLoginRouter() {
  const { isAuthenticated, isLoading, memberships, currentMembership, selectInstitution } =
    useAuth();

  // Auto-select if exactly 1 membership and none selected
  useEffect(() => {
    if (memberships.length === 1 && !currentMembership) {
      console.log('[Router] PostLoginRouter: auto-selecting single membership');
      selectInstitution(memberships[0].institution_id);
    }
  }, [memberships, currentMembership, selectInstitution]);

  // Still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-teal-500" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 0 memberships -> no institution
  if (memberships.length === 0) {
    console.log('[Router] PostLoginRouter: 0 memberships, redirecting to /no-institution');
    return <Navigate to="/no-institution" replace />;
  }

  // If membership is selected -> redirect by role
  if (currentMembership) {
    const target = routeByRole(currentMembership.role);
    console.log(
      `[Router] PostLoginRouter: role='${currentMembership.role}', redirecting to ${target}`
    );
    return <Navigate to={target} replace />;
  }

  // 1 membership -> useEffect above will auto-select, show spinner while processing
  if (memberships.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
        <Loader2 size={24} className="animate-spin text-teal-500" />
      </div>
    );
  }

  // N memberships and none selected -> choose
  console.log(
    `[Router] PostLoginRouter: ${memberships.length} memberships, redirecting to /select-institution`
  );
  return <Navigate to="/select-institution" replace />;
}
