// ============================================================
// Axon v4.4 — Root App Component — Agent 6 PRISM
// FIX P1: Wrapped with required context providers
//
// Provider chain (outermost → innermost):
//   AppProvider    → theme, locale (no dependencies)
//   AuthProvider   → Supabase auth session, login/signup/logout
//   ApiProvider    → fetch wrapper (uses useAuth().accessToken)
//   RouterProvider → all routes rendered via createBrowserRouter
//
// NOT wrapped globally (by design):
//   StudentDataProvider — heavy, auto-fetches + seeds. Scope to /study/*.
//   AdminProvider       — AdminShell manages own state. Scope to /admin/*.
// ============================================================
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ApiProvider } from './lib/api-provider';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <ApiProvider>
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
          <Toaster position="top-center" richColors closeButton />
        </ApiProvider>
      </AuthProvider>
    </AppProvider>
  );
}
