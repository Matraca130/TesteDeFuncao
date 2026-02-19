import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { ApiProvider } from '../lib/api-provider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ApiProvider>
        <Outlet />
      </ApiProvider>
    </AuthProvider>
  );
}
