// ============================================================
// Axon v4.4 — Student Signup Page (FIXED: uses config.ts)
// Registration form for students within institution context
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireGuest } from '../components/guards/RequireGuest';
import { AxonLogo } from '../components/AxonLogo';
import { apiBaseUrl, supabaseAnonKey } from '../lib/config';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

function StudentSignupForm() {
  const { slug } = useParams<{ slug: string }>();
  const { signup, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [loadingInst, setLoadingInst] = useState(true);

  useEffect(() => {
    const fetchInst = async () => {
      if (!slug) return;
      try {
        const res = await fetch(`${apiBaseUrl}/institutions/by-slug/${slug}`, {
          headers: { Authorization: `Bearer ${supabaseAnonKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          const inst = data.data || data.institution;
          setInstitutionName(inst?.name || slug);
          setInstitutionId(inst?.id || '');
        }
      } catch {
        // silently fail
      } finally {
        setLoadingInst(false);
      }
    };
    fetchInst();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    const success = await signup(email, password, name, institutionId || undefined);
    if (success) {
      toast.success('Conta criada com sucesso!');
      navigate('/go');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mb-6">
        <button
          onClick={() => navigate(`/i/${slug}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <AxonLogo size="lg" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
            <div className="flex items-center gap-1.5 justify-center mt-1">
              <UserPlus size={14} className="text-indigo-500" />
              <p className="text-sm text-gray-500">
                {loadingInst ? 'Carregando...' : institutionName || slug}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aluno@exemplo.com"
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
              placeholder="Minimo 6 caracteres"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              disabled={isLoading}
              autoComplete="new-password"
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
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate(`/i/${slug}/login`)}
              className="text-sm text-teal-600 hover:underline"
            >
              Ja tem conta? Entre aqui
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StudentSignupPage() {
  return (
    <RequireGuest>
      <StudentSignupForm />
    </RequireGuest>
  );
}
