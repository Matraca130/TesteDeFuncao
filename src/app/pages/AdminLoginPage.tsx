// ============================================================
// Axon v4.4 — Admin Login/Signup Page
// Supports both login and signup with institution creation
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireGuest } from '../components/guards/RequireGuest';
import { AxonLogo } from '../components/AxonLogo';
import { apiBaseUrl, supabaseAnonKey } from '../lib/config';
import { Loader2, ArrowLeft, ShieldCheck, Building2 } from 'lucide-react';
import { toast } from 'sonner';

function AdminAuthForm() {
  const { login, signup, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const switchMode = () => { setMode(mode === 'login' ? 'signup' : 'login'); clearError(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    if (mode === 'signup') {
      if (!name) { toast.error('Preencha seu nome'); return; }
      if (!institutionName) { toast.error('Preencha o nome da instituicao'); return; }
      if (password.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const success = await login(email, password);
        if (success) { toast.success('Login realizado!'); navigate('/go'); }
      } else {
        const success = await signup(email, password, name);
        if (!success) { setSubmitting(false); return; }
        try {
          const slug = institutionName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
          const { supabase } = await import('../lib/supabase-client');
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (token) {
            const res = await fetch(`${apiBaseUrl}/institutions`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ name: institutionName, slug: slug || `inst-${Date.now()}` }),
            });
            const result = await res.json();
            if (result.success) { toast.success('Conta e instituicao criadas!'); }
            else { toast.success('Conta criada! (Instituicao pode ser configurada depois)'); }
          } else { toast.success('Conta criada!'); }
        } catch (err) { toast.success('Conta criada! Configure sua instituicao no painel.'); }
        navigate('/go');
      }
    } finally { setSubmitting(false); }
  };

  const busy = isLoading || submitting;
  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mb-6"><button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"><ArrowLeft size={16} /> Voltar ao inicio</button></div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <AxonLogo size="lg" />
          <div className="text-center"><h1 className="text-2xl font-bold text-gray-900">Axon Admin</h1>
            <div className="flex items-center gap-1.5 justify-center mt-1"><ShieldCheck size={14} className="text-indigo-500" />
              <p className="text-sm text-gray-500">{mode === 'login' ? 'Entrar na sua conta' : 'Criar conta de administrador'}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          {mode === 'signup' && (<>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" disabled={busy} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5"><span className="flex items-center gap-1.5"><Building2 size={13} className="text-indigo-400" /> Nome da instituicao</span></label>
              <input type="text" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="Ex: Faculdade de Medicina ABC" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" disabled={busy} required />
              <p className="text-[10px] text-gray-400 mt-1">Voce sera o owner desta instituicao</p></div>
          </>)}
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@exemplo.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" disabled={busy} autoComplete="email" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" minLength={6} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" disabled={busy} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={busy} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <><Loader2 size={16} className="animate-spin" /> {mode === 'login' ? 'Entrando...' : 'Criando...'}</> : mode === 'login' ? 'Entrar' : 'Criar Conta e Instituicao'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          {mode === 'login' ? (<>Primeira vez? <button onClick={switchMode} className="text-indigo-600 font-semibold hover:underline">Criar conta</button></>) : (<>Ja tem conta? <button onClick={switchMode} className="text-indigo-600 font-semibold hover:underline">Entrar</button></>)}
        </p>
      </div>
    </div>
  );
}

export function AdminLoginPage() { return <RequireGuest><AdminAuthForm /></RequireGuest>; }
