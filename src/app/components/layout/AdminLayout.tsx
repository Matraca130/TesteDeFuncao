// ============================================================
// Axon v4.4 — Admin Layout
// Protected layout for admin routes (owner, admin, professor)
// ============================================================
import { Outlet } from 'react-router';
import { RequireAuth } from '../guards/RequireAuth';
import { RequireRole } from '../guards/RequireRole';

export function AdminLayout() {
  return (
    <RequireAuth>
      <RequireRole roles={['owner', 'admin', 'professor']}>
        <Outlet />
      </RequireRole>
    </RequireAuth>
  );
}
