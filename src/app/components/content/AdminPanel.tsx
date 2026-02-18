import React, { useState } from 'react';
import { useAdmin } from '@/app/context/AdminContext';
import { useAuth } from '@/app/context/AuthContext';
import { Shield, LogOut, Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ContentApprovalList } from '../ai/ContentApprovalList';

export function AdminLoginGate() {
  const { adminLogin, hasAdminRole } = useAdmin();
  const { user } = useAuth();
  const [error, setError] = useState('');

  function handleActivate() {
    setError('');
    if (adminLogin('')) {
      // Session activated — ViewRouter will re-render with <AdminPanel />
    } else {
      setError('Falha ao ativar sessao admin');
    }
  }

  // ── No admin role → Access Denied ──
  if (!hasAdminRole) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f2ea]">
        <div className="w-full max-w-sm mx-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mb-3">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
          <p className="text-sm text-gray-500 mt-2">
            {user
              ? <>Logado como <span className="font-medium text-gray-700">{user.name}</span>. Sua conta nao possui permissao de administrador.</>
              : 'Faca login com uma conta que tenha permissao de administrador.'
            }
          </p>
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
            Roles com acesso: <span className="font-semibold">super_admin</span>, <span className="font-semibold">institution_admin</span>, <span className="font-semibold">professor</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Has admin role → Activate session ──
  return (
    <div className="h-full flex items-center justify-center bg-[#f5f2ea]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mb-3">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Area Administrativa</h2>
          <p className="text-sm text-gray-500 mt-1">
            Logado como <span className="font-medium text-gray-700">{user?.name}</span>.
            Ative a sessao admin para continuar.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <span className="font-medium">Role verificada</span> — sua conta possui acesso administrativo via Supabase Auth.
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            onClick={handleActivate}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition"
          >
            <Shield className="w-4 h-4" />
            Ativar Sessao Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const { adminLogout, sessionDurationMinutes } = useAdmin();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-content'>('overview');

  return (
    <div className="h-full overflow-y-auto bg-[#f5f2ea]">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-xs text-gray-500">
                Sessao ativa ha {sessionDurationMinutes} minuto{sessionDurationMinutes !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={adminLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 border border-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair do Admin
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'overview' ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Visao Geral
          </button>
          <button
            onClick={() => setActiveTab('ai-content')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'ai-content' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Conteudo AI
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
              <p className="text-2xl font-bold text-green-600">Ativo</p>
              <p className="text-xs text-gray-400 mt-1">Servidor conectado</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Auth</p>
              <p className="text-2xl font-bold text-indigo-600">Supabase</p>
              <p className="text-xs text-gray-400 mt-1">Autenticacao integrada</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">IA</p>
              <p className="text-2xl font-bold text-purple-600">Gemini</p>
              <p className="text-xs text-gray-400 mt-1">API key configurada</p>
            </div>
          </div>
        )}

        {activeTab === 'ai-content' && (
          <ContentApprovalList />
        )}
      </div>
    </div>
  );
}