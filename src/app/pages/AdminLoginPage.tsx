// ============================================================
// Axon v4.4 — Admin Login Page (Owner + Admin shared login)
// After login, PostLoginRouter redirects by role:
//   owner → /owner (OwnerDashboard)
//   admin → /admin (AdminShell)
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth, getRouteForRole } from '../context/AuthContext';
import { AxonLogo } from '../components/AxonLogo';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, login, signup, isLoading, error, clearError, isAuthenticated, memberships, selectInstitution, currentMembership } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect
  // ── PLATFORM OWNER: redirect to /owner (no memberships needed) ──
  if (isAuthenticated && user?.is_super_admin) {
    navigate('/owner', { replace: true });
    return null;
  }
  // ── REGULAR USERS: redirect by membership role ──
  if (isAuthenticated && memberships.length > 0) {
    // Auto-select first membership if none selected
    if (!currentMembership && memberships.length === 1) {
      selectInstitution(memberships[0].institution_id);
    }
    if (currentMembership) {
      const target = getRouteForRole(currentMembership.role);
      navigate(target, { replace: true });
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    let success: boolean;
    if (isSignup) {
      success = await signup(email, password, name);
    } else {
      success = await login(email, password);
    }

    if (success) {
      // Navigate to post-login router which handles role-based redirect
      navigate('/go', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <AxonLogo size="lg" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              {isSignup ? 'Crear Cuenta' : 'Iniciar Sesion'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isSignup ? 'Registrate como dueno o administrador' : 'Entra como dueno o administrador'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="tu@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Contrasena</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                placeholder="Tu contrasena"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-2.5"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isSignup ? (
              'Crear Cuenta'
            ) : (
              'Iniciar Sesion'
            )}
          </Button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="text-center mt-6">
          <button
            onClick={() => { setIsSignup(!isSignup); clearError(); }}
            className="text-xs text-gray-500 hover:text-teal-600 transition-colors"
          >
            {isSignup ? 'Ya tienes cuenta? Iniciar sesion' : 'No tienes cuenta? Registrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
