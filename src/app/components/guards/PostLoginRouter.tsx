// ============================================================
// Axon v4.4 — PostLoginRouter
// Redirects authenticated users to the correct dashboard by role.
// UPDATED: checks user.is_super_admin FIRST → /owner (no memberships needed)
// ============================================================
import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { getRouteForRole } from '../../../types/auth';
import { Loader2 } from 'lucide-react';

export function PostLoginRouter() {
  const { user, isAuthenticated, isLoading, memberships, currentMembership, selectInstitution } =
    useAuth();

  // ── PLATFORM OWNER: no membership needed ──
  // Skip auto-select for owners; they go to /owner directly.
  useEffect(() => {
    if (user?.is_super_admin) return;
    if (memberships.length === 1 && !currentMembership) {
      console.log('[Router] PostLoginRouter: auto-selecting single membership');
      selectInstitution(memberships[0].institution_id);
    }
  }, [memberships, currentMembership, selectInstitution, user]);

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

  // ── PLATFORM OWNER → /owner (no memberships required) ──
  if (user?.is_super_admin) {
    console.log('[Router] PostLoginRouter: is_super_admin=true, redirecting to /owner');
    return <Navigate to="/owner" replace />;
  }

  // ── REGULAR USERS: membership-based routing ──

  // 0 memberships -> no institution
  if (memberships.length === 0) {
    console.log('[Router] PostLoginRouter: 0 memberships, redirecting to /no-institution');
    return <Navigate to="/no-institution" replace />;
  }

  // If membership is selected -> redirect by role
  if (currentMembership) {
    const target = getRouteForRole(currentMembership.role);
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
