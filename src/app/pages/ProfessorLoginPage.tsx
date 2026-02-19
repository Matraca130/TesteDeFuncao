// ============================================================
// Axon v4.4 — Professor Login Page (Dev 5)
// Login form for professor role
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireGuest } from '../components/guards/RequireGuest';
import { AxonLogo } from '../components/AxonLogo';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

function ProfessorLoginForm() {
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast.success('Login realizado com sucesso!');
      navigate('/go');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao inicio
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <AxonLogo size="lg" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Axon Professor</h1>
            <div className="flex items-center gap-1.5 justify-center mt-1">
              <BookOpen size={14} className="text-teal-500" />
              <p className="text-sm text-gray-500">Portal do professor</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="professor@exemplo.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Acesse com sua conta de professor para gerenciar conteudo.
        </p>
      </div>
    </div>
  );
}

export function ProfessorLoginPage() {
  return (
    <RequireGuest>
      <ProfessorLoginForm />
    </RequireGuest>
  );
}
