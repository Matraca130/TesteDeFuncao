// ============================================================
// Axon v4.4 — App Entry Point
// Provider nesting order: Auth -> Admin -> App -> Api -> Router
// ============================================================
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';

// Providers (nesting order matters — see LOGIN-CONTRACT R7)
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { AppProvider } from './context/AppContext';
import { ApiProvider } from './lib/api-provider';

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <AppProvider>
          <ApiProvider>
            <RouterProvider router={router} />
            <Toaster position="bottom-right" richColors closeButton />
          </ApiProvider>
        </AppProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
