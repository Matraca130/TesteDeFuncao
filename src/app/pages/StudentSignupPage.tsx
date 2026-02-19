// ============================================================
// Axon v4.4 — Student Signup Page (/i/:slug/signup)
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireGuest } from '../components/guards/RequireGuest';
import { apiBaseUrl, supabaseAnonKey } from '../lib/config';
import type { Institution, InstitutionBySlugResponse } from '../types/auth';
import { Loader2, ArrowLeft, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

function StudentSignupForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signup, error, clearError, isLoading } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loadingInst, setLoadingInst] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/institutions/by-slug/${slug}`, { headers: { Authorization: `Bearer ${supabaseAnonKey}` } });
        const result: InstitutionBySlugResponse = await res.json();
        if (result.success && result.data) setInstitution(result.data);
      } catch {} finally { setLoadingInst(false); }
    })();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    if (!name || !email || !password) { toast.error('Preencha todos os campos'); return; }
    if (password !== confirmPassword) { toast.error('As senhas nao coincidem'); return; }
    if (password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres'); return; }
    if (!institution?.id) { toast.error('Instituicao nao encontrada'); return; }
    const success = await signup(email, password, name, institution.id);
    if (success) { toast.success('Conta criada!'); navigate('/go'); }
  };

  if (loadingInst) return <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]"><Loader2 size={24} className="animate-spin text-teal-500" /></div>;

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mb-6"><button onClick={() => navigate(`/i/${slug}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Voltar</button></div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center"><GraduationCap size={22} className="text-white" /></div>
          <div className="text-center"><h1 className="text-2xl font-bold text-gray-900">{institution?.name || 'Criar Conta'}</h1><p className="text-sm text-gray-500 mt-1">Registre-se como aluno</p></div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" disabled={isLoading} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aluno@exemplo.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" disabled={isLoading} autoComplete="email" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" disabled={isLoading} autoComplete="new-password" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" disabled={isLoading} autoComplete="new-password" /></div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : 'Criar Conta'}</button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">Ja tem conta? <button onClick={() => navigate(`/i/${slug}/login`)} className="text-amber-600 font-semibold hover:underline">Entrar</button></p>
      </div>
    </div>
  );
}

export function StudentSignupPage() { return <RequireGuest><StudentSignupForm /></RequireGuest>; }
