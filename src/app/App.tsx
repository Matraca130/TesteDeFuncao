// ============================================================
// Axon v4.4 — Root App Component — Agent 7 (NEXUS)
// ============================================================
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </ErrorBoundary>
  );
}