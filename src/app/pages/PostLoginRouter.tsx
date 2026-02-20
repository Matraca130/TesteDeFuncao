// ============================================================
// Axon v4.4 — PostLoginRouter
// Redirects authenticated users to the correct dashboard by role:
//   owner → /owner (OwnerDashboard)
//   admin → /admin (AdminShell)
//   professor → /professor
//   student → /study
// ============================================================
import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuth, getRouteForRole } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function PostLoginRouter() {
  const { user, isAuthenticated, isLoading, memberships, currentMembership, selectInstitution } = useAuth();

  // ── PLATFORM OWNER: no membership needed ──
  // The owner is a platform-level role (is_super_admin).
  // They don't need any memberships to access /owner.
  useEffect(() => {
    // Skip: owner routing is handled below, not via selectInstitution
    if (user?.is_super_admin) return;
    if (memberships.length === 1 && !currentMembership) {
      selectInstitution(memberships[0].institution_id);
    }
  }, [memberships, currentMembership, selectInstitution, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
        <Loader2 size={24} className="animate-spin text-teal-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // ── PLATFORM OWNER → /owner (no memberships required) ──
  if (user?.is_super_admin) {
    return <Navigate to="/owner" replace />;
  }

  // ── REGULAR USERS: require memberships ──
  if (memberships.length === 0) {
    return <Navigate to="/" replace />;
  }

  if (currentMembership) {
    const target = getRouteForRole(currentMembership.role);
    return <Navigate to={target} replace />;
  }

  // 1 membership → useEffect above will auto-select
  if (memberships.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
        <Loader2 size={24} className="animate-spin text-teal-500" />
      </div>
    );
  }

  // Multiple memberships → for now, auto-select first one
  // (in repo, this goes to /select-institution)
  if (memberships.length > 1 && !currentMembership) {
    selectInstitution(memberships[0].institution_id);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
        <Loader2 size={24} className="animate-spin text-teal-500" />
      </div>
    );
  }

  return <Navigate to="/" replace />;
}
