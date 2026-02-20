// ============================================================
// Axon v4.4 — PostLoginRouter
// Redirects authenticated users to the correct dashboard by role.
// FIX: Uses useNavigate() + useEffect() instead of <Navigate>
// to prevent infinite re-render loop in React Router v7.
// ============================================================
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { getRouteForRole } from '../../../types/auth';
import { Loader2 } from 'lucide-react';

export function PostLoginRouter() {
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const { user, isAuthenticated, isLoading, memberships, currentMembership, selectInstitution } =
    useAuth();

  // ── Auto-select single membership (skip for platform owners) ──
  useEffect(() => {
    if (user?.is_super_admin) return;
    if (memberships.length === 1 && !currentMembership) {
      console.log('[Router] PostLoginRouter: auto-selecting single membership');
      selectInstitution(memberships[0].institution_id);
    }
  }, [memberships, currentMembership, selectInstitution, user]);

  // ── Navigate by role (runs in useEffect to satisfy React Router v7) ──
  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    if (!isAuthenticated) {
      hasNavigated.current = true;
      navigate('/', { replace: true });
      return;
    }

    // Platform owner → /owner (no memberships needed)
    if (user?.is_super_admin) {
      console.log('[Router] PostLoginRouter: is_super_admin=true, redirecting to /owner');
      hasNavigated.current = true;
      navigate('/owner', { replace: true });
      return;
    }

    // 0 memberships → no institution
    if (memberships.length === 0) {
      console.log('[Router] PostLoginRouter: 0 memberships, redirecting to /no-institution');
      hasNavigated.current = true;
      navigate('/no-institution', { replace: true });
      return;
    }

    // Membership selected → redirect by role
    if (currentMembership) {
      const target = getRouteForRole(currentMembership.role);
      console.log(
        `[Router] PostLoginRouter: role='${currentMembership.role}', redirecting to ${target}`
      );
      hasNavigated.current = true;
      navigate(target, { replace: true });
      return;
    }

    // N memberships and none selected → choose
    if (memberships.length > 1) {
      console.log(
        `[Router] PostLoginRouter: ${memberships.length} memberships, redirecting to /select-institution`
      );
      hasNavigated.current = true;
      navigate('/select-institution', { replace: true });
      return;
    }

    // memberships.length === 1 && !currentMembership → auto-select useEffect will handle it
  }, [isLoading, isAuthenticated, user, memberships, currentMembership, navigate]);

  // Always render spinner while deciding
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-teal-500" />
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}
