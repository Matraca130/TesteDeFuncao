// ============================================================
// Axon v4.4 — Auth Screen (Login / Signup)
// ============================================================
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_super_admin: boolean;
}

export interface AuthResult {
  user: AuthUser;
  access_token: string;
}

interface AuthScreenProps {
  onAuthenticated: (result: AuthResult) => void;
  onSignIn: (email: string, password: string) => Promise<AuthResult>;
  onSignUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  error?: string | null;
}

export function AuthScreen({ onAuthenticated, onSignIn, onSignUp, error: externalError }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(externalError ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result: AuthResult;
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Nome e obrigatorio');
          setLoading(false);
          return;
        }
        result = await onSignUp(email.trim(), password, name.trim());
      } else {
        result = await onSignIn(email.trim(), password);
      }
      onAuthenticated(result);
    } catch (err: any) {
      setError(err?.message || 'Erro de autenticacao');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f2ea] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-200/50 mb-4">
            <span className="text-white text-2xl font-black tracking-tighter">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Axon Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Plataforma de gestao de conteudo academico</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {mode === 'signin' ? 'Entrar na conta' : 'Criar conta'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'signin'
              ? 'Use suas credenciais de professor.'
              : 'Registre-se como professor administrador.'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="professor@universidade.edu"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm shadow-teal-200/50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading
                ? (mode === 'signin' ? 'Entrando...' : 'Criando conta...')
                : (mode === 'signin' ? 'Entrar' : 'Criar conta')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              {mode === 'signin'
                ? 'Nao tem conta? Criar agora'
                : 'Ja tem conta? Entrar'}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Axon v4.4 — Content Management System
        </p>
      </motion.div>
    </div>
  );
}
