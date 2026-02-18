// ============================================================
// Axon v4.4 — Root App (Thin Shell)
//
// Provider hierarchy (order matters):
//   AuthProvider → ApiProvider → AuthGuard → AppProvider → AdminProvider → AppShell
//
// All layout components extracted to /components/layout/:
//   AppShell.tsx       — Sidebar + ViewRouter + KeywordPopup overlay
//   ViewRouter.tsx     — Maps activeView → component
//   AuthGateRouter.tsx — Login/Signup gate + BatchVerifier access
// ============================================================

// @refresh reset

// ═══ Contexts (order matters: Auth outermost, then App, Admin) ═══
import { AuthProvider } from '@/app/context/AuthContext';
import { AppProvider } from '@/app/context/AppContext';
import { AdminProvider } from '@/app/context/AdminContext';
import { ApiProvider } from '@/app/lib/api-provider';

// ═══ Auth gate ═══
import { AuthGuard } from '@/app/components/auth/AuthGuard';

// ═══ Layout (extracted) ═══
import { AppShell } from '@/app/components/layout/AppShell';
import { AuthGateRouter } from '@/app/components/layout/AuthGateRouter';

/**
 * Root component — Provider hierarchy (v4.4):
 *   AuthProvider → ApiProvider → AuthGuard → AppProvider → AdminProvider → AppShell
 *
 * ApiProvider is AFTER AuthProvider so useAuth can feed tokens into useApi.
 * AuthGuard gates BEFORE AppProvider — no nav state until authenticated.
 */
export default function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <AuthGuard fallback={<AuthGateRouter />}>
          <AppProvider>
            <AdminProvider>
              <AppShell />
            </AdminProvider>
          </AppProvider>
        </AuthGuard>
      </ApiProvider>
    </AuthProvider>
  );
}
