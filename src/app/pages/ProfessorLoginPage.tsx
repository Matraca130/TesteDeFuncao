// ============================================================
// Axon v4.4 — Professor Login/Signup Page
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { RequireGuest } from '../components/guards/RequireGuest';
import { AxonLogo } from '../components/AxonLogo';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

function ProfessorAuthForm() {
  const { login, signup, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const switchMode = () => { setMode(mode === 'login' ? 'signup' : 'login'); clearError(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    if (mode === 'signup' && !name) { toast.error('Preencha seu nome'); return; }
    if (mode === 'signup' && password.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const success = await login(email, password);
        if (success) { toast.success('Login realizado!'); navigate('/go'); }
      } else {
        const success = await signup(email, password, name);
        if (success) { toast.success('Conta criada! Peca ao admin da sua instituicao para adiciona-lo.'); navigate('/go'); }
      }
    } finally { setSubmitting(false); }
  };

  const busy = isLoading || submitting;
  return (
    <div className="min-h-screen bg-[#f5f2ea] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mb-6"><button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Voltar ao inicio</button></div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8"><AxonLogo size="lg" />
          <div className="text-center"><h1 className="text-2xl font-bold text-gray-900">Axon Professor</h1>
            <div className="flex items-center gap-1.5 justify-center mt-1"><BookOpen size={14} className="text-teal-500" />
              <p className="text-sm text-gray-500">{mode === 'login' ? 'Acesso para professores' : 'Criar conta de professor'}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          {mode === 'signup' && (<div><label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" disabled={busy} required /></div>)}
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="professor@exemplo.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" disabled={busy} autoComplete="email" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" minLength={6} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" disabled={busy} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={busy} className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <><Loader2 size={16} className="animate-spin" /> {mode === 'login' ? 'Entrando...' : 'Criando...'}</> : mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          {mode === 'login' ? (<>Primeira vez? <button onClick={switchMode} className="text-teal-600 font-semibold hover:underline">Criar conta</button></>) : (<>Ja tem conta? <button onClick={switchMode} className="text-teal-600 font-semibold hover:underline">Entrar</button></>)}
        </p>
        {mode === 'signup' && <p className="text-xs text-gray-400 text-center mt-3">Apos criar sua conta, peca ao admin da sua instituicao para adiciona-lo como professor.</p>}
      </div>
    </div>
  );
}

export function ProfessorLoginPage() { return <RequireGuest><ProfessorAuthForm /></RequireGuest>; }
