// ============================================================
// Axon v4.4 — Root App Component
// ============================================================
// Provider hierarchy:
//   AuthProvider → ApiProvider → RouterProvider
//
// AuthProvider MUST wrap ApiProvider because ApiProvider calls
// useAuth() to get the access token for API requests.
// ============================================================
import { Toaster } from 'sonner';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ApiProvider } from './lib/api-provider';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors closeButton />
      </ApiProvider>
    </AuthProvider>
  );
}
